<template>
	<VForm
		ref="form"
		:model="formData"
		:rules="rules"
		label-position="top"
		style="padding: 0;"
	>
		<VFormItem prop="username" :asterisk="false" required="请输入用户名">
			<div class="g-flex g-fd-c">
				<div class="g-flex-ac">
					<VInput
						v-model="formData.username"
						:placeholder="'请输入用户名/手机号'"
						clearable
					/>
				</div>
			</div>
		</VFormItem>
		<VFormItem prop="password" :asterisk="false">
			<div class="g-flex g-fd-c">
				<div class="g-flex-ac">
					<VInput
						v-model="formData.password"
						:type="!showPassword ? 'password' : 'text'"
						placeholder="请输入密码"
						clearable
					>
						<template #append>
							<VIcon
								style="height: 40px; line-height: 40px;"
								class="g-pd-r-12 g-pointer"
								:type="showPassword ? 'visible' : 'invisible'"
								@click="showPassword = !showPassword"
							/>
						</template>
					</VInput>
				</div>
			</div>
		</VFormItem>
		<VFormItem prop="code" :asterisk="false" required="请输入验证码">
			<div class="g-flex g-fd-c">
				<div class="g-flex-ac">
					<VInput
						v-model="formData.code"
						:maxlength="4"
						placeholder="请输入验证码"
						clearable
						@enter="$emit('submit')"
					/>
					<div class="g-m-l-10 g-pointer" @click="loadCode">
						<VImage
							:src="codeSource"
							:previewable="false"
							class="g-br-4 g-of-h"
							style="width: 106px; height: 40px;"
						/>
					</div>
				</div>
			</div>
		</VFormItem>
	</VForm>
</template>
<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useEnvStore } from '@/shared/stores/modules';
import { Rules } from '@/shared/utils';
import * as api from './api';

defineEmits(['submit']);

const envStore = useEnvStore();

const defaultAccount = ({
	shared: {
		username: 'v2admin',
		password: '123456',
		code: '1102'
	},
	manage: {
		username: 'v2admin',
		password: '123456',
		code: '1102'
	}
} as any)[`${envStore.appCode}${envStore.dev ? '' : 'any'}`];

const codeSource = ref<any>();
const showPassword = ref(false);
const form = ref<any>();
const formData = reactive(defaultAccount || {
	code: '',
	username: '',
	password: ''
});

const rules = reactive({
	// 不再校正强密码
	password: Rules.password((v: any) => !!v),
});

const loadCode = async () => {
	codeSource.value = await api.getVerifyCode();
};

onMounted(loadCode);

defineExpose({
	disabled: computed(() => {
		return !formData.username || !formData.password || !formData.code;
	}),
	getData: () => ({ ...formData }),
	validate: () => form.value.validate(),
	setUsername: (v: any) => {
		formData.username = v || formData.username || '';
	},

	refresh() { loadCode(); }
});
</script>
