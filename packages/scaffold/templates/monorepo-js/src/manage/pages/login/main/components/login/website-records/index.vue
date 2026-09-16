<template>
	<span v-if="value" class="c-login-website-records">
		<a href="https://beian.miit.gov.cn/" target="_blank">备案号: </a>
		<a href="https://beian.miit.gov.cn/" target="_blank">{{ value }}</a>
	</span>
</template>

<script setup>
const vMap = {};

const hosts = location.host.split('.');
const domainIndex = hosts.findIndex(i => i === 'com') - 1;

const value = domainIndex >= 0 ? vMap[hosts[domainIndex]] : '';
</script>
<style lang="scss">
$component-name: c-login-website-records;

@include block($component-name) {
	position: fixed;
	bottom: 20px;
	left: 50%;
	cursor: pointer;
	transform: translateX(-50%);

	a {
		font-size: 12px;
		color: rgb(134 144 156);
	}
}
</style>
