import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { Storage } from '@deot/helper-cache';
import { Context } from '@/src/modules/context';
import { CACHE_ENV, MODE_DEV as dev, MODE_DEBUG as debug } from '../../constants';

export const useEnvStore: any = defineStore('env', () => {
	const appCode = ref<any>();
	const branch = ref<any>();

	const state = computed(() => Context.options.platform.envs?.[branch.value] || {});
	// baseUrl
	const keys = Object.keys(Context.options.platform.envs?.['dev'] || {});
	const clear = () => {
		Storage.remove(CACHE_ENV);
	};

	const update = (appCode$?: any, branch$?: any) => {
		const cacheData = {
			appCode: appCode$ || appCode.value,
			branch: branch$ || branch.value
		};

		if (
			cacheData.appCode === appCode.value
			&& cacheData.branch === branch.value
		) return;

		// 先设置缓存，再修改值
		Storage.set(CACHE_ENV, cacheData);
		appCode.value = cacheData.appCode;
		branch.value = cacheData.branch;
	};

	return {
		clear,
		update,
		appCode,
		branch,
		dev,
		debug,
		...keys.reduce((pre: any, cur) => {
			pre[cur] = computed(() => state.value[cur]);
			return pre;
		}, {})
	};
});
