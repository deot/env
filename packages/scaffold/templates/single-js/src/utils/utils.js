import { flatten, flattenJSONParse } from '@deot/helper-utils';
import { Storage } from '@deot/helper-cache';

export const walk = (data, key = 'children', fn, parent, level = 0) => {
	if (typeof key === 'function') {
		fn = key;
		parent = fn;
		key = 'children';
	}
	data.forEach((item) => {
		const _parent = fn(item, data, parent, level) || item;
		if (item[key]) {
			walk(item[key], key, fn, _parent, level + 1);
		}
	});

	return parent;
};

export const list2tree = (list, rootValue = '0', options = {}) => {
	const { valueKey = 'value', parentKey = 'parent', childrenKey = 'children' } = options;

	const map = {};
	let root = [];
	let i = 0;
	while (i < list.length) {
		const item = list[i];

		map[item[valueKey]] = map[item[valueKey]] || [];
		map[item[parentKey]] = map[item[parentKey]] || [];

		map[item[parentKey]].push(item);

		item[childrenKey] = map[item[valueKey]];

		if (item[parentKey] === rootValue) {
			root = map[rootValue];
		}

		i++;
	}

	return root;
};

/**
 * 用于转为标准的树结构 { parent, label, value, children }
 * @param tree ~
 * @param options ~
 * @param result ~
 * @param parentValue ~
 * @returns ~
 */
export const toTreeData = (tree, options = {}, result = [], parentValue) => {
	const {
		labelKey = 'label',
		valueKey = 'value',
		childrenKey = 'children',
		clean = true,
		injectParent = true,
		getValue,
		getLabel,
		getChildren,
		deep = 0,
	} = options;
	for (let i = 0; i < tree.length; i++) {
		const label = getLabel ? getLabel(tree[i]) : tree[i][labelKey];
		result[i] = {
			label,
			value: getValue ? getValue(tree[i]) : tree[i][valueKey],
		};

		if (injectParent) {
			result[i].parent = parentValue;
		}

		if (!clean) {
			result[i] = { ...tree[i], ...result[i] };
		}
		const _children = getChildren ? getChildren(tree[i]) : tree[i][childrenKey];
		if (deep !== 1 && _children && _children.length) {
			result[i].children = [];
			toTreeData(
				_children,
				deep > 1 ? { ...options, deep: options.deep - 1 } : options,
				result[i].children,
				result[i].value
			);
		}
	}
	return result;
};

export const tree2map = (tree, options) => {
	const {
		childrenKey = 'children',
		labelKey = 'label',
		labelAsValue = true,
		injectParent = false,
		...rest
	} = options || {};
	const data = toTreeData(tree, { childrenKey, labelKey, injectParent, ...rest });
	const result = {};
	walk(data, childrenKey, (item) => {
		result[item.value] = labelAsValue ? item[labelKey] : item;
	});
	return injectParent ? [result, data] : result;
};

export const decodeData = (data) => {
	return flattenJSONParse(flatten(data));
};

const _pick = effect => (context, keys, transform) => {
	const result = {};
	keys.forEach((i) => {
		let key = i;
		if (!Array.isArray(i)) {
			key = [i, i];
		}

		const [oldKey, newKey] = key;
		let value = context[oldKey];
		try {
			value
				= typeof transform === 'function'
					? transform(context[oldKey], oldKey, newKey)
					: context[oldKey];
		} catch (e) {
			console.error(e);
		}

		result[newKey] = value;
		effect && (context[newKey] = value);
	});

	return result;
};

/**
 * @examples
 * const context = { a: 1, b: 2 };
 * const keys = ['a', ['b', 'c']];
 *
 * pick(context, keys, (v, oldKey, newKey) => v) -> { a: 1, c: 2 };
 * context: { a: 1, b: 2 }
 */
export const pick = _pick(false);
/**
 * @examples
 * const context = { a: 1, b: 2 };
 * const keys = ['a', ['b', 'c']];
 *
 * pickEffect(context, keys, (v, oldKey, newKey) => v) -> { a: 1, c: 2 };
 * context: { a: 1, b: 2, c: 2 }
 */
export const pickEffect = _pick(true);

/**
 * 根据模型过滤出后端要的数据
 * @examples
 * const v = { a: 1, b: 2, f: { a: 0, c: '' } };
 * const schema = {a: [],  b: '', c: 1, d: {}, e: null, f: { a: true } };
 *
 * pickData(c, schema);
 * context: {a: [],  b: '2', c: undefined, d: null, e: null, f: { a: false } }
 * @param v ~
 * @param schema ~
 * @returns ~
 */
export const pickData = (v, schema) => {
	// (v=string）toNumber
	if ((schema === null || typeof schema === 'number') && typeof v === 'string') {
		return +v;
	}
	// （v=number）toString
	if (typeof schema === 'string' && typeof v === 'number') {
		return `${v}`;
	}

	// （v=any）toBoolean
	if (typeof schema === 'boolean') {
		return !!v;
	}

	if (typeof schema !== 'object' || schema === null) return v;

	// toArray
	if (Array.isArray(schema)) {
		if (!Array.isArray(v)) return [];

		if (typeof schema[0] !== 'undefined') {
			return v.map(i => pickData(i, schema[0]));
		}

		return Array.isArray(v) ? v : [];
	}

	const result = {};

	for (const key in schema) {
		if (Object.prototype.hasOwnProperty.call(schema, key)) {
			if (Object.prototype.hasOwnProperty.call(v, key)) {
				result[key] = pickData(v[key], schema[key]);
			} else {
				if (Array.isArray(schema[key])) {
					result[key] = [];
				} else if (typeof schema[key] === 'object' || typeof schema[key] === 'number') {
					result[key] = null;
				} else {
					result[key] = void 0;
				}
			}
		}
	}

	return result;
};
export const hasValue = v =>
	typeof v !== 'undefined' && v !== '' && v !== null;

/**
 * 合并初始化值
 * v1: null/undefined
 * v2: ''
 * ->
 * ''
 * @param value ~
 * @param defaultValue ~
 * @returns ~
 */
export const mergeValue = (value, defaultValue) => {
	if ((value === null || typeof value === 'undefined') && typeof defaultValue !== 'undefined') {
		return typeof defaultValue === 'function' ? defaultValue(value) : defaultValue;
	};

	return value;
};

/**
 * async/await 防抖处理
 * lodash防抖的局限在于 fn(), 执行超过时间后扔可以点击
 *
 * 在Network, onFinish中加入setTimeout去延迟uni.hideLoading
 * 这个在感知上在一些加载场景中显得系统响应慢
 * @examples
 * const handleSubmit = locked(() => {
 * })
 * @param fn ~
 * @param delay 250
 * @returns newFn ~
 */
export const locked = (fn, delay = 250) => {
	let lock = false;

	return async function (...args) {
		if (lock) return;
		lock = true;
		try {
			await fn.apply(this, args);
		} finally {
			setTimeout(() => (lock = false), delay);
		}
	};
};

export const persist = (fn, key) => {
	key = key || fn.name;
	return async (...args) => {
		const v = Storage.get(key);
		if (v) {
			return v;
		}
		const result = await fn(...args);
		Storage.set(key, result);
		return result;
	};
};

/**
 * 向下取两位小数，与展示/上限口径一致。
 * @param v 原值
 * @param precision 精度
 * @returns 截断后的值
 */
export const floatFloor = (v, precision = 2) => {
	const base = 10 ** precision;
	return Math.floor(v * base) / base;
};

export const floatCeil = (v, precision = 2) => {
	const base = 10 ** precision;
	return Math.ceil(v * base) / base;
};
