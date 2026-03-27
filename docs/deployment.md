# 部署说明

当前项目已经具备完整的前端控制台、Node gateway、worker、control-plane runtime 和 maintenance tooling。这里整理的是“可启动、可校验、可备份、可恢复”的最小部署基线。

当前前端使用 `BrowserRouter`，因此线上环境必须把前端路由重写到根入口 [index.html](../index.html)。

## 构建与启动前检查

推荐在部署前先执行：

```bash
npm install
npm run check:runtime-env
npm run verify
```

如果你要校验真实部署配置，而不是仓库模板，可以显式指定：

```bash
npm run check:runtime-env -- --env-file .env
```

`check:runtime-env` 会校验以下约束：

- `file / db` control-plane adapter 值是否合法
- gateway 端口、前端 refresh interval 是否为正整数
- broker adapter 与前端 provider 是否落在支持集合内
- Alpaca / custom-http 运行模式下是否补齐了对应的关键变量
- `VITE_ALPACA_PROXY_BASE` 是否仍然走同源路径

## 环境变量

建议从 [.env.example](../.env.example) 复制出 `.env` 后再做环境调整。

### 前端变量

- `VITE_REFRESH_MS`
  控制台刷新间隔，默认 `1800`
- `VITE_MARKET_DATA_PROVIDER`
  `simulated | custom-http | alpaca`
- `VITE_MARKET_DATA_HTTP_URL`
  当 `VITE_MARKET_DATA_PROVIDER=custom-http` 时使用
- `VITE_BROKER_PROVIDER`
  `simulated | custom-http | alpaca`
- `VITE_BROKER_HTTP_URL`
  当 `VITE_BROKER_PROVIDER=custom-http` 时使用
- `VITE_ALPACA_PROXY_BASE`
  Alpaca 前端代理基地址，默认 `/api/alpaca`

### Gateway 变量

- `GATEWAY_PORT`
  gateway 端口，默认 `8787`
- `BROKER_ADAPTER`
  `alpaca | custom-http`
- `BROKER_UPSTREAM_URL`
  custom-http broker 的上游地址
- `BROKER_UPSTREAM_API_KEY`
  可选，上游 broker 鉴权
- `BROKER_UPSTREAM_AUTH_SCHEME`
  默认为 `Bearer`
- `ALPACA_KEY_ID`
  Alpaca key
- `ALPACA_SECRET_KEY`
  Alpaca secret
- `ALPACA_USE_PAPER`
  `true | false`
- `ALPACA_DATA_FEED`
  Alpaca data feed，默认 `iex`

### Control-Plane 变量

- `QUANTPILOT_CONTROL_PLANE_ADAPTER`
  `file | db`，默认 `file`
- `QUANTPILOT_CONTROL_PLANE_NAMESPACE`
  控制面命名空间，不填时默认 `control-plane`

## 推荐启动形态

### 1. 本地模拟环境

适合纯前端和控制面联调：

```bash
npm run dev
npm run gateway
npm run worker
```

建议配置：

- `VITE_MARKET_DATA_PROVIDER=simulated`
- `VITE_BROKER_PROVIDER=simulated`
- `BROKER_ADAPTER=alpaca`
- `ALPACA_USE_PAPER=true`

说明：

- 前端 provider 可以完全跑本地模拟
- gateway 仍然可以保留 Alpaca paper 配置，便于后续切换

### 2. Alpaca paper sandbox

适合“前端控制台 + 本地 gateway + paper broker”这类半真实沙盒：

```bash
VITE_BROKER_PROVIDER=custom-http
VITE_BROKER_HTTP_URL=/api/broker
BROKER_ADAPTER=alpaca
ALPACA_USE_PAPER=true
```

然后启动：

```bash
npm run gateway
npm run worker
npm run dev
```

### 3. Custom HTTP broker

如果你已有自己的 broker upstream，推荐前端仍然只访问同源 gateway：

