import { createWebHistory, createRouter } from 'vue-router';
import { routes } from 'vue-router/auto-routes';
import { setupLayouts } from 'virtual:generated-layouts';

const isDev = import.meta.env.MODE === 'development';

const base = '/b';
const realRoutes = isDev
	? setupLayouts(routes).find(i => i.path === base).children.map((i) => {
			i.path = `/${i.path}`;
			return i;
		})
	: setupLayouts(routes);

export const router = createRouter({
	history: createWebHistory(isDev ? base : '/'),
	routes: [
		{ path: '/', redirect: '/home/main' },
		...realRoutes
	],
});
