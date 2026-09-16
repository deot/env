<!-- hasLoad的目的是为了优先让宽高计算完毕（目前/shared/business/list/basic受到影响，这里先做个补丁，后续再查找具体原因） -->
<template>
	<slot v-if="hasLoad && !fill" />
	<div v-else-if="hasLoad" :style="sizeStyle">
		<slot />
	</div>
</template>
<script setup>
import { ref, watch, computed, inject, onActivated, onDeactivated, provide, onUnmounted, nextTick } from 'vue';
import { Portal } from '@deot/vc';
import { useKeepAlive } from '@/src/hooks';

const props = defineProps({
	title: String,
	// Array<{ value: string, label: string }>
	routes: {
		type: Array,
		default: () => ([])
	},

	// 在初始化确定，避免重复mounted; 用来确定宽高是否填充（固定值/最小值/最大值）
	fill: {
		type: Boolean,
		default: false
	},

	// width/min-width/max-width
	width: {
		type: String,
		default: 'width'
	},

	// height/min-height/max-height
	height: {
		type: String,
		default: 'height'
	},

	layoutName: {
		type: String,
		default: 'default'
	}
});

const layoutStore = inject(`layout-${props.layoutName}`, {});
const layoutSizeStore = inject(`layout-${props.layoutName}-size`, {});
const layoutScrollerStore = inject(`layout-${props.layoutName}-scroller`, {});

const hasLoad = ref(false);

const sizeStyle = computed(() => {
	let v = null;
	if (props.fill && layoutSizeStore.content) {
		v = {
			[props.width]: `${layoutSizeStore.content.width ? `${layoutSizeStore.content.width}px` : '100%'}`,
			[props.height]: `${layoutSizeStore.content.height ? `${layoutSizeStore.content.height}px` : '100%'}`
		};
	}
	return v;
});

const resetTitle = () => {
	const v = props.title || (props.routes?.[props.routes.length - 1]?.label) || document.title;
	document.title = v;

	layoutStore.setCurrentPage?.({ title: v, routes: props.routes });

	hasLoad.value = true;
};

useKeepAlive(resetTitle);
watch(() => [props.title, props.routes], () => nextTick(resetTitle), { immediate: true });
/**
 * TODO:
 * 1. 判断无权限路由跳转至404 【初步考虑放在这个位置比router.beforeEach更合适】
 */
onActivated(() => {
	layoutScrollerStore.enter();
});

onDeactivated(() => {
	Portal.clear();
	layoutScrollerStore.leave();
	layoutStore.setCurrentPage?.({ title: '', routes: [] });
});

onUnmounted(() => {
	Portal.clear();
});
const exposed = {
	scrollTo: v => layoutScrollerStore.scrollTo(v)
};
defineExpose(exposed);

provide('set-title', exposed);
</script>
