<template>
	<div
		v-show="isActive"
		ref="c-ldrm"
		:style="{
			left: `${event.clientX}px`,
			top: `${top}px`
		}"
		class="c-ldrm"
	>
		<Resizer @resize="handleResize">
			<div class="c-ldrm__content">
				<div
					v-for="item in currentMenu"
					:key="item.label || item.value"
					:class="{ 'is-disabled': item.disabled }"
					class="c-ldrm__item"
					@click="handleClick(item)"
					@mousedown.stop
				>
					<span>{{ item.label }}</span>
				</div>
			</div>
		</Resizer>
	</div>
</template>
<script setup>
import { onMounted, onUnmounted, ref, getCurrentInstance, computed } from 'vue';
import { Resizer } from '@deot/vc';

const emit = defineEmits(['portal-fulfilled', 'portal-rejected']);
const props = defineProps({
	event: MouseEvent,
	menu: {
		type: Array,
		default: () => ([])
	}
});

const instance = getCurrentInstance();
const isActive = ref(false);
const wrapHeight = ref(0);
const currentMenu = computed(() => {
	return props.menu.map((i) => {
		return {
			...i,
			disabled: i.disabled,
			value: i.value,
			label: i.label,
			onOk: i.onOk
		};
	});
});

const top = computed(() => {
	return (window.innerHeight - props.event.clientY) < wrapHeight.value
		? (props.event.clientY - wrapHeight.value)
		: props.event.clientY;
});

const handleClick = (item) => {
	if (item.disabled) return;
	isActive.value = false;
	item?.onOk?.(item);
	emit('portal-fulfilled', item);
};

const operateDOMEvents = (type) => {
	const fn = (
		type === 'add'
			? document.documentElement.addEventListener
			: document.documentElement.removeEventListener
	).bind(document.documentElement);

	fn('click', handleDeselect);
};

const handleDeselect = (e) => {
	const path = e.path || e.composedPath() || [];
	const inArea = path.some(el => el === instance.vnode.el || el === props.event.target);

	if (!inArea) {
		isActive.value = false;
		emit('portal-rejected');
	}
};

const handleResize = (e) => {
	wrapHeight.value = e.height;
};

onMounted(() => {
	isActive.value = true;
	operateDOMEvents('add');
});

onUnmounted(() => {
	operateDOMEvents('remove');
});
</script>f
<style lang="scss">
$block: c-ldrm; // c-layout-default-right-menu;

@include block($block) {
	position: fixed;
	z-index: 1999;
	width: 212px;
	padding: 6px;
	background: white;
	border-radius: 8px;
	box-shadow: 0 2px 8px 0 rgb(0 0 0 / 4%), 0 4px 16px -2px rgb(0 0 0 / 16%);
	box-sizing: border-box;

	@include element(content) {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	@include element(item) {
		display: flex;
		width: 100%;
		height: 32px;
		padding: 0 8px;
		font-weight: 500;
		line-height: 32px;
		color: #080F20;
		cursor: pointer;
		align-items: center;
		justify-content: flex-start;
		border-radius: 8px;

		@include pseudo(hover) {
			color: #080F20;
			background: #F3F4F6;
		}

		@include when(disabled) {
			color: #e5e5e5;
			cursor: not-allowed !important;
		}
	}

	@include element(icon) {
		margin-right: 8px;
		font-size: 12px;
	}
}
</style>
