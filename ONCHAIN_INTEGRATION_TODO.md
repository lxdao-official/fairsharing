# FairSharing 前端 & 合约联调 TODO 列表

本文档用于指导后续将 Foundry 合约与 Next.js/TRPC/Prisma 前端逐步打通，按阶段推进。  
当前版本只描述目标与实施步骤，不包含具体代码改动。

---

## 阶段 0：总体目标与约束

- [x] 目标一：在链上通过 `ProjectFactory` 创建 `Project` 实例，并与数据库中的项目记录建立映射。
- [ ] 目标二：贡献在 off-chain 投票通过后，由「前端」使用用户自己的钱包自动调用链上 `Project.submitContribution` 上链。
- [x] 约束一：链下（数据库）仍然是业务状态的主来源，链上记录作为最终可信凭证。
- [x] 约束二：合约逻辑尽量保持独立、通用；前端/后端负责适配业务与权限。

---

## 阶段 1：基础准备与环境配置

**目标：能够同时起动 Foundry 合约环境与前端应用，为后续联调做好基础设施准备。**

- [ ] 合约环境
  - [ ] 优先确定联调网络：推荐从本地 `anvil` 开始，再切到目标测试网（如 Sepolia）。
  - [ ] 在 `contracts/` 下执行 `forge build && forge test`，记录依赖安装步骤。
  - [ ] 在 README 或单独文档中写明：
    - [ ] 如何启动 `anvil`（命令、默认链 ID、预置账户/私钥）。
    - [ ] 如何配置远程测试网 RPC、部署账户私钥等敏感信息。

- [ ] 前端环境
  - [ ] 在 `frontend/` 下执行 `npm install`，记录 Node 版本范围（避免因版本差异导致的 Vite/Next 报错）。
  - [ ] 配置数据库与 Prisma：确保能顺利运行 `npm run db:push`、`npm run db:seed`。
  - [ ] 准备 `.env.local`，至少包含：
    - [ ] `DATABASE_URL`
    - [ ] `JWT_SECRET`
    - [ ] `NEXT_PUBLIC_CHAIN_ID`
    - [ ] `NEXT_PUBLIC_RPC_URL`
    - [ ] 占位的链上合约地址（阶段 2 完成后再填充）。
  - [ ] 起动前端开发服务器：`npm run dev`（默认端口 3100），记录常见故障排查方法（如 Prisma 连接失败、TRPC 报错等）。

---

## 阶段 2：合约部署与地址管理

**目标：在目标网络上部署必要合约，并将地址统一管理起来。**

- [ ] 部署顺序（可用 `forge script` 或手工命令）：
  - [ ] 部署 `SimpleMajorityValidationStrategy`，记录链 ID、部署账户、交易哈希。
  - [ ] 部署 `ProjectFactory`（构造函数内部会部署 `Project` 实现），同样记录所有元信息。
  - [ ] 在文档或脚本中描述如何重新部署 / 升级实现（包括 `setProjectImplementation` 流程）。

- [ ] 记录并管理以下地址：
  - [ ] 维护一个统一的地址清单（JSON、TS 常量或 `.env.example`）：
    - [ ] `SimpleMajorityValidationStrategy` 合约地址。
    - [ ] `ProjectFactory` 合约地址。
    - [ ] 任何后续会被前端/后端引用的辅助合约地址。
  - [ ] 将地址与对应的网络、部署时间、部署人建立映射，方便排查。

- [ ] 为前端准备 env：
  - [ ] 在 `.env.local` 中添加：
    - [ ] `NEXT_PUBLIC_PROJECT_FACTORY_ADDRESS=<ProjectFactory 地址>`
    - [ ] `NEXT_PUBLIC_SIMPLE_VALIDATION_STRATEGY_ADDRESS=<SimpleMajorityValidationStrategy 地址>`
    - [ ] 如果未来增加更多策略 / 合约，同步扩展 env 变量。

---

## 阶段 3：跨层 ID 映射设计（Project & Contribution）

**目标：统一链下 CUID 与链上 `bytes32` ID 的映射规则。**

- [ ] 项目 ID 映射：
  - [x] 约定：`projectIdBytes32 = keccak256(utf8(project.id))`。
  - [x] 后续所有与链上交互使用 `projectIdBytes32`。

