<template>
	<div :class="{ 'g-badge-dot': isActive }" class="g-flex-ac g-c-000 g-fs-16">
		<VIcon
			type="download"
			class="g-pointer"
			@click="handleOpenDrawer"
		/>
	</div>
</template>
<script setup lang="jsx">
import { ref } from 'vue';

const isActive = ref(false);
const handleOpenDrawer = async () => {
	isActive.value = false;
	alert('TODO: 任务中心');
};
</script>
<style lang="scss">
$block: c-ldd; // c-layout-default-download;

@include block($block) {
}
</style>
