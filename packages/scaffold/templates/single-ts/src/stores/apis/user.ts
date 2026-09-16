/**
 * @files 放一些常用的筛选项, 仅bms
 */
import { Network } from '@/src/modules/network';

export const getUserInfo = async (token?: any) => {
	const response: any = await Network.http('/todo/getUserInfo', {
		loading: '用户信息中...',
		headers: { token: token },
		localData: {
			code: 200,
			data: {
				token: '1234567890',
				userName: 'admin',
				permissions: ['admin']
			}
		}
	});
	return response.body.data;
};

export const logout = async () => {
	const response: any = await Network.http('/todo/logout', {
		loading: '退出登录...',
		localData: {
			code: 200,
			data: {}
		}
	});
	return response.body.data;
};

export const updatePassword = async (body: any) => {
	const response: any = await Network.http('/todo/updateByUser', {
		method: 'POST',
		body: {
			...body
		},
		localData: {
			code: 200,
			data: {}
		},
		successTip: '密码修改成功，请重新登录'
	});

	return response.body.data;
};