```bash
VITE_BROKER_PROVIDER=custom-http
VITE_BROKER_HTTP_URL=/api/broker
BROKER_ADAPTER=custom-http
BROKER_UPSTREAM_URL=https://broker.example.internal
```

不要把上游 broker 密钥放进任何 `VITE_*` 变量。

## 生产构建产物

```bash
npm run build
```

产物目录是 `dist/`。

### Netlify

项目已提供 [public/_redirects](../public/_redirects)。执行构建后，这个文件会进入 `dist/_redirects`，Netlify 会把所有路由回退到 `index.html`。

### Vercel

项目已提供 [vercel.json](../vercel.json)，会把所有请求重写到 `index.html`。

### Nginx

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

### 静态文件服务器

只要支持以下规则即可：

- 真实存在的静态资源直接返回
- 其余前端路由统一回退到 `index.html`

否则直接访问 `/overview`、`/signals`、`/accounts`、`/orders` 会返回 404。

## 运维与恢复

control-plane maintenance 已提供 CLI 和 API 两个入口。CLI 常用命令如下：

```bash
npm run control-plane:maintenance -- check
npm run control-plane:maintenance -- migrate
npm run control-plane:maintenance -- backup --output ./backups/control-plane.json
npm run control-plane:maintenance -- restore --input ./backups/control-plane.json --dry-run
npm run control-plane:maintenance -- restore --input ./backups/control-plane.json
npm run control-plane:maintenance -- repair-workflows --limit 20
```

如果你在数据库 adapter foundation 上做联调，也可以显式指定：

```bash
npm run control-plane:maintenance -- check --adapter db
```

如果你准备做 adapter 切换、真实 migrate 演练、restore 回退或者 repair 决策，建议同时阅读 [control-plane-migrations.md](./control-plane-migrations.md)。这份 runbook 额外补齐了：

- `file -> db` 与 `db -> file` 的切换顺序
- migrate 前必须先做 backup 与 dry-run restore 的原因
- 何时应该优先 restore，何时只需要 repair-workflows
- degraded posture 下的停止条件与 rollback posture

推荐恢复顺序：

1. 先执行 `check`
2. 执行一次 `backup`
3. 对候选备份做 `restore --dry-run`
4. 如果启用了 `db` adapter foundation，先执行一次 `migrate`
5. 确认后再执行正式 `restore`
6. 如有 workflow retry backlog，再执行 `repair-workflows`

### 迁移规划建议

如果是计划内迁移而不是故障恢复，推荐把动作拆成四个阶段：

1. `observe`
   - 先看 `/api/operations/maintenance` 或前端 persistence posture
   - 记录当前 schema version、target version 和 pending migrations
2. `protect`
   - 导出 backup
   - 用同一份 backup 执行 `restore --dry-run`
3. `change`
   - 仅执行一种写动作：`migrate` 或 `restore`
   - 不要把 `migrate + restore + repair` 混在一步里
4. `stabilize`
   - 再次 `check`
   - 如确有 retry backlog，再执行 `repair-workflows`
   - 最后重跑 `npm run verify`

### 回退姿态

如果 migrate 或 adapter 切换后 posture 变成 degraded，不建议继续追加 repair。更安全的顺序是：

1. 先保留当前现场 backup
2. 用已知可用备份执行 `restore --dry-run`
3. 再决定是否执行正式 `restore`
4. 待 posture 回到可读状态后，再处理 workflow retry backlog

## Readiness Checklist

部署或交付前，建议至少确认以下项目：

1. `npm run check:runtime-env -- --env-file .env` 已通过
2. `npm run verify` 已通过
3. `BROKER_ADAPTER` 与实际 broker 接法一致
4. 前端未暴露任何真实 broker 密钥
5. control-plane backup 已成功导出并验证过一次 dry-run restore
6. worker、gateway、frontend 端口没有冲突
7. 静态站点已配置前端路由回退到 `index.html`
8. 如果涉及 control-plane migrate 或 adapter 切换，已按 [control-plane-migrations.md](./control-plane-migrations.md) 走完 planning / backup / dry-run / verification 顺序
