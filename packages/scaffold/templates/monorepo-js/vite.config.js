/*
 * UnoCSS 的 `presetStyle` 选项写在各包的 import query 上，例如
 * `src/mobile/index.js` 里的 `import 'virtual:uno.css?unit=rem&scale=2'`，
 * 这里不需要配置。
 */
export default {
	define: {
		__BRANCH__: JSON.stringify(process.env.BRANCH || 'dev')
	}
};
