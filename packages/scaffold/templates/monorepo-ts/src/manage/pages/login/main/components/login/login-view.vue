<template>
	<VScroller
		class="c-login-view g-relative"
		:native="false"
		wrapper-class="g-flex-cc"
	>
		<div class="g-flex-cc g-absolute" style="top: 24px; left: 24px;">
			<VImage
				class="g-m-b-32 g-pointer"
				src="https://dummyimage.com/106x24/555/fff/?text=logo"
			/>
		</div>
		<div class="g-relative" style="min-width: 960px;">
			<div class="g-flex g-jc-sb">
				<div class="g-flex-cc g-fd-c" style="padding-right: 120px;">
					<div class="g-m-t-32 g-m-b-10 g-fs-32 g-fw-600" style="color: #1D2129;">XXX系统</div>
					<div class="g-fs-20 g-fw-400" style="color: #86909C;">登录后使用全部功能</div>
				</div>
				<div style="padding-left: 120px;">
					<div class="c-login-view__content g-relative g-bg-white g-flex g-fd-c">
						<Account
							v-model="virtualPageName"
							:redirect="redirect"
							@success="$emit('account-success', $event)"
						/>
						<Password
							v-model="virtualPageName"
							@success="$emit('password-success', $event)"
						/>
					</div>
				</div>
			</div>
		</div>
	</VScroller>
	<WebsiteRecords />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Password from './password/index.vue';
import Account from './account/index.vue';
import WebsiteRecords from './website-records/index.vue';

defineEmits(['account-success', 'password-success']);
defineProps({
	redirect: {
		type: Boolean,
		default: true
	}
});

const virtualPageName = ref('account');

</script>

<style lang="scss">
$component-name: c-login-view;

@include block($component-name) {
	width: 100vw;
	height: 100vh;
	overflow: hidden;
	background-color: #FAFBFF;
	background-position: center center;
	background-repeat: no-repeat;
	background-size: cover;

	@include element(content) {
		width: 420px;
		height: 550px;
		border-radius: 16px;
		box-shadow: 0 2px 12px 0 rgb(0 0 0 / 4%), 0 0 48px 0 rgb(0 0 0 / 10%);
	}

	@include element(submit-btn) {
		height: 40px;
		padding: 0;
		margin-top: 40px;
		line-height: 40px;
		border-radius: 8px;

		@include when(disabled) {
			color: white;
			background: #9CC7FE;

			&:hover {
				background: #9CC7FE;
			}
		}
	}

	.vc-input {
		min-height: 40px;
		font-size: 14px;
		line-height: 40px;
		background: #F3F4F6;

		&::after {
			border: none;
		}
	}

	.vc-input__append, .vc-input__prepend {
		height: 40px;
		padding-left: 8px;
		line-height: 40px;
		color: #9AA0A9;
		background: transparent;
	}

	.vc-input__content input {
		height: 0; // 为了密码自动回填时无样式
		padding: 20px 12px;
		padding-left: 20px;
		appearance: textfield;
		-webkit-text-fill-color: #000;
		caret-color: #000;

		&::placeholder {
			color: #86909C;
			-webkit-text-fill-color: #CDCED1;
			caret-color: #CDCED1;
		}

		&::-webkit-outer-spin-button {
			appearance: none;
		}

		&::-webkit-inner-spin-button {
			appearance: none;
		}
	}

	.vc-input__icon-clear {
		padding-right: 8px;
		font-size: 20px;
	}

	.vc-tabs.is-line .vc-tabs__bar::after {
		border-color: #EBEDEF;
	}

	.vc-tabs.is-line .vc-tabs__item {
		padding: 16px;
		font-family: "PingFang SC";
		font-size: 14px;
		font-weight: 500;
		color: #080F20;
	}

	.vc-tabs.is-line .vc-tabs__item.is-active {
		color: #456cf6;
	}

	input:-webkit-autofill,
	input:-webkit-autofill:hover,
	input:-webkit-autofill:focus,
	input:-webkit-autofill:active {
		box-shadow: 0 0 0 40px #f3f4f6 inset;
		transition: color 99999s ease-out, background-color 99999s ease-out;
		transition-delay: 99999s;
	}
}
</style>
