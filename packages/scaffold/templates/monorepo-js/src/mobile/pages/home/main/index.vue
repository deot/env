<template>
	<SetTitle title="Mobile Preview">
		<div class="g-pd-24">
			<h2>Mobile Feedback</h2>
			<div class="g-flex">
				<MButton @click="handleShowToast">MToast.success</MButton>
				<MButton @click="handleShowModal">MModal.operation</MButton>
			</div>
			<h2>Environment</h2>
			<div class="g-flex g-fd-c g-m-b-20">
				<div>Branch：{{ env.branch }}</div>
				<div>Base URL：{{ env.baseUrl }}</div>
				<div>Source：{{ env.headerSourceCode }}</div>
			</div>
			<MButton type="primary" @click="handleLogout">Logout</MButton>
		</div>
	</SetTitle>
</template>
<script setup>
import { MButton } from '@deot/vc';
import { SetTitle, useEnvStore } from '@/shared';
import { Context } from '@/shared/modules/context';
import { Global } from '@/shared/modules/global';
import { apiRoots } from '@/mobile/stores';

const env = useEnvStore();
const handleShowToast = () => Context.platform.success('Mobile feedback is ready');
const handleShowModal = () => Context.platform.modal({
	title: 'Mobile Scaffold',
	content: '移动应用通过 MToast 与 MModal 提供反馈。',
	onCancel: () => {}
});
const handleLogout = async () => {
	try {
		await apiRoots.logout();
	} finally {
		Global.clearLoginAuth({ reLogin: true });
	}
};
</script>

<style lang="scss">
$block: v-hm;

@include block($block) {

}
</style>

<route lang="json5">
{
	meta: {
		layout: 'default-mobile'
	}
}
</route>
