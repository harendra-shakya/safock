import hre from 'hardhat'
import fs from 'fs'

import { getChainId } from '../../../common/blockchain-utils'
import { developmentChains, networkConfig } from '../../../common/configuration'
import { getDeploymentFile, getDeploymentFilename, IDeployments } from '../../deployment/common'
import { ethers } from 'hardhat'
let deployments: IDeployments

async function main() {
  // ********** Read config **********
  const chainId = await getChainId(hre)
  if (!networkConfig[chainId]) {
    throw new Error(`Missing network configuration for ${hre.network.name}`)
  }

  if (developmentChains.includes(hre.network.name)) {
    throw new Error(`Cannot verify contracts for development chain ${hre.network.name}`)
  }

  deployments = <IDeployments>getDeploymentFile(getDeploymentFilename(chainId))

  const abiPath = ".frontend/src/abis/"

  const safock = await ethers.getContractAt("Safock", deployments.safock)

  let _interface = safock.interface.format(ethers.utils.FormatTypes.json)
  fs.writeFileSync(abiPath + "safock.json", _interface)

}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
