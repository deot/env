/*
 * 按入口注入 UnoCSS `presetStyle` 选项。
 * `UnoEnhancer` 读取 `process.env.UNOCSS_ENTRIES`。
 */
process.env.UNOCSS_ENTRIES = JSON.stringify({
	mobile: { unit: 'rem', scale: 2 },
	manage: { unit: 'px', scale: 1 },
	shared: { unit: 'px', scale: 1 }
});

export default {
	define: {
		__BRANCH__: JSON.stringify(process.env.BRANCH || 'dev')
	}
};
