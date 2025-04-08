import { createApp, h } from 'vue';
import { RouterView } from 'vue-router';
import { router } from './router';

(async () => {
	const app = createApp(() => h(RouterView));
	app.use(router);
	app.mount('#app');
})();
