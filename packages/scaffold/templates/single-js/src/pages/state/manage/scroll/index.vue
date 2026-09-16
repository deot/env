<template>
	<SetTitle title="Scroll Memory">
		<div class="v-sms">
			<header class="v-sms__hero">
				<p class="v-sms__kicker">layout scroller</p>
				<h1>滚动位置记忆</h1>
				<p>向下滚动后切换到其他标签，再回到本页，验证 scroller store 保存和恢复的位置。</p>
			</header>
			<ul class="v-sms__list">
				<li v-for="item in items" :key="item">内容区块 {{ item }} · KeepAlive 与滚动状态协同工作</li>
			</ul>
		</div>
	</SetTitle>
</template>
<script setup>
import { SetTitle } from '@/src/components';

const items = Array.from({ length: 36 }, (_, index) => index + 1);
</script>

<style lang="scss">
$block: v-sms;

@include block($block) {
	min-height: 100%;
	padding: 24px;
	box-sizing: border-box;

	@include element(hero) {
		padding: 4px 0 20px;

		h1 {
			margin: 4px 0 8px;
			font-size: 28px;
		}

		p {
			color: #646a73;
		}
	}

	@include element(kicker) {
		margin: 0;
		font-weight: 600;
		color: #165dff;
		text-transform: uppercase;
	}

	@include element(list) {
		display: grid;
		padding: 0;
		margin: 16px 0 0;
		list-style: none;
		gap: 10px;

		li {
			padding: 18px;
			background: #fff;
			border: 1px solid #e5e6eb;
			border-radius: 8px;
		}
	}
}
</style>

<route lang="json5">
{
	meta: {
		layout: 'default',
		tabAlive: true
	}
}
</route>
