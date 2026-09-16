<template>
	<div
		class="c-ldni g-flex g-pointer"
		:class="{
			'is-active': isActive
		}"
		@click="handleOpenNewPage"
		@contextmenu.prevent="handleShowMenu($event)"
	>
		<div class="g-fs-13">{{ info.label }}</div>
	</div>
</template>
<script setup lang="ts">
import type { PropType } from 'vue';
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { Clipboard, Message } from '@deot/vc';
import { useLayoutDefaultStore } from '../stores';
import { RightMenu } from '../right-menu';

const emit = defineEmits(['click']);
const props = defineProps({
	info: Object as PropType<any>
});

const layoutStore = useLayoutDefaultStore();
const router = useRouter();

const isActive = computed(() => {
	return (
		layoutStore.currentNavbarRoutes.some((i: any) => i.value === props.info.value)
		|| layoutStore.currentPage.routes.some((i: any) => i.value === props.info.value)
	);
});

const handleOpenNewPage = async () => {
	await router.push(props.info.value);
	emit('click', props.info);
};

const handleShowMenu = (e: any) => {
	const href = `${location.origin}${router.options.history.base}${props.info.value}`;
	RightMenu.popup({
		event: e,
		menu: [
			{
				label: '在新标签页中打开链接',
				value: 'TAB',
				onOk: () => {
					router.push(props.info.value);
				}
			},
			{
				label: '在窗口中打开链接',
				value: 'BLANK',
				onOk: () => window.open(href, '_blank')
			},
			{
				label: '复制链接地址',
				value: 'COPY',
				onOk: () => {
					Clipboard.set(href);
					Message.success('复制成功');
				}
			}
		]
	});
};

</script>
<style lang="scss">
$block: c-ldni; // c-layout-default-navbar-item;

@include block($block) {
	font-weight: 400;
	line-height: 32px;
	color: #374455;
	transition: color .2s;

	@include when(active) {
		font-weight: 600;
		color: #456cf6;
	}

	@include pseudo(hover) {
		color: #456cf6;
	}
};
</style>
