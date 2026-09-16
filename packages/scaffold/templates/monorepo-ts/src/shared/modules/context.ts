/**
 * @files 单例使用(约定)，为避免循环引入，当前文件不要引入任何文件
 */
class AppContext {
	[key: string]: any;

	version = '';

	options: any = null;

	// 第三方
	app: any = null;

	router: any = null;

	vc: any = null;

	pinia: any = null;

	// 和自身导出同步（import { * }  from '@/shared/modules/*'）;
	Shared: any = null;

	Global: any = null;

	Network: any = null;

	add(name: string, v: any) {
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
