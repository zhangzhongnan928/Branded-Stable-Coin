# Branded Stable Coin – Contracts & DApp (Base Sepolia)

A minimal end-to-end implementation of the "Branded Stablecoin" MVP:
- Users deposit USDC → supplied to Aave V3 → mint brand token 1:1
- Users redeem brand token 1:1 for USDC
- Brand can harvest yield (surplus over principal) to its treasury

This repo contains:
- Solidity contracts (Foundry)
- Next.js DApp with Wagmi/Viem (Base Sepolia)

## Prerequisites
- Node 20+ and pnpm (Corepack): `corepack enable && corepack prepare pnpm@latest --activate`
- Wallet (MetaMask) on Base Sepolia (chainId 84532)
- Foundry (optional, for contracts): `curl -sSfL https://foundry.paradigm.xyz | bash` then `foundryup`

## Deployed contracts (Base Sepolia)
- Factory: `0x5ED49796e59007E6b3360d85C3049e353743B0B8`
- USDC: `0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f`
- Aave IPool: `0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27`
- aUSDC: `0x10F1A9D11CDf50041f3f8cB7191CBE2f31750ACC`

Note: Vaults are created per-brand using the Factory.

## Concept & Benefits
- Brands/creators can launch their own branded stablecoins that fans/users can mint 1:1 with USDC.
- Branded stablecoins can be programmed with entitlements/benefits (exclusive content, product discounts, partner perks, early access, etc.).
- Users/fans enjoy these benefits in addition to holding a stable, redeemable asset.
- Brands/creators deepen engagement while earning on-chain yield from the pooled principal supplied to Aave.

Future considerations:
- Configurable yield sharing with users/fans/partners.
- Richer on-chain/off-chain benefit gating and integrations.

## Web app – local run
1) Create env file

Create `web/.env.local`:

```
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_FACTORY_ADDRESS=0x5ED49796e59007E6b3360d85C3049e353743B0B8
NEXT_PUBLIC_USDC_ADDRESS=0xba50Cd2A20f6DA35D788639E581bca8d0B5d4D5f
NEXT_PUBLIC_AUSDC_ADDRESS=0x10F1A9D11CDf50041f3f8cB7191CBE2f31750ACC
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
```

2) Install & start

```
cd web
pnpm install
pnpm dev -p 3001
```
Open http://localhost:3001 and connect your wallet (Base Sepolia).

## Using the DApp
### Brand (owner)
- Create Brand: fill Name, Symbol, Treasury, Cap
  - Cap is in human USDC (UI scales to 6 decimals). Example: `1000.0`
- Set aToken: set the vault’s aToken to aUSDC (`0x10F1...0ACC`)
- Update Cap: adjust cap if deposits hit the limit
- Harvest Yield: enabled when Available Yield > 0

### User
- Deposit + Mint: approve USDC then deposit the amount (USDC has 6 decimals, UI scales)
- Redeem: burn brand token to receive USDC 1:1

### Available Yield
- Computed as `max(aTokenBalance − totalPrincipal, 0)`
- After setting aToken on the vault, yield updates as aUSDC increases

## Common errors
- `CAP`: your deposit exceeds `cap`. Increase cap via Set Cap.
- `NO_YIELD`: harvest attempted when `availableYield == 0`. Wait until aUSDC > principal.
- Wallet conflicts: disable other wallet extensions if MetaMask errors during provider injection.
- Port in use: run the app with `-p 3001` or kill the process on 3000/3001.

## Contracts – develop & test
```
forge test -vvv
```
Deploy Factory (script uses Base Sepolia addresses above):
```
export PRIVATE_KEY=0x<your_key>
forge script script/DeployFactory.s.sol:DeployFactory \
  --rpc-url https://sepolia.base.org \
  --chain-id 84532 \
  --broadcast
```

## Security & notes
- This is an MVP; no upgradeability for vault/token; use at your own risk
- Aave integration uses V3 `supply()` and `withdraw()`
- USDC/aUSDC decimals: 6

## License
MIT
