import { Network } from '@/src/modules/network';

export const sendCode = async (...args) => {
	const [v] = args;
	const { body } = await Network.http(`/`, {
		method: 'GET',
		loading: false,
		body: {
			value: v
		},
		localData: {
			code: 200,
			data: {
				code: '123456'
			}
		}
	});
	return body;
};
