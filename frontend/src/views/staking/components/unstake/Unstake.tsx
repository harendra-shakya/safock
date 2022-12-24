import { Trans } from "@lingui/macro";
import { Button } from "components";
import { useEffect, useState } from "react";
import { BoxProps, Card } from "theme-ui";
import useRToken from "hooks/useRToken";

import { InsureTransactionInput } from "components/transaction-input";

import { ethers } from "ethers";
import { SAFOCK_ADDRESS } from "utils/addresses";
import erc20Abi from "abis/ERC20.json";
import safockAbi from "abis/safock.json";
import { CHAIN_ID } from "utils/chains";
import { LoadingButton } from "components/button";
import Modal from "components/modal";
import { Divider, Flex, Text, Link, Box, Spinner } from "theme-ui";
import { useWeb3React } from "@web3-react/core";

const Unstake = (props: BoxProps) => {
    const rToken = useRToken();
    const [showModal, setShowModal] = useState(false);
    const [signing, setSigning] = useState(false);
    const [paymentCurrency, setPaymentCurrency] = useState(
        "0xAE64954A904da3fD9D71945980A849B8A9F755d7"
    );
    const { account } = useWeb3React();

    const [amount, setAmount] = useState("0");
    const [isOkDisabled, setIsOkDisabled] = useState(false);
    const [info, setInfo] = useState(`Unstake you ETF?`);

    const [balance, setBalance] = useState("0");

    useEffect(() => {
        updateUI();
    }, [account, showModal]);

    const updateUI = async () => {
        const { ethereum }: any = window;
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();

        const safock = new ethers.Contract(SAFOCK_ADDRESS[CHAIN_ID], safockAbi, signer);

        setBalance(await safock.stakeOf(account, rToken?.address));
    };

    const _unstake = async () => {
        try {
            if (+amount <= 0) {
                alert("Invalid amount");
                return;
            }

            const _amount = ethers.utils.parseEther(amount);

            if (+balance < +_amount) {
                alert("Amount exceeds balance");
                return;
            }

            setIsOkDisabled(true);
            const { ethereum }: any = window;
            const provider = new ethers.providers.Web3Provider(ethereum);
            const signer = provider.getSigner();

            const safock = new ethers.Contract(SAFOCK_ADDRESS[CHAIN_ID], safockAbi, signer);

            const stkToken = await safock.getStakingContract(rToken?.address);

            const token = await new ethers.Contract(stkToken, erc20Abi, signer);

            console.log("stk token", stkToken);

            setInfo(`Approve your STK Tokens?`);

            let tx = await token.approve(SAFOCK_ADDRESS[CHAIN_ID], _amount);

            setInfo(`Approved! Receving confirmations.....`);

            let txReceipt = await tx.wait(1);

            if (txReceipt.status === 1) {
                console.log("aprroved");
            } else {
                alert("Tx failed. Plz try agains!");
                return;
            }

            setInfo(`Unstaking your ${rToken?.symbol} ETF. Approve Tx?`);

            tx = await safock.removeStake(rToken?.address, _amount);

            setInfo("Unstaking your token...");

            txReceipt = await tx.wait();
            if (txReceipt.status === 1) {
                setInfo("done!");
            } else {
                alert("Tx failed. Plz try agains!");
            }
            setShowModal(false);
            setIsOkDisabled(false);
            setInfo(`Stake you ETF?`);
        } catch (e) {
            console.log(e);
            setIsOkDisabled(false);
            setInfo("");
        }
    };
    const modalStyle = { maxWidth: "420px" };

    return (
        <>
            <Card p={4} {...props}>
                <InsureTransactionInput
                    title="Amount"
                    placeholder={`10`}
                    onChange={(e) => {
                        setAmount((e.target as HTMLInputElement).value);
                    }}
                    {...props}
                />
                <Button
                    disabled={isOkDisabled}
                    sx={{ width: "100%" }}
                    mt={3}
                    onClick={() => {
                        setShowModal(true);
                    }}
                >
                    -{" "}
                    <Trans>
                        {isOkDisabled ? "transacting..." : `Unstake (${rToken?.symbol})`}
                    </Trans>
                </Button>
                {showModal && (
                    <Modal
                        title="Unstake"
                        onClose={() => {
                            setShowModal(false);
                        }}
                        style={modalStyle}
                    >
                        {info}
                        <>
                            <Divider mx={-4} my={4} />
                        </>
                        <Divider mx={-4} mt={4} />
                        <LoadingButton
                            loading={!!signing}
                            disabled={isOkDisabled}
                            variant={!!signing ? "accent" : "primary"}
                            text={isOkDisabled ? "Unstaking" : "Unstake"}
                            onClick={_unstake}
                            sx={{ width: "100%" }}
                            mt={3}
                        />
                    </Modal>
                )}{" "}
            </Card>
        </>
    );
};

export default Unstake;
