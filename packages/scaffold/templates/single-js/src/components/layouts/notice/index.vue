<template>
	<div class="c-ldn g-flex-ac g-pointer" @click="handleLinkNotice">
		<div
			class="g-flex-ac"
			:class="{ 'g-m-r-10': !!label, 'g-badge-dot': !!noticeStore.count }"
		>
			<VIcon
				:type="icon"
				class="g-fs-16 g-c-[#0E1934]"
			/>
		</div>
		<div
			v-if="showLabel && label"
			class="g-fs-13 g-fw-400"
			style="color: #374455;"
		>{{ label }}</div>
	</div>
</template>
<script setup>
import { useRouter } from 'vue-router';
import { useNoticeStore } from '@/src/stores/modules';

defineProps({
	icon: {
		type: String,
		default: 'o-info'
	},
	label: {
		type: [String],
		default: ''
	},
	showLabel: {
		type: Boolean,
		default: true
	},
});

const noticeStore = useNoticeStore();
const router = useRouter();

const handleLinkNotice = async () => {
	router.push('/home/notice');
};
</script>
<style lang="scss">
$block: c-ldn; // c-layout-default-notice;

@include block($block) {

}
</style>
