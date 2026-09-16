<template>
	<VScroller
		class="c-ld g-relative"
		:class="{
			'has-layout': layoutStore.hasLayout,
			'has-navbar': layoutStore.hasLayout && layoutStore.hasNavbar && !layoutSizeStore.forceHideNavbar,
			[`is-${layoutStore.theme}`]: true
		}"
		:native="false"
	>
		<div
			v-if="layoutStore.loaded"
			:style="{
				padding: `${layoutStore.hasLayout ? layoutSizeStore.gap : 0}px`
			}"
			class="c-ld__display"
		>
			<div
				v-if="layoutStore.hasLayout"
				class="c-ld__nav"
			>
				<div
					v-if="layoutStore.hasSidebar"
					class="c-ld__sidebar"
					:style="{
						paddingRight: `${layoutSizeStore.gap}px`
					}"
				>
					<div
						class="c-ld__sidebar-wrapper"
						:style="{
							width: `${layoutSizeStore.sidebar.width}px`
						}"
					>
						<Sidebar />
					</div>
				</div>
				<div
					class="c-ld__navbar"
					:style="{
						width: `${layoutStore.hasNavbar ? layoutSizeStore.navbar.width : 0}px`
					}"
				>
					<div class="c-ld__navbar-wrapper">
						<Navbar />
					</div>
				</div>
			</div>
			<div
				class="c-ld__container"
				:style="{
					minWidth: `${layoutSizeStore.container.minWidth}px`
				}"
			>
				<div class="c-ld__wrapper">
					<div
						v-if="layoutStore.hasLayout"
						class="c-ld__header"
						:style="{
							height: `${layoutSizeStore.header.height}px`
						}"
					>
						<Header />
					</div>
					<div class="c-ld__content">
						<VResizer @resize="handleContentResize">
							<template #default="{ style }">
								<VScroller
									:ref="layoutScrollerStore.setScroller"
									:native="false"
									:style="style"
								>
									<RouterView v-slot="{ Component }">
										<KeepAlive
											:max="MAX_KEEP_ALIVE"
											:exclude="/no-keep-alive/"
										>
											<component :is="layoutStore.render && Component" />
										</KeepAlive>
									</RouterView>
								</VScroller>
							</template>
						</VResizer>
					</div>
				</div>
			</div>
		</div>
	</VScroller>
	<DownloadFloating v-if="!layoutStore.hasLayout" />
</template>
<script setup>
import { onMounted, provide } from 'vue';
import { MAX_KEEP_ALIVE } from '@/shared/constants';
import { Context } from '@/shared/modules/context';
import {
	useLayoutDefaultStore,
	useLayoutDefaultSizeStore,
	useLayoutDefaultScrollerStore,
	useLayoutDefaultTabsStore
} from './stores';

import Navbar from './navbar/index.vue';
import Sidebar from './sidebar/index.vue';
import Header from './header/index.vue';
import { DownloadFloating } from './download';

const layoutStore = useLayoutDefaultStore();
const layoutSizeStore = useLayoutDefaultSizeStore();
const layoutScrollerStore = useLayoutDefaultScrollerStore();
const layoutTabsStore = useLayoutDefaultTabsStore();

const loadData = async () => {
	if (window.__LAYOUT_ROUTES__) {
		layoutStore.setData(window.__LAYOUT_ROUTES__);
	} else {
		layoutStore.setData(await Context.platform.http('getLayoutRoutes'));
	}
};

const handleContentResize = (e) => {
	layoutSizeStore.setContent(e);
};

provide('layout-default', layoutStore);
provide('layout-default-size', layoutSizeStore);
provide('layout-default-scroller', layoutScrollerStore);
provide('layout-default-tabs', layoutTabsStore);

onMounted(loadData);
</script>
<style lang="scss">
$block: c-ld; // c-layout-default;

// 内容区域padding, 自行定义，不在本文件中处理
@include block($block) {
	width: 100vw;
	height: 100vh;
	background: #E8E9EE;

	// when(x, true) → has-x；when(x) / when(x, false) → is-x（非「无 x」）
	@include when(layout, true) {
		&:not(.has-navbar) {
			@include element(navbar-wrapper) {
				background: #E8E9EE; // 渲染补丁
			}

			@include element(wrapper) {
				border-bottom-left-radius: 8px;
				border-top-left-radius: 8px;
			}

			@include element(header) {
				border-top-left-radius: 8px;
			}
		}
	}

	&:not(.has-layout) {
		@include element(wrapper) {
			border-radius: 0;
		}
	}

	@include element(display) {
		display: flex;
		height: 100vh;
		box-sizing: border-box;
	}

	@include element(nav) {
		display: flex;
	}

	@include element(sidebar) {
		transition: width 0.2s cubic-bezier(0.34, 0.69, 0.1, 1);
	}

	@include element(sidebar-wrapper) {
		height: 100%;
		background: linear-gradient(99deg, #FBF9F7 -7.94%, #FAF7FA 40.05%, #F8F7FC 93.29%);
		border-radius: 8px;
	}

	@include element(navbar) {
		transition: width 0.2s cubic-bezier(0.34, 0.69, 0.1, 1);
	}

	@include element(navbar-wrapper) {
		height: 100%;
		background: #F8F9FB;
		border-bottom-left-radius: 8px;
		border-top-left-radius: 8px;
	}

	@include element(container) {
		width: 100%;
		height: 100%;
	}

	@include element(wrapper) {
		display: flex;
		width: 100%;
		height: 100%;
		background: white;
		border-top-right-radius: 8px;
		border-bottom-right-radius: 8px;
		flex-direction: column;
	}

	@include element(header) {
		background: white;
		border-top-right-radius: 8px;
	}

	@include element(content) {
		flex: 1;
		overflow: hidden;
	}

	@include when(v2) {
		@include element(navbar-wrapper) {
			border-top-right-radius: 8px;
			border-bottom-right-radius: 8px;
		}

		@include element(wrapper) {
			background: #E8E9EE;
			border-left: 4px solid #E8E9EE;
		}

		@include element(header) {
			border-top-left-radius: 8px;
		}

		@include when(layout, true) {
			&:not(.has-navbar) {
				@include element(wrapper) {
					border-left: none;
				}
			}
		}
	}
}
</style>
