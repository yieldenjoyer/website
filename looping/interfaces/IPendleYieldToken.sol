// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

/**
 * @title IPendleYieldToken
 * @author Pendle
 * @notice Interface for Pendle Yield Token (YT) contracts
 * @dev YT represents the yield portion of a tokenized yield-bearing asset
 */
interface IPendleYieldToken {
    
    /**
     * @dev User interest tracking struct
     */
    struct UserInterest {
        uint128 index;
        uint128 accrued;
    }

    /**
     * @dev User reward tracking struct
     */
    struct UserReward {
        uint128 index;
        uint128 accrued;
    }

    /**
     * @dev Post expiry data struct
     */
    struct PostExpiryData {
        uint128 firstPYIndex;
        uint128 totalSyInterestForTreasury;
    }

    // ============ EVENTS ============

    /**
     * @dev Emitted when YT tokens are minted
     */
    event Mint(
        address indexed caller,
        address indexed receiverPT,
        address indexed receiverYT,
        uint256 amountSyToMint,
        uint256 amountPYOut
    );

    /**
     * @dev Emitted when YT tokens are burned/redeemed
     */
    event Burn(
        address indexed caller,
        address indexed receiver,
        uint256 amountPYToRedeem,
        uint256 amountSyOut
    );

    /**
     * @dev Emitted when interest is redeemed
     */
    event RedeemInterest(
        address indexed user,
        uint256 interestOut
    );

    /**
     * @dev Emitted when rewards are redeemed
     */
    event RedeemRewards(
        address indexed user,
        uint256[] amountRewardsOut
    );

    /**
     * @dev Emitted when interest index is updated
     */
    event NewInterestIndex(uint256 newIndex);

    /**
     * @dev Emitted when interest fee is collected
     */
    event CollectInterestFee(uint256 amountInterestFee);

    /**
     * @dev Emitted when reward fee is collected
     */
    event CollectRewardFee(
        address indexed rewardToken,
        uint256 amountRewardFee
    );

    /**
     * @dev Standard ERC20 Transfer event
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Standard ERC20 Approval event
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);

    // ============ VIEW FUNCTIONS ============

    /**
     * @notice Returns the underlying SY token address
     */
    function SY() external view returns (address);

    /**
     * @notice Returns the corresponding PT token address
     */
    function PT() external view returns (address);

    /**
     * @notice Returns the factory address
     */
    function factory() external view returns (address);

    /**
     * @notice Returns the expiry timestamp of the YT
     */
    function expiry() external view returns (uint256);

    /**
     * @notice Returns whether the YT has expired
     */
    function isExpired() external view returns (bool);

    /**
     * @notice Returns whether to cache index updates in same block
     */
    function doCacheIndexSameBlock() external view returns (bool);

    /**
     * @notice Returns the stored PY index
     */
    function pyIndexStored() external view returns (uint256);

    /**
     * @notice Returns the last updated block for PY index
     */
    function pyIndexLastUpdatedBlock() external view returns (uint128);

    /**
     * @notice Returns the SY reserve amount
     */
    function syReserve() external view returns (uint256);

    /**
     * @notice Returns post expiry data
     */
    function postExpiry() external view returns (uint128 firstPYIndex, uint128 totalSyInterestForTreasury);

    /**
     * @notice Returns user interest data
     */
    function userInterest(address user) external view returns (uint128 index, uint128 accrued);

    /**
     * @notice Returns user reward data for a specific reward token
     */
    function userReward(address user, address rewardToken) external view returns (uint128 index, uint128 accrued);

    /**
     * @notice Returns all reward token addresses
     */
    function getRewardTokens() external view returns (address[] memory);

    /**
     * @notice Returns post expiry data including reward indexes
     */
    function getPostExpiryData() external view returns (
        uint256 firstPYIndex,
        uint256 totalSyInterestForTreasury,
        uint256[] memory firstRewardIndexes,
        uint256[] memory userRewardOwed
    );

    // ============ STATE CHANGING FUNCTIONS ============

    /**
     * @notice Returns the current PY index (updates state)
     */
    function pyIndexCurrent() external returns (uint256 currentIndex);

    /**
     * @notice Returns the current reward indexes (updates state)
     */
    function rewardIndexesCurrent() external returns (uint256[] memory);

    /**
     * @notice Mints PT and YT tokens
     * @param receiverPT Address to receive PT tokens
     * @param receiverYT Address to receive YT tokens
     * @return amountPYOut Amount of PY tokens minted
     */
    function mintPY(address receiverPT, address receiverYT) external returns (uint256 amountPYOut);

    /**
     * @notice Mints PT and YT tokens in batch
     * @param receiverPTs Addresses to receive PT tokens
     * @param receiverYTs Addresses to receive YT tokens
     * @param amountSyToMints Amounts of SY to mint from
     * @return amountPYOuts Amounts of PY tokens minted
     */
    function mintPYMulti(
        address[] calldata receiverPTs,
        address[] calldata receiverYTs,
        uint256[] calldata amountSyToMints
    ) external returns (uint256[] memory amountPYOuts);

    /**
     * @notice Redeems PY tokens for SY tokens
     * @param receiver Address to receive SY tokens
     * @return amountSyOut Amount of SY tokens received
     */
    function redeemPY(address receiver) external returns (uint256 amountSyOut);

    /**
     * @notice Redeems PY tokens for SY tokens in batch
     * @param receivers Addresses to receive SY tokens
     * @param amountPYToRedeems Amounts of PY tokens to redeem
     * @return amountSyOuts Amounts of SY tokens received
     */
    function redeemPYMulti(
        address[] calldata receivers,
        uint256[] calldata amountPYToRedeems
    ) external returns (uint256[] memory amountSyOuts);

    /**
     * @notice Redeems accrued interest and rewards
     * @param user User address
     * @param redeemInterest Whether to redeem interest
     * @param redeemRewards Whether to redeem rewards
     * @return interestOut Amount of interest redeemed
     * @return rewardsOut Amounts of rewards redeemed
     */
    function redeemDueInterestAndRewards(
        address user,
        bool redeemInterest,
        bool redeemRewards
    ) external returns (uint256 interestOut, uint256[] memory rewardsOut);

    /**
     * @notice Redeems interest and rewards post expiry for treasury
     * @return interestOut Amount of interest redeemed
     * @return rewardsOut Amounts of rewards redeemed
     */
    function redeemInterestAndRewardsPostExpiryForTreasury() 
        external 
        returns (uint256 interestOut, uint256[] memory rewardsOut);

    /**
     * @notice Sets post expiry data (admin only)
     */
    function setPostExpiryData() external;

    // ============ ERC20 FUNCTIONS ============

    /**
     * @notice Returns the token name
     */
    function name() external view returns (string memory);

    /**
     * @notice Returns the token symbol
     */
    function symbol() external view returns (string memory);

    /**
     * @notice Returns the token decimals
     */
    function decimals() external view returns (uint8);

    /**
     * @notice Returns the total supply of tokens
     */
    function totalSupply() external view returns (uint256);

    /**
     * @notice Returns the balance of an account
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @notice Transfers tokens to a recipient
     */
    function transfer(address to, uint256 amount) external returns (bool);

    /**
     * @notice Returns the allowance of a spender for an owner
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @notice Approves a spender to spend tokens
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @notice Transfers tokens from one account to another
     */
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}
