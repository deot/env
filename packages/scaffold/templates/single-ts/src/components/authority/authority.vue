<template>
	<slot v-if="hasAuth" />
</template>
<script setup lang="ts">
import type { PropType } from 'vue';
import { watch, ref, computed, getCurrentInstance, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useKeepAlive } from '@/src/hooks';
import { useAuthority } from './hooks';

const emit = defineEmits(['update:defaultValue', 'update:modelValue', 'update:visible', 'change']);
const props = defineProps({
	visible: Boolean,
	modelValue: [Boolean, Array] as PropType<any>,
	// undefined = 有权限
	value: [String, Array] as PropType<any>,
	layoutName: {
		type: String,
		default: 'default'
	},
	defaultValue: [String, Number],
	defaultKey: {
		type: String,
		default: 'type'
	},
	// 如果不指定path, 那么使用当前页route.path
	path: String
});
const instance = getCurrentInstance()!;
const route = useRoute();
const authorities = useAuthority([], {
	path: props.path,
	layoutName: props.layoutName
});
const hasLoad = ref(false);

const multiple = computed(() => Array.isArray(props.value));
const current = computed(() => {
	let v: any = props.value;
	v = (multiple.value ? v : [v]).map((i: any) => {
		i = i?.authority || i;
		return typeof i === 'undefined' ? true : i;
	});

	return v.map((i: any) => i === true || authorities.has(i));
});

const hasAuth = computed(() => {
	return !current.value.some((i: any) => i === false);
});

const isSet = (v: any) => v !== '' && typeof v !== 'undefined' && v !== null;

const setDefaultValueIfUnset = () => {
	if (!multiple.value || isSet(props.defaultValue)) return;
	let firstAuthorityItem: any;
	let defaultValue: any;
	for (let i = 0; i < props.value.length; i++) {
		const item = props.value[i];
		if (current.value[i]) {
			firstAuthorityItem = firstAuthorityItem || item;
			if (item.value === route.query[props.defaultKey]) {
				defaultValue = item.value;
				break;
			}
		}
	}
	!isSet(defaultValue) && firstAuthorityItem && (defaultValue = firstAuthorityItem.value);
	isSet(defaultValue) && emit('update:defaultValue', defaultValue);
};

const sync = () => {
	let v: any = current.value;
	v = multiple.value ? v : v[0];
	emit('update:modelValue', v, hasAuth.value);
	emit('update:visible', hasAuth.value);
	emit('change', v, hasAuth.value);

	setDefaultValueIfUnset();
};

const setTrackingTag = () => {
	const target: any = (instance.vnode.el as any)?.nextElementSibling;
	if (!target) return;

	const canTrack = props.value
		&& typeof props.value === 'string'
		&& hasLoad.value
		&& hasAuth.value;
	if (!canTrack) return;

	target.setAttribute('data-tracking', props.value);
	props.path && target.setAttribute('data-tracking-url', props.path);
};
useKeepAlive(setTrackingTag);
watch(
	() => [hasAuth.value, hasLoad.value, props.value, props.path],
	async () => {
		setTrackingTag();
	},
	{ immediate: true }
);

watch(() => current.value, sync, { immediate: true });

onMounted(() => hasLoad.value = true);
</script>
