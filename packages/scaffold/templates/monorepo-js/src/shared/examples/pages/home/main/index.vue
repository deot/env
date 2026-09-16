<template>
	<SetTitle value="Manage Overview">
		<div class="v-hm g-pd-24 g-flex g-fd-c g-g-24">
			<router-link to="/style/unocss/on-demand">UnoCSS 按需注入</router-link>
		</div>
	</SetTitle>
</template>
<script setup>
import { SetTitle, useFirstRoute } from '@/shared';
import { LAYOUT_HOME_VISIBLE } from '@/manage/constants';

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
