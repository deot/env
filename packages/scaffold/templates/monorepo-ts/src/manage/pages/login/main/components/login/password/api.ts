import { Network } from '@/shared/modules/network';

export const restPasswordByMobile = async (options: any) => {
	const response: any = await Network.http('/todo/restPasswordByMobile', {
		method: 'POST',
		body: options,
		successTip: '密码修改成功，请重新登录'
	});

	return response.body.data;
};

export const restPassword = async (type: string, options: any) => {
	if (type === 'mobile') return restPasswordByMobile(options);
};
