<template>
	<div :ref="layoutScrollerStore.setScroller" class="c-layout-mobile">
		<RouterView v-slot="{ Component }">
			<KeepAlive :max="MAX_KEEP_ALIVE" :exclude="/no-keep-alive/">
				<component :is="layoutStore.render && Component" />
			</KeepAlive>
		</RouterView>
	</div>
</template>
<script setup>
import { provide } from 'vue';
import { MAX_KEEP_ALIVE } from '@/shared/constants';
import {
	useLayoutDefaultScrollerStore,
	useLayoutDefaultStore
} from '@/shared/components/layouts/stores';

const layoutStore = useLayoutDefaultStore();
const layoutScrollerStore = useLayoutDefaultScrollerStore();

provide('layout-default', layoutStore);
provide('layout-default-scroller', layoutScrollerStore);
</script>
<style lang="scss">
$block: c-layout-mobile;

@include block($block) {
	height: 100vh;
	overflow: auto;
}
</style>
