<template>
	<SetTitle title="Desktop Capabilities" >
		<div class="v-wff g-pd-24">
			<header>
				<p>Feedback</p>
				<h1>桌面反馈</h1>
			</header>
			<div class="g-flex g-g-10">
				<Button @click="handleShowSuccess">Message.success</Button>
				<Button @click="handleShowModal">Modal.info</Button>
			</div>
		</div>
	</SetTitle>
</template>
<script setup lang="ts">
import { Button, Modal, Message } from '@deot/vc';
import { SetTitle } from '@/shared';

const handleShowSuccess = () => Message.success('Manage feedback is ready');
const handleShowModal = () => Modal.info({
	title: 'Manage Scaffold',
	content: '桌面应用通过 Message 与 Modal 提供反馈。',
	onCancel: () => {}
});
</script>

<style lang="scss">
$block: v-wff;

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
