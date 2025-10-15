# Branded Stablecoin — 产品开发文档

## 0. 概述

**目标**：为任意品牌提供“一键发行美元稳定币”的 DApp。
**机制**：用户存入 **USDC**，同笔交易由金库合约存入 **Aave V3**（赚息），并按 **1:1** 铸造品牌稳定币（如 `ACMEUSD`）。**利息归品牌**，**本金归用户**。
**技术栈**：ERC-20、ERC-4626（变体）、Aave V3、EIP-1167 Clone、可选多签/时锁。

---

## 1. 目标与非目标

* 目标

  * 品牌零门槛发行稳定币；用户随时 1:1 赎回 USDC。
  * 利息自动累计给品牌金库，可随时提取。
  * 单笔 TX 完成“存入→Aave→铸币”与“销毁→提回 USDC”。
  * Token 合约内置 **ERC-5169** 以支持未来脚本化扩展。
  
* 非目标

  * 不做收益分配给用户。
  * 不做跨品牌结算与积分互兑。
  * 不内置法币出入金（可由品牌侧对接）。

---

## 2. 角色与权限

* **User**：存入/赎回，持有品牌稳定币。
* **BrandOwner**：品牌金库与代币管理员；设置收益地址、更新权益元数据、提息。
* **Guardian**（可选）：紧急暂停、限额。
* **ProtocolAdmin**：仅限工厂合约层面的创建与上限参数；不触碰资金。

---

## 3. 用户体验（UX）

### 3.1 品牌端

* 创建品牌：名称、符号、Logo、**treasury** 收益地址、TVL 上限（cap）。
* 管理 **Benefits**：折扣与权益配置（见 §7.3）。
* 一键提取利息；查看累计利息与历史。

### 3.2 用户端（无 APY）

* 存入：选择品牌 → 输入 USDC → “存入并铸造品牌稳定币”（单笔 TX）。
* 资产页：只显示**余额**与“**1:1 可赎回 USDC**”说明。
* **权益（Benefits）列表**：例如官网 8 折、合作方 9 折、线下 VIP、优先购。
* 赎回：销毁品牌币 → 1:1 取回 USDC。
* 无任何 APY/利率/预计年化展示。

---

## 4. 架构与合约

### 4.1 组件

* **Factory**（EIP-1167）

  * 一次性部署每个品牌的 `BrandVault` + `BrandToken`。
  * 记录品牌信息与上限参数；可收创建费（可选）。
* **BrandVault**（ERC-4626 变体 + Aave 接入）

  * 托管 aUSDC，维护本金会计，提取利息。
  * 只对用户本金铸/销 `BrandToken`。
* **BrandToken**（ERC-20 + **ERC-5169** + ERC-165）

  * 6 位小数；仅 `BrandVault` 可铸/销。
  * `scriptURI()/setScriptURI()` + `ScriptUpdate` 事件，便于后续脚本化用例（如前端动态逻辑、钱包侧脚本）。

### 4.2 会计模型（核心不变式）

* `totalPrincipal`（USDC）：所有用户本金之和。
* `aBalance()`（USDC）：合约持有 aUSDC 折算值。
* `availableYield = max(aBalance() − totalPrincipal, 0)`。
* **不把利息计入用户份额**；用户仅享有 1:1 赎回权。

### 4.3 算法流程

* `deposit(amount)`

  1. 收 USDC → `AavePool.deposit(USDC, amount, this, 0)`
  2. `totalPrincipal += amount`
  3. 铸造 `BrandToken = amount` 给用户
* `redeem(amount)`

  1. 销毁 `BrandToken = amount`
  2. `AavePool.withdraw(USDC, amount, user)`
  3. `totalPrincipal -= amount`
  4. 断言 `out >= amount`，低于 1:1 回滚
* `harvestYield()`（BrandOwner）

  1. 计算 `availableYield`
  2. `AavePool.withdraw(USDC, availableYield, treasury)`

### 4.4 权限与安全

* `setTreasury` 仅 BrandOwner。
* `pause/unpause`（可选 Guardian）。
* `setCap` 设置最大 TVL。
* ReentrancyGuard；CEI 模式；事件齐全。
* 建议 BrandOwner 与 Guardian 用多签+时锁。

### 4.5 升级策略

* Vault 与 Token 默认**不可升级**。如需升级，走“新库迁移”脚本与前端迁移向导。
* Factory 可升级但不影响已部署金库。

---

## 5. 前后端与元数据

### 5.1 前端

* 技术：Next.js + Wagmi + Viem；WalletConnect。
* 资产页：余额、1:1 文案、赎回入口。
* **权益列表**：卡片式显示 `title/summary/discount/value/termsURL/有效期`，按钮跳品牌落地页。
* 无 APY/年化字段与图标。

