# @deot/env-deps

`@deot/env-deps` 是依赖容器，不提供代码入口。当前包只直接依赖 `@deot/dev`，用于让 `@deot/env` 项目获得统一版本的开发工具链。

## 安装

通常通过聚合包安装：

```bash
pnpm add -D @deot/env
```

只需要开发工具链时也可以单独安装：

```bash
pnpm add -D @deot/env-deps
```

## 当前依赖

```json
{
  "dependencies": {
    "@deot/dev": "^2.9.15"
  }
}
```

`@deot/dev` 再组合以下能力：

| 能力 | 对应包 |
| --- | --- |
| CLI 与包操作 | `@deot/dev-cli`、`@deot/dev-adder`、`@deot/dev-linker` |
| 开发、构建与测试 | `@deot/dev-dever`、`@deot/dev-builder`、`@deot/dev-tester` |
| ESLint 与 Stylelint | `@deot/dev-eslint`、`@deot/dev-stylelint` |
| 发布与更新 | `@deot/dev-releaser`、`@deot/dev-updater` |
| 共享工具与测试辅助 | `@deot/dev-shared`、`@deot/dev-test` |
| 提交检查 | `@deot/dev-commitlint` |

具体子包版本由当前 `@deot/dev` 决定，不由 `@deot/env-deps` 单独重复声明。

## 配置入口

安装后可以直接使用 `@deot/dev` 暴露的 TypeScript 配置：

```json
{
  "extends": "@deot/dev/tsconfig.shared.json"
}
```

ESLint 与 Stylelint 配置来自对应工具包：

```js
import { configure } from '@deot/dev-eslint';

export default configure();
```

```js
import { configure } from '@deot/dev-stylelint';

export default configure();
```

完整项目接法见[配置扩展](../../docs/configuration.md)。

## 使用边界

- 不要从 `@deot/env-deps` 执行 `import`；它没有 `main`、`types` 或 `exports`。
- 如果项目已经直接管理完整的 `@deot/dev` 工具链，可以不单独安装本包。
- 普通 `@deot/env` 项目不需要显式添加本包，因为聚合包已经依赖它。
