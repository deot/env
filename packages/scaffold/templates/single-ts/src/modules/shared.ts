import type { App } from 'vue';
import { reactive } from 'vue';
import * as Components from '../components';

class SharedManager {
	/**
	 * 配置项
	 */
	options: Record<string, any> = reactive({

	});

	configure(options?: Record<string, any>) {
		if (options) {
			Object.keys(options).forEach((i) => {
				if (typeof this.options[i] !== 'undefined') {
					this.options[i] = options[i];
				}
			});
		}

		return this;
	}

	install(app: App, options?: Record<string, any>) {
		app.config.globalProperties.$shared = this.configure(options);
		Object.keys(Components).forEach((key) => {
			const component = (Components as any)[key];
			if (typeof component.setup === 'function') {
				app.component(key, (Components as any)[key]);
			}
		});
	}
}

export const Shared = new SharedManager();

export const install = (context: any) => {
	context.app.use(Shared, context.options?.shared);

	// 其他使用module使用
	context.add('Shared', Shared);
};
