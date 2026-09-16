import './styles/index.scss';
import 'virtual:uno.css?unit=px&scale=1';

import { createApp, h } from 'vue';
import { RouterView, createRouter, createWebHistory } from 'vue-router';
import { Storage } from '@deot/helper';

import { PAGE_HOME } from '@/src/constants';
import { Context } from '@/src/modules/context';
import { platform } from '@/src/env';
import { base, routes } from '@/src/router';

const version = '1.0';

(async () => {
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

	Context.add('options', { name: 'app', platform, base, routes, version });
	Context.add('app', app);
	Context.add('router', router);
	Context.add('platform', platform);

	await Promise.all(
		Object.values(import.meta.glob<any>(['./modules/*.ts', '!./modules/context.ts'], { eager: true }))
			.toSorted((a, b) => (a.sort || 0) - (b.sort || 0))
			.map(module => module.install?.(Context))
	);

	app.mount('#app');
})();
