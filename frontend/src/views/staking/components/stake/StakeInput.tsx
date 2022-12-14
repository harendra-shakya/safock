import TransactionInput, { TransactionInputProps } from "components/transaction-input";
import useRToken from "hooks/useRToken";
import { useAtomValue } from "jotai";
import { rsrBalanceAtom } from "state/atoms";
import { stakeAmountAtom } from "views/insurance/atoms";

const StakeInput = (props: Partial<TransactionInputProps>) => {
    const max = useAtomValue(rsrBalanceAtom);
    const rToken = useRToken()

    return (
        <TransactionInput
            title="Stake"
            placeholder={`${rToken?.symbol} Amount`}
            amountAtom={stakeAmountAtom}
            maxAmount={max}
            {...props}
        />
    );
};

export default StakeInput;
