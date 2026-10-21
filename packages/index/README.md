# @deot/env

`@deot/env` 是统一安装入口。它组合 CLI、开发运行时和通用开发工具链，并在代码入口导出 `Dever`。

## 安装

```bash
pnpm add -D @deot/env
```

安装后可以直接使用：

```bash
dec init my-app
dec dev --workspace src
dec build --workspace src --out-dir dist
```

`dec init` 创建新目录；开发和构建命令应在目标项目根目录运行。第一次接入请按[快速开始](../../docs/getting-started.md)完成项目创建或 workspace 配置。

## 包含的包

| 依赖 | 作用 |
| --- | --- |
| [`@deot/env-cli`](../cli) | 提供 `dec init`、`dec dev` 与 `dec build` |
| [`@deot/env-deps`](../deps) | 带入 `@deot/dev` 工具链 |
| [`@deot/env-dever`](../dever) | Vite 开发和构建运行时 |

[`@deot/env-scaffold`](../scaffold/README.md) 由 CLI 引入，提供项目生成器与模板；`@deot/env-vue` 与 `@deot/env-shared` 由 Dever 间接使用，无需在普通项目中重复安装。

## 代码 API

当前代码入口只导出一个命名空间：

```ts
import { Dever } from '@deot/env';

await Dever.run({
	workspace: 'src',
	packageName: '*'
});
```

等价于：

```ts
import * as Dever from '@deot/env-dever';
```

### `Dever.run(options)`

`run()` 返回 `Utils.autoCatch()` 包装后的 Promise。常用选项：

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `workspace` | `clients` | 单应用根目录或多应用 workspace |
| `outDir` | `clients/dist` | 构建输出根目录 |
| `packageName` | 空 | 目录名、完整包名、`*` 或逗号分隔名称 |
| `dryRun` | `false` | 只执行探测命令，不启动 Vite |
| `build` | `false` | `false` 创建开发服务；`true` 执行构建 |

`packageFolderName` 和 `mergePackageFolderNames` 会在运行过程中推导，通常不应由业务代码直接设置。

完整行为见 [`@deot/env-dever`](../dever) 和[配置扩展](../../docs/configuration.md)。

## 选择 CLI 还是 API

- npm scripts 和日常开发优先使用 `dec`，参数更直观。
- 需要在 Node 流程中组合环境变量或构建步骤时使用 `Dever.run()`。
- 两种入口最终都调用同一个 Dever 运行时。
