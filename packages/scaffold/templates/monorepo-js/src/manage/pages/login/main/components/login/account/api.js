import { Network } from '@/shared/modules/network';
import { apiRoots } from '@/manage/stores';

/**
 * 登录
 * @param body {
 *  username - 用户名/手机号
 *  password - 密码
 *  code - 图形验证
 *  smsCode - 用于短信验证码登录
 *  dingCode - 用于钉钉绑定
 * }
 * @returns ~
 */
export const loginByInternal = async (body) => {
	const response = await Network.http('/todo/login', {
		method: 'POST',
		loading: '登录验证...',
		body,
		localData: {
			code: 200,
			data: {
				token: '1234567890'
			}
		}
	});
	const userInfo = await apiRoots.getUserInfo(response.body.data.token);
	return {
		...response.body.data,
		...userInfo
	};
};

export const getDingClientId = async () => {
	const response = await Network.http('/todo/getCurrentAppDingConfig', {
		loading: '钉钉信息中...',
		localData: {
			code: 200,
			data: {
				appKey: 'dingtalk-1234567890'
			}
		},
		shared: getDingClientId
	});

	return response.body.data.appKey;
};

export const getVerifyCode = async () => {
	const response = await Network.http('', {
		loading: '验证码获取...',
		localData: {
			code: 200,
			data: `https://dummyimage.com/106x40/555/fff/?text=${Math.random().toString(36).substring(0, 4)}`
		}
	});

	return response.body.data;
};
