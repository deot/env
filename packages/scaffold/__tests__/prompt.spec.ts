import { input, select } from '@inquirer/prompts';

import { getOptions } from '../src/prompt';

vi.mock('@inquirer/prompts', () => ({
	input: vi.fn(),
	select: vi.fn()
}));

const tty = { stdin: process.stdin.isTTY, stdout: process.stdout.isTTY };

const setTTY = (stdin?: boolean, stdout?: boolean) => {
	Object.defineProperty(process.stdin, 'isTTY', { configurable: true, value: stdin });
	Object.defineProperty(process.stdout, 'isTTY', { configurable: true, value: stdout });
};

describe('prompt', () => {
	beforeEach(() => {
		vi.mocked(input).mockReset();
		vi.mocked(select).mockReset();
		setTTY(tty.stdin, tty.stdout);
	});

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
		expect(input).not.toHaveBeenCalled();
		expect(select).not.toHaveBeenCalled();
	});

	it('requires every missing option in non-interactive mode', async () => {
		setTTY(false, false);
		await expect(getOptions(undefined, {})).rejects.toThrow('Project name is required');
		await expect(getOptions('example', {})).rejects.toThrow('--template is required');
		await expect(getOptions('example', { template: 'single' })).rejects.toThrow('--language is required');
		expect(input).not.toHaveBeenCalled();
		expect(select).not.toHaveBeenCalled();
	});

	it('prompts for missing options when a terminal is attached', async () => {
		setTTY(true, true);
		vi.mocked(input).mockResolvedValue('example');
		vi.mocked(select)
			.mockResolvedValueOnce('single')
			.mockResolvedValueOnce('ts');

		await expect(getOptions(undefined, {})).resolves.toEqual({
			name: 'example',
			template: 'single',
			language: 'ts'
		});
		expect(input).toHaveBeenCalledWith({ message: 'Project name:' });
		expect(select).toHaveBeenCalledTimes(2);
	});

	it('stays non-interactive unless both streams are terminals', async () => {
		setTTY(true, false);
		await expect(getOptions(undefined, {
			template: 'single',
			language: 'js'
		})).rejects.toThrow('Project name is required');
	});
});
