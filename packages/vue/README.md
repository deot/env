# @deot/env-vue

`@deot/env` 的 Vue 3 Vite 配置。它组合文件路由、布局、Vue SFC 和 JSX 插件，并根据单项目或多应用 workspace 自动生成页面目录。

## 安装

```bash
pnpm add -D @deot/env-vue
```

`@deot/env-dever` 会在开发和构建时自动调用本包，普通业务项目无需重复配置。下面的 API 主要用于开发环境集成或单独测试 Vue 配置：

```ts
import vue from '@deot/env-vue';

const config = vue(options, options.packageFolderName);
```

业务项目需要追加端口、proxy、alias 等配置时，直接提供标准 `vite.config.js`；Dever 会把它与本包生成的插件配置合并，参见[配置扩展](../../docs/configuration.md)。

## API

### 默认导出

```text
vue(options, packageFolderName?)
```

- `options`：`@deot/env-dever` 传入的运行参数。
- `packageFolderName`：当前构建目标目录；开发模式通常直接读取 `options` 即可。
- 返回值：Vite `UserConfig`。

## 内置插件

配置按以下顺序注册：

1. `vue-router/vite`：基于文件生成路由。
2. `vite-plugin-vue-layouts`：为页面匹配布局。
3. `@vitejs/plugin-vue`：处理 Vue SFC。
4. `@vitejs/plugin-vue-jsx`：处理 Vue JSX / TSX。

路由声明文件默认关闭（`dts: false`），并排除：

```text
**/components/**
**/component/**
**/common/**
**/_common/**
**/*.component.vue
```

## 页面与布局目录

### 多应用开发

执行 `dec dev --workspace src` 时，路由来自：

```text
src/<应用>/pages
src/shared/examples/pages
```

每个路由以对应目录名作为路径前缀，例如 `src/admin/pages/index.vue` 对应 `admin/` 下的页面。

布局来自：

```text
src/shared/components/layouts
src/<应用>/components/layouts
```

### 指定应用构建

执行 `dec build --workspace src --package-name admin` 时，只为目标应用生成路由。逗号合并构建会同时加入列出的应用目录；构建 `shared` 时改用 `shared/examples/pages`。

### 单项目模式

不传 `workspace` 时使用：

```text
src/pages
src/components/layouts
```

## 示例结构

```text
src/
├── admin/
│   ├── components/layouts/default.vue
│   └── pages/index.vue
├── portal/
│   ├── components/layouts/default.vue
│   └── pages/index.vue
└── shared/
    ├── components/layouts/default.vue
    └── examples/pages/index.vue
```

完整运行参数与构建选择规则参见 [`@deot/env-dever`](../dever/README.md)，项目落地方式参见[项目结构](../../docs/project-structure.md)。
