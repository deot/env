import { Emitter } from '@deot/helper-emitter';
import { Utils } from '@/src/utils';
import { useUserStore, useEnvStore, useAppStore } from '@/src/stores/modules';
import * as LINKS from '@/src/constants/pages';
import { Context } from './context';

class GlobalManager extends Emitter {
	// 重定向地址，可以是函数
	redirect = '';

	user = null;

	env = null;

	app = null;

	events = {
		logout: '@/logout',
		login: '@/login',
	};

	/**
	 * 清理登录
	 * reLogin为true时
	 * 1. 主动退出，下次登录回到首页
	 * 2. token失效退出，下次登录回到原地址;
	 * isReady用于避免路由系统未完成注册的情况
	 * @param options ~
	 */
	clearLoginAuth = Utils.locked(async (options = {}) => {
		const { reLogin = true, redirect } = options;
		await Context.Network.clear(); // 取消所有请求和shared缓存
		await this.user.clear();
		this.emit(this.events.logout);
		if (reLogin) {
			await Context.router.isReady();
			Global.setRedirect(redirect);
			await Context.router.replace(LINKS.PAGE_lOGIN);
		}
	});

	async createLoginAuth(config) {
		this.user.clear();
		this.user.update(config);
		this.emit(this.events.login);
		if (this.redirect) {
			try {
				if (typeof this.redirect === 'function') {
					await this.redirect();
				} else {
					const current = this.redirect.split('?')[0];
					if (['/', LINKS.PAGE_HOME, LINKS.PAGE_lOGIN].includes(current)) {
						await Context.router.replace('/');
					} else {
						await Context.router.push(this.redirect);
					}
				}
			} catch {
				this.reLaunchHome();
			} finally {
				this.redirect = '';
			}
		}
	}

	setRedirect(v) {
		this.redirect = v || '/';
	}

	/**
	 * 关闭了所有的页面, 慎用！
	 */
	reLaunchHome() {
		window.location.replace('/');
	}

	install(app) {
		app.config.globalProperties.$global = Global;
	}
}

export const Global = new GlobalManager();

export const sort = -9999; // 插件排序，越小优先注入
export const install = (context) => {
	Global.user = useUserStore();
	Global.env = useEnvStore();
	Global.app = useAppStore();

	context.app.use(Global);
	// 其他使用module使用
	context.add('Global', Global);
};
