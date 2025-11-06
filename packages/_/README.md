# 测试使用

- 让IDE支持正确识别`alias`(如`@`), 正确执行`Go To Definition`, 其中`tsconfig/jsconfig`的`compilerOptions.paths`是必要的
- 如果要支持`.scss/.vue` stylelint 有效, 需要检查相关配置
```
"stylelint.validate": [
	"scss",
	"vue"
```