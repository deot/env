import type { ViteDevServer, Plugin } from 'vite';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Options } from '@deot/dev-shared';
import { generateVirtualHtml } from './utils';

const pathRegex = /^\/$|^\/(?:[^/]+\/)*[^/.]+?\/?$/;
const innerPathRegex = /^\/(@|__)/; // /@vite/ | /__vue-router

/*
 * 与 Vite proxyMiddleware 的 doesProxyContextMatchUrl 保持一致。
 * 本中间件在 configureServer 里注册，早于代理；/api 这类无后缀路径会命中 pathRegex，
 * 不放行的话请求会被当成页面返回，server.proxy 永远走不到。
 */
const matchesDevProxy = (requestUrl: string, proxy: ViteDevServer['config']['server']['proxy']) => {
	if (!proxy) return false;
	return Object.keys(proxy).some((context) => {
		if (!proxy[context]) return false;
		return context[0] === '^'
			? new RegExp(context).test(requestUrl)
			: requestUrl.startsWith(context);
	});
};

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
				 * 5. 命中 server.proxy，交给后面的 Vite 代理
				 */
				if (
					res.writableEnded
					|| requestUrl.includes('html-proxy&')
					|| innerPathRegex.test(url)
					|| (!isPath && fs.existsSync(path.join(root, url)))
					|| matchesDevProxy(requestUrl, server.config.server?.proxy)
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
