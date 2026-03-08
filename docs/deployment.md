# 部署说明

当前项目使用 `BrowserRouter`，所以线上环境必须把前端路由重写到根入口 [index.html](../index.html)。

## 构建产物

```bash
npm run build
```

产物目录是 `dist/`。

## Netlify

项目已提供 [public/_redirects](../public/_redirects)。执行构建后，这个文件会进入 `dist/_redirects`，Netlify 会把所有路由回退到 `index.html`。

## Vercel

项目已提供 [vercel.json](../vercel.json)，会把所有请求重写到 `index.html`。

## Nginx

如果部署在 Nginx，可以使用下面的最小配置：

```nginx
server {
    listen 80;
    server_name _;

    root /var/www/quantpilot/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 静态文件服务器

只要支持以下规则即可：

- 真实存在的静态资源直接返回
- 其余前端路由统一回退到 `index.html`

否则直接访问 `/overview`、`/signals`、`/accounts`、`/orders` 会返回 404。
