<template>
	<div
		v-show="modelValue === 'account'"
		class="c-login-account g-flex g-fd-c g-relative"
	>
		<div
			class="c-login-account__switch g-absolute g-flex-cc g-c-info"
			@click="isDingtalkQrCodeLogin = !isDingtalkQrCodeLogin"
		>
			<VIcon v-if="!isDingtalkQrCodeLogin" type="qrcode" class="g-fs-32" />
			<VIcon v-else type="preview" class="g-fs-32" />
			<p />
		</div>
		<!--扫码登录 - 扫码验证-->
		<div
			class="c-login-account__switch-tip g-absolute g-pointer"
			@click="isDingtalkQrCodeLogin = !isDingtalkQrCodeLogin"
		>
			<div>
				<p><em /><span /></p>
				<div>
					<span v-if="isDingtalkQrCodeLogin">密码登录</span>
					<span v-else>使用钉钉登录</span>
				</div>
			</div>
		</div>
		<div v-show="!isDingtalkQrCodeLogin" class="g-flex g-fd-c">
			<div class="g-c-000 g-fs-24 g-fw-600 g-pd-lr-48">欢迎使用</div>
			<div v-if="ways.length >= 2" class="g-pd-lr-48 g-pd-t-10">
				<VTabs v-model="type" animated>
					<VTabsPane
						v-for="item in ways"
						:key="item.type"
						:label="item.label"
						:value="item.type"
					/>
				</VTabs>
			</div>
			<div class="g-pd-lr-48 g-pd-t-16">
				<Password
					v-show="type === 'password'"
					ref="password$"
					@submit="handleLogin"
				/>
				<SmsCode
					v-show="type === 'sms-code'"
					ref="smsCode$"
					@submit="handleLogin"
				/>
				<div class="g-flex g-jc-sb" style="margin-top: -5px;">
					<div class="g-col" />
					<div
						v-if="type === 'password'"
						class="g-pointer"
						style="color: #456cf6;"
						@click="$emit('update:modelValue', 'password')"
					>忘记密码？</div>
				</div>
			</div>
			<div class="g-pd-lr-48">
				<VButton
					class="c-login-view__submit-btn"
					type="primary"
					style="width: 100%;"
					:disabled="disabled"
					@click="handleLogin"
				>登录</VButton>
			</div>
		</div>
		<OAuth2Dingtalk v-if="isDingtalkQrCodeLogin" />
		<OAuth2Check
			@success="loginByData"
			@error="handleOAuth2Error"
		/>
	</div>
</template>

<script setup lang="tsx">
import { ref, computed } from 'vue';
import { Global } from '@/shared/modules/global';
import { useUserStore } from '@/shared/stores/modules';
import Password from './password.vue';
import SmsCode from './sms-code.vue';
import OAuth2Dingtalk from './dingtalk-qrocde.vue';
import OAuth2Check from './check-code.vue';
import * as api from './api';

const emit = defineEmits(['update:modelValue', 'success']);
const props = defineProps({
	modelValue: String,
	redirect: {
		type: Boolean,
		default: true
	}
});

const userStore = useUserStore();
const isDingtalkQrCodeLogin = ref(false);
const password$ = ref<any>();
const smsCode$ = ref<any>();
const requestOptions = ref<any>({});

const type = ref('password');
const ways = computed(() => {
	return [
		{
			type: 'password',
			label: '密码登录',
			form: password$.value
		},
		{
			type: 'sms-code',
			label: '验证码登录',
			form: smsCode$.value
		}
	];
});

const instance = computed(() => {
	return ways.value.find(i => i.type === type.value);
});

const disabled = computed(() => {
	return instance.value?.form?.disabled;
});

const loginByData = async (v: any) => {
	if (!v) return;
	await Global.clearLoginAuth({
		reLogin: false
	});

	props.redirect && !Global.redirect && Global.setRedirect();
	props.redirect
		? Global.createLoginAuth(v)
		: userStore.update(v);
	emit('success', v);
};

// 用于下一次登录
const handleOAuth2Error = (e: any) => {
	if (!e || typeof e !== 'object') return;
	requestOptions.value = e;
};

const handleLogin = async () => {
	const cureent: any = instance.value;
	await cureent.form.validate();
	let data: any;
	try {
		data = await api.loginByInternal({
			...cureent.form.getData(),
			...requestOptions.value
		});
	} catch {
		cureent.form.refresh?.();
	}

	loginByData(data);
};
</script>

<style lang="scss">
$component-name: c-login-account;

@include block($component-name) {
	padding-top: 68px;

	// 开关
	@include element(switch) {
		// background: #e3f0fd;
		top: 0;
		right: 0;
		width: 70px;
		height: 70px;
		overflow: hidden;
		cursor: pointer;

		> p {
			position: absolute;
			width: 0;
			height: 0;
			border: 35px solid transparent;
			border-bottom-color: white;
			border-left-color: white;

			// 三角形内的阴影以及截断
			clip-path: inset(3px 0 3px 0);
			filter: drop-shadow(0 0 4px rgb(0 0 0 / 30%));
		}

		> img {
			position: absolute;
			width: 47px;
			height: 47px;
		}
	}

	// 开关提示
	@include element(switch-tip) {
		top: 16px;
		right: 70px;

		> div {
			position: relative;
			height: 16px;
			padding: 5px 18px;
			font-size: 14px;
			line-height: 16px;
			color: white;
			background: #456cf6;
			border: 1px solid #456cf6;
			border-radius: 6px;
			box-sizing: content-box;
		}

		p {
			position: absolute;
			top: 6px;
			right: 2px;

			em {
				position: absolute;
				top: 0;
				left: 1px;
				overflow: hidden;
				border-color: transparent;
				border-left-color: #456cf6;
				border-style: solid;
				border-width: 6px 0 6px 6px;
			}

			span {
				position: absolute;
				top: 0;
				left: -1px;
				overflow: hidden;
				border-color: transparent;
				border-left-color: #456cf6;
				border-style: solid;
				border-width: 6px 0 6px 6px;
			}
		}
	}
}
</style>
