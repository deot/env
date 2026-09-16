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

	constant = (type: string): any => {
		return ({} as any)[type];
	};

	schema = (type: string): any => {
		const map: any = {
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

	http = (type: string, ...args: any[]): any => {
		const fn = (apiRoots as any)[type] || (() => /^\//.test(type) ? Context.Network.http(type, ...args) : {});
		return fn(...args);
	};

	hasAuth = (ids: any[], state: any) => {
		return ids.some(
			(id: any) => typeof id === 'undefined' || (Array.isArray(state.permissions) ? state.permissions.includes(id) : state.permissions?.[id])
		);
	};

	loading = (message: any, ...args: any[]) => (MToast.loading as any)(message, ...args);

	error = (message: any, ...args: any[]) => (MToast.error as any)(message, ...args);

	success = (message: any, ...args: any[]) => (MToast.success as any)(message, ...args);

	modal = (options: any) => options.onCancel ? MModal.operation(options) : MModal.alert(options);
}

export const platform = new EnvironmentManager();
