<template>
	<VModalView
		ref="target"
		v-model="isActive"
		:title="title"
		size="small"
		:ok-disabled="disabled"
		@ok="handleOk"
		@close="handleClose"
	>
		<VForm
			ref="form"
			:model="formData"
			:rules="rules"
			label-position="top"
			style="padding: 0;"
		>
			<VFormItem
				prop="oldPassword"
				label="旧密码"
				required="请输入旧密码"
			>
				<VInput
					v-model="formData.oldPassword"
					:type="states.type.old"
					:placeholder="'请输入旧密码'"
					clearable
				>
					<template #append>
						<VIcon
							class="g-pd-r-12 g-pointer"
							:type="states.icon.old"
							@click="shows.old = !shows.old"
						/>
					</template>
				</VInput>
			</VFormItem>
			<VFormItem
				prop="newPassword"
				label="新密码"
			>
				<VInput
					v-model="formData.newPassword"
					:type="states.type.new"
					:placeholder="'请输入新密码'"
					clearable
				>
					<template #append>
						<VIcon
							class="g-pd-r-12 g-pointer"
							:type="states.icon.new"
							@click="shows.new = !shows.new"
						/>
					</template>
				</VInput>
			</VFormItem>
			<VFormItem
				prop="repeatPassword"
				label="确认密码"
			>
				<VInput
					v-model="formData.repeatPassword"
					:type="states.type.repeat"
					:placeholder="'请输入确认密码'"
					clearable
				>
					<template #append>
						<VIcon
							class="g-pd-r-12 g-pointer"
							:type="states.icon.repeat"
							@click="shows.repeat = !shows.repeat"
						/>
					</template>
				</VInput>
			</VFormItem>
		</VForm>
	</VModalView>
</template>
<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import { Rules } from '@/src/utils';
import { Global } from '@/src/modules/global';
import { Context } from '@/src/modules/context';

const props = defineProps({
	title: {
		type: String,
		default: '修改密码'
	},
	logout: {
		type: Boolean,
		default: true
	}
});

const emit = defineEmits(['portal-fulfilled', 'portal-rejected']);

const form = ref();
const formData = reactive({
	oldPassword: '',
	newPassword: '',
	repeatPassword: ''
});
const shows = reactive({
	old: false,
	new: false,
	repeat: false
});

const disabled = computed(() => {
	return !formData.oldPassword || !formData.newPassword || !formData.repeatPassword;
});

const states = computed(() => {
	return Object.keys(shows).reduce((pre, cur) => {
		const v = shows[cur];
		pre.type[cur] = v ? 'text' : 'password';
		pre.icon[cur] = v ? 'visible' : 'invisible';
		return pre;
	}, { type: {}, icon: {} });
});

const rules = reactive({
	newPassword: Rules.password((v) => {
		if (!v) return '请输入新密码';
		if (v === formData.oldPassword) {
			return `新旧密码一致，请确认`;
		}
	}),
	repeatPassword: Rules.password((v) => {
		if (!v) return '请输入确认密码';
		if (v !== formData.newPassword) {
			return `新密码/确认密码不一致，请确认`;
		}
	})
});

const isActive = ref(false);

const handleOk = async () => {
	await form.value.validate();
	await Context.platform.http('updatePassword', formData);

	if (!props.logout) emit('portal-fulfilled');

	try {
		await Context.platform.http('logout');
	} finally {
		Global.clearLoginAuth({ reLogin: true });
		emit('portal-fulfilled');
	}
};

const handleClose = () => {
	emit('portal-rejected');
};

onMounted(() => {
	isActive.value = true;
});
</script>
<style lang="scss">

</style>
