import { createPinia } from 'pinia';
import { Storage } from '@deot/helper-cache';
import { CACHE_ENV, MODE_DEV } from '@/src/constants';

export const sort = -99999; // 插件排序，越小优先注入
export const install = (context: any) => {
	const { app, options } = context;
	const pinia = createPinia();
	app.use(pinia);

	// 本地开发的时候，强制清理
	if (MODE_DEV) {
		Storage.remove(CACHE_ENV);
	}

	const envConfig: any = Storage.get(`${CACHE_ENV}`) || '';

	// 设定初始的initialState, 这个值不会被改变
	pinia.state.value = {
		...(options.pinia || {}),
		env: {
			appCode: envConfig.appCode || options.name,

			branch: envConfig.branch || __BRANCH__
		}
	};

	// 其他使用module使用
	context.add('pinia', pinia);
};
