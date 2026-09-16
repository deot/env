import { reactive } from 'vue';
import * as Components from '../components';

class SharedManager {
	/**
	 * 配置项
	 */
	options = reactive({});

	configure(options) {
		if (options) {
			Object.keys(options).forEach((i) => {
				if (typeof this.options[i] !== 'undefined') {
					this.options[i] = options[i];
				}
			});
		}

		return this;
	}

	install(app, options) {
		app.config.globalProperties.$shared = this.configure(options);
		Object.keys(Components).forEach((key) => {
			const component = Components[key];
			if (typeof component.setup === 'function') {
				app.component(key, Components[key]);
			}
		});
	}
}

export const Shared = new SharedManager();

export const install = (context) => {
	context.app.use(Shared, context.options?.shared);

	// 其他使用module使用
	context.add('SharedPrivate', Shared);
};
