FROM harbor.trscd.com.cn/baseapp/nginx:1.20.1-alpine-root-strong-v3

ENV LANG C.UTF-8

ENV TZ Asia/Shanghai

WORKDIR /TRS/HyCloud/WEB

# 按需修改这一行，海云海星都是打包成dist文件
ADD dist.tar.gz /TRS/HyCloud/WEB

# 按需修改这一行，海云的二级路由是govapp，根据项目具体修改
RUN mv /TRS/HyCloud/WEB/dist /TRS/HyCloud/WEB/vue3-ts-admin

EXPOSE 80 443