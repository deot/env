import { onBeforeMount, inject } from 'vue';
import { useRouter } from 'vue-router';
import { Message } from '@deot/vc';
import { useKeepAlive } from './use-keep-alive';

/**
 * 寻找第一个页面
 * @param layoutName ~
 * @param autoReplace 为true会强制跳转至首页
 * @returns replaceToHome 跳转方法
 */
export const useFirstRoute = (layoutName = 'default', autoReplace = false) => {
	if (!layoutName) return () => {
		throw 'any';
	};

	const layoutStore = inject(`layout-${layoutName}`);
	const router = useRouter();

	const replaceToHome = () => {
		try {
			let url;
			// 目前规定的菜单必须三级
			for (let i = 0; i < layoutStore.routes.length; i++) {
				for (let j = 0; j < layoutStore.routes[i].children.length; j++) {
					for (let k = 0; k < layoutStore.routes[i].children[j].children.length; k++) {
						const item = layoutStore.routes[i].children[j].children[k];
						if (item.value) {
							url = item.value;
							break;
						}
					}
					if (url) break;
				}
				if (url) break;
			}
			if (!url) throw 'any';
			router.replace(url);
		} catch {
			Message.error('请联系管理员配置权限', 3000);
		}
	};

	if (!autoReplace) return replaceToHome;

	onBeforeMount(replaceToHome);
	useKeepAlive(replaceToHome);

	return replaceToHome;
};
