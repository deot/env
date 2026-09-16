## Layouts

### Default

```vue
<route lang="json5">
{
  meta: {
    layout: 'default',
    theme: 'v1|v2',
    tabless: 'boolean',
    tabAlive: 'boolean'
  }
}
</route>
```
- tabAlive：优先`keep-alive`，对应的页面需要`watch query`, 默认false
- tabless：当前页禁用标签功能, 默认false
- theme：主题
- 首次 URL 带 `hideLayout=1`（或 `true`）时隐藏 sidebar/navbar/header，只留 content；该标志在 SPA 生命周期内固定

### `None`

```vue
<route lang="json5">
{
  meta: {
    layout: 'none'
  }
}
</route>
```

