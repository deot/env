<template>
	<VPopover class="c-lda g-flex-ac">
		<div class="g-flex-ac g-pointer">
			<div
				class="c-lda__placeholder g-br-circle g-flex-cc"
				:class="{
					'g-bg-blue-light': !userStore.avatar,
					'g-m-r-10': showUserName
				}"
				:style="`width: ${size}px; height: ${size}px`"
			>
				<VImage v-if="userStore.avatar" :src="userStore.avatar" alt="" />
				<div v-else class="g-c-white" :style="`font-size: ${size / 2}px`">{{ userStore.userName[0] || '-' }}</div>
			</div>

			<div
				v-if="showUserName"
				class="g-line-1 g-fs-13 g-fw-400"
				style="color: #374455;"
				:title="userStore.userName"
			>{{ userStore.userName || '-' }}</div>
		</div>
		<template #content>
			<div class="c-lda__logout g-flex g-fd-c g-pd-12">
				<div class="g-flex-ac g-jc-sb g-m-b-12">
					<div class="g-fs-20 g-fw-500 g-c-000">{{ userStore.userName }}</div>
					<div class="c-lda g-br-circle">
						<div src="" alt="" />
					</div>
				</div>
				<div class="g-flex g-fd-c g-br-6" style="border: 1px solid #F6F6F7;">
					<div v-if="false" class="c-lda__logout-item g-flex-ac g-pd-lr-8 g-jc-sb g-pd-lr-16 g-pointer" @click="handleTodo">
						<div class="g-c-000 g-fs-13 g-fw-500">修改头像</div>
						<Icon type="home/arrow-right" :size="[24, 16]" />
					</div>
					<div class="c-lda__logout-item g-flex-ac g-pd-lr-8 g-jc-sb g-pd-lr-16 g-pointer" @click="handlePasswordEditor">
						<div class="g-c-000 g-fs-13 g-fw-500">修改密码</div>
						<Icon type="home/arrow-right" :size="[24, 16]" />
					</div>
					<div class="c-lda__logout-item g-flex-ac g-pd-lr-8 g-jc-sb g-pd-lr-16" @click="handleLogout">
						<div class="g-c-000 g-fs-13 g-fw-500">登出</div>
						<Icon type="layout/logout" :size="[24, 16]" />
					</div>
				</div>
			</div>
		</template>
	</VPopover>
</template>
<script setup lang="tsx">
import { Message } from '@deot/vc';
import { useUserStore } from '@/shared/stores/modules';
import { Global } from '@/shared/modules/global';
import { Context } from '@/shared/modules/context';
import { PasswordEditor } from './password-editor';

defineProps({
	size: {
		type: Number,
		default: 20
	},
	showUserName: {
		type: Boolean,
		default: true
	}
});
const userStore = useUserStore();

const handleLogout = async () => {
	try {
		await Context.platform.http('logout');
	} finally {
		Global.clearLoginAuth({ reLogin: true });
	}
};

const handleTodo = () => {
	Message.info('TODO');
};

const handlePasswordEditor = async () => {
	await PasswordEditor.popup();
};
</script>
<style lang="scss">
$block: c-lda; // c-layout-default-avatar;

@include block($block) {
	@include element(placeholder) {
		flex-shrink: 0;
		width: 30px;
		height: 30px;
		background: #F3F4F6;

		img {
			width: 100%;
			height: 100%;
		}
	}

	@include element(logout) {
		width: 264px;
	}

	@include element(logout-item) {
		line-height: 48px;
		cursor: pointer;
		background: white;

		&:hover {
			background: #F5F5F6;
		}
	}
}
</style>
