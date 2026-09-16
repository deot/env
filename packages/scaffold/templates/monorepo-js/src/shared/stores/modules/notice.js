import { computed, reactive, onBeforeMount } from 'vue';
import { defineStore } from 'pinia';
import { useRoute } from 'vue-router';
import { Context } from '@/shared/modules/context';

// 合法的值，不要用{}（增加未知不确定性）
const originState = (override = {}) => {
	return {
		count: null,
		...Context.platform.schema('notice'),
		...override
	};
};

export const useNoticeStore = defineStore('notice', () => {
	const route = useRoute();
	const keys = Object.keys(originState());
	const state = reactive(originState());

	const update = async () => {
		const config = await Context.platform.http('getNoticeInfo');

		const target = Object.keys(config).reduce((pre, key) => {
			keys.includes(key) && (pre[key] = config[key]);
			return pre;
		}, {});

		Object.assign(state, target);
	};

	const read = async (messageId) => {
		await Context.platform.http('readMessage', messageId);
		await update();
	};

	onBeforeMount(async () => {
		const { readMessage, messageId } = route.query;

		if (messageId && readMessage == 1) {
			if (route.path === '/home/notice') return; // 由/home/notice内部触发相关逻辑
			await read(messageId);
		} else {
			await update();
		}
	});
	return {
		...keys.reduce((pre, cur) => {
			pre[cur] = computed(() => state[cur]);
			return pre;
		}, {}),
		read,
		update
	};
});
