# @deot/env-cli ChangeLog

## v1.1.1

_2026-11-25_

### Bugfixes

- fix(dever): let virtual html pass through dev proxy paths ([cc9bb9f](https://github.com/deot/env/commit/cc9bb9fe08ac3b786e9366216879640390464b8e))
- fix(dever): restore content-type on virtual html responses ([87ffd83](https://github.com/deot/env/commit/87ffd830f72a6bdf8261d4ca9b03ed0653ba9218))
- fix(shared): keep marketplace when scanning package folders ([7eea040](https://github.com/deot/env/commit/7eea040df0c02bad259e92cf8a88b841105b0d2a))
- fix(scaffold): bump @deot/env to 1.1.0 and drop photoswipe ([dcb45b3](https://github.com/deot/env/commit/dcb45b30b91d4d8025119743fbad7a313cf481b9))

## v1.1.0

_2026-11-23_

### Bugfixes

- fix(dever): support official uno.css aliases and harden entry routing ([4ae9982](https://github.com/deot/env/commit/4ae9982c03fba9ae9f034be2a7a0357bed7cc0e1))
- fix(dever): set content-type for virtual html responses ([66166f6](https://github.com/deot/env/commit/66166f6665503f500e18e5659d4dbe72f52c23d3))
- fix(scaffold): upgrade @deot/vc and adapt plugin callbacks ([607eed5](https://github.com/deot/env/commit/607eed5fcc7283bd11e2272ccadf310c84baee95))
- fix(scaffold): migrate obsolete utility classes and add badge styles ([df9f0f3](https://github.com/deot/env/commit/df9f0f3a143069c525491eb0498ecae681f51333))
- fix(*): dependencies & unexpected build ([7d589b9](https://github.com/deot/env/commit/7d589b92dbb13c0e052efcc01ce78f1b7a8626dc))

### Features

- feat: add project init with per-entry UnoCSS ([f70c14c](https://github.com/deot/env/commit/f70c14c5f44fe275a50470d3fb33c10b7f340a57))
- feat(dever): support ios12 as minimum build target ([3ae2458](https://github.com/deot/env/commit/3ae2458b3e47dad2a3a0d6c2b214989e627faaaa))
- feat(scaffold): add single JavaScript and TypeScript scaffold templates ([1810c0c](https://github.com/deot/env/commit/1810c0c28ad8f5eb699df2f5fd91e82c65deb514))
- feat(scaffold): add monorepo TypeScript scaffold template ([8975816](https://github.com/deot/env/commit/897581689d7e1d3b2d9ff7ec471f7a8a818af82d))
- feat(*): {workspace}/shared as packageName prefix ([464bf1e](https://github.com/deot/env/commit/464bf1e2627849599c4c4c330e00697b9f5e5627))
- feat(*): add `--workspace` & `--out-dir`(monorepo) & branch & singlerepo ([5c0767a](https://github.com/deot/env/commit/5c0767a63aa930d5a2f7f6df4e2f2afbb5f449a0))
- feat(*): dev/build initial commit ([beb77ec](https://github.com/deot/env/commit/beb77ec2ae8cd71effbea9af920dd09083c0b890))

### Updates

- chore: deps updated ([42f13b5](https://github.com/deot/env/commit/42f13b55889b5d335bc22d5b6cad8dadb753c3fd))
- refactor(dever,scaffold): configure per-package UnoCSS via import query ([02139f2](https://github.com/deot/env/commit/02139f2eee6f5bf869523d29c549461868559938))
- refactor(dever): delegate per-entry UnoCSS to official vite plugin instances ([a7c3561](https://github.com/deot/env/commit/a7c35610d15bb535c3bfbd74fcd40938d78ddbde))
- chore(*): deps updated ([3ddfdf3](https://github.com/deot/env/commit/3ddfdf3bc70f76b306d8d7fec6b8a880ed3156ce))
- chore(*): deps updated ([6269a3c](https://github.com/deot/env/commit/6269a3cd1f74508dee6b1e1b610b41e237730f05))

## v1.0.15

_2026-01-20_

### Features

- feat(vue): self repo layouts support ([8f9a221](https://github.com/deot/env/commit/8f9a2219a0b1035b43635053609096d9bec45cbe))

## v1.0.14

_2026-01-14_

### Updates

- chore: deps updated ([3ddfdf3](https://github.com/deot/env/commit/3ddfdf3bc70f76b306d8d7fec6b8a880ed3156ce))

## v1.0.13

_2025-11-06_

### Updates

- chore: deps updated ([6269a3c](https://github.com/deot/env/commit/6269a3cd1f74508dee6b1e1b610b41e237730f05))

## v1.0.12

_2025-07-08_

### Updates

- chore(vue): support shared build alone ([8fa4483](https://github.com/deot/env/commit/8fa4483834590bd69cfd38fd84e08fcb748af72c))

## v1.0.11

_2025-06-19_

### Updates

- chore(vue): avoid output dts file ([95406f7](https://github.com/deot/env/commit/95406f7ad122f4ae975a3129edc6703a3876bb61))

## v1.0.10

_2025-06-13_

### Features

- feat(vue): avoid components add to routes ([03afe4c](https://github.com/deot/env/commit/03afe4c03820e85b28bb756cc9df7a0cddce7c92))

## v1.0.9

_2025-05-29_

### Features

- feat(dever): support postcss ([a4c7581](https://github.com/deot/env/commit/a4c7581b29319118f70aea710a4dbad00d6fb656))

## v1.0.8

_2025-05-08_

### Features

- feat(dever): clean before build ([55e21b0](https://github.com/deot/env/commit/55e21b0f56597adcfd134215c05e7ee678a784e1))

## v1.0.7

_2025-04-28_

### Features

- feat(dever): add `__MULTIPLE_PACKAGE_FOLDER_NAMES__` define ([f0ce81f](https://github.com/deot/env/commit/f0ce81f4201487a7c6b40933dc3fc2fd8466b043))
- feat(dever,vue): allow build with multiple package ([10adeed](https://github.com/deot/env/commit/10adeedac8ccdacbedc65aaf4271e10adcbbaf60))
- feat(dever): add `packageFolderName` when build ([f15e2eb](https://github.com/deot/env/commit/f15e2eb2944e3c7ddf2aba1daa93a96abe1a45bc))
- feat(dever): `layouts` -> `components/layouts` ([f7c2cd2](https://github.com/deot/env/commit/f7c2cd21f609d7bba5856c8245dba7505d33f357))

### Updates

- chore(shared): force-publish `1.0.4` -> `1.0.5`

## v1.0.6

_2025-04-14_

### Features

- feat: {workspace}/shared as packageName prefix ([464bf1e](https://github.com/deot/env/commit/464bf1e2627849599c4c4c330e00697b9f5e5627))
- feat(dever): `DEV_OPTIONS` -> `ENV_OPTIONS`, `BRANCH` -> `ENV_DEFINE` ([b5a25ec](https://github.com/deot/env/commit/b5a25ecc9c70071eb3e22fb9d20c5b08e223f7eb))

## v1.0.5

_2025-04-14_

### Features

- feat: add `--workspace` & `--out-dir`(monorepo) & branch & singlerepo ([5c0767a](https://github.com/deot/env/commit/5c0767a63aa930d5a2f7f6df4e2f2afbb5f449a0))

## v1.0.4

_2025-04-09_

### Bugfixes

- fix(dever): rules must be written before any other rules ([f7ad7cb](https://github.com/deot/env/commit/f7ad7cb62d6c427508dcbe7889fd07fb980d1983))

## v1.0.3

_2025-04-08_

### Features

- feat(vue): router/dts disabled ([40e8f60](https://github.com/deot/env/commit/40e8f6018bd6e8e47f9733a47520301f0262f763))

## v1.0.2

_2025-04-08_

### Bugfixes

- fix: dependencies & unexpected build ([7d589b9](https://github.com/deot/env/commit/7d589b92dbb13c0e052efcc01ce78f1b7a8626dc))

## v1.0.1

_2025-04-08_

### Features

- feat: dev/build initial commit ([beb77ec](https://github.com/deot/env/commit/beb77ec2ae8cd71effbea9af920dd09083c0b890))
