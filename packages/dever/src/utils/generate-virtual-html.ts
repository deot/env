import fs from 'fs-extra';
import * as path from 'node:path';

import { Locals } from '@deot/env-shared';
import { render } from 'ejs';

export const generateVirtualHtml = (root: string, url: string, defaultFolderName?: string) => {
	const locals = Locals.impl();
	const urls = url.split('/');
	const packageFolder = urls[0] || urls[1] || defaultFolderName || locals.packageFolderNames[0];

	while (urls.length) {
		const filepath = path.resolve(root, `./${urls.join('/')}`, './index.html');

		if (fs.existsSync(filepath)) {
			return fs.readFileSync(filepath).toString();
		}
		urls.pop();
	}

	const tpl = fs.readFileSync(path.resolve(root, './index.ejs'));
	const allowFiles = ['index.js', 'index.ts'];
	let entry = '';
	for (let i = 0; i < allowFiles.length; i++) {
		const filename = allowFiles[i];
		const filepath = path.resolve(root, packageFolder, allowFiles[i]);
		if (fs.existsSync(filepath)) {
			entry = `/${packageFolder}/${filename}`;
			break;
		}
	}
	const html = render(tpl.toString(), { entry });
	return html;
};
