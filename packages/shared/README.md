# @deot/env-shared

`@deot/env` 的工作区解析与日志工具。`@deot/env-dever` 和 `@deot/env-vue` 使用它识别单项目、多应用 workspace、包目录和真实包名。

## 安装

```bash
pnpm add @deot/env-shared
```

## 导出

```ts
import { Locals, Logger } from '@deot/env-shared';
```

### `Locals.impl(workspace)`

解析当前项目并缓存结果：

```ts
const locals = Locals.impl('src');
```

主要字段：

| 字段 | 说明 |
| --- | --- |
| `cwd` | 当前进程目录 |
| `workspace` | 多应用目录；单项目模式下为空字符串 |
| `workspaceDir` | workspace 的绝对路径 |
| `packageDir` | 当前项目绝对路径 |
| `packageOptions` | 根 `package.json` 内容 |
| `packageName` | 从 `shared/package.json` 推导出的包名前缀，如 `@clients/` |
| `packageVersion` | 根包版本 |
| `packageFolderNames` | 普通应用目录，不包含 `shared` |
| `packageOptionsMap` | 目录名到 `package.json` 的映射 |
| `packageDirsMap` | 目录名到绝对路径的映射 |
| `sharedPackageFolderName` | 多应用模式固定为 `shared` |

workspace 扫描只收集目录，并忽略名称匹配 `^_`、`tpl` 或 `dist` 的目录。每个被识别的目录都需要包含 `package.json`。

### 包名转换

```ts
Locals.getPackageName('admin', 'src');
// => @clients/admin

Locals.getPackageFolderName('@clients/admin', 'src');
// => admin

Locals.getRealPackageName('admin,portal', 'src');
// => @clients/admin,@clients/portal
```

- `getPackageName`：目录名转完整包名。
- `getPackageFolderName`：完整包名转 workspace 目录名。
- `getRealPackageName`：规范化逗号分隔的选择结果，并过滤不存在的包。
- 单项目模式下，转换函数返回根包名或空目录名。

### `Logger`

`Logger.log`、`Logger.info` 和 `Logger.error` 分别直接引用对应的 `console` 方法，用于各子包共享输出入口。

## 使用约定

- 解析依赖 `process.cwd()`，应在目标项目根目录启动命令。
- 同一个 `workspace` 参数的结果会在当前进程中缓存。
- 多应用 workspace 应提供 `shared/package.json`，其包名决定其他应用的包名前缀。
- 面向项目开发时通常直接使用 [`@deot/env`](../index/README.md)；只有编写环境集成时才需要直接依赖本包。

更多目录约定参见[项目结构](../../docs/project-structure.md)。
