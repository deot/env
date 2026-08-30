[ci-image]: https://github.com/deot/env/actions/workflows/ci.yml/badge.svg?branch=main
[ci-url]: https://github.com/deot/env/actions/workflows/ci.yml

[![build status][ci-image]][ci-url]

# @deot/env

`@deot/env` 是面向 Vue/Vite 项目的统一开发环境。它提供 `dec` 命令、Vite 开发与构建流程、约定式页面和布局发现，以及 monorepo 中多应用与 shared 公共层的组织能力。

## 特性

- 使用 `dec dev` 和 `dec build` 统一单仓库与多应用 workspace 的开发、构建入口。
- 根据 workspace 中的 `package.json` 自动建立包名、目录与 Vite alias 映射。
- 自动发现 Vue 页面与布局，支持应用页面、shared 示例页和多应用路由合并。
- 缺少应用 `index.html` 时，根据 workspace 根部的 `index.ejs` 和 `index.js/index.ts` 生成入口。
- 构建时按应用输出独立目录，并提供 PostCSS、Autoprefixer、CSS 压缩和 iOS 12 构建目标。
- 允许通过 `vite.config`、`ENV_OPTIONS`、`ENV_DEFINE` 和业务环境变量扩展基础配置。

## 安装

```bash
pnpm add -D @deot/env
```

安装聚合包后会同时获得 `dec` CLI、开发服务和 `@deot/dev` 工具链。

## 快速开始

推荐把多个前端应用和公共层放在同一个 workspace 中：

```text
project/
├── package.json
├── pnpm-workspace.yaml
├── vite.config.js
└── src/
    ├── index.ejs
    ├── preload.js
    ├── manage/
    │   ├── package.json
    │   ├── index.js
    │   └── pages/
    ├── mobile/
    │   ├── package.json
    │   ├── index.js
    │   └── pages/
    └── shared/
        ├── package.json
        ├── components/layouts/
        └── examples/
```

在根 `package.json` 中声明命令：

```json
{
  "scripts": {
    "cli:dev": "dec dev --workspace src",
    "cli:build": "dec build --workspace src --out-dir dist",
    "dev": "cross-env BRANCH=dev npm run cli:dev",
    "build": "cross-env BRANCH=prod npm run cli:build"
  },
  "devDependencies": {
    "@deot/env": "^1.0.15"
  }
}
```

运行开发服务时可以在交互列表中选择全部应用、单个应用或 shared：

```bash
npm run dev
```

构建全部应用，或明确构建一个应用：

```bash
npm run build
dec build --workspace src --out-dir dist --package-name manage
```

完整安装与首个项目见[快速开始](./docs/getting-started.md)。

## 包

[npm-cli-image]: https://img.shields.io/npm/v/@deot/env-cli
[npm-cli-url]: https://www.npmjs.com/package/@deot/env-cli

[npm-deps-image]: https://img.shields.io/npm/v/@deot/env-deps
[npm-deps-url]: https://www.npmjs.com/package/@deot/env-deps

[npm-dever-image]: https://img.shields.io/npm/v/@deot/env-dever
[npm-dever-url]: https://www.npmjs.com/package/@deot/env-dever

[npm-shared-image]: https://img.shields.io/npm/v/@deot/env-shared
[npm-shared-url]: https://www.npmjs.com/package/@deot/env-shared

[npm-vue-image]: https://img.shields.io/npm/v/@deot/env-vue
[npm-vue-url]: https://www.npmjs.com/package/@deot/env-vue

[npm-image]: https://img.shields.io/npm/v/@deot/env
[npm-url]: https://www.npmjs.com/package/@deot/env

| 包 | 版本 | 职责 |
| --- | --- | --- |
| [`@deot/env`](./packages/index) | [![npm][npm-image]][npm-url] | 聚合安装包；代码入口导出 `Dever` |
| [`@deot/env-cli`](./packages/cli) | [![npm][npm-cli-image]][npm-cli-url] | 提供 `dec dev` 与 `dec build` |
| [`@deot/env-deps`](./packages/deps) | [![npm][npm-deps-image]][npm-deps-url] | 聚合 `@deot/dev` 开发工具链 |
| [`@deot/env-dever`](./packages/dever) | [![npm][npm-dever-image]][npm-dever-url] | 解析 workspace，创建 Vite 服务与应用构建 |
| [`@deot/env-shared`](./packages/shared) | [![npm][npm-shared-image]][npm-shared-url] | 提供 workspace 元数据与日志工具 |
| [`@deot/env-vue`](./packages/vue) | [![npm][npm-vue-image]][npm-vue-url] | 生成 Vue、JSX、文件路由和布局插件配置 |

## 文档

- [快速开始](./docs/getting-started.md)：安装、命令、最小 workspace 与单仓库模式。
- [项目结构](./docs/project-structure.md)：多应用、shared、入口模板、页面和布局约定。
- [配置扩展](./docs/configuration.md)：Vite 配置优先级、环境数据、alias、样式和代码检查。
- [构建与部署](./docs/build-and-deploy.md)：独立构建、合并构建、静态资源与分环境部署。
- [CLI](./packages/cli/README.md)：命令和参数。
- [Dever](./packages/dever/README.md)：开发与构建运行时。
- [Vue 集成](./packages/vue/README.md)：自动路由与布局目录。

## 本仓库开发

```bash
pnpm install

# 启动文档站
npm run docs:dev

# 测试、类型检查与构建
npm run test
npm run typecheck
npm run build

# 代码检查
npm run lint
```

## 相关项目

- [env-demo](https://github.com/deot/env-demo)
- [site](https://github.com/deot/site)

## 贡献

- [贡献指南](./.github/CONTRIBUTING.md)
- License: MIT
