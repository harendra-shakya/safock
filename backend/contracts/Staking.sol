// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./StakingToken.sol";

// @dev it's a dynamic staking contract
contract Staking is Initializable, AccessControlUpgradeable, PausableUpgradeable, StakingToken {
    using EnumerableSet for EnumerableSet.AddressSet;

    IERC20 private rToken;
    EnumerableSet.AddressSet private stakeholders;

    struct Stake {
        uint256 stakedRToken;
        uint256 shares;
    }

    bytes32 private ADMIN_ROLE;
    uint256 private constant BASE = 10**18;
    uint256 private totalStakes;
    bool private initialRatioFlag;

    mapping(address => Stake) private stakeholderToStake;

    event StakeAdded(
        address indexed stakeholder,
        uint256 amount,
        uint256 shares,
        uint256 timestamp
    );
    event StakeRemoved(
        address indexed stakeholder,
        uint256 amount,
        uint256 shares,
        uint256 reward,
        uint256 timestamp
    );

    modifier hasAdminRole() {
        require(hasRole(ADMIN_ROLE, msg.sender), "Caller is not an admin");
        _;
    }

    function initialize(
        address admin1,
        address admin2,
        address _rToken
    ) public initializer {
        AccessControlUpgradeable.__AccessControl_init();
        PausableUpgradeable.__Pausable_init();

        ADMIN_ROLE = keccak256("ADMIN_ROLE");

        // Set up roles
        _setupRole(ADMIN_ROLE, admin1);
        _setupRole(ADMIN_ROLE, admin2);

        rToken = IERC20(_rToken);
    }

    function pauseContract() public hasAdminRole {
        _pause();
    }

    function unPauseContract() public hasAdminRole {
        _unpause();
    }

    function createStake(address to) public whenNotPaused {
        uint256 stakeAmount = rToken.balanceOf(address(this)) - totalStakes;
        uint256 _totalShares = totalSupply;
        uint256 shares;

        if(_totalShares == 0) {
            shares = stakeAmount;
        } else {
            shares = (stakeAmount * _totalShares) / rToken.balanceOf(address(this));
        }

        stakeholders.add(to);
        stakeholderToStake[to].stakedRToken += stakeAmount;
        stakeholderToStake[to].shares += shares;
        totalStakes += stakeAmount;
        _mint(to, shares);

        emit StakeAdded(to, stakeAmount, shares, block.timestamp);
    }

    function removeStake(address to) public whenNotPaused {
        uint256 stakeAmount = balanceOf[address(this)];
        uint256 stakeholderStake = stakeholderToStake[to].stakedRToken;
        uint256 stakeholderShares = stakeholderToStake[to].shares;

        require(stakeholderStake >= stakeAmount, "Not enough staked!");

        uint256 stakedRatio = (stakeholderStake * BASE) / stakeholderShares;
        uint256 currentRatio = (rToken.balanceOf(address(this)) * BASE) / totalSupply;
        uint256 sharesToWithdraw = (stakeAmount * stakeholderShares) / stakeholderStake;

        uint256 rewards = 0;

        if (currentRatio > stakedRatio) {
            rewards = (sharesToWithdraw * (currentRatio - stakedRatio)) / BASE;
        }

        stakeholderToStake[to].shares -= sharesToWithdraw;
        stakeholderToStake[to].stakedRToken -= stakeAmount;
        totalStakes -= stakeAmount;
        _burn(address(this), sharesToWithdraw);

        require(rToken.transfer(to, stakeAmount + rewards), "RToken transfer failed");

        if (stakeholderToStake[to].stakedRToken == 0) {
            stakeholders.remove(to);
        }

        emit StakeRemoved(to, stakeAmount, sharesToWithdraw, rewards, block.timestamp);
    }

    function getRTokenPerShare() public view returns (uint256) {
        return (rToken.balanceOf(address(this)) * BASE) / totalSupply;
    }

    function stakeOf(address stakeholder) public view returns (uint256) {
        return stakeholderToStake[stakeholder].stakedRToken;
    }

    function sharesOf(address stakeholder) public view returns (uint256) {
        return stakeholderToStake[stakeholder].shares;
    }

    function rewardOf(address stakeholder) public view returns (uint256) {
        uint256 stakeholderStake = stakeholderToStake[stakeholder].stakedRToken;
        uint256 stakeholderShares = stakeholderToStake[stakeholder].shares;

        if (stakeholderShares == 0) {
            return 0;
        }

        uint256 stakedRatio = (stakeholderStake * BASE) / stakeholderShares;
        uint256 currentRatio = (rToken.balanceOf(address(this)) * BASE) / totalSupply;

        if (currentRatio <= stakedRatio) {
            return 0;
        }

        uint256 rewards = (stakeholderShares * (currentRatio - stakedRatio)) / BASE;

        return rewards;
    }

    function rewardForRToken(address stakeholder, uint256 rTokenAmount) public view returns (uint256) {
        uint256 stakeholderStake = stakeholderToStake[stakeholder].stakedRToken;
        uint256 stakeholderShares = stakeholderToStake[stakeholder].shares;

        require(stakeholderStake >= rTokenAmount, "Not enough staked!");

        uint256 stakedRatio = (stakeholderStake * BASE) / stakeholderShares;
        uint256 currentRatio = (rToken.balanceOf(address(this)) * BASE) / totalSupply;
        uint256 sharesToWithdraw = (rTokenAmount * stakeholderShares) / stakeholderStake;

        if (currentRatio <= stakedRatio) {
            return 0;
        }

        uint256 rewards = (sharesToWithdraw * (currentRatio - stakedRatio)) / BASE;

        return rewards;
    }

    function getTotalStakes() public view returns (uint256) {
        return totalStakes;
    }

    function getCurrentRewards() public view returns (uint256) {
        return rToken.balanceOf(address(this)) - totalStakes;
    }

    function getTotalStakeholders() public view returns (uint256) {
        return stakeholders.length();
    }

    function refundLockedRToken(uint256 from, uint256 to) public hasAdminRole {
        require(to <= stakeholders.length(), "Invalid `to` param");
        uint256 s;

        for (s = from; s < to; s += 1) {
            totalStakes -= stakeholderToStake[stakeholders.at(s)].stakedRToken;

            require(
                rToken.transfer(
                    stakeholders.at(s),
                    stakeholderToStake[stakeholders.at(s)].stakedRToken
                ),
                "RToken transfer failed"
            );

            stakeholderToStake[stakeholders.at(s)].stakedRToken = 0;
        }
    }

    function removeLockedRewards() public hasAdminRole {
        require(totalStakes == 0, "Stakeholders still have stakes");

        uint256 balance = rToken.balanceOf(address(this));

        require(rToken.transfer(msg.sender, balance), "RToken transfer failed");
    }
}
