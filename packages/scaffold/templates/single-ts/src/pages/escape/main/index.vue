<template>
	<SetTitle title="Manage Escape">
		<section class="v-em g-flex-cc">
			<div class="v-em__content g-bg-white">
				<h1>Manage Escape</h1>
				<p>当前页面不使用 Default Layout，可作为登录、分享页等直接访问页面的基础。</p>
				<Button type="primary" @click="router.push('/')">返回应用</Button>
			</div>
		</section>
	</SetTitle>
</template>

<script setup lang="ts">
import { Button } from '@deot/vc';
import { useRouter } from 'vue-router';
import { SetTitle } from '@/src/components';

const router = useRouter();
</script>

<style lang="scss">
$block: v-em;

@include block($block) {
	width: 100vw;
	height: 100vh;
	padding: 24px;
	background: #f5f6f8;
	box-sizing: border-box;

	@include element(content) {
		width: min(480px, 100%);
		padding: 32px;
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
