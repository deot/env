<template>
	<SetTitle title="登录">
		<main class="v-lm">
			<img class="v-lm__logo" src="https://dummyimage.com/106x24/456cf6/ffffff.png&text=LOGO" alt="__PROJECT_NAME__">
			<section class="v-lm__content">
				<div class="v-lm__illustration">⌁</div>
				<h1>欢迎使用</h1>
				<p>本地开发环境可使用伪登录进入应用。</p>
				<button type="button" @click="submit">伪登录</button>
			</section>
		</main>
	</SetTitle>
</template>
<script setup lang="ts">
import { Global } from '@/shared/modules/global';
import * as api from './api';

const submit = async () => {
	const response: any = await api.login();
	await Global.createLoginAuth(response.body.data);
};
</script>
<style lang="scss">
$block: v-lm;

@include block($block) {
	display: flex;
	min-height: 100vh;
	padding: 24px;
	color: #1d2129;
	background: linear-gradient(180deg, #edf3ff, #fff 48%);
	box-sizing: border-box;
	flex-direction: column;

	@include element(logo) {
		width: 106px;
		height: 24px;
	}

	@include element(content) {
		margin: auto 0;
		text-align: center;
	}

	@include element(illustration) {
		display: grid;
		width: 160px;
		height: 160px;
		margin: 0 auto 32px;
		font-size: 72px;
		color: #456cf6;
		background: #e4edff;
		border-radius: 50%;
		place-items: center;
	}

	h1 {
		margin: 0 0 12px;
		font-size: 28px;
	}

	p {
		margin: 0;
		color: #86909c;
	}

	button {
		width: 100%;
		height: 48px;
		margin-top: 48px;
		font-size: 16px;
		color: #fff;
		background: #456cf6;
		border: 0;
		border-radius: 24px;
	}
}
</style>
<route lang="json5">
{
	meta: {
		layout: 'none'
	}
}
</route>
