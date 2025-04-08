<template>
	<div @click="handleClick">{{ message }}</div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const message = ref('shared/Home');

const handleClick = () => {
	router.push('/about/main')
}
</script>

<route lang="json5">
{
	meta: {
		layout: 'default'
	}
}
</route>