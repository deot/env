import { Locals } from '@deot/env-shared';

describe('shared.ts', () => {
	it('getPackageName', () => {
		expect(Locals.getPackageName('index', 'packages')).toBe('@packages/index');
		expect(Locals.getPackageName('shared', 'packages')).toBe('@packages/shared');
	});

	it('getPackageFolderName', () => {
		expect(Locals.getPackageFolderName('@packages/shared', 'packages')).toBe('shared');
		expect(Locals.getPackageFolderName('@packages/index', 'packages')).toBe('index');
	});

	it('getRealPackageName', () => {
		expect(Locals.getRealPackageName('*', 'packages')).toBe('*');
		expect(Locals.getRealPackageName('index', 'packages')).toBe('@packages/index');
		expect(Locals.getRealPackageName('shared', 'packages')).toBe('@packages/shared');
		expect(Locals.getRealPackageName()).toBe(undefined);
		expect(Locals.getRealPackageName('index,shared', 'packages')).toBe('@packages/index,@packages/shared');
		expect(Locals.getRealPackageName(',shared', 'packages')).toBe('@packages/shared');
		expect(Locals.getRealPackageName('@packages/shared', 'packages')).toBe('@packages/shared');
		expect(Locals.getRealPackageName('@packages/index,shared', 'packages')).toBe('@packages/index,@packages/shared');
		// 过滤无效的包
		expect(Locals.getRealPackageName('@packages/index,abc', 'packages')).toBe('@packages/index');
		expect(Locals.getRealPackageName('@packages/dev-bb,abc', 'packages')).toBe('');
	});

	it('impl', () => {
		const it = Locals.impl('packages');
		expect(it.workspace).toBe('packages');
		expect(it.packageName).toBe('@packages/');
		expect(it.packageFolderNames.length > 0).toBe(true);
	});

	it('impl single', () => {
		const it = Locals.impl('');
		expect(it.workspace).toBe('');
		expect(it.packageName).toBe('@/');
		expect(it.packageFolderNames.length).toBe(0);

		expect(Locals.getPackageName('index', '')).toBe('@/');
		expect(Locals.getPackageFolderName('index', '')).toBe('');
		expect(Locals.getPackageFolderName('@/', '')).toBe('');
	});
});
