import { Network } from '@/shared/modules/network';

export const sendCode = async (...args: any[]) => {
	const [v] = args;
	const { body }: any = await Network.http(`/`, {
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
