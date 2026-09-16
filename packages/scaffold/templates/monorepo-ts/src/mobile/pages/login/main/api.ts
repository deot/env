import { Network } from '@/shared/modules/network';

export const login = () => Network.http('/scaffold/mobile/login', {
	method: 'POST',
	localData: {
		code: 200,
		data: {
			token: 'mobile-local-token',
			userName: '移动端测试用户',
			permissions: ['preview']
		}
	}
});
