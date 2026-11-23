import { createVcPlugin } from '@deot/vc/full';
import { VcInstance } from '@deot/vc';
import { transfromOssMessage } from '@/shared/stores/apis/upload';

export const install = (context) => {
	const vc = createVcPlugin(
		{
			Portal: {
				aliveRules: { className: /(vc-portal-alive|vc-modal|vc-drawer)/ },
				install: (app) => {
					app.use(vc);
					app.use(context.Global);
					app.use(context.router);
					app.use(context.pinia);
					app.use(context.Shared);
				}
			},
			Upload: {
				onRequest: async ({ requestOptions: options }) => {
					// 非oss地址
					if (options.url) return {
						...options,
						url: /^http/.test(options.url) ? options.url : context.Global?.env?.baseUrl + options.url,
						headers: {
							Authorization: `Bearer ${context.Global?.user?.token}`,
							...options.headers
						}
					};
					// OSS地址
					const { url, body } = await context.platform.http('getOssUploadSignature', options.file.name);

					return {
						...options,
						url,
						body: {
							...body,
							file: options.file
						}
					};
				},
				onResponse: ({ request, requestOptions: options }) => {
					const response = request?.responseText || request?.response;
					const e = {
						file: options.file
					};
					// OSS地址
					if (!response) {
						e.source = `${options.url}/${options.body.key}`;
						// ETag 形如 "MD5"，引号是头字段格式，不是摘要的一部分
						e.entityTag = request?.getResponseHeader?.('etag')?.replace(/^"|"$/g, '');
					} else {
						const v = JSON.parse(response);
						e.data = v;
						e.source = context.Global?.env?.ossUrl + v.data;
					}
					return e;
				},
				onMessage: ({ cause: e, message }) => {
					// OSS报的错误
					if (e && e.data) {
						return transfromOssMessage(e.data) || message;
					}
					return message;
				}
			},
			TableColumn: {
				line: 1
			},
			Snapshot: {
				download: async ({ instance, options }) => {
					if (options.format === 'pdf') {
						await instance.exposed.refresh();
						const canvas = await instance.exposed.snapshot.value.toCanvas();
						const { jsPDF } = await import('jspdf');
						const pdf = new jsPDF('p', 'mm', 'a4');
						const ctx = canvas.getContext('2d');
						const a4w = 170;
						const a4h = 250;
						const imageHeight = Math.floor(a4h * canvas.width / a4w);
						let renderedHeight = 0;

						while (renderedHeight < canvas.height) {
							const el = document.createElement('canvas');
							el.width = canvas.width;
							el.height = Math.min(imageHeight, canvas.height - renderedHeight);

							const imageData = ctx.getImageData(0,
								renderedHeight,
								canvas.width,
								Math.min(imageHeight, canvas.height - renderedHeight)
							);

							el.getContext('2d').putImageData(imageData, 0, 0);
							pdf.addImage(el.toDataURL('image/png', 1.0), 'PNG', 20, 20, a4w, Math.min(a4h, a4w * el.height / el.width));

							renderedHeight += imageHeight;
							if (renderedHeight < canvas.height) {
								pdf.addPage();
							}
						}

						await pdf.save(`${options.filename}.pdf`, { returnPromise: true });
						return true;
					}

					return false;
				}
			},
			Editor: {
				options: {
					toolbar: [
						'bold',
						'italic',
						'underline',
						'strike',
						'color',
						'line-height',
						'font-size',
						'letter-spacing',
						'link',
						'upload/image',
						'undo',
						'redo'
					]
				}
			}
		},
		v => `V${v}`
	);

	context.app.use(vc);

	// 其他使用module使用
	context.add('vc', VcInstance);
};
