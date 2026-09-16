<template>
	<VForm
		ref="form"
		:model="formData"
		:rules="rules"
		label-position="top"
		style="padding: 0;"
	>
		<VFormItem prop="username" :asterisk="false" required="请输入手机号">
			<div class="g-flex g-fd-c">
				<div class="g-flex-ac">
					<VInput
						v-model="formData.username"
						:maxlength="11"
						:placeholder="'请输入手机号'"
						clearable
					/>
				</div>
			</div>
		</VFormItem>
		<VFormItem prop="smsCode" :asterisk="false" required="请输入验证码">
			<div class="g-flex g-fd-c">
				<div class="g-flex-ac">
					<VInput
						v-model="formData.smsCode"
						placeholder="请输入验证码"
						:maxlength="6"
						clearable
					>
						<template #append>
							<SendCode
								ref="code$"
								:value="formData.username"
								style="height: 40px;"
								class="g-pd-r-12"
								@confirm="$emit('submit')"
							/>
						</template>
					</VInput>
				</div>
			</div>
		</VFormItem>
	</VForm>
</template>
<script setup>
import { ref, reactive, computed } from 'vue';
import { SendCode } from '@/manage/components/send-code';

defineEmits(['submit']);

const form = ref();
const code$ = ref();
const formData = reactive({
	username: '',
	smsCode: ''
});

const rules = reactive({});

defineExpose({
	disabled: computed(() => {
		return !formData.username || !formData.smsCode;
	}),
	getData: () => ({ ...formData }),
	validate: async () => {
		await form.value.validate();
		await code$.value.validate();
	},
	setUsername: (v) => {
		formData.username = v || formData.username || '';
	}
});
</script>
