<template>
	<div class="c-set-title">
		<slot />
	</div>
</template>

<script setup>
defineProps({
	tag: {
		type: String,
		default: 'div'
	}
});
</script>

<style lang="scss">
$component-name: c-set-title;

@include block($component-name) {

}
</style>