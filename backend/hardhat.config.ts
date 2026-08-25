import 'tsconfig-paths/register'
import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-etherscan'
import '@nomiclabs/hardhat-waffle'
import '@openzeppelin/hardhat-upgrades'
import '@typechain/hardhat'
import 'hardhat-contract-sizer'
import 'hardhat-gas-reporter'
import 'solidity-coverage'

import { useEnv } from '#/utils/env'
import { HardhatUserConfig } from 'hardhat/types'
import forkBlockNumber from '#/test/integration/fork-block-numbers'

require('#/tasks')

const MAINNET_RPC_URL = useEnv(['MAINNET_RPC_URL', 'ALCHEMY_MAINNET_RPC_URL'])
const SEPOLIA_RPC_URL = useEnv('SEPOLIA_RPC_URL')
const MNEMONIC = useEnv('MNEMONIC') ?? 'test test test test test test test test test test test junk'
const TIMEOUT = useEnv('SLOW') ? 3_000_000 : 300_000
const src_dir = `./contracts/${useEnv('PROTO')}`
const settings = useEnv('NO_OPT') ? {} : { optimizer: { enabled: true, runs: 200 } }

const optionalNetworks = {
  ...(SEPOLIA_RPC_URL
    ? {
        sepolia: {
          chainId: 11155111,
          url: SEPOLIA_RPC_URL,
          accounts: { mnemonic: MNEMONIC },
        },
      }
    : {}),
  ...(MAINNET_RPC_URL
    ? {
        mainnet: {
          chainId: 1,
          url: MAINNET_RPC_URL,
          accounts: { mnemonic: MNEMONIC },
        },
      }
    : {}),
}

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      ...(MAINNET_RPC_URL
        ? {
            forking: {
              url: MAINNET_RPC_URL,
              blockNumber: Number(useEnv('MAINNET_BLOCK', forkBlockNumber['default'].toString())),
            },
          }
        : {}),
      gas: 0x1ffffffff,
      blockGasLimit: 0x1fffffffffffff,
      allowUnlimitedContractSize: true,
    },
    localhost: {
      chainId: 31337,
      url: 'http://localhost:8545',
      gas: 0x1ffffffff,
      blockGasLimit: 0x1fffffffffffff,
      allowUnlimitedContractSize: true,
    },
    ...optionalNetworks,
  },
  solidity: {
    compilers: [
      { version: '0.8.9', settings },
      { version: '0.6.12' },
      { version: '0.4.24' },
    ],
  },
  paths: { sources: src_dir },
  mocha: { timeout: TIMEOUT, slow: 1000 },
  contractSizer: {
    alphaSort: false,
    disambiguatePaths: false,
    runOnCompile: false,
    strict: false,
    only: [],
    except: ['Extension'],
  },
  gasReporter: { enabled: !!useEnv('REPORT_GAS') },
  etherscan: { apiKey: useEnv('ETHERSCAN_API_KEY') || '' },
}

if (useEnv('ONLY_FAST')) {
  config.mocha!.grep = '/#fast/'
  config.mocha!.slow = 200
  config.gasReporter!.enabled = false
}

if (useEnv('JOBS')) {
  config.mocha!.parallel = true
  config.mocha!.jobs = Number(useEnv('JOBS'))
}

export default config
