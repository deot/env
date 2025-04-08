import { Dever } from '@deot/env';

// @vitest-environment node
describe('index.ts', () => {
	it('any', () => {
		expect(typeof Dever).toBe('object');
	});
});
