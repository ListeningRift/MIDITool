# XXX

一个开箱即用的模板工程

## 技术栈

[Vue3](https://v3-migration.vuejs.org/zh/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](http://www.vitejs.net/) + [Ant Design Vue](https://www.antdv.com/components/overview-cn/).

## 浏览器兼容

| [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_48x48.png" alt="IE / Edge" width="24px" height="24px" />](https://godban.github.io/browsers-support-badges/)</br>Edge | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png" alt="Firefox" width="24px" height="24px" />](https://godban.github.io/browsers-support-badges/)</br>Firefox | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png" alt="Chrome" width="24px" height="24px" />](https://godban.github.io/browsers-support-badges/)</br>Chrome | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari_48x48.png" alt="Safari" width="24px" height="24px" />](https://godban.github.io/browsers-support-badges/)</br>Safari |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 79+                                                                                                                                                                                                         | 67+                                                                                                                                                                                                                | 64+                                                                                                                                                                                                            | 11.1+                                                                                                                                                                                                          |

[兼容性分析](http://wiki.devdemo.trs.net.cn/pages/viewpage.action?pageId=45483336)

## 目录结构

以下是系统的目录结构

```
├── public                   // 静态资源
├── src
│    ├── api                 // api请求
│    ├── assets              // 静态文件（图标）
│    ├── axios               // 接口请求
│    ├── components          // 业务通用组件
│    ├── directives          // 自定义指令
│    ├── layout              // 基本页面布局
│    ├── router              // 路由文件
│    ├── store               // 状态管理
│    ├── styles              // 样式文件
│         ├── index.less     // 全局样式
│         ├── varibles.less  // 全局变量
│    ├── utils               // 工具类
│         ├── auth           // 权限维护
│         ├── downloadFile.ts// 文件下载
│    ├── views               // 业务页面
│         ├── home           // 首页
│         ├── login          // 登录
│    ├── App.vue             // vue模板入口
│    ├── main.ts             // vue模板js
├── .cz-config.js            // commit提交规范
├── auto-imports.d.ts        // 自动引入全局类型声明
├── prettier.config.js       // 代码格式规范
├── tsconfig.json            // ts配置
└── vite.config.ts           // vite全局配置
```

## Project Init

See [vue3+ts+vite 项目框架搭建](http://wiki.devdemo.trs.net.cn/pages/viewpage.action?pageId=30017511).

## Proxy & Request

See [接口请求和本地代理](http://wiki.devdemo.trs.net.cn/pages/viewpage.action?pageId=30017542)

## Project Setup

- 支持的 node 版本为 16.0.0 及其以上版本，推荐使用最新稳定 node 版本

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

## 使用手册

See [使用手册](http://wiki.devdemo.trs.net.cn/pages/viewpage.action?pageId=42172607)
【环境地址】(http://192.168.210.106:81/vue3-ts-admin)

## 注意事项

由于自动引入 api 机制无法在本地运行过程中热更新，所以当 api 文件夹下增加新模块 api 文件时需要重新运行 `npm run dev` 更新全局类型声明的内容才能生效。
