import { computed, reactive } from 'vue';
import { Context } from '@/shared/modules/context';

/**
 * 用于权限判断
 * const authMap = useAuthority({ 编辑: [1, 2], 删除: 3 });
 * authMap['编辑'] / authMap.has('编辑') / authMap.has([1, 2])
 * @param codes ~
 * @param options ~
 * @returns map
 */
export const useAuthority = (codes: any, options?: any) => {
	const has = (keyOrIds: any) => {
		if (codes[keyOrIds]) {
			return Context.Global.user.hasAuth(codes[keyOrIds]);
		} else {
			return Context.Global.user.hasAuth(Array.isArray(keyOrIds) ? keyOrIds : [keyOrIds], options);
		}
	};

	const exposed = Object.keys(codes).reduce((pre: any, cur) => {
		pre[cur] = computed(() => has(cur));
		return pre;
	}, { has });

	return reactive(exposed);
};
