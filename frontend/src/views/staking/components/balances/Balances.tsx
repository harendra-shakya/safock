import { t, Trans } from "@lingui/macro";
import { useWeb3React } from "@web3-react/core";
import { Card } from "components";
import { LoadingButton } from "components/button";
import TokenBalance from "components/token-balance";
import { BigNumber } from "ethers/lib/ethers";
import useRToken from "hooks/useRToken";
import { atom, useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import {
    addTransactionAtom,
    pendingRSRSummaryAtom,
    rsrBalanceAtom,
    rsrExchangeRateAtom,
    rsrPriceAtom,
    rTokenAtom,
    stRsrBalanceAtom,
} from "state/atoms";
import { useTransaction } from "state/web3/hooks/useTransactions";
import { smallButton } from "theme";
import { Box, BoxProps, Divider, Grid, Text } from "theme-ui";
import { TRANSACTION_STATUS } from "utils/constants";
import { v4 as uuid } from "uuid";
import { Link } from "theme-ui";
import { ethers } from "ethers";
import { SAFOCK_ADDRESS } from "utils/addresses";
import { CHAIN_ID } from "utils/chains";
import safockAbi from "abis/safock.json";
const pendingRSRBalanceAtom = atom((get) => get(pendingRSRSummaryAtom).pendingAmount);

const PendingBalance = () => {
    const balance = useAtomValue(pendingRSRBalanceAtom);

    return (
        <Box p={4}>
            <Text variant="subtitle" mb={3}>
                <Trans>In Cooldown</Trans>
            </Text>
            <TokenBalance symbol="RSR" balance={balance} />
        </Box>
    );
};

// TODO: Create "Claim" component
const AvailableBalance = () => {
    const rToken = useRToken();
    const addTransaction = useSetAtom(addTransactionAtom);
    const { index, availableAmount } = useAtomValue(pendingRSRSummaryAtom);
    const [claiming, setClaiming] = useState("");
    const { account } = useWeb3React();
    const claimTx = useTransaction(claiming);

    const handleClaim = () => {
        const txId = uuid();
        setClaiming(txId);
        addTransaction([
            {
                id: txId,
                description: t`Withdraw RSR`,
                status: TRANSACTION_STATUS.PENDING,
                value: availableAmount,
                call: {
                    abi: "stRSR",
                    address: rToken?.stToken?.address ?? " ",
                    method: "withdraw",
                    args: [account, index.add(BigNumber.from(1))],
                },
            },
        ]);
    };

    useEffect(() => {
        if (
            claiming &&
            claimTx &&
            ![TRANSACTION_STATUS.SIGNING, TRANSACTION_STATUS.PENDING].includes(claimTx.status)
        ) {
            setClaiming("");
        }
    }, [claimTx, claiming]);

    return (
        <Box p={4}>
            <Text variant="subtitle" mb={3}>
                <Trans>Available</Trans>
            </Text>
            <TokenBalance symbol="RSR" balance={availableAmount} />
            <LoadingButton
                loading={!!claiming}
                disabled={!availableAmount}
                text={t`Withdraw`}
                onClick={handleClaim}
                sx={{ ...smallButton }}
                mt={3}
            />
        </Box>
    );
};

const StakeBalance = () => {
    const rToken = useRToken();
    const [stakedAmount, setStakedAmount] = useState("0");
    const [rTokenPerShare, setRTokenPerShare] = useState("0");
    const [shares, setShares] = useState("0");
    const [reward, setReward] = useState("0");
    const [totalStake, setTotalStake] = useState("0");
    const [totalShare, setTotalShare] = useState("0");

    const { account } = useWeb3React();

    useEffect(() => {
        updateUI();
    }, [account]);

    const updateUI = async () => {
        const { ethereum }: any = window;
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();

        const safock = new ethers.Contract(SAFOCK_ADDRESS[CHAIN_ID], safockAbi, signer);

        if (!(await safock.isStakingContractExists(rToken?.address))) return;

        setStakedAmount(ethers.utils.formatEther(await safock.stakeOf(account, rToken?.address)));
        setRTokenPerShare(
            ethers.utils.formatEther(await safock.getRTokenPerShare(rToken?.address))
        );
        setShares(ethers.utils.formatEther(await safock.sharesOf(account, rToken?.address)));
        setReward(ethers.utils.formatEther(await safock.rewardOf(account, rToken?.address)));
        setTotalStake(ethers.utils.formatEther(await safock.getTotalStakes(rToken?.address)));
        setTotalShare(ethers.utils.formatEther(await safock.getTotalShares(rToken?.address)));
    };

    return (
        <Box p={4}>
            <Text variant="title" mb={3}>
                <Trans>Staked Amount</Trans>
            </Text>
            <Text variant="subtitle" mb={3}>
                <Trans>
                    {stakedAmount} {rToken?.symbol} ETF
                </Trans>
            </Text>
            <Text variant="title" mb={3}>
                <Trans>ETFs Per STK Token</Trans>
            </Text>
            <Text variant="subtitle" mb={3}>
                <Trans>
                    {rTokenPerShare} {rToken?.symbol} ETF
                </Trans>
            </Text>{" "}
            <Text variant="title" mb={3}>
                <Trans>Your STK</Trans>
            </Text>
            <Text variant="subtitle" mb={3}>
                <Trans>{shares} STK</Trans>
            </Text>{" "}
            <Text variant="title" mb={3}>
                <Trans>Your Reward</Trans>
            </Text>
            <Text variant="subtitle" mb={3}>
                <Trans>
                    {reward} {rToken?.symbol} ETF
                </Trans>
            </Text>{" "}
            <Text variant="title" mb={3}>
                <Trans>Total Stake</Trans>
            </Text>
            <Text variant="subtitle" mb={3}>
                <Trans>
                    {totalStake} {rToken?.symbol} ETF
                </Trans>
            </Text>{" "}
            <Text variant="title" mb={3}>
                <Trans>Total STK</Trans>
            </Text>
            <Text variant="subtitle" mb={3}>
                <Trans>{totalShare} STK</Trans>
            </Text>{" "}
        </Box>
    );
};

const RSRBalance = () => {
    const balance = useAtomValue(rsrBalanceAtom);
    const rsrPrice = useAtomValue(rsrPriceAtom);

    return (
        <Box p={4}>
            {/* <Text variant="subtitle" mb={3}>
                <Trans>In Wallet</Trans>
            </Text>
            <TokenBalance symbol="RSR" balance={balance} />
            <TokenBalance
                logoSrc="/svgs/equals.svg"
                symbol="USD"
                usd
                balance={balance * rsrPrice}
                mt={2}
            /> */}
        </Box>
    );
};

/**
 * Display collateral tokens balances
 */
const Balances = (props: BoxProps) => (
    <Card p={0} {...props}>
        <StakeBalance />
        <Box
            sx={(theme: any) => ({
                borderLeft: ["none", `1px solid ${theme.colors.border}`],
                borderTop: [`1px solid ${theme.colors.border}`, "none"],
            })}
        >
            <RSRBalance />
            {/* <Divider m={0} /> */}
        </Box>
    </Card>
);

export default Balances;
