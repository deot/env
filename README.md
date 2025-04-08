[ci-image]: https://github.com/deot/env/actions/workflows/ci.yml/badge.svg?branch=main
[ci-url]: https://github.com/deot/env/actions/workflows/ci.yml

[![build status][ci-image]][ci-url]

# deot/env

用于项目开发的仓库统一环境

所有的相关的开发环境，统一更新，升级时如果有多仓库，仅更新此仓库即可，无需同时更新太多依赖性，以追求最新且稳定的项目开发环境

> 需要依赖当前的`tsconfig.json`, `.eslintrc.cjs`等，这些配置项可以用`extends`导出
> 如果执行`dev`, `test`, `build`需要扩展，可以配置`*.config.ts`来进行扩展
> 具体可以参考以下`demo`

- [demo by @deot/env](https://github.com/deot/env-demo)
- [site by @deot/env](https://github.com/deot/site)

## Monorepo

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

| 包名                        | 版本                                         | 说明                                     |
| ------------------------- | ------------------------------------------ | -------------------------------------- |
| [cli](packages/cli)       | [![npm][npm-cli-image]][npm-cli-url]       | 开发指令集`dev`、`build`、`test`、`link`、`add` |
| [deps](packages/deps)     | [![npm][npm-deps-image]][npm-deps-url]     | 额外依赖提取                                 |
| [dever](packages/dever)   | [![npm][npm-dever-image]][npm-dever-url]   | 开发服务集成                                 |
| [shared](packages/shared) | [![npm][npm-shared-image]][npm-shared-url] | 开发共享资源                                 |
| [vue](packages/vue)       | [![npm][npm-vue-image]][npm-vue-url]       | Vue集成包                                 |
| [index](packages/index)   | [![npm][npm-image]][npm-url]               | 当前所有包的合集                               |

## Contributing

这是一个[monorepo](https://en.wikipedia.org/wiki/Monorepo)仓库 ，使用[pnpm](https://pnpm.io/) 管理

- 安装环境

```console
$ npm run init
```

- 添加依赖或添加新的包

```console
$ npm run add
```

- 关联

```console
$ npm run link
```

- 测试

```console
$ npm run test

# 或者 直接添加参数
$ npm run test -- --package-name '**' --watch
```

- 开发

```console
$ npm run dev

# 或者 直接添加参数
$ npm run dev -- --package-name '**'
```

- 打包

```console
$ npm run build
```

- 代码检查

```console
$ npm run lint
```

- 发布

```console
$ npm run release
```

## 关联

[CONTRIBUTING](./.github/CONTRIBUTING.md)

[LICENSE (MIT)](./LICENSE)