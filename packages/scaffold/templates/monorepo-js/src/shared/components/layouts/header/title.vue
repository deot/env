<template>
	<div class="c-ldhi g-nowrap g-flex-ac" style="color: #080F20;">
		<span v-if="layoutTabsStore.disabled && !isInner" class="g-fs-20 g-fw-600">{{ title }}</span>
		<div v-else-if="isInner && (layoutTabsStore.disabled || layoutTabsStore.innerDisabled)" class="g-flex-ac">
			<Icon
				v-if="isInner"
				type="layout/back"
				class="g-m-r-12 g-pointer g-br-6 c-ldhi__icon"
				:size="[26, 20]"
				@click="handleBack"
			/>
			<div
				class="g-flex-ac"
				v-for="(item, index) in currentPageRoutes"
				:key="item.label"
			>
				<span
					:class="{
						'g-fs-20 g-fw-600': index === 0,
						'g-fs-13 g-fw-400': index !== 0,
						'g-pointer': item.value
					}"
					:style="[
						`color: ${(index > 0 && item.value) ? '#456cf6' : (index > 0 ? '#1D2129' : '')}`
					]"
					@click="handleLinkPage(item)"
				>{{ item.label }}</span>
				<Icon
					v-if="index !== currentPageRoutes.length - 1"
					type="layout/right"
					class="g-m-l-12 g-m-r-12 g-br-6"
					:size="16"
				/>
			</div>
		</div>
	</div>
</template>
<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useLayoutDefaultStore, useLayoutDefaultTabsStore } from '../stores';

const router = useRouter();
const layoutTabsStore = useLayoutDefaultTabsStore();
const layoutStore = useLayoutDefaultStore();

const currentPageRoutes = computed(() => layoutStore.currentPageRoutes);
const isInner = computed(() => layoutStore.isInnerPage);

const title = computed(() => {
	return layoutStore.currentPage.title || layoutStore.currentNavbarRoute?.label;
});

const handleBack = () => {
	router.back();
};

const handleLinkPage = (item) => {
	router.replace(item.value);
};

</script>
<style lang="scss">
$block: c-ldhi; // c-layout-default-header-title;

@include block($block) {
	line-height: 28px;
}
</style>
