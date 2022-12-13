import { InsureTransactionInputProps, InsureTransactionInput } from "components/transaction-input";
import { useAtomValue } from "jotai";
import { rsrBalanceAtom } from "state/atoms";
import { stakeAmountAtom } from "views/insurance/atoms";
import useRToken from "hooks/useRToken";
import { Select } from "theme-ui";
import { Trans } from "@lingui/macro";
import { useState } from "react";

const InsureInput = (props: Partial<InsureTransactionInputProps>) => {
    const max = useAtomValue(rsrBalanceAtom);
    const rToken = useRToken();
    const [amount, setAmount] = useState("0");
    const [planNum, setPlanNum] = useState("0");

    return <></>;
};

export default InsureInput;
