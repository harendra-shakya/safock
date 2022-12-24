// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

interface IStaking {
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
