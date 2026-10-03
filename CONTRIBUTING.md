# 贡献指南

感谢关注 Ultralearning OS！这是一个本地优先的学习项目管理工具，欢迎 Issue 与 PR。

## 开发环境

要求：Node.js 20+、pnpm 12。

```bash
pnpm install
pnpm db:setup   # 应用迁移 + 写入演示数据
pnpm dev        # http://localhost:3000
```

> 国内网络如遇 prisma 引擎下载失败，在项目根目录创建 `.env`：
> `PRISMA_ENGINES_MIRROR=https://registry.npmmirror.com/-/binary/prisma/` 和
> `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1`（已在 gitignore，不会入库）。

## 常用命令

```bash
pnpm lint          # ESLint
pnpm test          # Vitest 单元测试
pnpm build         # 生产构建（含类型检查）
pnpm test:e2e      # Playwright E2E（先 pnpm build，跑生产服务器）
pnpm db:migrate    # 开发期迁移（改 schema 后）
```

## 提交规范

- Conventional Commits：`feat:` / `fix:` / `docs:` / `chore:` / `ci:`，中文描述即可
- 一个 PR 聚焦一件事；提交前确保 lint、单测、build 全绿

## 代码约定

- **文案**：UI 文案一律走 `messages/zh-CN.ts` + `t()`，不要散落硬编码；领域标签集中在 `lib/domain.ts`
- **枚举**：SQLite 下 Prisma 不支持 enum，统一 `String` + `lib/validators/` 的 Zod schema 校验
- **纯函数优先**：算法/推导/统计放 `lib/`（可单测），组件只做展示与交互
- **写操作**：一律 Server Action（`server/actions/`），Zod 校验 + `revalidatePath`，返回 `ActionResult`
- **DB 页面**：加 `export const dynamic = "force-dynamic"`
- **原则映射**：新功能请注明对应《Ultralearning》九原则中的哪一条（只用原则名称与概念，**不要引用原书文本**）

## 测试

- 改 `lib/` 纯函数请补/更新对应单测（`tests/unit/`）
- 影响 主链路（创建→练习→复习→复盘）的改动请跑 `pnpm test:e2e`

## License

提交即表示同意以 [MIT](LICENSE) 许可发布你的贡献。
