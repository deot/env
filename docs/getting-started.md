# 快速开始

本页使用当前 `dec` CLI 与 `@deot/env-dever` 行为说明如何创建单应用或多应用项目。

## 安装

```bash
pnpm add -D @deot/env
```

`@deot/env` 会带入以下核心能力：

- `@deot/env-cli`：提供 `dec` 命令。
- `@deot/env-scaffold`：提供项目生成器，以及单应用、多应用、JS、TS 项目模板。
- `@deot/env-dever`：创建 Vite 开发服务和生产构建。
- `@deot/env-deps`：带入 `@deot/dev` 开发工具链。

## 创建项目

已经安装 `dec` 时可以直接创建：

```bash
dec init my-app
```

尚未安装时可以通过 pnpm 临时执行 CLI：

```bash
pnpm dlx @deot/env-cli init my-app
```

交互流程会选择 `single` 或 `monorepo`，以及 JavaScript 或 TypeScript。生成完成后默认执行 `pnpm install`；需要跳过时使用：

```bash
dec init my-app \
	--template monorepo \
	--language ts \
	--no-install
```

非交互环境必须显式提供项目名、模板和语言，且同样默认安装依赖。目标目录必须不存在，CLI 不会覆盖已有文件，也不会自动执行 `git init`。

## 多应用 workspace

实际项目通常把应用和公共层放在 `src/`，并显式传给 `--workspace`。

### 1. 声明 workspace

```yaml
# pnpm-workspace.yaml
shamefullyHoist: true

linkWorkspacePackages: true

packages:
  - 'src/*'
```

### 2. 声明根命令

```json
{
  "private": true,
  "type": "module",
  "scripts": {
    "cli:dev": "dec dev --workspace src",
    "cli:build": "dec build --workspace src --out-dir dist",
    "dev": "cross-env BRANCH=dev npm run cli:dev",
    "dev:pre": "cross-env BRANCH=pre npm run cli:dev",
    "build": "cross-env BRANCH=prod npm run cli:build",
    "build:pre": "cross-env BRANCH=pre npm run cli:build"
  },
  "devDependencies": {
    "@deot/env": "^1.0.15"
  }
}
```

`BRANCH` 是业务项目自己的环境变量；`@deot/env` 不会替你定义它。项目可以在 Vite 配置中读取并转换为客户端常量，见[配置扩展](./configuration.md)。

### 3. 创建应用包

```json
{
  "private": true,
  "name": "@clients/manage",
  "version": "1.0.0"
}
```

```js
// src/manage/index.js
import { createApp, h } from 'vue';
import { RouterView } from 'vue-router';

createApp(() => h(RouterView)).mount('#app');
```

每个应用目录至少需要 `package.json`，并使用 `index.js` 或 `index.ts` 作为约定入口。页面放在 `pages/`；更完整的目录见[项目结构](./project-structure.md)。

### 4. 创建 shared 包

```json
{
  "name": "@clients/shared",
  "version": "1.0.0"
}
```

`shared` 的包名用于推导应用包前缀。以上配置会把目录 `manage` 映射为 `@clients/manage`，并把 `shared` 映射为 `@clients/shared`。

### 5. 创建入口模板

```html
<!-- src/index.ejs -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width,initial-scale=1">
	<title>App</title>
</head>
<body>
	<div id="app"></div>
	<script type="module" src="/preload.js"></script>
	<script type="module" src="<%= entry %>"></script>
</body>
</html>
```

当应用目录没有 `index.html` 时，开发服务会渲染这份 EJS 模板，并把 `entry` 替换为当前应用的 `index.js` 或 `index.ts`。

### 6. 运行

```bash
npm run dev
```

未传 `--package-name` 时，CLI 会显示选择列表：

- `*`：全部应用。
- 每个应用目录。
- `shared`：公共层示例。

非交互环境可以明确传入 `*`：

```bash
dec dev --workspace src --package-name '*'
```

## 构建

构建所有普通应用：

```bash
dec build --workspace src --out-dir dist
```

构建单个应用：

```bash
dec build --workspace src --out-dir dist --package-name manage
```

单独构建 shared 示例：

```bash
dec build --workspace src --out-dir dist --package-name shared
```

将多个应用的页面合入第一个应用的输出：

```bash
dec build \
	--workspace src \
	--out-dir dist \
	--package-name manage,mobile,shared
```

上述命令只创建 `dist/manage`，但自动路由会同时读取 `manage`、`mobile` 和 `shared/examples`。完整规则见[构建与部署](./build-and-deploy.md)。

## 单仓库模式

没有独立 workspace 目录时，把 `--workspace` 指向当前目录：

```json
{
  "scripts": {
    "dev": "dec dev --workspace ./",
    "build": "dec build --workspace ./ --out-dir dist"
  }
}
```

目录使用标准单应用约定：

```text
project/
├── index.html
├── package.json
└── src/
	├── app.ts
	├── env.ts
	├── index.ts
	├── layout.ts
	├── pages/
	│   ├── home/main/
	│   ├── workspace/features/main/
	│   └── state/manage/scroll/
	├── components/
	├── constants/
	├── hooks/
	├── modules/
	├── stores/
	├── styles/
	└── utils/
```

Single 模板等价于 Monorepo 模板的 `manage + shared`：`manage` 的应用内容放在 `src/`，`shared` 能力合并到对应的根目录模块。单仓库模式不会扫描子包，也不会生成 workspace 包名 alias；Dever 的 `@` 指向项目根目录，因此源码 alias 使用 `@/src/...`。
