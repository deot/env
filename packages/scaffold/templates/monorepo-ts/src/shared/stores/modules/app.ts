import { ref, reactive, computed } from 'vue';
import { defineStore } from 'pinia';
import * as Route from '@deot/helper-route';
import { toggle as toggleFullscreenNative, isFullscreen, event as fullscreenEventName } from '@/shared/utils/fullscreen';

export const useAppStore = defineStore('app', () => {
	const referrer = ref(Route.get('referrer'));
	const fullscreen = ref(isFullscreen());
	const width = ref(window.innerWidth);
	const height = ref(window.innerHeight);
	const dpr = computed(() => 2);

	// 最后进入时间和离开时间
	const times: any = reactive({
		enter: new Date(),
		leave: new Date()
	});

	const toggleFullscreen = (e: any) => {
		const el = e.currentTarget || e;
		fullscreen.value = toggleFullscreenNative(el);
	};

	const handleResize = () => {
		height.value = window.innerHeight;
		width.value = window.innerWidth;
	};

	const px2rem = (v: number, unit = false) => {
		const result = v * dpr.value;
		return unit ? `${result}rem` : result;
	};

	// 单页应用只执行有一次，除非重载, 不需要处理销毁逻辑
	window.addEventListener('resize', handleResize);
	window.addEventListener(fullscreenEventName, () => {
		if (isFullscreen() !== fullscreen.value) {
			fullscreen.value = !fullscreen.value;
		}
	});

	return {
		width,
		height,
		referrer,
		fullscreen,
		toggleFullscreen,
		times,
		px2rem,
		updateTimes: (type: string) => {
			if (type === 'enter') {
				times.show = new Date();
			} else if (type === 'leave') {
				times.leave = new Date();
			}
		},
	};
});
