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

import { LoadingButton } from "components/button";
import Modal from "components/modal";
import { Divider, Flex, Text, Link, Box, Spinner } from "theme-ui";
import { CHAIN_ID } from "utils/chains";
import { Select } from "theme-ui";

const Insure = (props: BoxProps) => {
    const rToken = useRToken();
    const [showModal, setShowModal] = useState(false);
    const [amount, setAmount] = useState("0");
    const [planNum, setPlanNum] = useState("0");
    const [signing, setSigning] = useState(false);
    const [paymentCurrency, setPaymentCurrency] = useState(
        "0xAE64954A904da3fD9D71945980A849B8A9F755d7"
    );
    const [tokenName, setTokenName] = useState("USDT");
    const [isOkDisabled, setIsOkDisabled] = useState(false);
    const [info, setInfo] = useState(`Allow to use your ${tokenName}`);

    enum InsurancePlan {
        BASIC,
        PRO,
        PRO_PLUS,
        PRO_MAX,
    }

    const [plan, setPlan] = useState<{
        planType: InsurancePlan;
        priceNumerator: number;
        priceDenominator: number;
        minDropNumerator: number;
        minDropDenominator: number;
        coverUptoNumerator: number;
        coverUptoDenominator: number;
        validity: number;
    }>();

    useEffect(() => {
        updateUI();
    }, [showModal]);

    const [price, setPrice] = useState(0);

    const updateUI = async () => {
        const { ethereum }: any = window;
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();

        const safock = new ethers.Contract(SAFOCK_ADDRESS[CHAIN_ID], safockAbi, signer);
        setPlan(await safock.getPlan(+planNum));

        const _price = await safock.price(rToken);

        setPrice(+_price * +amount);
    };

    const provideInsurance = async () => {
        try {
            console.log("providing insurance...");
            if (+amount <= 0) {
                alert("invalid Amount!");
                setShowModal(false);
                return;
            }
            if (+planNum > 3) {
                alert("Wrong plan!");
                setShowModal(false);
                return;
            }

            setIsOkDisabled(true);
            const { ethereum }: any = window;
            const provider = new ethers.providers.Web3Provider(ethereum);
            const signer = provider.getSigner();

            const safock = new ethers.Contract(SAFOCK_ADDRESS[CHAIN_ID], safockAbi, signer);

            const token = await new ethers.Contract(paymentCurrency, erc20Abi, signer);

            setInfo(`Allow to use your ${tokenName}`);

            let tx = await token.approve(
                safock.address,
                ethers.utils.parseEther((+amount).toString())
            );
            setInfo(`Approved! Receiving confirmations.....`);

            let txReceipt = await tx.wait(1);

            if (txReceipt.status === 1) {
                console.log("aprroved");
            } else {
                alert("Tx failed. Plz try agains!");
            }
            setInfo(`Confirm Your Insurance Plan.....`);

            tx = await safock.insurance(planNum, paymentCurrency, rToken?.address, amount);
            setInfo("receiving confirmations...");

            txReceipt = await tx.wait();
            if (txReceipt.status === 1) {
                setInfo("done!");
            } else {
                alert("Tx failed. Plz try agains!");
            }
            setInfo("Done!");

            setShowModal(false);
            setIsOkDisabled(false);
            setInfo(`Allow to use your ${tokenName}`);
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
                    placeholder={`${rToken?.symbol} amount`}
                    onChange={(e) => {
                        setAmount((e.target as HTMLInputElement).value);
                    }}
                    {...props}
                />
                <InsureTransactionInput
                    title="Plan"
                    placeholder={`0`}
                    onChange={(e) => {
                        setPlanNum((e.target as HTMLInputElement).value);
                    }}
                    {...props}
                />
                <InsureTransactionInput
                    title="Payment Currency"
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
                    + <Trans>{isOkDisabled ? "transacting..." : `Insure ${rToken?.symbol}`}</Trans>
                </Button>
                {showModal && (
                    <Modal
                        title="Get Insurance"
                        onClose={() => {
                            setShowModal(false);
                        }}
                        style={modalStyle}
                    >
                        Your Plan info:
                        <div></div>
                        <div></div>
                        {`Token Name: ${rToken?.name}`}
                        <div></div>
                        {`Token Symbol: ${rToken?.symbol}`}
                        <div></div>
                        {`Insurace Plan type ${rToken?.symbol}: ${plan?.planType!}`}
                        <div></div>
                        {`Price should atleast drop: ${plan?.minDropNumerator}`}
                        <div></div>
                        {`% Price Insurace will be covered: ${plan?.coverUptoNumerator!}`}
                        <div></div>
                        {`Validity: ${plan?.validity! / (3600 * 24)} Days`}
                        <div></div>
                        {`Price: ${plan?.priceNumerator!}% of Asset Price`}
                        <div></div>
                        {/* {`Is insurance claimable: ${hasFallen}`} */}
                        <Divider mx={-4} my={4} />
                        {info}
                        <>
                            <Divider mx={-4} my={4} />
                        </>
                        <Divider mx={-4} mt={4} />
                        <LoadingButton
                            loading={!!signing}
                            disabled={isOkDisabled}
                            variant={!!signing ? "accent" : "primary"}
                            text={
                                isOkDisabled
                                    ? `Providing insurance to ${rToken?.symbol}`
                                    : "Get insurance"
                            }
                            onClick={provideInsurance}
                            sx={{ width: "100%" }}
                            mt={3}
                        />
                    </Modal>
                )}{" "}
            </Card>
        </>
    );
};

export default Insure;
