<template>
	<div v-show="modelValue === 'password'" class="c-login-password g-flex g-fd-c">
		<div class="g-pd-lr-48">
			<div class="g-flex-ac g-pointer" @click="$emit('update:modelValue', 'account')">
				<VIcon type="left" />
				<div style="color: #4E5969;" class="g-fs-16 g-fw-400 g-pd-l-5">返回</div>
			</div>
		</div>
		<div v-if="ways.length >= 2" class="g-pd-lr-48 g-pd-t-10">
			<VTabs v-model="type" animated>
				<VTabsPane
					v-for="item in ways"
					:key="item.type"
					:label="item.label"
					:value="item.type"
				/>
			</VTabs>
		</div>
		<div class="g-pd-lr-48">
			<Mobile
				v-show="type === 'mobile'"
				ref="mobile$"
				@submit="handleSubmit"
			/>
		</div>
		<div class="g-pd-lr-48">
			<VButton
				class="c-login-view__submit-btn"
				type="primary"
				style="width: 100%; margin-top: 10px;"
				:disabled="disabled"
				@click="handleSubmit"
			>提交</VButton>
		</div>
	</div>
</template>
<script setup>
import { ref, computed } from 'vue';
import Mobile from './mobile.vue';
import * as api from './api';

const emit = defineEmits(['update:modelValue', 'success']);
defineProps({
	modelValue: String
});
const mobile$ = ref();
const type = ref('mobile');
const ways = computed(() => {
	return [
		{
			type: 'mobile',
			label: '手机号',
			form: mobile$.value
		}
	];
});

const instance = computed(() => {
	return ways.value.find(i => i.type === type.value);
});

const disabled = computed(() => {
	return instance.value.form?.disabled;
});
const handleSubmit = async () => {
	const cureent = instance.value;
	await cureent.form.validate();
	const body = cureent.form.getData();

	await api.restPassword(type.value, body);

	emit('update:modelValue', 'account');
	emit('success', body);
};

</script>

<style lang="scss">
$component-name: c-login-password;

@include block($component-name) {
	padding-top: 68px;
}
</style>
