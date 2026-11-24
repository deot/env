import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Connect, ViteDevServer } from 'vite';
import type { Options } from '@deot/dev-shared';
import virtualHtml from '../src/plugins/virtual-html';

vi.mock('../src/plugins/virtual-html/utils', () => ({
	generateVirtualHtml: vi.fn(() => '<!DOCTYPE html>')
}));

const invoke = async (url: string, proxy?: Record<string, unknown>) => {
	let middleware: Connect.NextHandleFunction | undefined;
	const use = vi.fn((handler: Connect.NextHandleFunction) => {
		middleware = handler;
	});
	const transformIndexHtml = vi.fn().mockResolvedValue('<!DOCTYPE html>');
	const server = {
		config: { root: process.cwd(), server: { proxy } },
		middlewares: { use },
		transformIndexHtml
	} as unknown as ViteDevServer;
	const plugin = virtualHtml({ build: false } as Options);

	(plugin.configureServer as (server: ViteDevServer) => void)(server);

	const setHeader = vi.fn();
	const end = vi.fn();
	const next = vi.fn();
	await middleware!(
		{ url, originalUrl: url } as unknown as IncomingMessage,
		{ writableEnded: false, setHeader, end } as unknown as ServerResponse,
		next
	);

	return { setHeader, end, next };
};

// @vitest-environment node
describe('virtual html', () => {
	it('sets the HTML content type before ending the response', async () => {
		const { setHeader, end, next } = await invoke('/example/page');

		expect(setHeader).toHaveBeenCalledWith('Content-Type', 'text/html; charset=utf-8');
		expect(setHeader.mock.invocationCallOrder[0]).toBeLessThan(end.mock.invocationCallOrder[0]);
		expect(end).toHaveBeenCalledWith('<!DOCTYPE html>');
		expect(next).not.toHaveBeenCalled();
	});

	it('lets proxy paths through so Vite can proxy them', async () => {
		const proxy = { '/api': { target: 'https://mcp-console.yaya1972.com', changeOrigin: true } };
		const proxied = await invoke('/api/oauth2/api/login', proxy);

		expect(proxied.next).toHaveBeenCalledOnce();
		expect(proxied.end).not.toHaveBeenCalled();
		expect(proxied.setHeader).not.toHaveBeenCalled();

		const page = await invoke('/manage/home', proxy);
		expect(page.end).toHaveBeenCalledWith('<!DOCTYPE html>');
		expect(page.next).not.toHaveBeenCalled();
	});

	it('lets regex proxy contexts through', async () => {
		const { next, end } = await invoke('/service/orders', { '^/service': { target: 'http://localhost:3000' } });

		expect(next).toHaveBeenCalledOnce();
		expect(end).not.toHaveBeenCalled();
	});
});
