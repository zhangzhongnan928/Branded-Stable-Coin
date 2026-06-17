# Minted — your coin, your community, their perks

**Minted** lets any creator or community launch their own dollar-backed coin in minutes.
Fans deposit USDC, get the brand coin **1:1**, and hold it to unlock the creator's perks
(token-gated Discord, discounts, drops, IRL/VIP access, partner deals). Fans can **redeem
1:1 for USDC anytime** — their principal is always theirs. The creator keeps the **yield**
the pooled deposits earn on Aave.

> Testnet demo on **Base Sepolia**. No real money. For feedback only — not financial advice.

```
USDC ──deposit──▶ BrandVault ──supply──▶ Aave V3        (fan gets $COIN 1:1)
$COIN ─redeem──▶ BrandVault ──withdraw─▶ USDC to fan    (principal, always 1:1)
                  yield (aBalance − principal) ──harvest──▶ creator treasury (− protocol fee)
```

## What's in here

- **Contracts (Foundry)** — `Factory` deploys per-brand `BrandVault` + `BrandToken`
  (ERC-20 + ERC-5169) clones (EIP-1167).
- **Web (Next.js 14 + wagmi/viem)** — a real product: landing, creator launch wizard,
  public brand page (mint/redeem + perks), and a creator dashboard.

### Contract design highlights

- **Auto-wired aToken.** The vault derives its aToken from Aave's canonical
  `getReserveData(USDC)` at creation (and via `rewireAToken()`), so accounting is correct
  immediately — no manual setup. The aToken is *only* ever sourced from the trusted Aave
  pool, never from caller input, so a brand owner cannot repoint accounting at a fake token.
- **Share = aTokens actually credited.** Aave's ray math can credit `amount − dust`; the
  vault mints shares equal to the real aToken delta, keeping `totalSupply == totalPrincipal
  ≤ aBalance` so every holder can always redeem 1:1 (verified against live Aave).
- **Protocol fee on yield only.** `harvestYield()` splits the surplus over principal as a
  protocol fee (default **5%**, hard-capped at 10%, read live from the Factory) + the
  remainder to the creator treasury. The fee can never touch principal.
- **Redeem is never pausable.** Pausing halts new mints + harvest; holders can always exit.
- **Brand profile on-chain** (`logoURI`, `description`, `benefitsURI`) so the frontend
  renders brand pages and perks with no off-chain infra. Perks are a JSON blob stored in
  `benefitsURI` and edited from the dashboard in one transaction.

## Verified Base Sepolia addresses (chainId 84532)

| | Address |
|---|---|
| Aave V3 Pool | `0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27` |
| Test USDC (Aave market) | `0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f` |
| aUSDC | `0x10F1A9D11CDf50041f3f8cB7191CBE2f31750ACC` |

The Factory is per-deployment — set its address in `web/.env.local` after deploying.

## Quickstart

### 1. Contracts

```bash
forge install            # pulls forge-std (git submodule)
forge test               # 27 unit/invariant/fuzz tests
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org forge test --match-contract BrandForkTest  # live-fork tests
```

Deploy the Factory (needs a funded deployer key + Base Sepolia ETH):

```bash
export PRIVATE_KEY=0x<your_key>
forge script script/DeployFactory.s.sol:DeployFactory \
  --rpc-url https://sepolia.base.org --chain-id 84532 --broadcast
# note the printed Factory address
```

### 2. Web

```bash
cd web
cp .env.example .env.local           # then set NEXT_PUBLIC_FACTORY_ADDRESS to the deployed Factory
pnpm install
pnpm dev                             # http://localhost:3000
```

If `NEXT_PUBLIC_FACTORY_ADDRESS` is unset, the explore page shows demo brand previews.

### 3. Seed demo brands (optional, so the demo isn't empty)

```bash
PRIVATE_KEY=0x<your_key> FACTORY=0x<factory_addr> node web/scripts/seed.mjs
```

Creates Vibe (`$VIBE`), PixelForge (`$FORGE`), and Cloud9 Coffee (`$CUP`) with full perks.

### Get testnet funds

- **Gas (Base Sepolia ETH):** https://portal.cdp.coinbase.com/products/faucet
- **Test USDC (must be the Aave market token):** https://app.aave.com/faucet/?marketName=proto_base_sepolia_v3

## Using the app

- **Creators** — `/launch`: name your coin, pick a color, set a cap and perks, deploy in one
  tx. Manage from `/dashboard`: harvest yield, edit perks, adjust cap, pause, change treasury.
- **Fans** — open a coin's page (`/b/<vault>`), mint with USDC, see which perks you've
  unlocked, redeem anytime. No APY/yield is ever shown to fans (it's the creator's).

## Security notes (demo)

- MVP, unaudited — do not use with real funds.
- Bank-run / Aave-insolvency: if `aBalance < totalPrincipal` the last redeemers could fail;
  the vault exposes `isSolvent()` / `solvencyDeficit()` and the UI surfaces it.
- Donations of aUSDC/USDC directly to a vault count as harvestable yield (they only ever
  *add* backing; principal redemption is unaffected). The protocol fee applies to them.
- Brand creation is permissionless; brand owners are untrusted relative to fans, which is
  why the aToken accounting can only ever be the canonical Aave aUSDC.

## License

MIT
