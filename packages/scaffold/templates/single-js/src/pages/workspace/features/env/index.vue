<template>
	<SetTitle title="Desktop Capabilities" >
		<div class="v-wfe g-pd-24">
			<header>
				<p>Environment and Authority</p>
				<h1>环境与权限</h1>
			</header>
			<div class="g-flex g-g-10">
				<VCard class="g-f-1/2" title="Network Environment">
					<div>Branch：{{ env.branch }}</div>
					<div>Base URL：{{ env.baseUrl }}</div>
				</VCard>
				<VCard class="g-f-1/2" title="Authority">
					<Authority value="preview">
						<VAlert class="g-m-tb-10" type="info">当前用户拥有 preview 权限</VAlert>
					</Authority>
					<Authority value="admin">
						<VAlert class="g-m-tb-10" type="success">当前用户拥有 admin 权限</VAlert>
					</Authority>
					<Button @click="handleChangePermission">切换权限</Button>
				</VCard>
			</div>
		</div>
	</SetTitle>
</template>
<script setup>
import { Button } from '@deot/vc';
import { Authority, SetTitle } from '@/src/components';
import { useEnvStore, useUserStore } from '@/src/stores';

const env = useEnvStore();
const userStore = useUserStore();

const handleChangePermission = () => {
	const isAdmin = userStore.permissions.includes('admin');
	const config = {
		userName: isAdmin ? 'preview' : 'admin',
		token: isAdmin ? 'preview-token' : 'admin-token',
		permissions: isAdmin ? ['preview'] : ['admin']
	};
	userStore.update(config);
};
</script>

<style lang="scss">
$block: v-wfe;

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
