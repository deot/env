import { configure } from '@deot/dev-eslint';
import parserTs from '@typescript-eslint/parser';

export default configure({}, {
	languageOptions: {
		globals: { __BRANCH__: 'readonly' }
	}
}, {
	files: ['**/*.vue'],
	languageOptions: {
		parserOptions: { parser: parserTs }
	}
});
