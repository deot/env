/**
 * @file
 * RADIOS_*
 * 其中*表示1的单词
 * IS=是，HAS=有，ERROR=错误，PASS=合格，CLOSE=关闭，COMPLETE=完成，EXCEPTION=异常
 */
import { tree2map } from '@/shared/utils/utils';

export const RADIOS_IS = [
	{ label: '是', value: 1 },
	{ label: '否', value: 0 }
];

export const RADIOS_HAS = [
	{ label: '有', value: 1 },
	{ label: '无', value: 0 }
];

export const RADIOS_ERROR = [
	{ label: '错误', value: 1 },
	{ label: '正确', value: 0 }
];

export const RADIOS_PASS = [
	{ label: '合格', value: 1 },
	{ label: '不合格', value: 0 }
];

export const RADIOS_CLOSE = [
	{ label: '关闭', value: 1 },
	{ label: '不关闭', value: 0 }
];

export const RADIOS_COMPLETE = [
	{ label: '完成', value: 1 },
	{ label: '未完成', value: 0 }
];

export const RADIOS_EXCEPTION = [
	{ label: '异常', value: 1 },
	{ label: '未异常', value: 0 }
];

export const RADIOS_IS_MAP = tree2map(RADIOS_IS);
export const RADIOS_HAS_MAP = tree2map(RADIOS_HAS);
export const RADIOS_ERROR_MAP = tree2map(RADIOS_ERROR);
export const RADIOS_PASS_MAP = tree2map(RADIOS_PASS);
export const RADIOS_CLOSE_MAP = tree2map(RADIOS_CLOSE);
export const RADIOS_COMPLETE_MAP = tree2map(RADIOS_COMPLETE);
export const RADIOS_EXCEPTION_MAP = tree2map(RADIOS_EXCEPTION);
