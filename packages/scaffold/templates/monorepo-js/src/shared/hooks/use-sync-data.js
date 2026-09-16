import { ref, watch, getCurrentInstance, inject } from 'vue';

/**
 * 解决无法直接修改props的问题, 操作同一个对象
 * <component :state="xxxx" />
 * // 如 const [formData] = useSyncData()
 * @param key ~
 * @param useInject ~
 * @returns ~
 */
export const useSyncData = (key = 'state', useInject = false) => {
	const instance = getCurrentInstance();
	const { props } = instance;
	const currentValue = ref({});

	if (useInject === true) {
		const v = inject(key);
		v && (currentValue.value = v);
	} else {
		watch(
			() => props[key],
			(v) => {
				if (v !== currentValue.value) {
					currentValue.value = v;
				}
			},
			{
				immediate: true
			}
		);
	}

	return [currentValue];
};
