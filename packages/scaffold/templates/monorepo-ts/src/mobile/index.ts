import './styles/index.scss';
import 'virtual:uno.css?unit=rem&scale=2';

import { Device } from '@deot/helper-device';
import { createAppContext } from '@/shared';
import { Style } from '@deot/style/dist';
import { base, routes } from './router';
import { platform } from './env';

(async () => {
	if (!Device.touch) {
		document.documentElement.style.setProperty('font-size', '0.5px', 'important'); // 强制让750rem = 375px；适配移动端rem单位
	} else {
		Style.useREM(750);
	}

	const context = await createAppContext({
		name: 'mobile',
		version: '3.1',
		platform,
		base,
		routes
	});

	// 动态导入模块
	await Promise.all(
		Object.values(import.meta.glob<any>('./modules/*.ts', { eager: true }))
			.map(i => i.install?.(context))
	);

	context.app.mount('#app');
})();
