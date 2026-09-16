import * as Route from '@deot/helper-route';
import * as LINKS from '@/shared/constants/pages';
import { MODE_DEV, ROUTE_UNAUTHORISED_REGEXP } from '@/shared/constants';

const MAX_REDIRECT = 1000;
export const install = (context) => {
	let redirectCount = 0;
	const router = context.router;
	const Global = context.Global;

	const userStore = Global.user;
	const envStore = Global.env;

	const PAGE_lOGIN_NAME = `/${envStore.appCode}${LINKS.PAGE_lOGIN}/`;
	const PAGE_HOME_NAME = `/${envStore.appCode}${LINKS.PAGE_HOME}/`;

	router.beforeEach((to, _from, next) => {
		redirectCount++;
		if (redirectCount > MAX_REDIRECT) {
			console.error('路由异常', to);
			to.path === LINKS.PAGE_lOGIN ? next() : next(LINKS.PAGE_lOGIN);
			return;
		}
		if (
			router.options.history.base === '/shared'
			|| ROUTE_UNAUTHORISED_REGEXP.test(to.path)
		) return next();

		// 保持端的域名一致
		if (envStore.appCode !== context.options.name) {
			Global.reLaunchHome(envStore.appCode);
			return;
		}

		if (
			!userStore.logged
			&& to.path !== LINKS.PAGE_lOGIN
			&& router.hasRoute(PAGE_lOGIN_NAME)
		) {
			Global.setRedirect(to.fullPath);
			return next(LINKS.PAGE_lOGIN);
		}
		if (
			router.hasRoute(PAGE_HOME_NAME)
			&& (to.path === '/' || (to.path === LINKS.PAGE_lOGIN && userStore.logged))
		) {
			return next(LINKS.PAGE_HOME);
		}

		next();
	});

	router.afterEach((to) => {
		redirectCount = 0;
		// 清理token
		if (to.query.token) {
			history.replaceState(null, null, Route.merge({
				path: `${router.options.history.base}${to.path}`,
				query: {
					...to.query,
					token: undefined,
				}
			}));
		}
	});

	router.onError((error) => {
		if (
			!MODE_DEV
			&& error.message.match(/(Failed to load module script|Failed to fetch dynamically imported module)/g)
		) {
			location.reload(true);
		}
	});
};
