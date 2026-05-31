# 阶段 6 收官定义：生产化与专业化

本文档定义 QuantPilot 在“阶段 6：生产化与专业化”收官时应达到的能力边界、完成标准、非目标和后续扩展前提。

## 目标

阶段 6 的目标不是把平台直接做成实盘商业产品，而是把前 1 到阶段 5 已经形成的业务闭环，推进成具备正式生产化基线的专业平台骨架。

收官时应满足以下判断：

- control-plane storage 不再只是一套研发态文件写入逻辑，而是具备 `file / db` adapter foundation、维护接口和恢复基线。
- 权限、workspace、tenant 和 session scope 已进入正式合同，而不是继续依赖 demo 常量和前端约定。
- monitoring、operations workbench 和 maintenance tooling 已能给出 observability posture、integrity posture 和 repair posture。
- README、架构文档、closeout 文档和阶段基线测试已经同步反映“当前主线 roadmap 已闭环”这一状态。

## 完成定义

### 1. Storage And Persistence Foundations

- control-plane storage 已具备 `file / db` adapter foundation。
- context/runtime 已可暴露当前 storage adapter metadata。
- 数据库化迁移不需要返工既有 repository contracts。

### 2. Access, Workspace And Tenant Foundations

- 用户账户已正式持久化 `role templates / access policy / effective permissions`。
- session 已稳定暴露 `tenant / workspace` 上下文。
- 新的 control-plane 写入会自动带上 scope metadata，为后续隔离和过滤提供正式边界。

### 3. Observability And Operations Posture

- `monitoring status` 已稳定输出 worker freshness、workflow retry posture、queue backlog posture。
- `operations workbench` 已聚合 observability summary，而不是只展示 incident 或 queue counts。
- runbook 和 operations summary 已能围绕 queue、workflow、worker freshness 给出真实运维信号。

### 4. Backup, Recovery And Maintenance

- control-plane 已支持 `backup export`。
- control-plane 已支持 `restore dry-run / restore apply`。
- integrity check 至少覆盖文件清单、对象/集合结构、缺失 id、重复 id、retry backlog 等基础完整性信号。
- maintenance repair 至少覆盖 workflow retry backlog release，并继续复用既有 audit / notification fanout。

### 5. Verification And Baseline Contracts

- 阶段 6 已有正式 closeout 文档，而不是只在 README 里提一句。
- 阶段 6 已有专项 baseline 测试，覆盖 account scope、observability、maintenance contracts。
- `npm run verify` 继续作为统一验收入口。
- 文档一致性脚本已把阶段 6 closeout 纳入校验范围。

## 明确非目标

以下内容不属于阶段 6 收官要求：

- 完整的多租户 SaaS 产品形态
- 真正的生产数据库迁移、分布式缓存和对象存储集群
- 完整的 SSO、组织管理、计费、订阅和商业化模型
- 真正的高可用部署、灾备演练平台和外部告警系统集成
- 无人值守实盘交易许可或生产级托管承诺

## 后续扩展前提

在阶段 6 收官后，如要继续进入更高阶的平台化或商业化扩展，应先满足以下条件：

1. 阶段 1 到阶段 6 的 baseline tests 与 `verify` 长期稳定通过。
2. control-plane 的 storage、maintenance、observability 和 workspace contracts 不再频繁返工。
3. 后续工作可以围绕商业化部署、真实基础设施和更高自治能力扩展，而不是重新补阶段 1 到阶段 6 的底层缺口。
4. 所有新的 agent、execution、risk 或 operations 扩展继续尊重既有 audit、approval、risk 和 maintenance 边界。

## 当前已达成的收官信号

截至当前仓库状态，以下信号已经出现：

- control-plane storage 已具备 `file / db` adapter foundation。
- access policy、role template、tenant 和 workspace 已进入正式持久化合同。
- monitoring 与 operations workbench 已输出 observability posture，而不是只停留在原始告警和列表。
- control-plane maintenance 已具备 backup、restore dry-run、integrity check 和 workflow retry repair。
- 阶段 1 到阶段 6 的 closeout 文档、README、架构说明和 baseline tests 已形成同一套路线图叙事。

## 收官后默认约束

阶段 6 收官后，默认应遵守以下约束：

- 不返工阶段 1 到阶段 5 已稳定的核心业务 contracts。
- 不绕开既有 risk、approval、audit、notification、maintenance 边界。
- 任何新的生产化扩展都应优先复用现有 storage、workspace、observability 和 maintenance contracts。

## 验证基线

阶段 6 收官时默认应通过以下检查：

1. `npm run verify`
2. 阶段 6 baseline tests
3. control-plane maintenance 的 backup / restore / integrity / repair contracts
4. README、`project-structure.md`、`stage-1-closeout.md`、`stage-2-closeout.md`、`stage-3-closeout.md`、`stage-4-closeout.md`、`stage-5-closeout.md` 和本 closeout 文档的一致性检查

阶段 6 收官后，如果新的提交破坏上述基线，应视为回归，而不是正常演进。
