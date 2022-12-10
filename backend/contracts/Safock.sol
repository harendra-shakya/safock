// SPDX-License-Identifier: MIT

import "./interfaces/IFacadeWrite.sol";
import "./interfaces/IFacadeRead.sol";
import "./interfaces/IRToken.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

pragma solidity ^0.8.9;

contract Safock {
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

    /**
    struct InsuranceAttributes {
        InsurancePlan planType;
        uint256 priceNumerator;
        uint256 priceDenominator;
        uint256 minDropNumerator;
        uint256 minDropDenominator;
        uint256 coverUptoNumerator;
        uint256 coverUptoDenominator;
        uint256 validity;
    } */

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

        plans[InsurancePlan.NONE] = InsuranceAttributes(
            InsurancePlan.NONE,
            0,
            100,
            0,
            100,
            0,
            100,
            0
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

    function _safeTranfer(
        address token,
        address to,
        uint256 amount
    ) internal {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(T_SELECTOR, to, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Transfer Failed!");
    }

    function _safeTranferFrom(
        address token,
        address from,
        address to,
        uint256 amount
    ) internal {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(TF_SELECTOR, from, to, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Transfer Failed!");
    }

    function createETF(
        ConfigurationParams calldata config,
        SetupParams calldata setup,
        uint8 planNum,
        address paymentCurrency
    ) external {
        require(planNum <= 4, "Invalid Plan");
        require(
            paymentCurrency == USDC || paymentCurrency == USDT || paymentCurrency == BUSD,
            "Invalid currency!"
        );
        IFacadeWrite(RESERVE_PROTOCOL).deployRToken(config, setup);
        emit CreateETF(config, setup, planNum);
    }

    function insurance(
        address user,
        uint8 planNum,
        address paymentCurrency,
        address rToken,
        uint256 numRTokens
    ) public {
        uint256 amount;
        if (planNum == 0) {
            userPlans[msg.sender][rToken] = UserPlan(
                msg.sender,
                false,
                InsurancePlan.NONE,
                rToken,
                numRTokens,
                0,
                0
            );
        } else if (planNum == 1) {
            amount = (1 * getPrice(rToken)) / 100; // 100 -> taking 100 times less than price
            userPlans[msg.sender][rToken] = UserPlan(
                msg.sender,
                false,
                InsurancePlan.BASIC,
                rToken,
                numRTokens,
                (getPrice(rToken)),
                90 days
            );
        } else if (planNum == 2) {
            amount = (3 * getPrice(rToken)) / 100;
            userPlans[msg.sender][rToken] = UserPlan(
                msg.sender,
                false,
                InsurancePlan.PRO,
                rToken,
                numRTokens,
                (getPrice(rToken)),
                90 days
            );
        } else if (planNum == 3) {
            amount = (5 * getPrice(rToken)) / 100;
            userPlans[msg.sender][rToken] = UserPlan(
                msg.sender,
                false,
                InsurancePlan.PRO_PLUS,
                rToken,
                numRTokens,
                (getPrice(rToken)),
                90 days
            );
        } else if (planNum == 4) {
            amount = (7 * getPrice(rToken)) / 100;
            userPlans[msg.sender][rToken] = UserPlan(
                msg.sender,
                false,
                InsurancePlan.PRO_MAX,
                rToken,
                numRTokens,
                (getPrice(rToken)),
                90 days
            );
        }

        if (planNum != 0) _safeTranferFrom(paymentCurrency, user, address(this), amount);
    }

    function claimInsurance(address rToken) external {
        UserPlan memory plan = userPlans[msg.sender][rToken];
        require(!plan.isClaimed, "Already Claimed");
        require(plan.planType != InsurancePlan.NONE, "You don't have any plan");
        require(plan.validity > block.timestamp, "Insurance validity is already over");
        require(
            (70 * getPrice(rToken)) / 100 <= plan.amountInsuredInUSD,
            "Price not dropped below minimu theshold"
        );
        _safeTranferFrom(rToken, msg.sender, address(this), plan.numRTokens);
        _safeTranfer(USDT, msg.sender, plan.amountInsuredInUSD);

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
