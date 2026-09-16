export const range = (message = '', minAndMax = [1, 999999], required = true) => {
	return [
		{
			required,
			validate: (v) => {
				if (required && !v) {
					return `${message}必填`;
				}
				const [min, max] = Array.isArray(minAndMax) ? minAndMax : [minAndMax];
				const numV = Number(v);
				if (typeof min === 'number' && numV <= min - 1) {
					return `${message}大于等于${min}`;
				}

				if (typeof max === 'number' && numV >= max + 1) {
					return `${message}小于等于${max}`;
				}
			}
		}
	];
};

export const password = (before, required = true) => [
	{
		required,
		validate: (v) => {
			const message = before?.(v);
			if (message === true) return;
			if (message && typeof message === 'string') return message;
			if (required && !v) return '请输入密码';
			if (!v) return;
			if (v.length < 8) return `密码至少8个字符`;
			// eslint-disable-next-line @stylistic/max-len
			const strongPasswordRegex = /^(?:(?=.*[A-Z])(?=.*[a-z])(?=.*\d)|(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*])|(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])|(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])).{8,}$/;
			if (!strongPasswordRegex.test(v)) {
				return `需包含大写字母、小写字母、数字及特殊字符中的三种以上`;
			}
		}
	}
];

export const socialCreditCode = (before, required = true) => [
	{
		required,
		validate: (v) => {
			const message = before?.(v);
			if (message === true) return;
			if (message && typeof message === 'string') return message;
			if (required && !v) return '请输入社会信用代码';

			if (v && !/^[0-9A-Z]{18}$/.test(v)) {
				return '请输入18位数字、大写字母';
			}
		}
	}
];
