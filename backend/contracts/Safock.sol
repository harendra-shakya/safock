// SPDX-License-Identifier: MIT

import "./interfaces/IFacadeWrite.sol";
import "./interfaces/IFacadeRead.sol";
import "./interfaces/IRToken.sol";
import "./libraries/TransferHelpers.sol";
import "./interfaces/IStaking.sol";
import "./Staking.sol";

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

pragma solidity ^0.8.9;

contract Safock is Ownable, ReentrancyGuard {
    // # This is the address of the reserve protocol's facade read contract
    address private immutable FACADE_READ;
    address private TREASURY_ADDRESS;
    address private immutable USDT;
    address private immutable USDC;
    address private immutable BUSD;

    /*
     * @dev here we're creating enum of BASIC, PRO, PRO_PLUS, PRO_MAX for keeping track of different types of insurance plans
     */
    enum InsurancePlan {
        BASIC,
        PRO,
        PRO_PLUS,
        PRO_MAX
    }

    /*
     * @dev struct of InsuranceAttributes which inclues basic information about price, minimum drop, and cover for
     * they are only initilized during deploying, saved globally
     */
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

    /*
     * @dev UserPlan struct
     * whenever a user buys a insurance, the information saved in this struct
     * the information is then used in future during claiming insurance
     */
    struct UserPlan {
        address owner;
        bool isClaimed;
        InsurancePlan planType;
        address rToken;
        uint256 numRTokens;
        uint256 price;
        uint256 amountInsuredInUSD;
        uint256 validity;
    }

    /*
     * @dev mapping then conatains all user insurance plans
     * user -> tToken -> UserPlan
     */
    mapping(address => mapping(address => UserPlan)) private userPlans; // user -> tToken -> UserPlan
    mapping(InsurancePlan => InsuranceAttributes) private plans; // InsurancePlan -> InsuranceAttributes

    mapping(address => bool) private isStkContractsExists; // rToken -> bool
    mapping(address => address) private stakingContracts; // rToken -> staking contract

    modifier stkContractExists(address rToken) {
        require(isStakingContractExists(rToken), "Staking contract NOT exists");
        _;
    }

    event Insured(
        address owner,
        InsurancePlan planType,
        address rToken,
        uint256 numRTokens,
        uint256 price,
        uint256 totalAmount,
        uint256 validity
    );
    event InsuranceClaimed(
        address owner,
        InsurancePlan planType,
        address rToken,
        uint256 numRTokens,
        uint256 amountInsuredInUSD,
        uint256 validity
    );

    event Withdraw(address caller, address token, uint256 amount);

    constructor(
        address facadeRead,
        address usdc,
        address usdt,
        address busd
    ) {
        require(facadeRead != address(0), "Invalid facade read address");
        require(usdc != address(0), "Invalid USDC address");
        require(usdt != address(0), "Invalid USDT address");
        require(busd != address(0), "Invalid BUSD address");

        FACADE_READ = facadeRead;
        USDC = usdc;
        USDT = usdt;
        BUSD = busd;

        // 0. BASIC     ->   cost = 1% of price, if drops atleast 20%, lose cover upto 30%, validity 3 month (validity is low coz of market fluctuation)
        // 1. PRO       ->   cost = 3% of price, if drops atleast 20%, lose cover upto 50%, validity 3 month
        // 2. PRO_PLUS  ->   cost = 5% of price, if drops atleast 20%, lose cover upto 70%, validity 3 month
        // 3. PRO_MAX   ->   cost = 7% of price, if drops atleast 20%, lose cover upto 100%, validity 3 month

        plans[InsurancePlan.BASIC] = InsuranceAttributes(
            InsurancePlan.BASIC, // InsurancePlan planType
            1, //  priceNumerator
            100, // priceDenominator
            20, // minDropNumerator
            100, // minDropDenominator
            30, // coverUptoNumerator
            100, // coverUptoDenominator
            90 days // validity
        );

        plans[InsurancePlan.PRO] = InsuranceAttributes(
            InsurancePlan.PRO, // InsurancePlan planType
            3, //  priceNumerator
            100, // priceDenominator
            20, // minDropNumerator
            100, // minDropDenominator
            50, // coverUptoNumerator
            100, // coverUptoDenominator
            90 days // validity
        );

        plans[InsurancePlan.PRO_PLUS] = InsuranceAttributes(
            InsurancePlan.PRO_PLUS, // InsurancePlan planType
            5, //  priceNumerator
            100, // priceDenominator
            20, // minDropNumerator
            100, // minDropDenominator
            70, // coverUptoNumerator
            100, // coverUptoDenominator
            90 days // validity
        );

        plans[InsurancePlan.PRO_MAX] = InsuranceAttributes(
            InsurancePlan.PRO_MAX, // InsurancePlan planType
            7, //  priceNumerator
            100, // priceDenominator
            20, // minDropNumerator
            100, // minDropDenominator
            100, // coverUptoNumerator
            100, // coverUptoDenominator
            90 days // validity
        );
    }

    // ========================== Staking ==================================== //

    function isStakingContractExists(address rToken) public view returns (bool isExists) {
        isExists = isStkContractsExists[rToken];
    }

    function createStakingContract(address rToken) private {
        require(!isStakingContractExists(rToken), "Staking contract NOT exists");

        Staking staking = new Staking();

        staking.initialize(owner(), address(this), rToken);
        isStkContractsExists[rToken] = true;
        stakingContracts[rToken] = address(staking);
    }


    function stake(address rToken, uint256 amount) external {
        if(!isStakingContractExists(rToken)) createStakingContract(rToken);
        address _stakingContract = stakingContracts[rToken];
        require(IERC20(rToken).transferFrom(msg.sender, _stakingContract, amount), "RToken transfer failed");
        IStaking(_stakingContract).createStake(msg.sender);
    }

    function removeStake(address rToken, uint256 amount) external stkContractExists(rToken) {
        address _stakingContract = stakingContracts[rToken];
        require(IERC20(_stakingContract).transferFrom(msg.sender, _stakingContract, amount), "Staking Token transfer failed");
        IStaking(_stakingContract).removeStake(msg.sender);
    }

    function getRTokenPerShare(address rToken) external view stkContractExists(rToken) returns (uint256) {
        return IStaking(stakingContracts[rToken]).getRTokenPerShare();
    }

    function getStakingContract(address rToken) external view returns (address _stakingContract) {
        _stakingContract = stakingContracts[rToken];
    }

    function stakeOf(address stakeholder, address rToken)
        external
        view
        stkContractExists(rToken)
        returns (uint256)
    {
        return IStaking(stakingContracts[rToken]).stakeOf(stakeholder);
    }

    function sharesOf(address stakeholder, address rToken)
        external
        view
        stkContractExists(rToken)
        returns (uint256)
    {
        return IStaking(stakingContracts[rToken]).sharesOf(stakeholder);
    }

    function rewardOf(address stakeholder, address rToken)
        external
        view
        stkContractExists(rToken)
        returns (uint256)
    {
        return IStaking(stakingContracts[rToken]).rewardOf(stakeholder);
    }

    function rewardForRToken(
        address stakeholder,
        uint256 stkAmount,
        address rToken
    ) external view stkContractExists(rToken) returns (uint256) {
        return IStaking(stakingContracts[rToken]).rewardForRToken(stakeholder, stkAmount);
    }

    function getTotalStakes(address rToken) external view stkContractExists(rToken) returns (uint256) {
        return IStaking(stakingContracts[rToken]).getTotalStakes();
    }

    function getTotalShares(address rToken) external view stkContractExists(rToken) returns (uint256) {
        return IStaking(stakingContracts[rToken]).getTotalShares();
    }

    function getCurrentRewards(address rToken)
        external
        view
        stkContractExists(rToken)
        returns (uint256)
    {
        return IStaking(stakingContracts[rToken]).getCurrentRewards();
    }

    function getTotalStakeholders(address rToken)
        external
        view
        stkContractExists(rToken)
        returns (uint256)
    {
        return IStaking(stakingContracts[rToken]).getCurrentRewards();
    }

    function refundLockedRToken(
        uint256 from,
        uint256 to,
        address rToken
    ) external stkContractExists(rToken) {
        IStaking(stakingContracts[rToken]).refundLockedRToken(from, to);
    }

    function removeLockedRewards(address rToken) external stkContractExists(rToken) {
        IStaking(stakingContracts[rToken]).removeLockedRewards();
    }

    // ========================== Insurance ==================================== //

    /*
     * @dev main function resposible for giving isurance to user's ETFs
     */
    function insurance(
        uint8 planNum,
        address paymentCurrency,
        address rToken,
        uint256 numRTokens
    ) external nonReentrant {
        require(planNum <= 3, "Invalid Plan");
        require(
            paymentCurrency == USDC || paymentCurrency == USDT || paymentCurrency == BUSD,
            "Invalid currency!"
        );

        InsurancePlan planType;

        if (planNum == 0) {
            planType = InsurancePlan.BASIC;
        } else if (planNum == 1) {
            planType = InsurancePlan.PRO;
        } else if (planNum == 2) {
            planType = InsurancePlan.PRO_PLUS;
        } else if (planNum == 3) {
            planType = InsurancePlan.PRO_MAX;
        }

        uint256 price = getPrice(rToken);
        uint256 totalAmount = price * numRTokens;

        InsuranceAttributes memory plan = plans[planType];
        uint256 amount = (plan.priceNumerator * totalAmount) / plan.priceDenominator;
        require(IERC20(paymentCurrency).transferFrom(msg.sender, address(this), amount), "Payment Currency transfer failed!");
        
        userPlans[msg.sender][rToken] = UserPlan(
            msg.sender, //owner
            false, // isClaimed
            planType, // planType
            rToken, // rToken
            numRTokens, // number of RTokens
            price, // current price of the RToken
            totalAmount, // amountInsuredInUSD
            plan.validity // validity
        );

        emit Insured(msg.sender, planType, rToken, numRTokens, price, totalAmount, plan.validity);
    }

    /*
     * @dev main function resposible for claiming the insurance
     */
    function claimInsurance(address rToken) external nonReentrant {
        UserPlan memory plan = userPlans[msg.sender][rToken];
        InsurancePlan planType = plan.planType;
        InsuranceAttributes memory planAttributes = plans[planType];

        require(plan.owner != address(0), "Plan not exists");
        require(!plan.isClaimed, "Already Claimed");
        require(plan.validity > block.timestamp, "Insurance validity is already over");

        uint256 currentPrice = getPrice(rToken);

        // * Currect price should be less than minimum drop
        require(
            currentPrice <=
                ((planAttributes.minDropDenominator - planAttributes.minDropNumerator) *
                    plan.price) /
                    planAttributes.minDropDenominator,
            "Price not dropped below minimum theshold"
        );

        // * Currect price should be more than cove upto
        require(
            currentPrice >=
                ((planAttributes.coverUptoDenominator - planAttributes.coverUptoNumerator) *
                    plan.price) /
                    planAttributes.coverUptoDenominator,
            "Price dropped out of coverage"
        );

        require(IERC20(rToken).transferFrom(msg.sender, address(this), plan.numRTokens), "RToken Transafer failed!");
        require(IERC20(USDT).transfer(msg.sender, plan.amountInsuredInUSD), "USDT Transfer failed");

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

    function withdraw(address token, uint256 amount) external {
        TransferHelpers.safeTranfer(token, TREASURY_ADDRESS, amount);
        emit Withdraw(msg.sender, token, amount);
    }

    function changeTreaduryAddress(address newAddress) external onlyOwner {
        TREASURY_ADDRESS = newAddress;
    }

    // this will return the price of rToken
    function getPrice(address rToken) public view returns (uint256 price) {
        price = IFacadeRead(FACADE_READ).price(IRToken(rToken));
    }

    function getUserPlan(address user, address rToken)
        external
        view
        returns (UserPlan memory userPlan)
    {
        userPlan = userPlans[user][rToken];
    }

    function getPlan(uint256 planNum) external view returns (InsuranceAttributes memory plan) {
        require(planNum <= 3, "Invalid Plan");

        InsurancePlan planType;

        if (planNum == 0) {
            planType = InsurancePlan.BASIC;
        } else if (planNum == 1) {
            planType = InsurancePlan.PRO;
        } else if (planNum == 2) {
            planType = InsurancePlan.PRO_PLUS;
        } else if (planNum == 3) {
            planType = InsurancePlan.PRO_MAX;
        }

        plan = plans[planType];
    }

    function validityLeft(address rToken) external view returns (uint256 leftValidity) {
        UserPlan memory plan = userPlans[msg.sender][rToken];
        leftValidity = plan.validity - block.timestamp;
    }
}
