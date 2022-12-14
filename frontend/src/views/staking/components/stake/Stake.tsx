import { Trans } from "@lingui/macro";
import { Button } from "components";
import useRToken from "hooks/useRToken";
import { useAtomValue } from "jotai/utils";
import { useState } from "react";
import { BoxProps, Card } from "theme-ui";
import { isValidStakeAmountAtom } from "views/insurance/atoms";
import ConfirmStake from "./ConfirmStake";
import StakeInput from "./StakeInput";

const Stake = (props: BoxProps) => {
    const [confirming, setConfirming] = useState(false);
    const isValid = useAtomValue(isValidStakeAmountAtom);
    const rToken = useRToken();

    return (
        <>
            {confirming && <ConfirmStake onClose={() => setConfirming(false)} />}
            <Card p={4} {...props}>
                <StakeInput />
                <Button
                    disabled={true}
                    sx={{ width: "100%" }}
                    mt={3}
                    onClick={() => setConfirming(true)}
                >
                    + <Trans>Stake {rToken?.symbol}</Trans>
                </Button>
            </Card>
        </>
    );
};

export default Stake;