### 5.2 合约元数据

* `BrandVault.setMetadataURI(string benefitURI)`（仅 BrandOwner）
* 事件：`MetadataUpdated(benefitURI)`
* 前端读取 `benefitURI`（IPFS/HTTPS，JSON），失败时兜底“当前无可用权益”。

### 5.3 Benefits JSON（示例）

```json
{
  "version": 1,
  "brand": "ACME",
  "benefits": [
    {
      "title": "官网 8 折",
      "summary": "使用 ACMEUSD 结算",
      "discountType": "percent",
      "discountValue": 20,
      "channels": ["online"],
      "eligibility": {"minHold": "100.0"},
      "validFrom": "2025-10-01T00:00:00Z",
      "validTo": "2026-10-01T00:00:00Z",
      "redeemHow": "在结算页选择加密货币支付，选择 ACMEUSD",
      "termsURL": "https://acme.com/terms"
    }
  ]
}
```

---

## 6. 外部集成

* **Aave V3**：`IPool.deposit/withdraw`；aUSDC 余额用于 `aBalance()` 计算。
* **USDC**：6 位小数；严格使用安全转账库。

---

## 7. 经济与费用

* 用户：不收协议费，承担 gas。
* 品牌：可选一次性创建费；提息不抽成（默认 0%）。
* 协议：可选平台抽成开关（默认关闭）。

---

## 8. 风险与防护

* **协议风险**：Aave 异常致 `aBalance < totalPrincipal` → 禁止提息，提示只允许赎回。
* **流动性挤兑**：允许开启异步赎回队列（可选），或分笔上限。
* **舍入与精度**：全部按 6 位小数；边界向用户有利取整。
* **权限滥用**：最小权限 + 多签 + 时锁 + 事件审计。
* **合规**：品牌侧负责营销与权益合规；可选白名单/KYC。

---

## 9. 接口概览（合约）

### 9.1 BrandVault

* `deposit(uint256 amount)`
* `redeem(uint256 amount)`
* `harvestYield()`
* `aBalance() view returns (uint256)`
* `availableYield() view returns (uint256)`
* `setTreasury(address)`
* `setMetadataURI(string)`
* `pause()/unpause()`
* 事件：`Deposited(user, amount)`、`Redeemed(user, amount)`、`Harvested(to, amount)`、`MetadataUpdated(uri)`

### 9.2 BrandToken（含 ERC-5169）

* `scriptURI() view returns (string[] memory)`
* `setScriptURI(string[] calldata)`（owner）
* 事件：`ScriptUpdate(string[] newScriptURI)`
* ERC-20 常规接口；`supportsInterface(bytes4)` 暴露 5169/165。

### 9.3 Factory

* `createBrand(name, symbol, treasury, cap) returns (vault, token)`
* `getBrands() view`

---

## 10. 验收标准（QA）

* 功能

  * 存入→Aave→铸币与赎回→退回 USDC 单笔路径稳定；1:1 不破。
  * 提息只动 `availableYield`，不得侵本金。
  * `aBalance − totalPrincipal >= 0` 恒为真；为负时 `harvest` 失败。
* UI

  * 全站无 **APY/年化/收益率** 字样。
  * 资产页显示余额与 1:1 文案；权益列表加载成功或给出兜底。
* 安全

  * 重入用例通过；事件完整；权限白盒测试通过。
* 运营

  * 品牌更新 `benefitURI` 后，前端刷新即刻生效；缓存不超过 10 分钟。

---

## 11. 测试计划

* 单元：会计不变式、极值赎回、提息边界、舍入、权限。
* 产权：多用户并发存取与交错顺序。
* 集成：Aave fork 上跑全链路。
* 属性测试：随机存取序列下 `availableYield >= 0`。
* 前端：无 APY 关键字快照测试；权益 JSON 异常与过期状态。

---

## 12. 监控与指标

* 品牌：TVL、累计利息、提息频率、近 7 日净流入。
* 用户：活跃数、赎回率、平均单笔。
* 风险：`aBalance < totalPrincipal` 告警；失败交易率；鲸鱼赎回提示。

---

## 13. 时间线（示例）

* T+3 周：单品牌 MVP（存取、提息、无 APY UI、权益渲染）。
* T+6 周：Factory 多品牌、创建向导。
* T+8 周：风控开关、cap、pause；可选异步赎回。
* T+10 周：指标与告警面板。
* T+12 周：审计与主网上线。

---

## 14. 未来拓展（依赖 ERC-5169）

* Token 侧脚本化：钱包/前端加载脚本，做动态贴纸、品牌任务、结算规则提示。
* 合作伙伴自动识别：基于脚本的域名白名单与跳转。
* 多链化与 L2 扩容；跨链消息同步权益元数据。
