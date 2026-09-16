import { Network } from '@/shared/modules/network';
import JSZip from 'jszip';

const _download = (blob: Blob, filename: string) => {
	const url = window.URL.createObjectURL(blob);
	const el = document.createElement('a');

	el.href = url;
	el.download = filename;
	el.click();
	window.URL.revokeObjectURL(url);
};

const _getBlob = async (url: string, body?: any, requestOptions?: any): Promise<any> => {
	if (/^http/.test(url)) {
		const response = await fetch(url);
		return response.blob();
	} else {
		const response = await Network.http(url, {
			method: 'POST',
			responseType: 'blob',
			body,
			...requestOptions
		});

		return response.body.data;
	}
};

/**
 * 同步导出
 * file -> { url: '', name: '', body: {} }
 * @param v file/Files/Url
 * @param body ~
 * @param filename ~
 * @param requestOptions ~
 * @returns ~
 */
export const download = async (v: any, body?: any, filename?: string, requestOptions: any = {}) => {
	const isFiles = Array.isArray(v);
	if (!v || (isFiles && !v.length)) return Promise.reject();

	const files = (isFiles ? v : [v]).map((i: any) => {
		if (typeof i === 'string') {
			return {
				url: i,
				name: filename || i.replace(/^.*\/([^/]+)$/, '$1'),
				body
			};
		}
		return {
			url: i.url || i.fileUrl,
			name: i.name || i.fileName,
			body: i.body || body
		};
	}).filter(i => i.url);
	if (!files.length) return Promise.reject();

	const isZip = files.length > 1;
	let content: any;
	if (isZip) {
		const zip = new JSZip();
		await Promise.all(files.map((file: any) => {
			return new Promise<void>((resolve) => {
				_getBlob(file.url, file.body, requestOptions).then((res: any) => res instanceof Blob ? res : res.blob()).then((blob) => {
					zip.file(file.name, blob);
					resolve();
				});
			});
		}));
		content = await zip.generateAsync({ type: 'blob' });
	} else {
		content = await _getBlob(files[0].url, files[0].body, requestOptions);
	}
	_download(
		content,
		(() => {
			try {
				if (!filename) return isZip ? '下载文件.zip' : (files[0].name || '下载文件');
				if (isZip && !/\.zip$/.test(filename)) {
					return `${filename.replace(/(?:\.[^/.]+)?$/, '.zip')}`;
				};
				return filename;
			} catch {
				return filename;
			}
		})()
	);
};

// 异步导出
export const downloadAsync = async (url: string, body?: any, options: any = {}) => {
	return Network.http(url, {
		successTip: '导出成功，请到下载中心下载',
		method: 'POST',
		body,
		...options
	});
};
