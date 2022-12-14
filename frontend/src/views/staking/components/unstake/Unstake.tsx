import { Trans } from "@lingui/macro";
import { Button } from "components";
import useRToken from "hooks/useRToken";
import { useAtomValue } from "jotai/utils";
import { useState } from "react";
import { BoxProps, Card } from "theme-ui";
import { isValidUnstakeAmountAtom } from "views/insurance/atoms";
import ConfirmUnstake from "./ConfirmUnstake";
import UnstakeInput from "./UnstakeInput";

const Unstake = (props: BoxProps) => {
    const [confirming, setConfirming] = useState(false);
    const isValid = useAtomValue(isValidUnstakeAmountAtom);
    const rToken = useRToken();

    return (
        <>
            {confirming && <ConfirmUnstake onClose={() => setConfirming(false)} />}
            <Card p={4} {...props}>
                <UnstakeInput />
                <Button
                    disabled={true}
                    sx={{ width: "100%" }}
                    mt={3}
                    onClick={() => setConfirming(true)}
                >
                    - <Trans>Unstake {rToken?.symbol} </Trans>
                </Button>
            </Card>
        </>
    );
};

export default Unstake;
