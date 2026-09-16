import { ref, onMounted, reactive, onBeforeUnmount, isReactive, isRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Storage } from '@deot/helper-cache';
import { getUid } from '@deot/helper-utils';
import * as Route from '@deot/helper-route';

const createSession = (key: any, router: any) => {
	const session = key || getUid('session');
	if (session !== key) {
		const { path, query } = Route.parse();

		const fullPath = Route.merge({
			path,
			query: {
				...query,
				session
			}
		});
		if (router) {
			const base = router.options.history.base;
			router.replace(fullPath.replace(new RegExp(`^${base}`), ''));
		} else if (typeof window !== 'undefined') {
			window.history.replaceState(history.state, '', fullPath);
		}
	}
	return session;
};

// 如 const [formData, syncData] = useSessionData({ ...any })
export const useSessionData = (originalData: any, options?: { onBefore?: () => any; router?: boolean }) => {
	const { onBefore, router = true } = options || {};
	const vRouter = useRouter();
	const route = useRoute();
	const formData = isReactive(originalData)
		? originalData
		: reactive(isRef(originalData) ? originalData.value : originalData);

	const uuid = ref<any>();
	const syncData = async () => {
		let data: any = {};
		if (onBefore) {
			data = await onBefore();
		}

		Object.assign(formData, data);
		Storage.set(uuid.value, formData, { session: true });
	};

	let timer: any;
	onMounted(() => {
		uuid.value = createSession(route.query.session, router ? vRouter : null);
		const sessionData = Storage.get(uuid.value, { session: true });

		sessionData
		&& Object.keys(sessionData).length > 0
		&& (Object.assign(formData, sessionData));

		// 每5秒同步一次数据
		timer = setInterval(syncData, 5000);
	});

	onBeforeUnmount(() => {
		clearInterval(timer);
		Storage.remove(uuid.value);
	});

	return [formData, syncData, uuid];
};
