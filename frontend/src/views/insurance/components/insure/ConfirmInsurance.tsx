import { parseEther } from '@ethersproject/units'
import { t } from '@lingui/macro'
import TransactionModal from 'components/transaction-modal'
import { BigNumber } from 'ethers'
import { useAtom, useAtomValue } from 'jotai'
import { useCallback, useMemo, useState } from 'react'
import { rTokenAtom } from 'state/atoms'
import { formatCurrency } from 'utils'
import { RSR, TRANSACTION_STATUS } from 'utils/constants'
import { v4 as uuid } from 'uuid'
import { isValidStakeAmountAtom, stakeAmountAtom } from 'views/insurance/atoms'
import InsureInput from './InsuranceInput'
import { ethers } from 'ethers'
import { SAFOCK_ADDRESS } from 'utils/addresses'
import useRToken from 'hooks/useRToken'

type Props = {
  onClose: () => void;
  amount: string;
  planNum: string;
}

const ConfirmInsurance = ({ onClose, amount, planNum }:  Props ) => {
  const [signing, setSigning] = useState(false)
  const rToken = useRToken()
  const [paymentCurrency, setPaymentCurrency] = useState("0xAE64954A904da3fD9D71945980A849B8A9F755d7")
  const [token, setToken] = useState("USDT")
  // const isValid = useAtomValue(isValidStakeAmountAtom)

  /**
   *    uint8 planNum,
        address paymentCurrency,
        address rToken,
        uint256 numRTokens
   */

  const transaction = useMemo(
    () => ({
      id: uuid(),
      description: t`Insure ${rToken?.symbol}`,
      status: TRANSACTION_STATUS.PENDING,
      value: amount,
      call: {
        abi: 'safock',
        address: rToken?.address ?? ' ',
        method: 'insurance',
        args: [+planNum, paymentCurrency, rToken?.address, +amount],
      },
    }),
    [rToken?.address, amount]
  )

  // TODO: Unlimited approval
  const buildApproval = useCallback(() => {
    if (rToken) {
      return [
        {
          id: uuid(),
          description: t`Approve ${rToken?.symbol}`,
          status: TRANSACTION_STATUS.PENDING,
          value: amount,
          call: {
            abi: 'erc20',
            address: paymentCurrency,
            method: 'approve',
            args: [SAFOCK_ADDRESS[5], ethers.utils.parseEther(amount)],
          },
        },
      ]
    }

    return []
  }, [rToken?.address, amount])

  const handleClose = () => {
    onClose()
  }

  return (

    <TransactionModal
      title={t`Insure ${rToken?.symbol}`}
      tx={transaction}
      isValid={true}
      requiredAllowance={{
        paymentCurrency: ethers.utils.parseEther(amount)
      }}
      approvalsLabel={t`Allow use of ${(+amount / 100)} ${token}`}
      confirmLabel={t`Begin Insurance of ${(amount)} ${rToken?.symbol}`}
      buildApprovals={buildApproval}
      onClose={handleClose}
      onChange={(signing) => setSigning(signing)}
    >
      <InsureInput compact disabled={signing} />
    </TransactionModal>
  )
}

export default ConfirmInsurance
