# @deot/env-cli

包管理命令行

## `dec <cmd>`

- `init`
- `dev`
- `build`
- `test`
- `add`

## 默认的目录参考

#### Monorepo

```
Monorepo
├─ .husky
├─ packages
│    ├─ index
│    │    ├─ __tests__
│    │    ├─ src
│    │    └─ package.json
│    ├─ shared
│    │    ├─ __tests__
│    │    ├─ src
│    │    └─ package.json
│    └─ shims.d.ts
├─ .eslintignore
├─ .eslintrc.cjs
├─ .lintstagedrc.json
├─ .npmrc
├─ pnpm-lock.yaml
├─ pnpm-workspace.yaml
├─ tsconfig.json
└─ package.json
```

#### Single Repo

```
Single Repo
├─ .husky
├─ __tests__
├─ src
├─ .eslintignore
├─ .eslintrc.cjs
├─ .npmrc
├─ shims.d.ts
├─ pnpm-lock.yaml
├─ pnpm-workspace.yaml
├─ tsconfig.json
├─ yarn.lock
└─ package.json
```

