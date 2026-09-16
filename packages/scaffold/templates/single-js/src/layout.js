/**
 * @file 菜单树；首页独立于菜单树，由 constants/layout 的 LAYOUT_HOME_VISIBLE 决定
 */
export const layoutRoutes = [
	{
		label: '工作',
		fullLabel: '管理工作台',
		icon: 'grid',
		value: '/workspace',
		children: [
			{
				label: '能力预览',
				value: '/workspace/features',
				children: [
					{ label: '反馈能力', value: '/workspace/features/feedback' },
					{ label: '环境能力', value: '/workspace/features/env' }
				]
			}
		]
	},
	{
		label: '状态',
		fullLabel: '状态示例',
		icon: 'setting',
		value: '/state',
		children: [
			{
				label: '状态管理',
				value: '/state/manage',
				children: [
					{ label: '滚动记忆', value: '/state/manage/scroll' }
				]
			}
		]
	}
];

export const getLayoutRoutes = async () => layoutRoutes;
