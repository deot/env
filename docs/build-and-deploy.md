# 构建与部署

本页说明当前逐包构建、路由合并、静态资源与分环境配置。

## 构建全部应用

```bash
dec build --workspace src --out-dir dist
```

没有指定 `--package-name` 时，运行时依次构建 workspace 中除 `shared` 外的普通应用：

```text
dist/
├── manage/
├── mobile/
└── system/
```

每个应用构建前会先清理自己的输出目录，不会主动删除其他应用目录。

## 构建单个应用

```bash
dec build \
	--workspace src \
	--out-dir dist \
	--package-name mobile
```

`--package-name` 可以使用目录名或完整包名：

```bash
dec build --workspace src --out-dir dist --package-name @clients/mobile
```

`@deot/env-shared` 会验证目录是否存在；无法解析的名称会被过滤。

## 合并多个应用

逗号分隔的名称表示把多个应用的页面合入第一个应用的产物：

```bash
dec build \
	--workspace src \
	--out-dir dist \
	--package-name manage,mobile,shared
```

行为：

- 输出目录是 `dist/manage`。
- 当前构建包是 `manage`。
- 自动路由读取 `manage/pages`、`mobile/pages` 和 `shared/examples/pages`。
- `__MULTIPLE_PACKAGE_FOLDER_NAMES__` 是 `"manage,mobile,shared"`。

这不是一次生成三个独立目录；需要三个独立产物时应省略 `--package-name` 或分别执行命令。

## shared 示例

默认“构建全部”不包含 shared。需要部署公共组件或页面示例时显式构建：

```bash
dec build \
	--workspace src \
	--out-dir dist \
	--package-name shared
```

shared 可以提供自己的 `index.html`，入口指向 `/shared/examples/index.js`；其页面目录是 `shared/examples/pages`。

## 虚拟 HTML 与产物整理

应用没有 `index.html` 时，构建流程会：

1. 使用 workspace 根部 `index.ejs` 生成临时 `.temp/index.html`。
2. 选择应用 `index.js` 或 `index.ts` 作为 `entry`。
3. 以当前应用为 Rollup HTML input。
4. 构建完成后移除临时文件。
5. 把 Vite 产生的嵌套应用目录整理到 `outDir/<app>`。

不要把业务源码放进 `.temp/`；该目录由构建流程临时管理。

## 默认构建配置

当前运行时默认设置：

| 配置 | 值 |
| --- | --- |
| `build.target` | `ios12` |
| `build.cssTarget` | `ios12` |
| 开发服务器 | `host: true` |
| HTML input | 当前应用入口 |
| CSS | import、URL、Flex 修正、压缩、Autoprefixer |

项目仍可在 Vite 配置中增加 alias、proxy、`define` 和其他标准选项。

## 按应用配置 publicDir

实际多应用项目会按正在构建的包选择静态资源：

```js
export default ({ command }) => {
	const { packageFolderName } = JSON.parse(
		decodeURIComponent(process.env.ENV_OPTIONS || '{}')
	);

	return {
		publicDir: command === 'build' && packageFolderName
			? 'src/' + packageFolderName + '/assets/static'
			: false
	};
};
```

这样每个产物只复制自己的 public 资源。开发模式未必有 `packageFolderName`，必须处理空值。

## 分环境 base

常见做法是在 npm script 设置业务环境，再在 Vite 配置中按包计算 `base`：

```json
{
  "scripts": {
    "build:dev": "cross-env BRANCH=dev npm run cli:build",
    "build:pre": "cross-env BRANCH=pre npm run cli:build",
    "build": "cross-env BRANCH=prod npm run cli:build"
  }
}
```

```js
export default ({ command }) => {
	const isBuild = command === 'build';
	const branch = process.env.BRANCH;
	const { packageFolderName } = JSON.parse(
		decodeURIComponent(process.env.ENV_OPTIONS || '{}')
	);

	const base = isBuild && branch !== 'dev'
		? 'https://cdn.example.com/' + packageFolderName + '/'
		: '/';

	return {
		base,
		define: {
			__BRANCH__: JSON.stringify(branch)
		}
	};
};
```

`@deot/env` 负责告诉配置“当前正在构建哪个包”，域名、目录命名和环境含义仍由项目决定。

## 部署检查

每个环境至少验证：

- `dist/<app>/index.html` 使用正确的资源 base。
- 只包含当前应用需要的 public 资源。
- 直接打开应用路由时，静态服务器能回退到该应用 `index.html`。
- `__BRANCH__` 等客户端常量与构建脚本一致。
- 合并构建只部署第一个包的输出目录。
- shared 示例部署时使用独立入口和 `shared/examples` 页面。

