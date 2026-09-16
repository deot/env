import { inject } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const mergeOptions = (...args: any[]) => {
	return args.reduce((pre: any, cur: any) => {
		if (typeof cur === 'string') {
			cur = { route: cur };
		}
		return { ...pre, ...cur };
	}, {});
};
// { route: Route, tabRemove: boolean = false } | string
export const useSafeRouter = (optionsV1: any = {}) => {
	const router = useRouter();
	const route = useRoute();
	const tabsStore = inject<any>('layout-default-tabs', {});
	return Object.assign({}, router, {
		back: async (optionsV2: any = {}) => {
			const options = mergeOptions(optionsV1, optionsV2);
			options.tabRemove && tabsStore?.remove?.(route);
			if (options.route && window?.history?.length === 1) {
				try {
					await router.replace(options.route);
				} catch {
					return router.replace('/');
				}
			} else {
				return router.back();
			}
		}
	});
};
