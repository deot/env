<template>
	<Resizer class="c-ldnt g-flex-ac" @resize="handleResize">
		<template #default="{ width }">
			<Scroller
				v-if="tabsStore.tags?.length"
				ref="scroller"
				:style="`width: ${width}px`"
				:native="false"
				content-class="g-flex-ac"
				style="white-space: nowrap;"
			>
				<div ref="content" class="g-flex-ac">
					<template v-for="(item, index) in tabsStore.tags" :key="index">
						<Tag
							v-if="displayable(index)"
							:style="itemStyle"
							:index="index"
							v-bind="item"
							:deletable="deletable(index)"
						/>
					</template>
				</div>
			</Scroller>
		</template>
	</Resizer>
</template>
<script setup>
import { computed, ref, watch } from 'vue';
import { Resizer, Scroller } from '@deot/vc';
import { sleep } from '@deot/helper-utils';
import { Context } from '@/shared/modules/context';
import { useLayoutDefaultTabsStore } from '../stores/use-layout-default-tabs';
import Tag from './item.vue';

const tabsStore = useLayoutDefaultTabsStore();

const scrollable = ref(false);
const content = ref();
const scroller = ref();
const clientWidth = ref(0);
const itemStyle = computed(() => {
	const length = tabsStore.tags.length;
	return {
		width: Math.min(150, Math.max(clientWidth.value / length, 64)) + 'px'
	};
});

const displayable = (index) => {
	const showHome = Context.platform.constant('LAYOUT_HOME_VISIBLE');
	const min = showHome ? 0 : 1;
	return (showHome || index !== 0) && tabsStore.tags.length > min;
};

const deletable = (index) => {
	const item = tabsStore.tags[index];
	const min = Context.platform.constant('LAYOUT_HOME_VISIBLE') ? 1 : 2;
	return tabsStore.tags.length !== min && item.deletable;
};

const refresh = async () => {
	await sleep(100);
	if (!content.value) return;
	const width = content.value.getBoundingClientRect().width;

	clientWidth.value && (scrollable.value = width > clientWidth.value);
};

const handleResize = async (e) => {
	clientWidth.value = e.width;
	refresh();
};

watch(() => tabsStore.tags, refresh);
</script>
<style lang="scss">
$block: c-ldnt; // c-layout-default-tabs;

@include block($block) {

};
</style>
