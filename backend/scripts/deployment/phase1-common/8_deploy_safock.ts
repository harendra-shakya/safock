import fs from 'fs'
import hre, { ethers } from 'hardhat'

import { getChainId, isValidContract } from '../../../common/blockchain-utils'
import { networkConfig } from '../../../common/configuration'
import { getDeploymentFile, getDeploymentFilename, IDeployments } from '../common'
import { validateImplementations } from '../utils'
import { Safock } from '../../../typechain'

let safock: Safock

async function main() {
  // ==== Read Configuration ====
  const [burner] = await hre.ethers.getSigners()
  const chainId = await getChainId(hre)

  const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  const USDT = '0xdAC17F958D2ee523a2206206994597C13D831ec7'
  const BUSD = '0x4Fabb145d64652a948d72533023f6E7A623C7C53'

  console.log(`Deploying Facade to network ${hre.network.name} (${chainId})
    with burner account: ${burner.address}`)

  if (!networkConfig[chainId]) {
    throw new Error(`Missing network configuration for ${hre.network.name}`)
  }

  const deploymentFilename = getDeploymentFilename(chainId)
  const deployments = <IDeployments>getDeploymentFile(deploymentFilename)

  await validateImplementations(deployments)


  // ******************** Deploy Safock ****************************************/

  // Deploy Safock
  const SafockFactory = await ethers.getContractFactory('Safock')

  safock = <Safock>await SafockFactory.connect(burner).deploy(deployments.facadeRead, USDC, USDT, BUSD) // 
  await safock.deployed()

  // Write temporary deployments file
  fs.writeFileSync(deploymentFilename, JSON.stringify(deployments, null, 2))

  console.log(`Deployed to ${hre.network.name} (${chainId})
    Safock:  ${safock.address}
    Deployment file: ${deploymentFilename}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
