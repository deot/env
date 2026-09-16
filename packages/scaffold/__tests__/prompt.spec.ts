import { getOptions } from '../src/prompt';

describe('prompt', () => {
	it('keeps supplied options without prompting', async () => {
		await expect(getOptions('example', {
			template: 'monorepo',
			language: 'ts',
			install: false
		})).resolves.toEqual({
			name: 'example',
			template: 'monorepo',
			language: 'ts'
		});
	});
});
