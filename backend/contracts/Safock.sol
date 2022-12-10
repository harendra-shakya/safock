// SPDX-License-Identifier: MIT

import "./interfaces/IFacadeWrite.sol";
import "./interfaces/IFacadeRead.sol";
import "./interfaces/IRToken.sol";
import "./libraries/TransferHelpers.sol";

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

pragma solidity ^0.8.9;

contract Safock is Ownable, ReentrancyGuard {
    // 1. deploy etf
    // 2. ask for insurance and give differnt userPlans

    bytes4 private constant T_SELECTOR = bytes4(keccak256(bytes("transfer(address,uint256)")));
    bytes4 private constant TF_SELECTOR =
        bytes4(keccak256(bytes("transferFrom(address,address,uint256)")));
    address private immutable RESERVE_PROTOCOL;
    address private immutable USDT;
    address private immutable USDC;
    address private immutable BUSD;

    // 0. NONE      ->   No plan
    // 1. BASIC     ->   cost = 1% of price, if drops atleast 20%, lose cover upto 30%, validity 3 month (validity is low coz of market fluctuation)
    // 2. PRO       ->   cost = 3% of price, if drops atleast 20%, lose cover upto 50%, validity 3 month
    // 3. PRO_PLUS  ->   cost = 5% of price, if drops atleast 20%, lose cover upto 70%, validity 3 month
    // 4. PRO_MAX   ->   cost = 7% of price, if drops atleast 20%, lose cover upto 100%, validity 3 month

    enum InsurancePlan {
        NONE,
        BASIC,
        PRO,
        PRO_PLUS,
        PRO_MAX
    }

    struct InsuranceAttributes {
        InsurancePlan planType;
        uint256 priceNumerator;
        uint256 priceDenominator;
        uint256 minDropNumerator;
        uint256 minDropDenominator;
        uint256 coverUptoNumerator;
        uint256 coverUptoDenominator;
        uint256 validity;
    }

    struct UserPlan {
        address owner;
        bool isClaimed;
        InsurancePlan planType;
        address rToken;
        uint256 numRTokens;
        uint256 amountInsuredInUSD;
        uint256 validity;
    }

    mapping(address => mapping(address => UserPlan)) private userPlans;
    mapping(InsurancePlan => InsuranceAttributes) private plans;

    event CreateETF(ConfigurationParams config, SetupParams setup, uint8 plan);
    event InsuranceClaimed(
        address owner,
        InsurancePlan planType,
        address rToken,
        uint256 numRTokens,
        uint256 amountInsuredInUSD,
        uint256 validity
    );

    constructor(
        address reserveAddress,
        address usdc,
        address busd,
        address usdt
    ) {
        RESERVE_PROTOCOL = reserveAddress;
        USDC = usdc;
        USDT = usdt;
        BUSD = busd;

        /**
        InsuranceAttributes {
            InsurancePlan planType;
            uint256 priceNumerator;
            uint256 priceDenominator;
            uint256 minDropNumerator;
            uint256 minDropDenominator;
            uint256 coverUptoNumerator;
            uint256 coverUptoDenominator;
            uint256 validity;
        } 
        */

        plans[InsurancePlan.NONE] = InsuranceAttributes(
            InsurancePlan.NONE,
            0, // InsurancePlan planType
            100, //  priceNumerator
            0, // priceDenominator
            100, // minDropNumerator
            0, // coverUptoNumerator
            100, // coverUptoDenominator
            0 // validity
        );

        plans[InsurancePlan.BASIC] = InsuranceAttributes(
            InsurancePlan.BASIC,
            1,
            100,
            20,
            100,
            30,
            100,
            90 days
        );

        plans[InsurancePlan.PRO] = InsuranceAttributes(
            InsurancePlan.PRO,
            3,
            100,
            20,
            100,
            50,
            100,
            90 days
        );

        plans[InsurancePlan.PRO_PLUS] = InsuranceAttributes(
            InsurancePlan.PRO_PLUS,
            5,
            100,
            20,
            100,
            70,
            100,
            90 days
        );

        plans[InsurancePlan.PRO_MAX] = InsuranceAttributes(
            InsurancePlan.PRO_MAX,
            7,
            100,
            20,
            100,
            90,
            100,
            90 days
        );
    }

    function createETF(
        ConfigurationParams calldata config,
        SetupParams calldata setup,
        uint8 planNum,
        uint256 amount
    ) external nonReentrant {
        require(planNum <= 4, "Invalid Plan");

        address rToken = IFacadeWrite(RESERVE_PROTOCOL).deployRToken(config, setup);
        IRToken(rToken).issue(amount);
        emit CreateETF(config, setup, planNum);
    }

    function insurance(
        address user,
        uint8 planNum,
        address paymentCurrency,
        address rToken,
        uint256 numRTokens
    ) external nonReentrant {
        require(planNum <= 4, "Invalid Plan");
        require(
            paymentCurrency == USDC || paymentCurrency == USDT || paymentCurrency == BUSD,
            "Invalid currency!"
        );
        InsurancePlan planType;
        if (planNum == 0) {
            planType = InsurancePlan.NONE;
        } else if (planNum == 1) {
            planType = InsurancePlan.BASIC;
        } else if (planNum == 2) {
            planType = InsurancePlan.PRO;
        } else if (planNum == 3) {
            planType = InsurancePlan.PRO_PLUS;
        } else if (planNum == 4) {
            planType = InsurancePlan.PRO_MAX;
        }

        if (planNum != 0) {
            InsuranceAttributes memory plan = plans[planType];
            uint256 amount = (plan.priceNumerator * getPrice(rToken)) / plan.priceDenominator;
            TransferHelpers.safeTranferFrom(paymentCurrency, user, address(this), amount);
        }

        userPlans[msg.sender][rToken] = UserPlan(
            msg.sender,
            false,
            planType,
            rToken,
            numRTokens,
            getPrice(rToken),
            90 days
        );
    }

    function claimInsurance(address rToken) external nonReentrant {
        UserPlan memory plan = userPlans[msg.sender][rToken];
        InsurancePlan planType = plan.planType;
        InsuranceAttributes memory planAttributes = plans[planType];

        require(!plan.isClaimed, "Already Claimed");
        require(plan.planType != InsurancePlan.NONE, "You don't have any plan");
        require(plan.validity > block.timestamp, "Insurance validity is already over");

        // * Currect price should be less than minimum drop
        require(
            getPrice(rToken) <=
                ((planAttributes.minDropDenominator - planAttributes.minDropNumerator) *
                    plan.amountInsuredInUSD) /
                    planAttributes.minDropDenominator,
            "Price not dropped below minimum theshold"
        );

        // * Currect price should be more than cove upto
        require(
            getPrice(rToken) >=
                ((planAttributes.coverUptoDenominator - planAttributes.coverUptoNumerator) *
                    plan.amountInsuredInUSD) /
                    planAttributes.coverUptoDenominator,
            "Price dropped out of coverage"
        );

        TransferHelpers.safeTranferFrom(rToken, msg.sender, address(this), plan.numRTokens);
        TransferHelpers.safeTranfer(USDT, msg.sender, plan.amountInsuredInUSD);

        plan.isClaimed = true;

        emit InsuranceClaimed(
            msg.sender,
            plan.planType,
            rToken,
            plan.numRTokens,
            plan.amountInsuredInUSD,
            plan.validity
        );
    }

    // this will return the price of rToken
    function getPrice(address rToken) public view returns (uint256 price) {
        price = IFacadeRead(RESERVE_PROTOCOL).price(IRToken(rToken));
    }
}
