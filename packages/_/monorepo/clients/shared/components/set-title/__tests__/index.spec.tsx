// @vitest-environment jsdom

import { SetTitle } from '@clients/shared';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof SetTitle).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<SetTitle />));

		expect(wrapper.classes()).toContain('c-set-title');
	});
});
