import * as Route from '@deot/helper-route';
import * as LINKS from '@/src/constants/pages';
import { MODE_DEV, ROUTE_UNAUTHORISED_REGEXP } from '@/src/constants';

const MAX_REDIRECT = 1000;
export const install = (context: any) => {
	let redirectCount = 0;
	const router = context.router;
	const Global = context.Global;

	const userStore = Global.user;

	const paths = router.getRoutes().map((route: any) => route.path);
	const hasLoginPage = paths.includes(LINKS.PAGE_lOGIN);
	const hasHomePage = paths.includes(LINKS.PAGE_HOME);

	router.beforeEach((to: any, _from: any, next: any) => {
		redirectCount++;
		if (redirectCount > MAX_REDIRECT) {
			console.error('路由异常', to);
			to.path === LINKS.PAGE_lOGIN ? next() : next(LINKS.PAGE_lOGIN);
			return;
		}
		if (ROUTE_UNAUTHORISED_REGEXP.test(to.path)) return next();

		if (
			!userStore.logged
			&& to.path !== LINKS.PAGE_lOGIN
			&& hasLoginPage
		) {
			Global.setRedirect(to.fullPath);
			return next(LINKS.PAGE_lOGIN);
		}
		if (
			hasHomePage
			&& (to.path === '/' || (to.path === LINKS.PAGE_lOGIN && userStore.logged))
		) {
			return next(LINKS.PAGE_HOME);
		}

		next();
	});

	router.afterEach((to: any) => {
		redirectCount = 0;
		// 清理token
		if (to.query.token) {
			history.replaceState(null, '', Route.merge({
				path: `${router.options.history.base}${to.path}`,
				query: {
					...to.query,
					token: undefined,
				}
			}));
		}
	});

	router.onError((error: any) => {
		if (
			!MODE_DEV
			&& error.message.match(/(Failed to load module script|Failed to fetch dynamically imported module)/g)
		) {
			(location as any).reload(true);
		}
	});
};
