import { createWebHistory, createRouter } from 'vue-router';
import { routes } from 'vue-router/auto-routes';
import { setupLayouts } from 'virtual:generated-layouts';

const base = '/';
const realRoutes = setupLayouts(routes).find(i => i.path === base).children.map((i) => {
	i.path = `/${i.path}`;
	return i;
});

export const router = createRouter({
	history: createWebHistory(base),
	routes: [
		{ path: '/', redirect: '/home/main' },
		...realRoutes
	],
});
