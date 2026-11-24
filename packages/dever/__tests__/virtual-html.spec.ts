import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Connect, ViteDevServer } from 'vite';
import type { Options } from '@deot/dev-shared';
import virtualHtml from '../src/plugins/virtual-html';

vi.mock('../src/plugins/virtual-html/utils', () => ({
	generateVirtualHtml: vi.fn(() => '<!DOCTYPE html>')
}));

// @vitest-environment node
describe('virtual html', () => {
	it('sets the HTML content type before ending the response', async () => {
		let middleware: Connect.NextHandleFunction | undefined;
		const use = vi.fn((handler: Connect.NextHandleFunction) => {
			middleware = handler;
		});
		const transformIndexHtml = vi.fn().mockResolvedValue('<!DOCTYPE html>');
		const server = {
			config: { root: process.cwd() },
			middlewares: { use },
			transformIndexHtml
		} as unknown as ViteDevServer;
		const plugin = virtualHtml({ build: false } as Options);

		(plugin.configureServer as (server: ViteDevServer) => void)(server);

		const setHeader = vi.fn();
		const end = vi.fn();
		const next = vi.fn();
		await middleware!(
			{ url: '/example/page', originalUrl: '/example/page' } as unknown as IncomingMessage,
			{ writableEnded: false, setHeader, end } as unknown as ServerResponse,
			next
		);

		expect(setHeader).toHaveBeenCalledWith('Content-Type', 'text/html; charset=utf-8');
		expect(setHeader.mock.invocationCallOrder[0]).toBeLessThan(end.mock.invocationCallOrder[0]);
		expect(end).toHaveBeenCalledWith('<!DOCTYPE html>');
		expect(next).not.toHaveBeenCalled();
	});
});
