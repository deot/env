import { configure } from '@deot/dev-eslint';

export default configure({}, {
	languageOptions: {
		globals: { __BRANCH__: 'readonly' }
	}
});
