import type { ViteDevServer, Plugin } from 'vite';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Options } from '@deot/dev-shared';
import { generateVirtualHtml } from '../utils';

const pathRegex = /^\/$|^\/(?:[^/]+\/)*[^/.]+?\/?$/;
const innerPathRegex = /^\/(@|__)/; // /@vite/ | /__vue-router
export default (options: Options): Plugin => {
	return {
		name: 'vite-plugin-virtual-html',
		configureServer(server: ViteDevServer) {
			if (options.build) return;
			const root = server.config.root;
			server.middlewares.use(async (req, res, next) => {
				const requestUrl = req.url || '/';
				const url = requestUrl.replace(/\/+/g, '/').replace(/[?#].*$/s, '') || '';
				const isPath = pathRegex.test(url);
				/**
				 * 1. ~
				 * 2. ~
				 * 3. ~
				 * 4. 文件已存在，这样xxx.png可以被获取，真实路径的.ts,.html都可以被获取
				 */
				if (
					res.writableEnded
					|| requestUrl.includes('html-proxy&')
					|| innerPathRegex.test(url)
					|| (!isPath && fs.existsSync(path.join(root, url)))
				) {
					return next();
				}

				if (isPath) {
					res.setHeader('Content-Type', 'text/html; charset=utf-8');
					res.end(await server.transformIndexHtml(url, generateVirtualHtml(root, url, options.packageFolderName), req.originalUrl));
					return;
				};

				next();
			});
		}
	};
};
