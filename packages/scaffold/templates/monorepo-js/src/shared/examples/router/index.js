import { routes as autoRoutes } from 'vue-router/auto-routes';
import { setupLayouts } from 'virtual:generated-layouts';

const localBase = '/shared';
const root = setupLayouts(autoRoutes).find(route => route.path === localBase);

export const base = import.meta.env.DEV ? localBase : '/';
export const routes = (root?.children || []).map(route => ({ ...route, path: `/${route.path}` }));
