import { ref, reactive, onBeforeMount, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import { Storage } from '@deot/helper-cache';
import { getUid } from '@deot/helper-utils';
import { defineStore } from 'pinia';
import { isEqualWith, cloneDeep } from 'lodash-es';
import { Context } from '@/src/modules/context';
import { MAX_KEEP_ALIVE } from '@/src/constants';
import { useLayoutDefaultStore } from './use-layout-default';

const TABS_DISABLED = false;
const TABS_INNER_DISABLED = false;
const TABS_MAX = Math.max(MAX_KEEP_ALIVE, 20);
const TABS_KEY = '@yaya/tabs';
const TABS_SKIP_KEY = ['session', 'token'];

/**
 * 统一tag模型
 * @param route { value, label }
 * @param options { state, query }
 * @returns Tag { id, value, label, deletable, draggable, lockless, visible, query }
 */
const createTag = (route: any, options: any = {}) => {
	const { deletable = true, draggable = true, lockless = true, visible = true, query, id } = options;
	const v: any = { value: route.value, label: route.label };

	!deletable && (v.deletable = false);
	!draggable && (v.draggable = false);
	!lockless && (v.lockless = false);
	!visible && (v.visible = false);

	query && (v.query = query);

	// 仅用于sort-list
	v.id = id || getUid();
	return v;
};
const getDefaultTags = () => ([
	createTag(
		{ value: '/home/main', label: '首页' },
		{
			deletable: false,
			draggable: false,
			lockless: false,
			id: 'home'
		}
	)
]);

const isEqual = (v1: any, v2: any) => {
	return isEqualWith(v1 || {}, v2 || {});
};

/**
 * layout下仅default可用
 */
export const useLayoutDefaultTabsStore = defineStore('layout-default-tabs', () => {
	const { Global } = Context;
	const layoutStore = useLayoutDefaultStore();
	const vRoute = useRoute();
	const tags: any[] = reactive(getDefaultTags());
	const disabled = ref(TABS_DISABLED);
	const innerDisabled = ref(TABS_INNER_DISABLED);
	const isReady = ref(false);

	const isSimilarQuery = (v1: any, v2: any) => {
		v1 = { ...v1 };
		v2 = { ...v2 };
		TABS_SKIP_KEY.forEach(k => (delete v1[k], delete v2[k]));
		return isEqual(v1, v2);
	};

	// 非内页 + 相同参数的内页
	const isSimilar = (v1: any, v2: any) => {
		v1 = { ...v1 };
		v2 = { ...v2 };
		v1 = { value: v1.path || v1.value, query: { ...v1.query } };
		v2 = { value: v2.path || v2.value, query: { ...v2.query } };
		return v1.value === v2.value && (layoutStore.routesMap[v2.value] || isSimilarQuery(v1.query, v2.query));
	};

	const similarTagsMap = computed(() => {
		return tags.reduce((pre: any, cur: any) => {
			pre[cur.value] = pre[cur.value] || [];
			pre[cur.value].push(cur);
			return pre;
		}, {});
	});

	// 当前标签active的位置；path 未变（replace）时 watch 不会触发，需要调用方主动 updateCurrent
	const current = ref(-1);

	// 返回为false时不执行同步
	const sync = (next: any) => async (...args: any[]) => {
		const status = await next(...args);
		if (status === false) return;

		Storage.set(`${TABS_KEY}/${Global.env.appCode}`, tags, { session: true });
	};

	/**
	 * add
	 * for循环
	 * 	1. 内页：先找到相似query, query值不同则更新，否则终止
	 * 	2. 非内页: 有且仅一个，query值不同则更新，否则终止
	 * @param  route ~
	 * @param options ~
	 * @returns ~
	 */
	const add = sync((route: any, options: any = {}) => {
		for (let index = 0; index < tags.length; index++) {
			const item = tags[index];
			if (
				route.value === item.value
				&& (
					layoutStore.routesMap[item.value]
					|| isSimilarQuery(options.query, item.query)
				)
			) {
				if (isEqual(options.query, item.query)) return false;
				tags[index].query = options.query;
				return;
			}
		}

		if (tags.length === TABS_MAX) {
			const j = tags.findIndex((i: any) => i.deletable !== false);
			j >= 0 && tags.splice(j, 1);
		};

		tags.push(createTag(route, options));
	});

	const remove = sync((route: any) => {
		const index = tags.findIndex((i: any) => isSimilar(route, i));
		if (index < 0) return false;
		tags.splice(index, 1);
	});

	const clear = sync((routes?: any) => {
		tags.splice(0, tags.length, ...(Array.isArray(routes) ? routes : getDefaultTags()));
	});

	const update = sync((route: any, options?: any) => {
		const index = tags.findIndex((i: any) => isSimilar(route, i));
		if (index < 0) return false;

		tags.splice(index, 1, createTag(route, {
			...options,
			id: tags[index].id
		}));
		// TODO: 去重，AB相同路径标签，当query在筛选过程中一致时要去除其他相同的
	});

	const isActive = (route: any) => {
		return isSimilar(route, vRoute);
	};

	const updateCurrent = (route: any) => {
		const index = tags.findIndex((i: any) => isSimilar(route, i));
		if (index !== current.value) {
			current.value = index;
		}
	};

	const enter = () => {
		const routes = Storage.get(`${TABS_KEY}/${Global.env.appCode}`, { session: true });

		routes && clear(routes);

		isReady.value = true;
	};

	// 单页应用只执行有一次，除非重载, 不需要处理销毁逻辑
	onBeforeMount(() => {
		enter();
		Global.on(Global.events.logout, clear);
		Global.on(Global.events.login, enter);
	});

	// path的变化
	watch(
		() => [layoutStore.loaded, vRoute.path, layoutStore.currentPage, isReady.value],
		(v1, v2) => {
			const [loaded, path] = v1;
			if (!loaded || isEqual(v1, v2)) return;

			// 二级/三级菜单
			let route: any = layoutStore.routesMap[path as any];

			if (
				innerDisabled.value
				|| vRoute.meta.layout === 'none'
				|| vRoute.meta.tabless
			) {
				return;
			}
			// 内页，若开启，则可保留无限个内页, 还需要考虑（back时是否要清理上一个tab）
			if (!route && layoutStore.isInnerPage && layoutStore.currentPageRoutes?.length) {
				const item = layoutStore.currentPageRoutes.slice(-1)[0];
				route = {
					value: item.value || path,
					label: item.label,
				};
			}
			if (!route) {
				// 首页等非菜单、非内页路由不会进入 routesMap，但仍需同步已存在 tab 的高亮
				updateCurrent(vRoute);
				return;
			}

			add(route, { query: Object.keys(vRoute.query).length ? cloneDeep(vRoute.query) : (void 0) });
			updateCurrent(vRoute);
		}
	);

	// query的变化，如果使用history.replaceState是无法监听的
	watch(
		() => [vRoute.path, vRoute.query],
		async () => {
			if (
				current.value < 0
				|| !tags[current.value]
				|| tags[current.value].value !== vRoute.path
				|| isEqual(tags[current.value].query, vRoute.query)
			) return;
			update(tags[current.value], { query: vRoute.query });
		},
		{ deep: true }
	);

	return {
		disabled,
		innerDisabled,
		current,
		similarTagsMap,
		tags,
		add,
		remove,
		update,
		updateCurrent,
		clear,
		isActive
	};
});
