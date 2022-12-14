import { t } from "@lingui/macro";
import TransactionInput, { TransactionInputProps } from "components/transaction-input";
import useRToken from "hooks/useRToken";
import { useAtomValue } from "jotai";
import { stRsrBalanceAtom } from "state/atoms";
import { unStakeAmountAtom } from "views/insurance/atoms";

const UnstakeInput = (props: Partial<TransactionInputProps>) => {
    const max = useAtomValue(stRsrBalanceAtom);
    const rToken = useRToken();

    return (
        <TransactionInput
            title={t`Unstake`}
            placeholder={t`${rToken?.symbol} amount`}
            amountAtom={unStakeAmountAtom}
            maxAmount={max}
            {...props}
        />
    );
};

export default UnstakeInput;
