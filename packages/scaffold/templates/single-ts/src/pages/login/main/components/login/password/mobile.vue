<template>
	<div class="g-flex g-fd-c">
		<div class="g-c-000 g-fs-24 g-fw-600 g-pd-tb-24">使用手机号找回密码</div>
		<VForm
			ref="form"
			:model="formData"
			:rules="rules"
			label-position="top"
			style="padding: 0;"
		>
			<VFormItem prop="mobileNumber" :asterisk="false" required="请输入手机号">
				<div class="g-flex g-fd-c">
					<div class="g-flex-ac">
						<VInput
							v-model="formData.mobileNumber"
							:maxlength="11"
							:placeholder="'请输入手机号'"
							clearable
						/>
					</div>
				</div>
			</VFormItem>
			<VFormItem prop="mobileCode" :asterisk="false" required="请输入验证码">
				<div class="g-flex g-fd-c">
					<div class="g-flex-ac">
						<VInput
							v-model="formData.mobileCode"
							placeholder="请输入验证码"
							:maxlength="6"
							clearable
						>
							<template #append>
								<SendCode
									ref="code$"
									:value="formData.mobileNumber"
									style="height: 40px;"
									class="g-pd-r-12"
								/>
							</template>
						</VInput>
					</div>
				</div>
			</VFormItem>
			<VFormItem prop="userPassword" :asterisk="false">
				<div class="g-flex g-fd-c">
					<div class="g-flex-ac">
						<VInput
							v-model="formData.userPassword"
							:type="states.type.current"
							:placeholder="'请输入新密码'"
							clearable
						>
							<template #append>
								<VIcon
									style="height: 40px; line-height: 40px;"
									class="g-pd-r-12 g-pointer"
									:type="states.icon.current"
									@click="shows.current = !shows.current"
								/>
							</template>
						</VInput>
					</div>
				</div>
			</VFormItem>
			<VFormItem prop="userConfirmPassword" :asterisk="false">
				<div class="g-flex g-fd-c">
					<div class="g-flex-ac">
						<VInput
							v-model="formData.userConfirmPassword"
							:type="states.type.confirm"
							:placeholder="'再次输入新密码'"
							clearable
							@enter="$emit('submit')"
						>
							<template #append>
								<VIcon
									style="height: 40px; line-height: 40px;"
									class="g-pd-r-12 g-pointer"
									:type="states.icon.confirm"
									@click="shows.confirm = !shows.confirm"
								/>
							</template>
						</VInput>
					</div>
				</div>
			</VFormItem>
		</VForm>
	</div>
</template>
<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { Rules } from '@/src/utils';

defineEmits(['submit']);

const form = ref<any>();
const code$ = ref<any>();
const shows = reactive({
	current: false,
	confirm: false
});

const states = computed(() => {
	return Object.keys(shows).reduce((pre: any, cur) => {
		const v = (shows as any)[cur];
		pre.type[cur] = v ? 'text' : 'password';
		pre.icon[cur] = v ? 'visible' : 'invisible';
		return pre;
	}, { type: {}, icon: {} } as any);
});

const formData = reactive({
	mobileNumber: '',
	mobileCode: '',
	userPassword: '',
	userConfirmPassword: ''
});

const rules = reactive({
	userPassword: Rules.password((v: any) => {
		if (!v) return '请输入新密码';
	}),
	userConfirmPassword: Rules.password((v: any) => {
		if (!v) return '请输入确认密码';
		if (v !== formData.userPassword) {
			return `密码不一致，请确认`;
		}
	})
});

defineExpose({
	disabled: computed(() => {
		return !formData.mobileNumber || !formData.mobileCode || !formData.userPassword || !formData.userConfirmPassword;
	}),
	getData: () => ({ ...formData }),
	validate: () => form.value.validate()
});

</script>

<style lang="scss">
$component-name: c-login-view-forget;

@include block($component-name) {
	@include element(content) {

	}
}
</style>
