import { reactive } from 'vue';
import { MModal, MToast } from '@deot/vc';

import { MODE_DEV } from '@/shared/constants';
import { apiRoots } from '@/mobile/stores';
import { Context } from '@/shared/modules/context';

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
		return ({})[type];
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

	loading = (message, ...args) => MToast.loading(message, ...args);
	error = (message, ...args) => MToast.error(message, ...args);
	success = (message, ...args) => MToast.success(message, ...args);
	modal = options => options.onCancel ? MModal.operation(options) : MModal.alert(options);
}

export const platform = new EnvironmentManager();
