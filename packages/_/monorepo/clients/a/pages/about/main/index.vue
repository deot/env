<template>
	<div @click="handleClick">{{ message }}</div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const message = ref('a/About');

const handleClick = () => {
	router.push('/')
}
</script>

<route lang="json5">
{
	meta: {
		layout: 'default'
	}
}
</route>