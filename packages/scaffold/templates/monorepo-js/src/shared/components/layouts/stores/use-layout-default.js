import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { defineStore } from 'pinia';
import { Utils } from '@/shared/utils';
import { sleep } from '@deot/helper-utils';

/**
 * layout下仅default可用
 * 符合格式才能启用
 * routes: Array<{ icon, fullLabel, parent, value, label, children }>
 * navbarVisibleMap: 存放navbar下的展开收齐
 * loaded: 是否初始化完成
 * currentPage: { title, routes } 当前组件setTitle传递当前的页面信息
 * currentNavbarRoutes:（computed）当前navbar选中的路由，内页根据currentPage内的某个信息强制设置navbar(比如某个详情页)
 * hasSidebar:（computed）是否存在sidebar
 * hasNavbar:（computed）是否存在navbar
 * hasLayout: 是否渲染壳层（sidebar/navbar/header）；首次 query.hideLayout=1|true 时为 false，之后不变
 */
export const useLayoutDefaultStore = defineStore('layout-default', () => {
	const routes = ref([]); // Tree格式路由
	const routesMap = ref({});

	const currentPage = ref({ title: '', routes: [] });
	const navbarVisibleMap = ref({});

	const loaded = ref(false);
	const render = ref(true);

	const route = useRoute();

	const v = route.query.hideLayout;
	const hasLayout = ref(!(v === '1' || v === 'true'));

	const isInnerPage = computed(() => {
		return !routesMap.value[route.path] && currentPageRoute.value?.value;
	});

	const theme = computed(() => route.meta?.theme || 'default');

	const currentPageRoutes = computed(() => {
		const { routes } = currentPage.value;
		const result = [];
		for (let i = routes.length - 1; i >= 0; i--) {
			const item = routes[i];
			if (routesMap.value[item.value]) {
				result.unshift(routesMap.value[item.value]);
			} else {
				result.unshift(item);
			}
		}
		return result;
	});

	const currentPageRoute = computed(() => {
		const v = currentPageRoutes.value[0];
		return v && v.value ? v : null;
	});

	const currentNavbarRoutes = computed(() => {
		let path = ((isInnerPage.value ? currentPageRoute.value?.value : route.path) || '').split('?')[0];
		const v = [];
		while (routesMap.value[path]) {
			v.unshift(routesMap.value[path]);
			path = routesMap.value[path].parent;
		}
		return v;
	});

	const currentNavbarRoute = computed(() => {
		return currentNavbarRoutes.value[currentNavbarRoutes.value.length - 1];
	});

	const hasSidebar = computed(() => {
		return routes.value.length > 1;
	});

	const hasNavbar = computed(() => {
		return currentNavbarRoutes.value.length > 1 || routes.value.length === 1;
	});

	// 注意这里最终的格式参考最上面的routes
	const setData = (treeData, treeMap) => {
		if (!treeMap) {
			[treeMap, treeData] = Utils.tree2map(treeData, { injectParent: true, labelAsValue: false, clean: false });
		}

		routes.value = treeData;
		routesMap.value = treeMap;
		loaded.value = true;
	};

	/**
	 * TODO: 后续用于不在navbar上的一些控制
	 * @param v ~
	 */
	const setCurrentPage = (v) => {
		currentPage.value = v;
	};

	// 刷新整个组件
	const reRender = async () => {
		render.value = false;
		await sleep(0);
		render.value = true;
	};

	return {
		theme,
		render,
		isInnerPage,
		currentPage,
		currentPageRoute,
		currentPageRoutes,

		loaded,
		routes,
		routesMap,
		navbarVisibleMap,

		// computed
		currentNavbarRoutes,
		currentNavbarRoute,
		hasNavbar,
		hasSidebar,
		hasLayout,

		// methods
		setData,
		setCurrentPage,
		reRender
	};
});