- [x] 贡献 ID 映射：
  - [x] 约定：`contributionIdBytes32 = keccak256(utf8(contribution.id))`。
  - [x] 在 Prisma schema 中新增 `Contribution.contributionIdBytes32` 字段，并在 create/update 时填充。
  - [x] 在 TRPC 层暴露一个 helper（或复用 util）专门负责 ID → bytes32 的转换，避免散落在各处。
  - [x] 链上 `submitContribution`、typed data 构造、payload 构建都使用该 `bytes32`。

- [ ] 数据库字段规划（后续实现时使用）：
  - [x] 在 `project` 表增加：
    - [x] `projectIdBytes32`：存储对应的 `bytes32`（以 0x 前缀 hex 字符串形式）。
    - [x] `onChainAddress`：对应链上 `Project` 代理地址。
- [x] 在 `contribution` 表增加：
    - [x] `contributionIdBytes32`：对应链上 `bytes32`。
    - [x] `onChainTxHash`：记录上链交易哈希（可选，用于前端展示和链上追踪）。

- [ ] 在文档中明确：任何需要 `projectId`/`contributionId` 的链上调用，一律使用映射后的 `bytes32` 值。

---

## 阶段 4：EIP-712 签名域与类型对齐（合约 & 后端 & 前端）

**目标：确保前端签名 / 后端验签 / 合约验签使用完全一致的 EIP-712 域与结构。**

- [x] 合约端（`SimpleMajorityValidationStrategy`）现有定义复盘：
  - [x] DOMAIN：
    - [x] `name = "Fairsharing Vote"`
    - [x] `version = "1"`
    - [x] `chainId = block.chainid`
    - [x] `verifyingContract = Project` 合约地址
  - [x] 类型：
    - [x] `Vote(bytes32 projectId, bytes32 contributionId, address voter, uint8 choice, uint256 nonce)`

- [x] 前端/后端 env 约定：
  - [x] `NEXT_PUBLIC_VOTE_DOMAIN_NAME="Fairsharing Vote"`
  - [x] `NEXT_PUBLIC_VOTE_DOMAIN_VERSION="1"`
  - [x] `NEXT_PUBLIC_CHAIN_ID=<与部署网络一致>`（需要与 `anvil` / 测试网保持同步，否则签名失效）
  - [x] `NEXT_PUBLIC_VOTE_CONTRACT_ADDRESS` 将从原先的固定 0 地址切换为实际 Project 合约地址，因此需在 typed data 构造时动态覆盖。

- [x] `vote-signature.ts` 规划变更（后续实现）：
  - [x] 将 typed data 域中的 `verifyingContract` 改为「项目对应的 `Project` 合约地址」，而非固定的 0 地址。
  - [x] 将 `projectId`、`contributionId` 的语义调整为 `bytes32`（0x hex 字符串），与合约结构一致。
  - [x] 保证 `buildVoteTypedData` / `hashVoteTypedData` / `recoverVoteSigner` 使用与合约相同的类型和域。

- [x] `voteRouter.prepareTypedData` 规划：
  - [x] 根据 `contributionId` 查到对应 `project`。
  - [x] 读取：
    - [x] `project.onChainAddress` 作为 `verifyingContract`；若缺失应返回错误提示管理员补充链上信息。
    - [x] `project.projectIdBytes32` 作为 `projectId`。
    - [x] `contribution.contributionIdBytes32` 作为 `contributionId`（字段落地前可暂时 runtime 计算）。
  - [x] 使用这些信息构造 EIP-712 typed data 返回给前端，并在响应体里携带 `verifyingContract` 与 bytes32 ID，便于前端调试。

---

## 阶段 5：项目创建打通 ProjectFactory（前端用用户钱包调用）

**目标：用户在前端创建项目时，用自己的钱包直接调用链上 `ProjectFactory.createProject`，并在后端记录链上地址。**

> 本阶段明确采用「前端创建」方案：  
> 前端通过 `wagmi/viem` 使用用户钱包调用 `ProjectFactory`，TRPC 只负责数据库层的记录与映射。

