import './styles/index.scss';
import 'virtual:uno.css?unit=px&scale=1';

import { createAppContext } from '@/shared';
import { base, routes } from './router';
import { platform } from './env';

(async () => {
	const context = await createAppContext({ name: 'manage', platform, base, routes });
	await Promise.all(
		Object.values(import.meta.glob('./modules/*.js', { eager: true }))
			.map(module => module.install?.(context))
	);
	context.app.mount('#app');
})();
