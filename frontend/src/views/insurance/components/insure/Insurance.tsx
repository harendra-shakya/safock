import { Trans } from '@lingui/macro'
import { Button } from 'components'
import { useState } from 'react'
import { BoxProps, Card } from 'theme-ui'
import { isValidStakeAmountAtom } from 'views/insurance/atoms'
import ConfirmStake from './ConfirmInsurance'
import StakeInput from './InsuranceInput'
import useRToken from 'hooks/useRToken'

import {
  InsureTransactionInputProps,  InsureTransactionInput,
} from 'components/transaction-input'
import { rsrBalanceAtom } from 'state/atoms'
import { stakeAmountAtom } from 'views/insurance/atoms'
import { Select } from 'theme-ui'


import { parseEther } from '@ethersproject/units'
import { t } from '@lingui/macro'
import TransactionModal from 'components/transaction-modal'
import { BigNumber } from 'ethers'
import { useAtom, useAtomValue } from 'jotai'
import { useCallback, useEffect, useMemo } from 'react'
import { rTokenAtom } from 'state/atoms'
import { formatCurrency } from 'utils'
import { RSR, TRANSACTION_STATUS } from 'utils/constants'
import { v4 as uuid } from 'uuid'
import InsureInput from './InsuranceInput'
import { ethers } from 'ethers'
import { useSetAtom } from 'jotai'
import { addTransactionAtom, allowanceAtom } from 'state/atoms'
import { SAFOCK_ADDRESS } from 'utils/addresses'
import  erc20Abi  from 'abis/ERC20.json'
import safockAbi from 'abis/safock.json'

// var window:any;

const Insure = (props: BoxProps) => {
  const [confirming, setConfirming] = useState(false)
  const isValid = useAtomValue(isValidStakeAmountAtom)
  const rToken = useRToken()

  const [amount, setAmount] = useState("0")
  const [planNum, setPlanNum] = useState("0")

  const [signing, setSigning] = useState(false)
  const [paymentCurrency, setPaymentCurrency] = useState("0xAE64954A904da3fD9D71945980A849B8A9F755d7")
  const [token, setToken] = useState("USDT")
  const addTransaction = useSetAtom(addTransactionAtom)
  const [isOkDisabled, setIsOkDisabled] = useState(false);

  const provideInsurance = async () => {
    try {
      console.log("providing insurance...")
        if (+amount <= 0) {
            alert("invalid Amount!");
            return;
        }
        if (+planNum >= 3) {
            alert("Wrong plan!");
            return;
        }
        setIsOkDisabled(true);
        const {ethereum}: any = window;
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();

        const safock = new ethers.Contract(SAFOCK_ADDRESS[5], safockAbi, signer);
        console.log("listing token");

        const token = await new ethers.Contract(paymentCurrency, erc20Abi, signer);

        let tx = await token.approve(safock.address, ethers.utils.parseEther((+amount).toString()));
        let txReceipt = await tx.wait(1);
        if (txReceipt.status === 1) {
            console.log("aprroved");
        } else {
            alert("Tx failed. Plz try agains!");
        }

        tx = await safock.insurance(planNum, paymentCurrency, rToken?.address, amount);
        console.log("receiving confirmations...");
        txReceipt = await tx.wait();
        if (txReceipt.status === 1) {
            console.log("done!");
        } else {
            alert("Tx failed. Plz try agains!");
        }
        setIsOkDisabled(false);
    } catch (e) {
        console.log(e);
        setIsOkDisabled(false);
    }
};

  return (
    <>
      <Card p={4} {...props}>
      <InsureTransactionInput
      title="Amount"
      placeholder={`${rToken?.symbol} amount`}
      onChange={(e) => {setAmount((e.target as HTMLInputElement).value
        )}}
      {...props}
    />
    <InsureTransactionInput
      title="Plan"
      placeholder={`0`}
      onChange={(e) => {setPlanNum((e.target as HTMLInputElement).value
        )}} 
      {...props}
    />
    <InsureTransactionInput
      title="Payment Currency"
      placeholder={`USDT`}
      onChange={(e) => {}}
      {...props}
    
    />
        <Button
          disabled={isOkDisabled}
          sx={{ width: '100%' }}
          mt={3}
          onClick={provideInsurance}
        >
          + <Trans>{isOkDisabled ? "transacting..." :`Insure ${rToken?.symbol}`}</Trans>
        </Button>
      </Card>
    </>
  )
}

export default Insure