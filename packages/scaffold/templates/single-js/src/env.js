import { reactive } from 'vue';
import { Message, Modal } from '@deot/vc';
import { MODE_DEV, LAYOUT_HOME_VISIBLE } from '@/src/constants';
import { apiRoots } from '@/src/stores';
import { Context } from '@/src/modules/context';

const baseUrl = window.location.origin;
/**
 * 负责当前平台的差异性处理
 */
class EnvironmentManager {
	// 环境变量：baseUrl
	envs = reactive({
		dev: {
			baseUrl: MODE_DEV ? 'https://httpbin.org' : baseUrl,
		},
		pre: {
			baseUrl: MODE_DEV ? 'https://httpbin.org' : baseUrl,
		},
		prod: {
			baseUrl: MODE_DEV ? 'https://httpbin.org' : baseUrl,
		}
	});

	constant = (type) => {
		return ({
			LAYOUT_HOME_VISIBLE
		})[type];
	};

	schema = (type) => {
		const map = {
			user: {
				token: '',
				userName: '',
				permissions: []
			},
			notice: {
				count: null
			}
		};
		return map[type] || {};
	};

	http = (type, ...args) => {
		const fn = apiRoots[type] || (() => /^\//.test(type) ? Context.Network.http(type, ...args) : {});
		return fn(...args);
	};

	hasAuth = (ids, state) => {
		return ids.some(
			id => typeof id === 'undefined' || (Array.isArray(state.permissions) ? state.permissions.includes(id) : state.permissions?.[id])
		);
	};

	loading = (message, ...args) => {
		return Message.loading(message, ...args);
	};

	error = (message, ...args) => {
		return Message.error(message, ...args);
	};

	success = (message, ...args) => {
		return Message.success(message, ...args);
	};

	modal = (options) => {
		if (options.onCancel) {
			return Modal.info(options);
		}
		return Modal.error(options);
	};
}
export const platform = new EnvironmentManager();
