import { reactive, computed } from 'vue';
import { defineStore } from 'pinia';
import { Storage } from '@deot/helper-cache';
import * as Route from '@deot/helper-route';
import { CACHE_USER } from '@/src/constants';
import { Context } from '@/src/modules/context';

// 合法的值，不要用{}（增加未知不确定性）
const originState = (override: any = {}) => {
	return {
		token: '',
		...Context.platform.schema('user'),
		...override,
	};
};
const getUserInfo = (state: any) => Context.platform.http('getUserInfo', state);

export const useUserStore: any = defineStore('user', () => {
	const local = Storage.get(CACHE_USER) || {};
	const keys = Object.keys(originState());
	const state: any = reactive(originState(local));
	const logged = computed(() => {
		return !!state.token;
	});

	const clear = () => {
		Storage.remove(CACHE_USER);
		Object.assign(state, originState());
	};

	const update = (config: any = {}) => {
		const target = Object.keys(config).reduce((pre: any, key) => {
			keys.includes(key) && (pre[key] = config[key]);
			return pre;
		}, {});

		Object.assign(state, target);
		Storage.set(
			CACHE_USER,
			keys.reduce((pre: any, key) => {
				pre[key] = state[key];
				return pre;
			}, {})
		);
	};

	const token = Route.get('token');
	if (token) {
		state.token = token;
		getUserInfo(state).then(update);
	}

	/**
	 * 当需要使用或者某个user变量
	 * 处理url上带token，用户数据异步的安全处理
	 * 取代原系统的getSaleCompanyCode/getSaleCompanyId等
	 * @param key ~
	 * @returns ~
	 */
	const safeGet = async (key: string) => {
		if (!state[key]) {
			await getUserInfo(state).then(update);
		}

		return state[key];
	};

	const hasAuth = (id: any, options?: any) => {
		const ids = Array.isArray(id) ? id : [id];
		return Context.platform.hasAuth(ids, state, options);
	};

	return {
		...keys.reduce((pre: any, cur) => {
			pre[cur] = computed(() => state[cur]);
			return pre;
		}, {}),
		logged,
		clear,
		update,
		safeGet,
		hasAuth
	};
});
