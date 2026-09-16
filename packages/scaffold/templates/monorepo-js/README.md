# __PROJECT_NAME__

```bash
pnpm install
pnpm dev
```

项目包含 `manage`、`mobile` 和 `shared` 三个 workspace 包。

## 环境配置

- `VITE_MANAGE_API_BASE_URL`：桌面端 API 地址。
- `VITE_MOBILE_API_BASE_URL`：移动端 API 地址。
- `VITE_SOURCE_CODE`：请求来源标识。

未配置 API 地址时使用当前页面域名。桌面端提示由 `manage/env.js` 统一适配，移动端提示由 `mobile/env.js` 统一适配。

菜单示例位于 `manage/layout.js`。首页独立于菜单树，通过 `shared/constants/layout.js` 中的 `LAYOUT_HOME_VISIBLE` 决定展示首页或跳转到首个菜单页面，默认展示首页。Shared 默认布局包含标签页、KeepAlive 和滚动位置记忆；移动端页面使用 `shared/components/layouts/default-mobile.vue` 提供的独立布局。

## 页面约定

页面样式写在对应的页面 `.vue` 文件中，使用 `<style lang="scss">`，不使用 `scoped`。`styles/` 只负责应用级基础样式、主题、重置和字体，不存放具体页面样式。

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

每个包的 UnoCSS 配置写在 import query 上：`src/mobile/index.js` 是 `import 'virtual:uno.css?unit=rem&scale=2'`，`src/manage/index.js` 是 `?unit=px&scale=1`，`src/shared/examples/index.js` 只写 `virtual:uno.css` 用默认配置。`vite.config.js` 里不需要配置。

query 的作用域是整个包，所以**一个包里只能有一处配置 query**，写第二套不同的会直接报错。不要依赖 `UNOCSS_OPTIONS` 按 URL 切换，它是全局覆盖，会把各端差异抹平。

UnoCSS 没有运行时动态生成样式的能力。只有源码中已经出现的完整 class token 才会在构建时生成并注入对应 CSS；运行时可以切换这些已生成的 class，但不要使用 `` `g-fs-${size}` `` 这类无法被静态扫描的拼接方式。

### 路由目录

路由路径段及其对应的文件夹名称统一使用小写连字符（kebab-case）规范，如 `user-permission-config`。路由 `/system-manage/user-permission/detail-page` 必须对应 `pages/system-manage/user-permission/detail-page/index.vue`；不要使用驼峰、下划线或让路由名称与目录名称不一致。

不要使用嵌套路由。约定一个页面文件夹只管理它自己的页面，不能在页面内部继续声明或承载子路由。

需要增加子页面时，应按照同级页面结构新建独立目录。例如已有 `pages/order/main/index.vue`，详情页应新建 `pages/order/detail/index.vue`，分别生成 `/order/main` 和 `/order/detail`，而不是把详情页配置成 `/order/main` 的嵌套路由。

### Escape 页面

`/escape/*` 是不经过业务布局、可直接访问的特殊路由区域，Manage 和 Mobile 均提供 `pages/escape/main/index.vue` 示例。Escape 页面使用 `layout: 'none'`，适合登录、授权、分享等不需要侧栏、导航栏和标签页的场景。

`shared/constants/pages.js` 导出的 `ROUTE_UNAUTHORISED_REGEXP` 用于在项目增加登录守卫后识别这类公开路由。`escape/main` 参考现有项目约定保留两层结构，不受普通业务页面优先使用三层目录的限制。
