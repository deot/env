import { ref, onActivated, onDeactivated } from 'vue';

// keep-alive重新进来时执行回调
export const useKeepAlive = (done) => {
	const isActive = ref(true);
	onActivated(() => {
		if (!isActive.value) {
			done?.();
		}
		isActive.value = true;
	});
	onDeactivated(() => {
		isActive.value = false;
	});
	return isActive;
};
