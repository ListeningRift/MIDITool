// vite.config.ts
import { resolve } from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import legacy from '@vitejs/plugin-legacy'
// 注意：在 ts 模块中加载 node 核心模块需要安装 node 的类型补充模块：npm i -D @types/node

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    base: './',
    plugins: [
      legacy({
        targets: ['defaults', 'not IE 11']
      }),
      vue()
    ],
    css: {
      preprocessorOptions: {
        less: {
          additionalData: `@import "@/styles/variables.less";`
        }
      }
    },
    esbuild: {
      // 打包最小化css是通过esbuild实现的
      // vite传递给esbuild的默认值在4.3版本被指定为utf8
      // 所以这里需要手动指定ascii
      charset: 'ascii'
    },
    resolve: {
      alias: {
        '@': resolve('src')
      }
    },
    // 本地代理设置
    server: {
      proxy: {
        xxx: {
          target: '', //代理的目标环境地址
          changeOrigin: true
        }
      },
      open: true
    }
  }
})
