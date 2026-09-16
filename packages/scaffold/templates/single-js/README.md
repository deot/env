# __PROJECT_NAME__

```bash
pnpm install
pnpm dev
```

单应用项目，所有代码位于 `src/`，没有 workspace 包。

## 环境配置

- `VITE_API_BASE_URL`：API 地址。
- `VITE_SOURCE_CODE`：请求来源标识。

未配置 API 地址时使用当前页面域名。提示由 `src/env.js` 统一适配。

菜单示例位于 `src/layout.js`。首页独立于菜单树，通过 `src/constants/layout.js` 中的 `LAYOUT_HOME_VISIBLE` 决定展示首页或跳转到首个菜单页面，默认展示首页。默认布局包含标签页、KeepAlive 和滚动位置记忆；移动端页面使用 `src/components/layouts/default-mobile.vue` 提供的独立布局。

应用入口是 `src/app.js`，它直接创建 `app` / `router`，把上下文注册到 `src/modules/context.js`，再按 `sort` 顺序依次注入 `src/modules/*.js`。

## 路径别名

`@` 指向项目根目录，所以内部引用统一写成 `@/src/xxx`：

```ts
import { SetTitle } from '@/src/components';
import { useFirstRoute } from '@/src/hooks';
```

## 页面约定

页面样式写在对应的页面 `.vue` 文件中，使用 `<style lang="scss">`，不使用 `scoped`。`src/styles/` 只负责应用级基础样式、主题、重置和字体，不存放具体页面样式。

页面 Block 使用 `v-` 加路由各段首字母的简写：

- `/home/main` 使用 `v-hm`。
- `/workspace/features/main` 使用 `v-wfm`。
- `/state/manage/scroll` 使用 `v-sms`。

样式使用 `@deot/style` 已注入的 BEM mixin，不需要在页面内再次导入：

```scss
$block: v-wfm;

@include block($block) {
	@include element(card) {
		// ...
	}
}
```

通用布局和原子样式优先使用 `@deot/style-unocss` 已集成的 `g-*` 类，页面自身的语义样式再使用上述 BEM Block。

UnoCSS 配置写在 import query 上：`src/app.js` 里的 `import 'virtual:uno.css?unit=px&scale=1'`。`vite.config.js` 里不需要配置。

整个应用**只能有一处 query 配置**，写第二套不同的会直接报错。不要依赖 `UNOCSS_OPTIONS` 按 URL 切换，它是全局覆盖。

UnoCSS 没有运行时动态生成样式的能力。只有源码中已经出现的完整 class token 才会在构建时生成并注入对应 CSS；运行时可以切换这些已生成的 class，但不要使用 `` `g-fs-${size}` `` 这类无法被静态扫描的拼接方式。

### 路由目录

路由路径段及其对应的文件夹名称统一使用小写连字符（kebab-case）规范，如 `user-permission-config`。路由 `/system-manage/user-permission/detail-page` 必须对应 `src/pages/system-manage/user-permission/detail-page/index.vue`；不要使用驼峰、下划线或让路由名称与目录名称不一致。

不要使用嵌套路由。约定一个页面文件夹只管理它自己的页面，不能在页面内部继续声明或承载子路由。

需要增加子页面时，应按照同级页面结构新建独立目录。例如已有 `pages/order/main/index.vue`，详情页应新建 `pages/order/detail/index.vue`，分别生成 `/order/main` 和 `/order/detail`，而不是把详情页配置成 `/order/main` 的嵌套路由。

### Escape 页面

`/escape/*` 是不经过业务布局、可直接访问的特殊路由区域，示例见 `src/pages/escape/main/index.vue`。Escape 页面使用 `layout: 'none'`，适合登录、授权、分享等不需要侧栏、导航栏和标签页的场景。

`src/constants/routes.js` 导出的 `ROUTE_UNAUTHORISED_REGEXP` 用于识别这类公开路由。`escape/main` 参考现有项目约定保留两层结构，不受普通业务页面优先使用三层目录的限制。
