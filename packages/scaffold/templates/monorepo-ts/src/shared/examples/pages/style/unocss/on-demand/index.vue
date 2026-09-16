<template>
	<SetTitle title="UnoCSS 按需注入">
		<section class="g-pd-20">
			<h2>@deot/style-unocss 按需注入</h2>
			<p>UnoCSS 只会为源码中已经出现的完整 g-* token 注入样式，运行时只能在已生成的 class 之间切换。</p>
			<div :class="[fontSizeClass, marginClass]">
				当前类名：{{ fontSizeClass }} {{ marginClass }}
			</div>
			<div class="g-flex">
				<Button class="g-m-r-8" @click="toggleFontSize">切换字体</Button>
				<Button @click="toggleMargin">切换边距</Button>
			</div>
		</section>
	</SetTitle>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Button } from '@deot/vc';

// 完整 token 必须出现在源码中，UnoCSS 才会在构建阶段提取并注入对应样式。
const fontSizeMap = {
	normal: 'g-fs-16',
	large: 'g-fs-32'
};
const marginMap = {
	normal: 'g-m-0',
	large: 'g-m-20'
};

const largeFontSize = ref(false);
const largeMargin = ref(false);
const fontSizeClass = computed(() => fontSizeMap[largeFontSize.value ? 'large' : 'normal']);
const marginClass = computed(() => marginMap[largeMargin.value ? 'large' : 'normal']);
const toggleFontSize = () => largeFontSize.value = !largeFontSize.value;
const toggleMargin = () => largeMargin.value = !largeMargin.value;
</script>

<route lang="json5">
{
	meta: {
		layout: 'default'
	}
}
</route>
