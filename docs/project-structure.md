# 项目结构

本页根据当前 workspace 扫描、虚拟 HTML、Vue 路由实现和实际多应用项目提炼目录约定。

## 推荐结构

```text
project/
├── package.json
├── pnpm-workspace.yaml
├── eslint.config.js
├── stylelint.config.js
├── vite.config.js
└── src/
    ├── index.ejs
    ├── preload.js
    ├── manage/
    │   ├── package.json
    │   ├── index.js
    │   ├── pages/
    │   ├── components/
    │   │   └── layouts/
    │   └── assets/
    │       └── static/
    ├── mobile/
    │   ├── package.json
    │   ├── index.js
    │   ├── pages/
    │   └── components/
    │       └── layouts/
    └── shared/
        ├── package.json
        ├── index.js
        ├── components/
        │   └── layouts/
        ├── examples/
        │   ├── index.js
        │   └── pages/
        └── index.html
```

目录名只是示例；运行时以 `--workspace`、各目录的 `package.json` 和 `shared` 包名为准。

## workspace 扫描

`Locals.impl(workspace)` 会把 `workspace` 解析为相对当前进程目录的绝对路径。

多应用模式下：

- 直属子目录视为包。
- `shared` 被识别为公共包，不包含在“构建全部普通应用”的列表中。
- 以 `_` 开头，或 `tpl`、`dist` 作为独立目录名片段（整段，或由 `-`、`_`、`.` 分隔）的目录会被忽略。`marketplace` 这类只是字母里碰巧包含 `tpl` 的名字仍会参与扫描。
- 每个参与扫描的目录都必须包含可读取的 `package.json`。
- 结果按 workspace 字符串缓存；同一进程中不应在首次读取后再动态改变目录结构。

## 包名与目录名

应用包前缀取自 `shared/package.json`：

```json
{
  "name": "@clients/shared"
}
```

对应关系为：

| 目录 | 包名 |
| --- | --- |
| `manage` | `@clients/manage` |
| `mobile` | `@clients/mobile` |
| `shared` | `@clients/shared` |

开发服务会同时建立两类 Vite alias：

- `@` → workspace 根目录。
- 每个包名 → 对应包目录。

当 `--workspace src` 时，`@` 指向 `src`。实际项目中的业务代码通常优先使用这个根别名导入公共层：

```js
import { router } from '@/shared/modules/router';
```

按 `package.json.name` 生成的包名 alias 同样可用：

```js
import { router } from '@clients/shared/modules/router';
```

前者更直接地体现“从当前 workspace 根目录导入”，也是 `src` workspace 下的常用写法；后者适合需要明确包边界的代码。

若 shared 包不存在或没有名称，代码会回退到以 workspace 名生成的前缀；实际项目仍应始终提供 `shared/package.json`，避免名称依赖目录推导。

## HTML 与应用入口

### 根模板

当请求路径没有找到现成 `index.html` 时，运行时会向上查找页面入口；仍未找到时使用 workspace 根部的 `index.ejs`。

模板接收一个 `entry`：

```html
<script type="module" src="<%= entry %>"></script>
```

`entry` 按以下顺序查找当前包：

1. `index.js`
2. `index.ts`

如果两者都不存在，模板仍会渲染，但不会得到有效应用入口，因此每个应用包应至少提供其中一个文件。

### 包级 index.html

包目录可以创建自己的 `index.html` 覆盖根模板。shared 示例常用这一能力：

```html
<div id="app"></div>
<script type="module" src="/preload.js"></script>
<script type="module" src="/shared/examples/index.js"></script>
```

开发服务还会沿请求路径向上寻找最近的 `index.html`，适合为某个子应用或示例区提供独立宿主页面。

### preload

实际项目会在根模板和 shared 示例入口中共同加载 `preload.js`：

```js
import '../node_modules/@deot/style/dist/index.normalize-only.css';
import './shared/styles/index.scss';
```

预加载文件适合放置：

- 全应用共享的基础 CSS。
- 必需的 polyfill。
- 应用挂载前必须执行的环境初始化。

业务页面逻辑和只属于某个应用的模块不应放进 preload。

## 页面路由

`@deot/env-vue` 使用 `vue-router/vite` 发现页面，默认不生成路由类型文件。

### 开发模式

多应用 workspace 会聚合：

```text
src/<app>/pages
src/shared/examples/pages
```

每个目录都带应用名前缀，避免不同应用的页面路径互相覆盖。

### 构建模式

构建单个应用时只读取该应用的 `pages/`。传入逗号分隔的多个包名时，会读取所有选中应用的页面；shared 使用 `shared/examples/pages`。

### 排除目录

以下路径默认不会被当作页面：

- `**/components/**`
- `**/component/**`
- `**/common/**`
- `**/_common/**`
- `**/*.component.vue`

公共组件应放在这些目录中，不要依赖文件名碰巧绕过规则。

## 布局

布局由 `vite-plugin-vue-layouts` 管理。

多应用 workspace 的布局目录：

```text
src/shared/components/layouts
src/<app>/components/layouts
```

单仓库布局目录：

```text
src/components/layouts
```

shared 布局适合全应用共同使用，应用目录中的布局适合覆盖具体业务场景。页面目录与布局目录的匹配由插件完成，`@deot/env` 不额外定义布局元数据格式。

## 静态资源

通用资源可以由 Vite 正常解析；按应用区分的 public 资源建议放在：

```text
src/<app>/assets/static
```

再在 `vite.config.js` 中根据内部生成的 `ENV_OPTIONS.packageFolderName` 设置 `publicDir`。构建示例见[构建与部署](./build-and-deploy.md)。
