import fs from 'fs'
import hre, { ethers } from 'hardhat'

import { getChainId, isValidContract } from '../../../common/blockchain-utils'
import { networkConfig } from '../../../common/configuration'
import { getDeploymentFile, getDeploymentFilename, IDeployments } from '../common'
import { validateImplementations } from '../utils'
import { Safock } from '../../../typechain'
import { ITokens } from '../../../common/configuration'

let safock: Safock

async function main() {
  // ==== Read Configuration ====
  const [burner] = await hre.ethers.getSigners()
  const chainId = await getChainId(hre)

  console.log(`Deploying Facade to network ${hre.network.name} (${chainId})
    with burner account: ${burner.address}`)

  if (!networkConfig[chainId]) {
    throw new Error(`Missing network configuration for ${hre.network.name}`)
  }

  const deploymentFilename = getDeploymentFilename(chainId)
  const deployments = <IDeployments>getDeploymentFile(deploymentFilename)

  await validateImplementations(deployments)


  // ******************** Deploy Safock ****************************************/

  const USDC = networkConfig[chainId].tokens.USDC!
  const USDT = networkConfig[chainId].tokens.USDT!
  const BUSD = networkConfig[chainId].tokens.BUSD!

  // Deploy Safock
  const SafockFactory = await ethers.getContractFactory('Safock')

  safock = <Safock>await SafockFactory.connect(burner).deploy(deployments.facadeRead, USDC, USDT, BUSD) // 
  await safock.deployed()

  // Write temporary deployments file
  deployments.safock = safock.address
  fs.writeFileSync(deploymentFilename, JSON.stringify(deployments, null, 2))

  console.log(`Deployed to ${hre.network.name} (${chainId})
    Safock:  ${safock.address}
    Deployment file: ${deploymentFilename}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
