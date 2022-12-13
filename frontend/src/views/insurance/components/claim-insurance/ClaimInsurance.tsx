import { Trans } from "@lingui/macro";
import { Button } from "components";
import { useState } from "react";
import { BoxProps, Card } from "theme-ui";
import useRToken from "hooks/useRToken";

import { InsureTransactionInput } from "components/transaction-input";

import { ethers } from "ethers";
import { SAFOCK_ADDRESS } from "utils/addresses";
import erc20Abi from "abis/ERC20.json";
import safockAbi from "abis/safock.json";

import { LoadingButton } from "components/button";
import Modal from "components/modal";
import { Divider, Flex, Text, Link, Box, Spinner } from "theme-ui";
import { useWeb3React } from "@web3-react/core";

const ClaimInsurace = (props: BoxProps) => {
    const rToken = useRToken();
    const [showModal, setShowModal] = useState(false);
    const [amount, setAmount] = useState("0");
    const [planNum, setPlanNum] = useState("0");
    const [signing, setSigning] = useState(false);
    const [paymentCurrency, setPaymentCurrency] = useState(
        "0xAE64954A904da3fD9D71945980A849B8A9F755d7"
    );
    const { account } = useWeb3React();

    const [tokenName, setTokenName] = useState("USDT");
    const [isOkDisabled, setIsOkDisabled] = useState(false);
    const [info, setInfo] = useState(`Claim insurance`);

    const _claimInsurance = async () => {
        try {
            setIsOkDisabled(true);
            const { ethereum }: any = window;
            const provider = new ethers.providers.Web3Provider(ethereum);
            const signer = provider.getSigner();

            const safock = new ethers.Contract(SAFOCK_ADDRESS[5], safockAbi, signer);

            const token = await new ethers.Contract(paymentCurrency, erc20Abi, signer);
            const numRTokens: string = (await safock.getUserPlan(account, rToken?.address))
                .numRTokens;

            setInfo(`Approve your ${numRTokens} ${rToken?.symbol}.....`);

            let tx = await token.approve(
                safock.address,
                ethers.utils.parseEther(numRTokens.toString())
            );

            setInfo(`Approved! Receving confirmations.....`);

            let txReceipt = await tx.wait(1);

            if (txReceipt.status === 1) {
                console.log("aprroved");
            } else {
                alert("Tx failed. Plz try agains!");
            }

            setInfo(`Cheking.....`);

            tx = await safock.claimInsurance(rToken?.address);

            setInfo("Giving you insurance claim...");

            txReceipt = await tx.wait();
            if (txReceipt.status === 1) {
                setInfo("done!");
            } else {
                alert("Tx failed. Plz try agains!");
            }
            setShowModal(false);
            setIsOkDisabled(false);
            setInfo(`Claim insurance`);
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
                    title="Refund Currency"
                    placeholder={`USDT`}
                    onChange={(e) => {}}
                    disabled
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
                        {isOkDisabled ? "transacting..." : `Claim Insurance (${rToken?.symbol})`}
                    </Trans>
                </Button>
                {showModal && (
                    <Modal
                        title="Claim Insurance"
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
                            text={isOkDisabled ? "Claming" : "Claim Inurance"}
                            onClick={_claimInsurance}
                            sx={{ width: "100%" }}
                            mt={3}
                        />
                    </Modal>
                )}{" "}
            </Card>
        </>
    );
};

export default ClaimInsurace;
