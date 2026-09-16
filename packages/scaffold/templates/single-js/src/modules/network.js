import { createInstance } from '@deot/http';
import { Context } from './context';

const getConfig = () => ({
	token: Context.Global.user.token,
	baseUrl: Context.Global.env.baseUrl,
	headerSourceCode: Context.Global.env.headerSourceCode
});

const loadingStore = {
	target: null,
	messages: [],
	refresh() {
		const { target, messages } = loadingStore;
		if (messages.length) {
			const message = `${messages.length >= 2 ? `(${messages.length})` : ''}${messages.at(-1)[1]}`;
			if (target) {
				if (target.wrapper?.setContent) {
					target.wrapper.setContent(message);
				} else {
					target.destroy();
					loadingStore.target = Context.platform.loading(message);
				}
			} else {
				loadingStore.target = Context.platform.loading(message);
			}
			return;
		}
		setTimeout(() => {
			if (!loadingStore.messages.length && loadingStore.target) {
				loadingStore.target.destroy();
				loadingStore.target = null;
			}
		}, 30);
	},
	add(leaf) {
		loadingStore.messages.push([
			leaf.id,
			typeof leaf.request.loading === 'string' ? leaf.request.loading : '加载中...'
		]);
		loadingStore.refresh();
	},
	remove(leaf) {
		const index = loadingStore.messages.findIndex(item => item[0] === leaf.id);
		index >= 0 && loadingStore.messages.splice(index, 1);
		loadingStore.refresh();
	}
};

const errorMap = {
	HTTP_REQUEST_TIMEOUT: '网络超时，请稍后再试',
	HTTP_STATUS_ERROR: '网络异常，请稍后再试'
};

const errorStore = {
	messages: [],
	async add(leaf) {
		const { id } = leaf;
		const message = errorMap[leaf.response.statusText] || leaf.response.statusText;
		if (errorStore.messages.some(item => item[1] === message)) return;

		if (typeof leaf.request.errorTip === 'function' || leaf.request.errorTip === 'modal') {
			const data = leaf.response.body?.data;
			const defaultContent = (Array.isArray(data) && data.length ? data.join('<br><br>') : data)
				|| leaf.response.body?.msg;
			const content = typeof leaf.request.errorTip === 'function'
				? leaf.request.errorTip(leaf)
				: defaultContent;
			content && Context.platform.modal({ title: '异常提示', content, cancelText: false });
			return;
		}

		errorStore.messages.push([id, message]);
		Context.platform.error(message, 2000, () => {
			const index = errorStore.messages.findIndex(item => item[0] === id);
			index >= 0 && errorStore.messages.splice(index, 1);
		});
	}
};

export const Network = createInstance({
	token: true,
	json: true,
	loading: true,
	errorTip: true,
	successTip: false,
	confirmTip: false,
	onRequest: [
		async (leaf) => {
			if (typeof leaf.request.confirmTip === 'string') {
				await new Promise((resolve, reject) => {
					Context.platform.modal({
						title: '提示',
						content: leaf.request.confirmTip,
						onOk: resolve,
						onCancel: reject
					});
				});
				leaf.request.loading && loadingStore.add(leaf);
			}

			const config = getConfig();
			if (!/^https?:/.test(leaf.request.url)) {
				leaf.request.url = config.baseUrl + leaf.request.url;
			}
			if (leaf.request.method === 'POST') {
				leaf.request.headers.set(
					'Content-Type',
					leaf.request.json
						? 'application/json'
						: 'application/x-www-form-urlencoded; charset=UTF-8'
				);
			}
			if (leaf.request.method === 'FORM') {
				leaf.request.headers.set('Content-Type', 'multipart/form-data');
				leaf.request.method = 'POST';
			}
			if (leaf.request.token !== false && config.token) {
				const token = typeof leaf.request.token === 'string' ? leaf.request.token : config.token;
				leaf.request.headers.set('Authorization', `Bearer ${token}`);
			}
			if (config.headerSourceCode) {
				leaf.request.headers.set('source', config.headerSourceCode);
			}
		}
	],
	onResponse: [
		(leaf) => {
			const { successTip, errorTip, responseType } = leaf.request;
			const { body } = leaf.response;
			if (body && body.code !== 200 && leaf.response.type !== 'error') {
				leaf.response.statusText = typeof errorTip === 'string' && errorTip !== 'modal'
					? errorTip
					: body.msg;
				leaf.response.type = 'error';
				if (body.code === 401) {
					errorStore.add(leaf);
					Context.Global.clearLoginAuth({
						redirect: window.location.pathname.replace(Context.router.options.history.base, '')
							+ window.location.search
					});
					return;
				}
				if (typeof body.data === 'string') {
					try {
						leaf.response.body.data = JSON.parse(body.data);
					} catch { /* keep original data */ }
				}
			}

			if (responseType === 'blob' && body instanceof Blob) {
				leaf.response.type = 'success';
				leaf.response.body = { code: 200, data: body };
			}
			if (
				errorTip
				&& leaf.response.type === 'error'
				&& leaf.response.statusText
				&& leaf.response.statusText !== 'HTTP_CANCEL'
				&& leaf.request.maxTries === 1
			) {
				errorStore.add(leaf);
			} else if (successTip && leaf.request.method !== 'GET') {
				const message = typeof successTip === 'string' ? successTip : leaf.response.body?.msg;
				message && Context.platform.success(message);
			}

			if (import.meta.env.DEV && leaf.response.type === 'error') {
				console.error('[Network Error]', {
					url: leaf.request.url,
					request: leaf.request.body,
					response: leaf.response.body,
					error: leaf.response.statusText,
					status: leaf.response.status
				});
			}
		}
	],
	onStart: (leaf) => {
		if (leaf.request.loading && !leaf.request.confirmTip) loadingStore.add(leaf);
	},
	onFinish: (leaf) => {
		if (leaf.request.loading) loadingStore.remove(leaf);
	}
});

export const install = (context) => {
	context.add('Network', Network);
};
