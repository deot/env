import { ref, computed, reactive, onMounted } from 'vue';
import { defineStore } from 'pinia';
import { Resize } from '@deot/helper-resize';
import { useLayoutDefaultStore } from './use-layout-default';
import { useLayoutDefaultTabsStore } from './use-layout-default-tabs';

/**
 * layout下仅default可用
 * 1366作为当前Layout的最小值
 */
export const useLayoutDefaultSizeStore = defineStore('layout-default-size', () => {
	const layoutStore = useLayoutDefaultStore();
	const layoutTabsStore = useLayoutDefaultTabsStore();

	const gap = 4;

	const scroller = ref();
	const width = ref(window.innerWidth);
	const height = ref(window.innerHeight);
	// 初始即按视口宽度决定，避免仅在 resize「宽度变化」时才更新导致窄屏仍按 220 占位
	const forceHideNavbar = ref(width.value < 1366);

	const baseHeight = computed(() => {
		return height.value - gap * 2;
	});

	const sidebar = reactive({
		paddingRight: gap,
		width: 108,
		height: baseHeight
	});

	const navbar = reactive({
		width: computed(() => !forceHideNavbar.value ? 220 : 0),
		height: baseHeight
	});

	const header = reactive({
		width: computed(() => content.width),
		height: computed(() => !layoutTabsStore.innerDisabled && !layoutTabsStore.disabled && layoutStore.isInnerPage ? 88 : 52),
	});

	const content = reactive({
		height: 0,
		width: 0
	});

	const container = reactive({
		minWidth: 1024,
		height: baseHeight,
		width: computed(() => content.width),
	});

	const syncForceHideNavbar = () => {
		if (width.value < 1366 && !forceHideNavbar.value) {
			forceHideNavbar.value = true;
		} else if (width.value >= 1366 && forceHideNavbar.value) {
			forceHideNavbar.value = false;
		}
	};

	const handleResize = () => {
		const widthChanged = width.value !== window.innerWidth;

		height.value = window.innerHeight;
		width.value = window.innerWidth;

		if (!widthChanged) return;
		syncForceHideNavbar();
	};

	const setContent = (e) => {
		if (typeof e.height === 'undefined') return;
		content.height = e.height;
		content.width = e.width;
	};

	const setScroller = (v) => {
		scroller.value = v;
	};

	const scrollTo = async (v) => {
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

	// 单页应用只执行有一次，除非重载, 不需要处理销毁逻辑
	onMounted(() => Resize.on(document.body, handleResize));

	return {
		scroller,
		// size
		width,
		height,
		gap,
		sidebar,
		navbar,
		container,
		header,
		content,

		// 外部控制
		forceHideNavbar,
		toggleNavBar: (v) => {
			v = typeof v === 'boolean' ? v : !forceHideNavbar.value;
			forceHideNavbar.value = v;
		},

		// methods
		setContent,
		setScroller,
		scrollTo
	};
});
