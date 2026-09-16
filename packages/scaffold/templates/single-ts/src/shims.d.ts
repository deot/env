/// <reference types="vite/client" />

declare const __BRANCH__: string;

declare module '*.vue' {
	import type { DefineComponent } from 'vue';

	const component: DefineComponent<any, any, any>;
	export default component;
}

interface Window {
	__CONTEXT__?: any;
}

declare module 'virtual:uno.css';
declare module 'virtual:uno.css?*';

declare module 'virtual:generated-layouts' {
	export const setupLayouts: (routes: any[]) => any[];
}

declare module 'vue-router/auto-routes' {
	export const routes: any[];
}
