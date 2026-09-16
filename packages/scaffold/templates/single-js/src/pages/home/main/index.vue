<template>
	<SetTitle value="Manage Overview">
		<div class="v-hm g-pd-24 g-flex g-fd-c g-g-24">
			<router-link to="/workspace/features/feedback">桌面反馈</router-link>
			<router-link to="/workspace/features/env">环境能力</router-link>
		</div>
	</SetTitle>
</template>
<script setup>
import { SetTitle } from '@/src/components';
import { useFirstRoute } from '@/src/hooks';
import { LAYOUT_HOME_VISIBLE } from '@/src/constants';

useFirstRoute('default', !LAYOUT_HOME_VISIBLE);

</script>

<style lang="scss">
$block: v-hm;

@include block($block) {

}
</style>

<route lang="json5">
{
	meta: {
		layout: 'default'
	}
}
</route>
