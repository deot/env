<template>
	<teleport to="body">
		<div
			class="c-lddf__handle g-fs-26 g-c-fff"
			@click="handleClick"
		>
			<VIcon type="download"/>
		</div>
	</teleport>
</template>

<script setup>

const handleClick = async () => {
	alert('TODO: 任务中心');
};
</script>

<style lang="scss">
$block: c-lddf; // c-layout-default-download-floating;

@include block($block) {
	@include element(handle) {
		position: fixed;
		top: 50%;
		right: -38px;
		z-index: 1000;
		display: flex;
		width: 48px;
		height: 48px;
		margin-top: -24px;
		cursor: pointer;
		background-color: var(--vc-color-primary, #456cf6);
		border-radius: 6px 0 0 6px;
		box-sizing: border-box;
		transition: right .5s;
		align-items: center;
		justify-content: center;

		&:hover {
			right: 0;
		}
	}
}
</style>