- [ ] 前端调用规划（`CreateProjectPage`）：
  - [x] 用户在 UI 中填写项目表单。
  - [x] 表单校验通过后：
    - [x] 使用当前连接钱包地址作为 `projectOwner`。
    - [x] 使用 `wagmi`/`viem` 构造 `CreateProjectParams`：
      - [x] `projectId`：使用阶段 3 约定的 `projectIdBytes32`。
      - [x] `projectOwner`：当前钱包地址。
      - [x] `name`、`metadataUri`：从表单映射。
      - [x] `validateModel` / `contributionModel`：根据业务需求映射到合约 enum。
      - [x] `validationStrategy`：使用部署好的 `SimpleMajorityValidationStrategy` 地址。
      - [x] `admins` / `members` / `voters`：根据表单成员信息和验证策略生成。
    - [x] 调用 `ProjectFactory.createProject(params)`：
      - [x] 等待交易确认。
      - [x] 从事件或返回值中获取 `Project` 代理地址。

- [ ] 后端/数据库记录规划：
  - [x] 前端在链上交易确认后，调用 TRPC `project.create` 或新的 `project.createFromOnChain`：
    - [x] 传入：
      - [x] 项目基础信息（与现有表单一致）。
      - [x] `projectIdBytes32`。
      - [x] 链上 `Project` 代理地址 `onChainAddress`。
    - [x] 后端在 DB 中创建 `project` 记录并保存这些字段。
  - [x] 确保项目详情页 / 列表接口可以返回 `onChainAddress` 和 `projectIdBytes32`，供后续投票与上链使用。

---

## 阶段 6：投票流程保持后端为真相源

**目标：维持现有 TRPC/Prisma 投票逻辑，只在其结果基础上触发链上操作。**

- [x] 保持现有逻辑：
  - [x] `voteRouter.prepareTypedData`：生成 EIP-712 typed data（未来改成 bytes32 版）。
  - [x] `voteRouter.create`：
    - [x] 验签并写入 `vote` 表。
    - [x] 调用 `applyVotingStrategy`：
      - [x] 统计票数与角色。
      - [x] 执行策略（简单多数或其他）。
      - [x] 更新 `contribution.status`：`VALIDATING` → `PASSED/FAILED`。

- [x] 规划小改动：
  - [x] `vote.create` 的返回值中增加最新的 `contributionStatus`、是否刚刚从 `VALIDATING` 变为 `PASSED`，以便前端立即提示“准备上链”。
  - [x] `vote.prepareTypedData` 在 `project.onChainAddress` 缺失时返回明确错误，引导在项目设置里补充链上部署信息。

---

## 阶段 7：贡献上链流程（前端自动触发）

**目标：当贡献状态更新为 `PASSED` 且尚未上链时，由前端自动使用当前用户钱包调用链上 `submitContribution`。**

- [ ] 状态驱动而非「最后一票」标志：
  - [ ] `vote.create` 返回体带上最新 `contributionStatus`，前端据此判断是否需要刷新详情。
  - [ ] 前端在 `ContributionCard` / 详情页监听 `status` 变化：
    - [ ] `status === 'VALIDATING'` → 不提示。
    - [ ] `status === 'FAILED'` → 展示失败原因。
    - [ ] `status === 'PASSED'` 且 `onChainPublishedAt` 为空 → 弹出“发布上链”提示框（可由项目 Owner / Admin 点击执行）。
  - [ ] 引入“待上链”队列：即使页面刷新，也能在 `PASSED` 状态下重新提示。

- [x] 构建链上调用 payload（基于现有 `publishContributionOnChain` 设计）：
  - [x] 将 `publishContributionOnChain` 拆分为：
    - [x] `contribution.buildOnChainPayload`：仅生成 payload，返回给前端；不写库。
    - [x] `contribution.commitOnChainPayload`：在链上交易确认后写库（见下节）。
  - [x] `buildOnChainPayload` 输出：
    - [x] `projectOnChainAddress`
    - [x] `projectIdBytes32`
    - [x] `contributionIdBytes32`
    - [x] `contributionHash`
    - [x] `votes`（`IValidationStrategy.VoteData[]`）
    - [x] `strategyData`（占位 `0x`）
    - [x] `rawContributionJson`
  - [x] 为避免用户重复上链，可增加一个 `payloadDigest`（hash），后续 `commit` 时校验一致性。

- [ ] 前端发起链上交易：
  - [ ] 使用钱包（`wagmi`/`viem`）调用 `Project.submitContribution`，参数来自 payload。
  - [ ] 等待交易确认（或至少拿到 `txHash`）。
  - [ ] 成功后调用后端 `commitOnChainPayload`，传入 `contributionId`、`txHash`、`payloadDigest`。

