<template>
	<div class="g-flex-ac c-ldhn">
		<div
			v-if="layoutSizeStore.forceHideNavbar && layoutStore.hasNavbar && (layoutStore.currentNavbarRoute || layoutStore.currentPageRoute)"
			class="c-ldhn__icon g-m-r-12 g-pointer g-br-6 g-w-26 g-h-26 g-flex-cc"
			@click="handleOpen"
			@mouseenter="handleEnter"
		>
			<VIcon type="right" class="g-fs-16" />
		</div>
	</div>
</template>
<script setup lang="jsx">
import { Popover } from '@deot/vc';
import { useLayoutDefaultStore, useLayoutDefaultSizeStore } from '../stores';
import Navbar from '../navbar/index.vue';

const layoutSizeStore = useLayoutDefaultSizeStore();
const layoutStore = useLayoutDefaultStore();

const handleOpen = () => {
	layoutSizeStore.toggleNavBar(false);
	handleEnter.poper.destroy();
	handleEnter.poper = null;
};
const handleEnter = (e) => {
	if (handleEnter.lock) return;
	handleEnter.poper = Popover.open({
		el: document.body,
		triggerEl: e.target,
		hover: true,
		alone: true,
		placement: 'top-left',
		portalClass: 'is-padding-none',
		content: () => {
			return (
				<Navbar
					style="width: 204px; height: 500px"
					showTitle={false}
					onCellClick={() => handleEnter.poper.wrapper.toggle(false)}
				/>
			);
		}
	});
};
</script>
<style lang="scss">
$block: c-ldhn; // c-layout-default-header-navbar;

@include block($block) {
	@include element(icon) {
		@include pseudo(hover) {
			background: #E5E6EB;
		}
	}
}
</style>
