import { routes as autoRoutes } from 'vue-router/auto-routes';
import { setupLayouts } from 'virtual:generated-layouts';

const localBase = '/manage';
const root = setupLayouts(autoRoutes).find((route: any) => route.path === localBase);

export const base = import.meta.env.DEV ? localBase : '/';
export const routes = (root?.children || []).map((route: any) => ({ ...route, path: `/${route.path}` }));
