// https://developer.apple.com/documentation/webkitjs/htmlvideoelement

const getSupported = (list: string[], el?: any) => {
	el = el || document.documentElement;

	for (const item of list) {
		if (el[item]) {
			return el[item];
		}
	}
};

// 获取全屏状态改变事件
export const event = (() => {
	const root = document.documentElement as any;
	const eventMap: Record<string, string> = {
		requestFullscreen: 'fullscreenchange',
		webkitRequestFullscreen: 'webkitfullscreenchange',
		mozRequestFullScreen: 'mozfullscreenchange',
		msRequestFullscreen: 'msfullscreenchange',
		webkitEnterFullscreen: 'webkitfullscreenchange'
	};

	for (const rfs in eventMap) {
		if (root[rfs]) {
			return eventMap[rfs];
		}
	}
})() as string;

// 获取当前处于全屏状态的元素
export const isFullscreen = () => !!getSupported([
	'fullscreenElement',
	'webkitFullscreenElement',
	'mozFullScreenElement',
	'msFullscreenElement',
	'webkitCurrentFullScreenElement'
], document);

export const request = (el?: any) => {
	const fn = getSupported([
		'requestFullscreen',
		'webkitRequestFullscreen',
		'mozRequestFullScreen',
		'msRequestFullscreen',
		'webkitEnterFullscreen'
	], el);

	if (fn) {
		return fn.call(el);
	}
};

export const exit = () => {
	const fn = getSupported([
		'exitFullscreen',
		'webkitExitFullscreen',
		'mozCancelFullScreen',
		'msExitFullscreen',
		'webkitExitFullscreen'
	], document);

	if (fn) {
		return fn.call(document);
	}
};

export const toggle = (el?: any) => {
	const v = isFullscreen();
	v ? exit() : request(el);
	return !v;
};
