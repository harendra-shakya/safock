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

const Plans = () => {
    const rToken = useAtomValue(rTokenAtom);
    const balance = useAtomValue(stRsrBalanceAtom);
    const rate = useAtomValue(rsrExchangeRateAtom);
    const rsrPrice = useAtomValue(rsrPriceAtom);

    return (
        <Box p={4}>
            <Text variant="subtitle" mb={3}>
                <Trans>There are currently 4 insurance plans that we provide: </Trans>
            </Text>
            <Text variant="subtitle" mb={3}>
                <Trans>0. BASIC - cost = 1% of price, lose cover upto 30%.</Trans>
            </Text>
            <Text variant="subtitle" mb={3}>
                <Trans>1. PRO - cost = 3% of price, lose cover upto 50%.</Trans>
            </Text>
            <Text variant="subtitle" mb={3}>
                <Trans>2. PRO_PLUS - cost = 5% of price, lose cover upto 70%.</Trans>
            </Text>
            <Text variant="subtitle" mb={3}>
                <Trans>3. PRO_MAX - cost = 7% of price, lose cover upto 100%.</Trans>
            </Text>
        </Box>
    );
};

const Conditions = () => {
    const balance = useAtomValue(rsrBalanceAtom);
    const rsrPrice = useAtomValue(rsrPriceAtom);

    return (
        <Box p={4}>
            <Text variant="subtitle" mb={3}>
                <Trans>The insurance can be claimed if it meets the conditions: </Trans>
            </Text>
            <Text variant="subtitle" mb={3}>
                <Trans>
                    0. BASIC - Conditions: If the price drops atleast 20% then the purchased price.
                    Validity 3 month.
                </Trans>
            </Text>
            <Text variant="subtitle" mb={3}>
                <Trans>
                    1. PRO - Conditions: If the price drops atleast 20% then the purchased price.
                    Validity 3 month.
                </Trans>
            </Text>
            <Text variant="subtitle" mb={3}>
                <Trans>
                    2. PRO_PLUS - Conditions: If the price drops atleast 20% then the purchased
                    price. Validity 3 month.
                </Trans>
            </Text>
            <Text variant="subtitle" mb={3}>
                <Trans>
                    3. PRO_MAX - Conditions: If the price drops atleast 20% then the purchased
                    price. Validity 3 month.
                </Trans>
            </Text>
        </Box>
    );
};

/**
 * Display collateral tokens balances
 */
const PlansInfo = (props: BoxProps) => (
    <Card p={0} {...props}>
        <Grid columns={[1, 2]} gap={0}>
            <Plans />
            <Box
                sx={(theme: any) => ({
                    borderLeft: ["none", `1px solid ${theme.colors.border}`],
                    borderTop: [`1px solid ${theme.colors.border}`, "none"],
                })}
            >
                <Conditions />
            </Box>
        </Grid>
    </Card>
);

export default PlansInfo;
