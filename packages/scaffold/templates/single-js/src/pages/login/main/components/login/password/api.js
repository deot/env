import { Network } from '@/src/modules/network';

export const restPasswordByMobile = async (options) => {
	const response = await Network.http('/todo/restPasswordByMobile', {
		method: 'POST',
		body: options,
		successTip: '密码修改成功，请重新登录'
	});

	return response.body.data;
};

export const restPassword = async (type, options) => {
	if (type === 'mobile') return restPasswordByMobile(options);
};
