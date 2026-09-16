import { createApp, h } from 'vue';
import { RouterView, createRouter, createWebHistory } from 'vue-router';
import { Storage } from '@deot/helper';

import { PAGE_HOME } from './constants/pages';
import { Context } from './modules/context';

export * from './components';
export * from './constants';
export * from './hooks';
export * from './stores';

export const createAppContext = async ({ name, platform, base = '/', routes = [], version = '1.0' }) => {
	Storage.configure({ version, versions: ['1.0', '3.1'] });
	const app = createApp(() => h(RouterView));
	const router = createRouter({
		history: createWebHistory(base),
		routes: [
			{ path: '/', redirect: PAGE_HOME },
			...routes,
			{ path: '/:all(.*)', redirect: PAGE_HOME }
		]
	});
	app.use(router);

	Context.add('options', { name, platform, base, routes, version });
	Context.add('app', app);
	Context.add('router', router);
	Context.add('platform', platform);

	await Promise.all(
		Object.values(import.meta.glob(['./modules/*.js', '!./modules/context.js'], { eager: true }))
			.toSorted((a, b) => (a.sort || 0) - (b.sort || 0))
			.map(module => module.install?.(Context))
	);

	return Context;
};
