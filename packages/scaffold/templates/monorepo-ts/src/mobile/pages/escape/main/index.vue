<template>
	<SetTitle title="Mobile Escape">
		<section class="v-em g-flex-cc">
			<div class="v-em__content g-bg-white">
				<h1>Mobile Escape</h1>
				<p>当前页面不使用 Mobile Layout，可作为登录、授权页等直接访问页面的基础。</p>
				<MButton type="primary" @click="router.push('/')">返回应用</MButton>
			</div>
		</section>
	</SetTitle>
</template>

<script setup lang="ts">
import { MButton } from '@deot/vc';
import { useRouter } from 'vue-router';
import { SetTitle } from '@/shared';

const router = useRouter();
</script>

<style lang="scss">
$block: v-em;

@include block($block) {
	width: 100vw;
	height: 100vh;
	padding: 16px;
	background: #f5f6f8;
	box-sizing: border-box;

	@include element(content) {
		width: 100%;
		padding: 24px;
		border: 1px solid #e5e6eb;
		border-radius: 12px;
		box-sizing: border-box;

		h1 {
			margin: 0 0 12px;
		}

		p {
			margin: 0 0 24px;
			line-height: 1.7;
			color: #646a73;
		}
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
