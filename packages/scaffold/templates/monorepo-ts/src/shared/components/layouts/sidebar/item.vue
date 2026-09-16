<template>
	<div
		class="c-ldsi g-flex g-pd-tb-10 g-pointer g-pd-lr-12"
		@mouseenter="handleEnter"
		@click="handleOpenNewPage"
	>
		<div class="g-flex-cc g-w-20 g-h-20">
			<VIcon
				:type="info.icon"
				:class="isActive ? 'g-c-info' : 'g-c-default'"
				class="g-fs-16"
			/>
		</div>
		<div
			v-if="showLabel"
			class="g-fs-13 g-fw-400 g-m-l-10"
			:class="{
				'g-fw-600': isActive
			}"
			:style="{
				width: '36px',
				color: isActive ? '#456cf6' : '#374455'
			}"
			style="line-height: 20px;"
		>
			{{ info.label }}
		</div>
	</div>
</template>
<script setup lang="tsx">
import type { PropType } from 'vue';
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { Popover } from '@deot/vc';
import { useLayoutDefaultStore, useLayoutDefaultSizeStore } from '../stores';
import Navbar from '../navbar/index.vue';

const props = defineProps({
	showLabel: {
		type: Boolean,
		default: true
	},
	info: Object as PropType<any>
});

const layoutStore = useLayoutDefaultStore();
const layoutSizeStore = useLayoutDefaultSizeStore();
const router = useRouter();
const isActive = computed(() => {
	return (
		layoutStore.currentNavbarRoutes.some((i: any) => i.value === props.info.value)
		|| layoutStore.currentPage.routes.some((i: any) => i.value === props.info.value)
	);
});

/**
 * 默认打开第一个, 目前规定的菜单必须三级
 * 必要时也可处理成异步的（一开始不加载子菜单）
 */
const handleOpenNewPage = () => {
	let url: any;

	for (let j = 0; j < props.info.children.length; j++) {
		for (let k = 0; k < props.info.children[j].children.length; k++) {
			const item = props.info.children[j].children[k];
			if (item.value) {
				url = item.value;
				break;
			}
		}
		if (url) break;
	}

	handleEnter?.poper?.wrapper?.toggle?.(false);
	router.push(url);
};

const handleEnter: any = (e: any) => {
	if (!layoutSizeStore.forceHideNavbar && layoutStore.hasNavbar) return;
	handleEnter.poper = Popover.open({
		el: document.body,
		triggerEl: e.target,
		hover: true,
		alone: true,
		placement: 'right',
		portalClass: 'is-padding-none',
		content: () => {
			return (
				<Navbar
					style="width: 220px; height: 500px"
					showTitle={false}
					info={props.info}
					onCellClick={() => handleEnter?.poper?.wrapper?.toggle?.(false)}
				/>
			);
		}
	});
};

</script>
<style lang="scss">
$block: c-ldsi; // c-layout-default-sidebar-item;

@include block($block) {
	border: 1px solid transparent;
	transition: background-color .2s;

	@include pseudo(hover) {
		font-weight: 600;
		color: #374455;
		background: linear-gradient(90deg, #F5F3F1 0%, #EBEAEF 100%);
		border: 1px solid #EFEDEC;
		border-radius: 8px;
		box-sizing: border-box;
	}
}
</style>
