import { ref, onMounted } from 'vue';
import { defineStore } from 'pinia';
import { Storage } from '@deot/helper-cache';
import { MODE_DEV } from '@/src/constants';
import * as Route from '@deot/helper-route';

const getkey = () => window.location.pathname;
const SCROLL_HISTORY_KEY = '@yaya/scroll-history';

/**
 * 注意
 * 1. popstate下才会触发记忆滚动(go / back / forward)
 * 2. 点击触发的跳转页面(push/replace) 不会产生记忆滚动
 * ，
 * scrollBehavior: crossBack 跨系统回退标记
 * history: [key]: [Object]
 * {
 * 	x,
 * 	y,
 * 	snapshot: 预留设计(crossBack下使用，popstate时，把x/y放到该处)
 * }
 */
export const useLayoutDefaultScrollerStore = defineStore('layout-default-scroller', () => {
	const isCrossBack = Route.get('scrollBehavior') === 'crossBack';
	const history = ref<Record<string, any>>((isCrossBack && Storage.get(SCROLL_HISTORY_KEY, { session: true })) || {});
	const currentPathname = ref('');
	const scroller = ref<any>();
	const setScroller = (v: any) => {
		scroller.value = v;
	};

	const scrollTo = async (v: any) => {
		if (typeof v === 'number') {
			v = { x: 0, y: v };
		} else if (typeof v !== 'object' || !v) {
			return;
		}
		try {
			scroller.value.scrollTo(v);
		} catch {
			console.error('layout/scroller 未找到');
		}
	};

	const refresh = async () => {
		if (!currentPathname.value) return;
		scrollTo(history.value[currentPathname.value]);
	};

	/**
	 * 进入 (onActivated/router.beforeEach)【当前为前者方案】
	 * 此时：浏览器显式地址=当前页
	 */
	const enter = () => {
		currentPathname.value = getkey();

		if (isCrossBack && history.value[currentPathname.value]?.snapshot) {
			scrollTo(history.value[currentPathname.value]?.snapshot);
		}
	};

	/**
	 * 离开 (onDeactivated/router.afterEach)【当前为前者方案】
	 * 此时：浏览器显式地址=下一页地址，取onActivated时记录的currentPathname.value
	 */
	const leave = () => {
		if (!currentPathname.value || !scroller.value) return;
		history.value[currentPathname.value] = {
			x: scroller.value.scrollLeft,
			y: scroller.value.scrollTop,
			snapshot: null
		};

		Storage.set(SCROLL_HISTORY_KEY, history.value, { session: true });
		currentPathname.value = '';

		// 默认恢复置顶
		scrollTo(0);
	};

	/**
	 * go / back / forward
	 * 执行时机：leave -> enter -> handlePopStateChange
	 * 此时：浏览器显式地址=下一页地址, currentPathname.value=下一页地址
	 */
	const handlePopStateChange = () => {
		const v = history.value[currentPathname.value];
		if (!v || currentPathname.value !== getkey()) return;
		const snapshot = {
			x: v.x || 0,
			y: v.y || 0
		};

		history.value[currentPathname.value].snapshot = snapshot;
		scrollTo(snapshot);
	};

	const clear = () => {
		history.value = {};
		Storage.remove(SCROLL_HISTORY_KEY);
	};

	// 单页应用只执行有一次，除非重载, 不需要处理销毁逻辑
	onMounted(() => window.addEventListener('popstate', handlePopStateChange));

	MODE_DEV && ((window as any).__LAYOUT_SCROLLER_STORE__ = { currentPathname, history, scroller });

	return {
		history,
		scroller,
		setScroller,
		scrollTo,
		enter,
		leave,
		refresh,
		clear
	};
});
