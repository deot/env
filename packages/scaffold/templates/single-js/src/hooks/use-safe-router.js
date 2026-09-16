import { inject } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const mergeOptions = (...args) => {
	return args.reduce((pre, cur) => {
		if (typeof cur === 'string') {
			cur = { route: cur };
		}
		return { ...pre, ...cur };
	}, {});
};
// { route: Route, tabRemove: boolean = false } | string
export const useSafeRouter = (optionsV1 = {}) => {
	const router = useRouter();
	const route = useRoute();
	const tabsStore = inject('layout-default-tabs', {});
	return Object.assign({}, router, {
		back: async (optionsV2 = {}) => {
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
