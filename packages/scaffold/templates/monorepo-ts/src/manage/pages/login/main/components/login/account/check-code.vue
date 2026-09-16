<template>
	<div />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { Storage } from '@deot/helper-cache';
import * as Route from '@deot/helper-route';
import * as api from './api';

const emit = defineEmits(['success', 'error']);

const route = Route.parse();
const checkCodeFromReferrer = async () => {
	const { referrer, code, state } = route.query;
	if (referrer !== 'dingtalk' || !code) return;

	const loginData = state && Storage.get(state, { session: true });
	state && Storage.remove(state, { session: true });

	const body: any = { dingCode: code };

	loginData && (body.userId = loginData.userId);

	// 清理code
	history.replaceState(null, '', Route.merge({
		path: route.path,
		query: {
			...route.query,
			code: undefined,
			authCode: undefined,
			referrer: undefined,
			state: undefined
		}
	}));

	try {
		const response = await api.loginByInternal(body);
		// 扫码成功，直接登录
		emit('success', response);
	} catch (e: any) {
		// 扫码失败1：存在登录 -> 直接登录
		if (loginData?.token) {
			return emit('success', loginData);
		}

		// 扫码失败2：不存在登录(即查询不到用户)，用于下一次登录时进行绑定
		if (e.body?.code === 609) {
			return emit('error', body);
		}
	}
};
onMounted(checkCodeFromReferrer);
</script>
