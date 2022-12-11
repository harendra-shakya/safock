## Deployment Overview

The deployment process consists of three high-level commands:

1. Deploy everything:

```
hardhat run scripts/deploy.ts --network {NETWORK}
OR
yarn deploy --network {NETWORK}
```

If anything _does_ go wrong, the easiest thing to do is comment out the sub-scripts in `deploy.ts` in order to pick up execution at another point.

2. Confirm the deployment:

```
hardhat run scripts/confirm.ts --network {NETWORK}
OR
yarn confirm --network {NETWORK}
```

3. Verify everything on Etherscan:

```
hardhat run scripts/verify_etherscan.ts --network {NETWORK}
OR
yarn verify_etherscan --network {NETWORK}
```

The verification scripts are smart enough to only verify those that are unverified.

#

The assets addresses will be found in `scripts/addresses/{chainId}-assets-collateral.json`. Use them in frontend `src/views/deploy/plugins.ts`.
