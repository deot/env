# @deot/env-cli

`@deot/env-cli` 提供 `dec` 命令。当前 CLI 只注册 `dev` 和 `build`，两者都调用 `@deot/env-dever`。

## 安装

通常通过聚合包安装：

```bash
pnpm add -D @deot/env
```

也可以单独安装：

```bash
pnpm add -D @deot/env-cli
```

## 命令

```text
dec <cmd>
```

| 命令 | 说明 |
| --- | --- |
| `dec dev` | 创建 Vite 开发服务 |
| `dec build` | 逐包执行 Vite 生产构建 |
| `dec --version` | 输出当前 CLI 版本 |
| `dec --help` | 输出帮助 |

当前源码没有注册 `init`、`test`、`add` 等子命令；这些属于 `@deot/dev` 的其他工具，不应写成 `dec` 命令。

## `dec dev`

```bash
dec dev [options]
```

| 选项 | 值 | 说明 |
| --- | --- | --- |
| `--workspace <string>` | 路径 | workspace；未传时 Dever 默认使用 `clients` |
| `--package-name <string>` | 名称 | 目录名、完整包名、`*` 或逗号分隔名称 |
| `--dry-run [boolean]` | 可选值 | 跳过 Vite，只执行内部探测命令 |
| `--custom <string>` | 字符串 | 透传到 `ENV_OPTIONS.custom` |

示例：

```bash
# 交互选择应用
dec dev --workspace src

# 非交互地加载全部应用
dec dev --workspace src --package-name '*'

# 传递业务自定义信息
dec dev --workspace src --package-name '*' --custom local
```

workspace 存在且未传 `--package-name` 时，会显示包选择器。列表包含 `*`、普通应用目录和 `shared`。

## `dec build`

```bash
dec build [options]
```

| 选项 | 值 | 说明 |
| --- | --- | --- |
| `--workspace <string>` | 路径 | workspace |
| `--out-dir <string>` | 路径 | 输出根目录；Dever 默认值是 `clients/dist` |
| `--package-name <string>` | 名称 | 选择单包，或用逗号合并多个包的路由 |
| `--dry-run [boolean]` | 可选值 | 跳过真实构建 |
| `--custom <string>` | 字符串 | 透传到 `ENV_OPTIONS.custom` |

示例：

```bash
# 构建全部普通应用
dec build --workspace src --out-dir dist

# 构建单个应用
dec build --workspace src --out-dir dist --package-name mobile

# 将多个应用页面合入第一个应用产物
dec build \
	--workspace src \
	--out-dir dist \
	--package-name manage,mobile,shared
```

逗号形式只输出第一个包的目录，不等于分别构建每个包。详见[构建与部署](../../docs/build-and-deploy.md)。

## 在 npm scripts 中使用

```json
{
  "scripts": {
    "cli:dev": "dec dev --workspace src",
    "cli:build": "dec build --workspace src --out-dir dist",
    "dev": "cross-env BRANCH=dev npm run cli:dev",
    "build": "cross-env BRANCH=prod npm run cli:build"
  }
}
```

CLI 会把命令选项交给 Dever。逐包构建时，Vite 配置可以从 `ENV_OPTIONS` 读取当前 `packageFolderName`，见[配置扩展](../../docs/configuration.md)。

## Dry run

测试传入 `--dry-run` 时，当前实现执行一个 `echo development <runtime-dir>` 子进程，并以其退出码完成命令；它不会解析 workspace、启动服务或写构建产物。

`--dry-run [boolean]` 没有自定义字符串解析器，建议只使用不带值的 `--dry-run`，不要依赖 `--dry-run false` 表示关闭。

