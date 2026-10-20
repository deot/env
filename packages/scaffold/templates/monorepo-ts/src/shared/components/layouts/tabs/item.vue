<template>
	<div
		:title="label"
		:class="{ 'is-active': isActive }"
		class="c-ldntt g-flex-ac g-jc-sb"
		@click="() => linkPage()"
		@contextmenu.prevent="handleShowMenu"
	>
		<div class="c-ldntt__label g-line-1">
			<span>
				<span>{{ label }}</span>
				<span v-if="currentSameIndex >= 0">({{ currentSameIndex + 1 }})</span>
			</span>
		</div>
		<div
			v-if="deletable !== false"
			class="c-ldntt__close g-flex-cc g-w-14 g-h-14 g-fsh-0"
			:style="{ color: isActive ? 'white' : '#86909c'}"
			@click.stop="handleDeleteTag"
		>
			<VIcon
				type="close"
				class="g-fs-10"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Clipboard, Message } from '@deot/vc';
import * as Route from '@deot/helper-route';
import { useLayoutDefaultTabsStore, useLayoutDefaultStore } from '../stores';
import { RightMenu } from '../right-menu';

const props = defineProps({
	index: Number,

	// { value, label, deletable, draggable, lockless, query }
	value: String,
	label: String,
	//  是否可以删除
	deletable: {
		type: Boolean,
		default: true
	},
	// 如果为false表示为 不可拖动
	draggable: {
		type: Boolean,
		default: true
	},
	// 如果为false表示为 锁定
	lockless: {
		type: Boolean,
		default: true
	},
	query: Object as PropType<any>
});

const layoutStore = useLayoutDefaultStore();
const tabsStore = useLayoutDefaultTabsStore();
const router = useRouter();
const vRoute = useRoute();

const isActive = computed(() => tabsStore.current === props.index);
const currentSameIndex = computed(() => {
	if (tabsStore.similarTagsMap[props.value!].length <= 1) return -1;
	return tabsStore.similarTagsMap[props.value!].findIndex((i: any) => i.query === props.query);
});

const linkPage = async (route?: any) => {
	!route && (route = props);
	if (!(route?.value)) return Promise.reject('any');

	const _route = { path: route.value, query: route.query };
	tabsStore.updateCurrent(_route);
	if (route.value === vRoute.path) {
		await router.replace(_route);
		// 如果更新key, 会强制取消所有keep-alive
		if (!vRoute.meta.tabAlive) {
			layoutStore.reRender();
		}
	} else {
		await router.push(_route);
	};
};

/**
 * 移除tag，跳转至下一个（没有则上一个）
 */
const handleDeleteTag = async () => {
	const active = isActive.value;
	const _route = tabsStore.tags[tabsStore.current];
	tabsStore.remove(props);
	if (!active) {
		_route && tabsStore.updateCurrent(_route);
		return;
	};
	await linkPage(tabsStore.tags[props.index!] || tabsStore.tags[props.index! - 1]);
};

const handleShowMenu = (e: any) => {
	const href = `${location.origin}${router.options.history.base}${props.value}`;

	RightMenu.popup({
		event: e,
		menu: [
			{
				label: '关闭',
				disabled: props.index === 1 && tabsStore.tags.length === 2,
				onOk: () => {
					handleDeleteTag();
				}
			},
			{
				label: '关闭其他',
				disabled: tabsStore.tags.length <= 2,
				onOk: () => {
					const active = (props as any).active;
					tabsStore.clear();
					tabsStore.add(props);
					if (active) return;
					linkPage();
				}
			},
			{
				label: '关闭右侧',
				disabled: tabsStore.tags.length - props.index! <= 1,
				onOk: () => {
					const routes = tabsStore.tags.slice(props.index! + 1, tabsStore.tags.length);
					const active = routes.some(tabsStore.isActive);
					routes.forEach(tabsStore.remove);

					if (!active) return;
					linkPage();
				}
			},
			{
				label: '刷新当前',
				onOk: () => {
					layoutStore.reRender();
				}
			},
			{
				label: '重载系统',
				onOk: () => {
					window.history.replaceState(history.state, '', Route.merge({
						path: href,
						query: props.query
					}));
					location.reload();
				}
			},
			{
				label: '在窗口中打开链接',
				onOk: () => window.open(href, '_blank')
			},
			{
				label: '复制链接地址',
				onOk: () => {
					Clipboard.set(href);
					Message.success('复制成功');
				}
			}
		]
	});
};

</script>

<style lang="scss">
$block: c-ldntt; // c-layout-default-tabs-tag;

@include block($block) {
	padding: 0 8px;
	margin-right: 4px;
	font-weight: 500;
	line-height: 32px;
	color: #1D2129;
	cursor: pointer;
	background: #F8FAFB;
	border-radius: 8px;

	@include element(close) {
		margin-left: 10px;
		border-radius: 50%;

		i {
			transform: scale(0.6);
		}
	}

	@include pseudo(hover) {
		background: #F2F3F5;

		@include element(close) {
			background: #e8e8e8;
		}
	}

	@include when(active) {
		color: white;
		background: #456CF6;

		@include element(close) {
			background: rgb(255 255 255 / 30%);
		}
	}
};
</style>
