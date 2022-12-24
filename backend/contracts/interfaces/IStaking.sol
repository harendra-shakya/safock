// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

interface IStaking {

    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Transfer(address indexed from, address indexed to, uint256 value);

    function name() external pure returns (string memory);

    function symbol() external pure returns (string memory);

    function decimals() external pure returns (uint8);

    function totalSupply() external view returns (uint256);

    function balanceOf(address owner) external view returns (uint256);

    function allowance(address owner, address spender) external view returns (uint256);

    function approve(address spender, uint256 value) external returns (bool);

    function transfer(address to, uint256 value) external returns (bool);

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) external returns (bool);

    function DOMAIN_SEPARATOR() external view returns (bytes32);

    function PERMIT_TYPEHASH() external pure returns (bytes32);

    function nonces(address owner) external view returns (uint256);

    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;

    function initialize(
        address admin1,
        address admin2,
        address _stkToken
    ) external;

    function pauseContract() external;

    function unPauseContract() external;

    function setInitialRatio(uint256 stakeAmount) external;

    function createStake(address to) external;

    function removeStake(address to) external;

    function getRTokenPerShare() external view returns (uint256);

    function stakeOf(address stakeholder) external view returns (uint256);

    function sharesOf(address stakeholder) external view returns (uint256);

    function rewardOf(address stakeholder) external view returns (uint256);

    function rewardForRToken(address stakeholder, uint256 stkAmount) external view returns (uint256);

    function getTotalStakes() external view returns (uint256);

    function getTotalShares() external view returns (uint256);

    function getCurrentRewards() external view returns (uint256);

    function getTotalStakeholders() external view returns (uint256);

    function refundLockedRToken(uint256 from, uint256 to) external;

    function removeLockedRewards() external;
}
