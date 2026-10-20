<template>
	<div v-if="layoutStore.routes.length" class="c-ldn g-flex g-fd-c" style="height: 100%;">
		<div v-if="showTitle" class="g-flex-ac g-pd-l-20 g-pd-tb-16 g-pointer">
			<div v-if="isSingle" class="g-flex-cc g-m-r-10" title="回到首页" @click="handleLinkHome">
				<VImage
					class="g-pointer"
					src="https://dummyimage.com/74x16/555/fff/?text=logo"
					:previewable="false"
				/>
			</div>
			<div v-if="current" class="g-fs-20 g-fw-600 g-line-nowrap g-f-1" style=" line-height: 26px;color: #080F20;">
				{{ current.fullLabel || current.label }}
			</div>
			<div
				v-if="!layoutSizeStore.forceHideNavbar"
				class="c-ldn__collapse-root g-m-r-10 g-pointer g-br-6 g-w-26 g-h-26 g-flex-cc"
				@click="layoutSizeStore.toggleNavBar(true);"
			>
				<VIcon class="g-fs-16" type="left" />
			</div>
		</div>
		<div class="g-f-1 g-of-h">
			<VScroller :native="false" style="height: 100%;">
				<div v-if="current" class="g-flex g-fd-c g-pd-lr-8">
					<template v-for="item in current.children" :key="item.label">
						<div v-if="item.children.length" class="g-flex g-fd-c g-pd-tb-8">
							<div class="g-flex g-pd-l-8 g-pd-r-8">
								<div
									v-if="current.children.length > 1"
									class="c-ldn__collapse-leaf g-flex g-jc-sb g-pointer g-pd-r-4 g-f-1"
									@click="handleSetVisible(item.value)"
								>
									<div
										class="g-flex g-fw-600 g-fs-13 g-pd-l-16"
										style=" line-height: 36px;color: rgb(14 25 52 / 80%);"
									>{{ item.label }}</div>
									<div class="g-flex-cc g-w-36 g-h-36">
										<VIcon
											:type="isVisible(item.value) ? 'up' : 'down'"
											class="g-fs-12"
										/>
									</div>
								</div>
							</div>
							<VExpand
								:model-value="isVisible(item.value)"
								class="g-flex g-fwr-w g-pd-l-24 g-pd-r-12"
							>
								<Item
									v-for="item$ in item.children"
									class="g-f-1/2"
									:key="item$.label"
									:info="item$"
									@click="handleOpenNewPage"
								/>
							</VExpand>
						</div>
					</template>
				</div>
			</VScroller>
		</div>
	</div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import Item from './item.vue';
import { useLayoutDefaultStore, useLayoutDefaultSizeStore } from '../stores';

const emit = defineEmits(['cell-click']);
const props = defineProps({
	info: Object,
	showTitle: {
		type: Boolean,
		default: true
	}
});
const router = useRouter();
const layoutSizeStore = useLayoutDefaultSizeStore();
const layoutStore = useLayoutDefaultStore();

const isSingle = computed(() => {
	return layoutStore.routes.length === 1;
});

const current = computed(() => {
	return props.info || (!isSingle.value ? layoutStore.currentNavbarRoutes[0] : layoutStore.routes[0]);
});

const isVisible = (path) => {
	const map = layoutStore.navbarVisibleMap;
	return typeof map[path] === 'undefined' || map[path] ? true : false;
};

const handleSetVisible = (path) => {
	layoutStore.navbarVisibleMap[path] = !isVisible(path);
};

// 默认打开第一个
const handleLinkHome = () => {
	router.push('/');
};

const handleOpenNewPage = (e) => {
	emit('cell-click', e);
};

</script>
<style lang="scss">
$block: c-ldn; // c-layout-default-navbar;

@include block($block) {
	@include element(collapse-root) {
		@include pseudo(hover) {
			background: #E5E6EB;
		}
	}

	@include element(collapse-leaf) {
		@include pseudo(hover) {
			background: #F1F1F4;
			border-radius: 8px;
		}
	}
}
</style>
