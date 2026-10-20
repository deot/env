<template>
	<div
		class="c-send-code g-m-l-15 g-fs-12 g-flex-cc"
		:class="{
			'is-pending': status === 'pending',
			'is-solid': solid
		}"
		@click="handleSend"
	>
		<div v-if="!solid" class="g-f-1" />
		<text v-if="status === 'pending'">{{ seconds }}s</text>
		<text v-if="!solid || status !== 'pending'" :class="{ 'g-c-999': status === 'pending' }">{{ STATUS_MAP[status] }}</text>
	</div>
</template>
<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import { RegExps } from '@deot/helper-validator';
import { Message } from '@deot/vc';
import * as api from './api';

const emit = defineEmits(['error']);
const props = defineProps({
	duration: {
		type: Number,
		default: 60
	},
	value: String,
	solid: {
		type: Boolean,
		default: false
	},
	showToast: {
		type: Boolean,
		default: true
	},
	clickRequired: {
		type: Boolean,
		default: false
	},
	type: {
		type: String,
		default: 'mobile'
	},
	request: {
		type: Function,
		default: async (v: any, type: any, requestOptions: any) => {
			if (!v) throw `请输入${type === 'mobile' ? '手机号' : '有效值'}`;
			if (type === 'mobile' && !RegExps.mobile.test(v)) throw '请输入有效手机号';
			await api.sendCode(v, type, requestOptions);
		}
	},
	requestOptions: {
		type: Object,
		default: () => ({})
	},
});
const STATUS_MAP = {
	unsent: '获取验证码',
	pending: '后重新发送',
	sendAgain: '重新获取',
};

// 状态：unsent未发送；pending已发送，倒计时中；sendAgain重新发送
const status = ref('unsent');
const seconds = ref(0);
const hasSendOnce = ref(false);

let timer: any;
const handleSend = async () => {
	if (status.value === 'pending') return;

	try {
		seconds.value = props.duration,
		status.value = 'pending';
		await props.request(props.value, props.type, props.requestOptions);
		timer = setInterval(() => {
			if (seconds.value > 0) {
				seconds.value = seconds.value - 1;
			} else {
				clearInterval(timer);
				timer = null;
				status.value = 'sendAgain';
			}
		}, 1000);
	} catch (error: any) {
		status.value = 'unsent';
		const message = error.body?.message || error.body?.msg || error;
		const isRemote = error.body?.code;
		//  服务端的错误不提示，Network会统一提示
		props.showToast && !isRemote && Message.error(message);

		emit('error', message);
	} finally {
		hasSendOnce.value = true;
	}
};

onUnmounted(() => {
	timer && clearInterval(timer);
});

defineExpose({
	validate() {
		if (!props.clickRequired || hasSendOnce.value) return;

		const message = '请先发送验证码';
		Message.error(message);
		return Promise.reject(message);
	}
});
</script>

<style lang="scss">
.c-send-code {
	width: 85px;
	height: 24px;
	font-weight: 400;
	color: #2D7FFF;
	text-align: right;

	&.is-solid {
		color: white;
		text-align: center;
		background: #333;
		border: 1px solid #000;
		border-radius: 12px;

		&.is-pending {
			opacity: .5;
		}
	}
}
</style>
