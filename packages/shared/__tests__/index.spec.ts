import { Locals } from '@deot/env-shared';

describe('shared.ts', () => {
	it('isIgnoredPackageFolder', () => {
		expect(Locals.isIgnoredPackageFolder('marketplace')).toBe(false);
		expect(Locals.isIgnoredPackageFolder('mobile')).toBe(false);
		expect(Locals.isIgnoredPackageFolder('distro')).toBe(false);
		expect(Locals.isIgnoredPackageFolder('_draft')).toBe(true);
		expect(Locals.isIgnoredPackageFolder('tpl')).toBe(true);
		expect(Locals.isIgnoredPackageFolder('dist')).toBe(true);
		expect(Locals.isIgnoredPackageFolder('page.tpl')).toBe(true);
		expect(Locals.isIgnoredPackageFolder('foo-dist')).toBe(true);
		expect(Locals.isIgnoredPackageFolder('tpl-page')).toBe(true);
	});

	it('getPackageName/virtual-dir', () => {
		expect(Locals.getPackageName('index', 'clients')).toBe('@clients/index');
		expect(Locals.getPackageName('shared', 'clients')).toBe('@clients/shared');
	});

	it('getPackageFolderName/virtual-dir', () => {
		expect(Locals.getPackageFolderName('@clients/shared', 'clients')).toBe('shared');
		expect(Locals.getPackageFolderName('@clients/index', 'clients')).toBe('index');
	});

	it('getRealPackageName/virtual-dir', () => {
		expect(Locals.getRealPackageName('*', 'clients')).toBe('*');

		expect(Locals.getRealPackageName('shared', 'clients')).toBe('');
		expect(Locals.getRealPackageName('', '')).toBe('');
		expect(Locals.getRealPackageName('index,shared', 'clients')).toBe('');
	});

	it('getRealPackageName/local-dir', () => {
		expect(Locals.getRealPackageName('*', 'packages')).toBe('*');

		expect(Locals.getRealPackageName('shared', 'packages')).toBe('@deot/shared');
		expect(Locals.getRealPackageName('', '')).toBe('');
		expect(Locals.getRealPackageName('index,shared', 'packages')).toBe('@deot/index,@deot/shared');
		expect(Locals.getRealPackageName('@deot/shared', 'packages')).toBe('@deot/shared');
	});

	it('impl/virtual-dir', () => {
		const it = Locals.impl('clients');
		expect(it.workspace).toBe('clients');
		expect(it.packageName).toBe('@clients/');
		expect(it.packageFolderNames.length === 0).toBe(true);
	});

	it('impl/local-dir', () => {
		const it = Locals.impl('packages');
		expect(it.workspace).toBe('packages');
		expect(it.packageName).toBe('@deot/');
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
