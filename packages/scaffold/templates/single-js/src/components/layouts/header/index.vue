<template>
	<div class="c-ldh g-flex g-fd-c g-pd-lr-24 g-jc-c">
		<div class="g-flex-ac">
			<NavbarToggle />
			<Title />
			<div v-if="false" class="c-ldh__search g-f-1 g-flex-ac">
				<VInputSearch
					prepend="search"
					placeholder="搜索内容"
					:enter-text="false"
				/>
			</div>
			<div
				v-else-if="!layoutTabsStore.disabled && (!layoutTabsStore.innerDisabled || !layoutStore.isInnerPage)"
				class="g-f-1 g-of-h"
			>
				<Tabs />
			</div>
			<div v-else class="g-f-1" />
			<Download class="g-m-l-8" />
			<Notice v-if="!layoutStore.hasSidebar" class="g-m-l-8" />
			<Avatar
				v-if="!layoutStore.hasSidebar"
				:size="30"
				:show-user-name="false"
				class="g-m-l-12"
			/>
		</div>
		<TitleInner />
	</div>
</template>
<script setup>
import { useLayoutDefaultStore, useLayoutDefaultTabsStore } from '../stores';
import Avatar from '../avatar/index.vue';
import Download from '../download/index.vue';
import Notice from '../notice/index.vue';
import Title from './title.vue';
import TitleInner from './title-inner.vue';
import Tabs from '../tabs/index.vue';
import NavbarToggle from './navbar-toggle.vue';

const layoutStore = useLayoutDefaultStore();
const layoutTabsStore = useLayoutDefaultTabsStore();

</script>
<style lang="scss">
$block: c-ldh; // c-layout-default-header;

@include block($block) {
	height: 100%;

	@include element(search) {
		.vc-input-search {
			min-height: 32px;
			background: #F3F4F6;

			&::after {
				border: none;
			}
		}

		.vc-input__append, .vc-input__prepend {
			height: 32px;
			padding-left: 8px;
			line-height: 32px;
			color: #9AA0A9;
			background: transparent;
		}

		.vc-input__content input {
			padding-left: 20px;
		}
	}

	@include element(avatar) {
		flex-shrink: 0;
		width: 30px;
		height: 30px;
		background: #F3F4F6;

		img {
			width: 100%;
			height: 100%;
		}
	}

	@include element(logout) {
		width: 264px;
	}

	@include element(logout-item) {
		line-height: 48px;
		cursor: pointer;
		background: white;

		&:hover {
			background: #F5F5F6;
		}
	}
}
</style>
