<template>
	<div class="c-lds g-flex g-fd-c g-pd-t-16 g-pd-lr-8" style="height: 100%;">
		<div class="g-flex-cc">
			<VImage
				class="g-m-b-32 g-pointer"
				src="https://dummyimage.com/74x16/555/fff/?text=logo"
				:previewable="false"
				@click="handleOpenNewPage"
			/>
		</div>
		<div class="g-f-1 g-of-h">
			<VScroller :native="false" style="height: 100%;">
				<div class="g-flex g-fd-c">
					<Item
						v-for="item in layoutStore.routes"
						:key="item.label"
						:info="item"
						class="g-pd-tb-12"
					/>
				</div>
			</VScroller>
		</div>
		<div class="g-pd-b-16 g-flex g-fd-c">
			<div class="g-flex g-fd-c g-pd-lr-12">
				<Notice label="消息" />
				<Avatar class="g-m-t-24" />
			</div>
		</div>
	</div>
</template>
<script setup lang="ts">
import { useRouter } from 'vue-router';
import Avatar from '../avatar/index.vue';
import Notice from '../notice/index.vue';
import Item from './item.vue';
import { useLayoutDefaultStore } from '../stores';

const layoutStore = useLayoutDefaultStore();
const router = useRouter();

// 默认打开第一个
const handleOpenNewPage = () => {
	router.push('/');
};
</script>
<style lang="scss">
$block: c-lds; // c-layout-default-sidebar;

@include block($block) {

}
</style>