- [x] 回写数据库状态：
  - [x] `commitOnChainPayload` / `contribution.markOnChain`：
    - [x] 校验当前 `status === 'PASSED'` 且 `onChainPublishedAt` 为空。
    - [x] 写入 `status = 'ON_CHAIN'`、`onChainTxHash = txHash`、`onChainPayload`、`onChainPublishedAt = now()`。
    - [x] 若已是 `ON_CHAIN`，返回已有 `txHash`，保持幂等。

- [ ] 并发与幂等性考虑：
  - [x] `buildOnChainPayload` 不修改状态，可随时调用。
  - [x] `commitOnChainPayload` 通过数据库事务确保只有首个成功的交易能推进状态，其余请求会拿到已存在的 `txHash`。
  - [ ] 前端在等待交易期间可显示“正在上链”状态，避免重复点击。

---

## 阶段 8：权限模型对齐（可后置）

**目标：让链上 `isVoter` / `validateModel` 与链下 `MemberRole` 权限模型尽可能一致。**

- [ ] 链下权限（现有）：
  - [ ] `ProjectMember` + `MemberRole` 控制谁是 `ADMIN` / `VALIDATOR` / `CONTRIBUTOR`。
  - [ ] `voteRouter.checkVotingPermissions` 已根据 `ProjectValidateType` 做权限过滤。

- [ ] 链上权限（合约）：
  - [ ] `SimpleMajorityValidationStrategy` 在 `validateModel == VALIDATOR` 时调用：
    - [ ] `IProjectRoles(project).isVoter(signer)`。

- [ ] 同步方案（未来迭代）：
  - [ ] 项目创建时，将 validators 列表写入 `Project` 合约。
  - [ ] 若链下成员/角色发生变更，视需要在合约中同步（可以通过专用管理交易完成）。

---

## 阶段 9：测试用例与手工验证路径

**目标：在真正实现改动前，先设计好联调时的测试场景和手工验证步骤。**

- [ ] 用例 1：项目创建联调
  - [ ] 步骤：
    - [ ] 连接钱包 → 在前端通过 `Create My Pie` 提交表单。
    - [ ] 前端调用 `ProjectFactory.createProject`，用户用自己钱包签名交易。
    - [ ] 交易确认后，调用 TRPC 创建 DB 项目记录并保存 `onChainAddress`、`projectIdBytes32`。
  - [ ] 验证：
    - [ ] Etherscan 或本地节点上看到 `ProjectCreated` 事件。
    - [ ] DB 中 project 记录包含正确的链上地址和 bytes32 ID。

- [ ] 用例 2：贡献投票 + 自动上链
  - [ ] 步骤：
    - [ ] 在某项目下创建贡献（DB 中为 `VALIDATING`）。
    - [ ] 多个 validator 在前端通过 EIP-712 签名投票。
    - [ ] 当策略判定状态为 `PASSED` 时，前端自动：
      - [ ] 获取上链 payload。
      - [ ] 使用当前钱包调用 `submitContribution`。
      - [ ] 交易确认后调用 `markOnChain`。
  - [ ] 验证：
    - [ ] 合约事件/状态反映该贡献已被记录。
    - [ ] DB 中 contribution 状态更新为 `ON_CHAIN`，并记录 txHash。

- [ ] 用例 3：签名域不一致检测
  - [ ] 故意配置错误的 `NEXT_PUBLIC_VOTE_DOMAIN_NAME` 或 `verifyingContract`：
    - [ ] 验证合约验签失败，交易被 revert。
    - [ ] 用于确认 EIP-712 域/类型一致性的必要性。

---

## 后续实施建议

实施时可以按阶段拆分 PR / Commit：

1. **优先**完成阶段 1–3（环境、部署、ID 映射），保证基本的合约与数据库模型准备齐全。
2. 然后实现阶段 4–5（EIP-712 对齐 + 前端创建项目打通 ProjectFactory）。
3. 随后实现阶段 6–7（保持后端为投票真相源，并由前端在 `PASSED` 状态自动上链）。
4. 最后根据需要补充阶段 8–9（权限对齐与系统性测试用例）。
