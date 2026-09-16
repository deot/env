/*
 * UnoCSS 的 `presetStyle` 选项写在 import query 上，即
 * `src/app.js` 里的 `import 'virtual:uno.css?unit=px&scale=1'`，
 * 这里不需要配置。
 */
export default {
	define: {
		__BRANCH__: JSON.stringify(process.env.BRANCH || 'dev')
	}
};
