/**
 * @files 单例使用(约定)，为避免循环引入，当前文件不要引入任何文件
 */
class AppContext {
	constructor() {
		this.version = '';
		this.options = null;

		// 第三方
		this.app = null;
		this.router = null;
		this.vc = null;
		this.pinia = null;

		// 和自身导出同步（import { * }  from '@/shared/modules/*'）;
		this.Shared = null;
		this.Global = null;
		this.Network = null;
	}

	add(name, v) {
		if (this[name]) {
			throw new Error(`[AppContext]: 模块重复导入 - ${name}`);
		}

		this[name] = v;
	}
}

export const Context = new AppContext();

// 供开发调试用
if (import.meta.env.MODE === 'development' || __BRANCH__ !== 'prod') {
	window.__CONTEXT__ = window.__CONTEXT__ || Context;
}
