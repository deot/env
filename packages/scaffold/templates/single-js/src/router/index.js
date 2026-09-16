import { routes as autoRoutes } from 'vue-router/auto-routes';
import { setupLayouts } from 'virtual:generated-layouts';

export const base = '/';
export const routes = setupLayouts(autoRoutes);
