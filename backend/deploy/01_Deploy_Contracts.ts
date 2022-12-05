import { DeployFunction } from "hardhat-deploy/types";
import { network } from "hardhat";
import { verify } from "../utils/verify";

const deployFunction: DeployFunction = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const developmentChains: string[] = ["hardhat", "localhost"];
    const chainId: number | undefined = network.config.chainId;
    if (!chainId) return;

    const waitConfirmations: number = developmentChains.includes(network.name) ? 1 : 6;

    log("-----------------------------------------------------------");
    log("deploying......");

    const contract = await deploy("Safock", {
        from: deployer,
        log: true,
        args: [],
        waitConfirmations: waitConfirmations,
    });

    if (!developmentChains.includes(network.name)) {
        await verify(contract.address, []);
    }
};

export default deployFunction;
deployFunction.tags = ["all", "main"];
