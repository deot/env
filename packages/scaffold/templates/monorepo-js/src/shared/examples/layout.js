export const layoutRoutes = [
	{
		label: '样式',
		fullLabel: '样式能力',
		icon: 'setting',
		value: '/style',
		children: [
			{
				label: 'Unocss',
				value: '/style/unocss',
				children: [
					{
						label: '按需注入',
						value: '/style/unocss/on-demand'
					}
				]
			}
		]
	}
];

window.__LAYOUT_ROUTES__ = layoutRoutes;
