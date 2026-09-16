import { Network } from '@/shared/modules/network';

export const readMessage = async (id) => {
	const response = await Network.http(`/todo/read/${id}`, {
		method: 'POST',
		onResponse(leaf) {
			leaf.response.body = JSON.stringify({ code: 200 });
		},
	});
	return response.body.data;
};

export const getNoticeInfo = async () => {
	const response = await Network.http('/todo/firstPageNoticeInfo', {
		localData: {
			code: 200,
			data: {
				count: 1
			}
		}
	});
	return response.body.data;
};
