<template>
	<div
		v-if="isInner && !layoutTabsStore.disabled && !layoutTabsStore.innerDisabled"
		class="c-ldhii g-line-nowrap g-flex-ac g-pd-t-8"
		style="color: #1D2129;"
	>
		<div
			class="g-flex-ac"
			v-for="(item, index) in currentPageRoutes"
			:key="item.label"
		>
			<span
				class="g-fs-14 g-fw-400"
				:class="{
					'g-fw-500': index === currentPageRoutes.length - 1,
					'g-pointer': item.value
				}"
				:style="[
					`color: ${(index >= 0 && item.value) ? '#4E5969' : (index > 0 ? '#1D2129' : '')}`
				]"
				@click="handleLinkPage(item)"
			>{{ item.label }}</span>
			<Icon
				v-if="index !== currentPageRoutes.length - 1"
				type="layout/right"
				class="g-m-l-6 g-m-r-6 g-br-6"
				:size="16"
			/>
		</div>
	</div>
</template>
<script setup lang="jsx">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useLayoutDefaultStore, useLayoutDefaultTabsStore } from '../stores';

const router = useRouter();
const layoutStore = useLayoutDefaultStore();
const layoutTabsStore = useLayoutDefaultTabsStore();

const currentPageRoutes = computed(() => {
	return layoutStore.currentPageRoutes;
});
const isInner = computed(() => layoutStore.isInnerPage);

const handleLinkPage = (item) => {
	router.replace(item.value);
};

</script>
<style lang="scss">
$block: c-ldhii; // c-layout-default-header-title-inner;

@include block($block) {
	line-height: 28px;

	@include element(icon) {
		@include pseudo(hover) {
			background: #E5E6EB;
		}
	}
}
</style>
