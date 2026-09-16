<!--
https://open.dingtalk.com/document/orgapp/tutorial-obtaining-user-personal-information
https://g.alicdn.com/dingding/h5-dingtalk-login/0.55.13/ddlogin.js
提取源码iframe的代码，解决无法重复创建
-->
<template>
	<div class="g-flex-cc g-fd-c">
		<div class="g-fs-24 g-fw-600" style="color: #1D2129;">扫码登录</div>
		<div class="g-fs-14 g-fw-400 g-pd-t-16" style="color: #86909C;">请使用钉钉移动端扫码二维码</div>
		<iframe
			v-if="src"
			:src="src"
			width="100%"
			height="260"
			frameBorder="0"
			scrolling="no"
			name="dingtalk-login_iframe-scan"
		/>
		<div class="g-pd-tb-15" />
		<VButton
			type="primary"
			class="g-fs-14"
			style="width: 150px; height: 40px; border-radius: 8px;"
			@click="handleLinkDingtalk"
		>{{ linkText }}</VButton>
	</div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import * as Route from '@deot/helper-route';
import * as Utils from '@deot/helper-utils';
import { Storage } from '@deot/helper-cache';
import { useRouter } from 'vue-router';
import * as api from './api';

const router = useRouter();
const props = defineProps({
	linkText: {
		type: String,
		default: '检测钉钉登录'
	},
	state: {
		type: Object,
		default: () => ({})
	}
});
const sessionId = Utils.getUid('session');

const src = ref();

const setState = () => {
	Storage.set(sessionId, props.state, { session: true });
};
const getUrl = async (options = {}) => {
	const clientId = await api.getDingClientId();
	return Route.merge({
		path: 'https://login.dingtalk.com/oauth2/auth',
		query: {
			iframe: true,
			redirect_uri: `${location.origin}${router.options.history.base}/login/main?referrer=dingtalk`,
			client_id: clientId,
			response_type: 'code',
			scope: 'openid',
			prompt: 'consent',
			state: sessionId,
			corpId: '',
			org_type: '',
			exclusiveLogin: '',
			exclusiveCorpId: '',
			...options
		}
	});
};

const handleMessage = (e) => {
	if (e.origin !== 'https://login.dingtalk.com' || !e?.data?.success) return;
	setState();
	window.location.href = e.data.redirectUrl;
};

const handleLinkDingtalk = async () => {
	setState();
	window.location.href = await getUrl({ iframe: false, FEForceLogin: true });
};

onMounted(async () => {
	src.value = await getUrl({});
	window.addEventListener('message', handleMessage);
});

onUnmounted(() => {
	window.removeEventListener('message', handleMessage);
});
</script>
