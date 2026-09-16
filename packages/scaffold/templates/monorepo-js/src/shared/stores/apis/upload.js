/**
 * 主要是Network也调用了此函数，避免循环引用
 *
 * OSS接入文档
 * https://help.aliyun.com/zh/oss/use-cases/use-alipay-mini-programs-to-upload-objects
 * https://help.aliyun.com/zh/oss/developer-reference/signature-version-4-recommend
 */

import { Network } from '@/shared/modules/network';
import { dataURLToFile } from '@deot/helper-utils';

export const getOssUploadSignature = async (fileName, loading = false) => {
	const { body: { data: it } } = await Network.http('/todo/getOssUploadSignature', {
		loading,
		body: {
			fileName: fileName ? fileName.replace(/\.image$/, '.png') : 'upload-unknown.gif'
		},
		method: 'POST',
	});
	const ossInfo = {
		'key': it.key,
		'policy': it.policy,
		'OSSAccessKeyId': it.ossAccessKeyId,
		'success_action_status': '200',
		'x-oss-signature': it.signature,
		'x-oss-signature-version': 'OSS4-HMAC-SHA256',
		'x-oss-credential': it.xOssCredential,
		'x-oss-date': it.xOssDate,
		'x-oss-security-token': it.accessToken
	};
	const oss = `https://${it.bucket}.${it.host}`;

	return {
		url: oss,
		body: ossInfo
	};
};

export const transfromOssMessage = (message) => {
	if (!message || !message.includes) return;

	if (message.includes('EntityTooLarge')) {
		return '文件大小不能超过20Mb, 请重新上传！';
	} else {
		console.log(message);
	}
};

export const uploadOss = async (file, fileName) => {
	let uploadFile = file;
	if (typeof file === 'string' && /data:[^;]+;[^,]+,/.test(file)) {
		uploadFile = dataURLToFile(file, fileName);
	}

	fileName = fileName || (typeof uploadFile === 'string' ? uploadFile : uploadFile?.name);
	const options = await getOssUploadSignature(fileName, false);

	await Network.http({
		url: options.url,
		body: {
			...options.body,
			...(uploadFile instanceof Blob ? { file: uploadFile } : {})
		},
		method: 'FORM'
	});

	return `${options.url}/${options.body.key}`;
};
