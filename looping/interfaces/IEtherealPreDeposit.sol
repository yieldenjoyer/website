// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./IERC20.sol";

/**
 * @title IEtherealPreDeposit
 * @dev Interface for Ethereal Pre-Deposit contract
 * @notice This contract implements an ERC4626-like vault with deposit/withdrawal controls
 * and owner-managed deposit/withdrawal enabling/disabling functionality.
 */
interface IEtherealPreDeposit is IERC20 {
    
    // Events
    event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares);
    event Withdraw(address indexed sender, address indexed receiver, address indexed owner, uint256 assets, uint256 shares);
    event DepositsEnabled(bool enabled);
    event WithdrawalsEnabled(bool enabled);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    
    // Core ERC4626-like functions
    
    /**
     * @notice Returns the address of the underlying asset
     * @return The underlying asset address
     */
    function asset() external view returns (address);
    
    /**
     * @notice Returns the total amount of underlying assets managed by the vault
     * @return The total assets amount
     */
    function totalAssets() external view returns (uint256);
    
    /**
     * @notice Converts assets to shares
     * @param assets The amount of assets to convert
     * @return The equivalent amount of shares
     */
    function convertToShares(uint256 assets) external view returns (uint256);
    
    /**
     * @notice Converts shares to assets
     * @param shares The amount of shares to convert
     * @return The equivalent amount of assets
     */
    function convertToAssets(uint256 shares) external view returns (uint256);
    
    /**
     * @notice Returns the maximum amount of assets that can be deposited
     * @param receiver The address that would receive the shares
     * @return The maximum deposit amount
     */
    function maxDeposit(address receiver) external view returns (uint256);
    
    /**
     * @notice Returns the maximum amount of shares that can be minted
     * @param receiver The address that would receive the shares
     * @return The maximum mint amount
     */
    function maxMint(address receiver) external view returns (uint256);
    
    /**
     * @notice Returns the maximum amount of assets that can be withdrawn
     * @param owner The address that owns the shares
     * @return The maximum withdrawal amount
     */
    function maxWithdraw(address owner) external view returns (uint256);
    
    /**
     * @notice Returns the maximum amount of shares that can be redeemed
     * @param owner The address that owns the shares
     * @return The maximum redeem amount
     */
    function maxRedeem(address owner) external view returns (uint256);
    
    /**
     * @notice Previews the amount of shares that would be minted for a deposit
     * @param assets The amount of assets to deposit
     * @return The amount of shares that would be minted
     */
    function previewDeposit(uint256 assets) external view returns (uint256);
    
    /**
     * @notice Previews the amount of assets needed to mint shares
     * @param shares The amount of shares to mint
     * @return The amount of assets needed
     */
    function previewMint(uint256 shares) external view returns (uint256);
    
    /**
     * @notice Previews the amount of shares that would be burned for a withdrawal
     * @param assets The amount of assets to withdraw
     * @return The amount of shares that would be burned
     */
    function previewWithdraw(uint256 assets) external view returns (uint256);
    
    /**
     * @notice Previews the amount of assets that would be received for redeeming shares
     * @param shares The amount of shares to redeem
     * @return The amount of assets that would be received
     */
    function previewRedeem(uint256 shares) external view returns (uint256);
    
    /**
     * @notice Deposits assets and mints shares to receiver
     * @param assets The amount of assets to deposit
     * @param receiver The address to receive the shares
     * @return The amount of shares minted
     */
    function deposit(uint256 assets, address receiver) external returns (uint256);
    
    /**
     * @notice Mints shares to receiver by depositing assets
     * @param shares The amount of shares to mint
     * @param receiver The address to receive the shares
     * @return The amount of assets deposited
     */
    function mint(uint256 shares, address receiver) external returns (uint256);
    
    /**
     * @notice Withdraws assets from the vault
     * @param assets The amount of assets to withdraw
     * @param receiver The address to receive the assets
     * @param owner The address that owns the shares
     * @return The amount of shares burned
     */
    function withdraw(uint256 assets, address receiver, address owner) external returns (uint256);
    
    /**
     * @notice Redeems shares for assets
     * @param shares The amount of shares to redeem
     * @param receiver The address to receive the assets
     * @param owner The address that owns the shares
     * @return The amount of assets received
     */
    function redeem(uint256 shares, address receiver, address owner) external returns (uint256);
    
    // Control functions
    
    /**
     * @notice Returns whether deposits are currently enabled
     * @return True if deposits are enabled, false otherwise
     */
    function depositsEnabled() external view returns (bool);
    
    /**
     * @notice Returns whether withdrawals are currently enabled
     * @return True if withdrawals are enabled, false otherwise
     */
    function withdrawalsEnabled() external view returns (bool);
    
    /**
     * @notice Enables or disables deposits (only owner)
     * @param depositsEnabled_ True to enable deposits, false to disable
     */
    function setDepositsEnabled(bool depositsEnabled_) external;
    
    /**
     * @notice Enables or disables withdrawals (only owner)
     * @param withdrawalsEnabled_ True to enable withdrawals, false to disable
     */
    function setWithdrawalsEnabled(bool withdrawalsEnabled_) external;
    
    // Ownership functions
    
    /**
     * @notice Returns the owner of the contract
     * @return The owner address
     */
    function owner() external view returns (address);
    
    /**
     * @notice Transfers ownership to a new address (only owner)
     * @param newOwner The new owner address
     */
    function transferOwnership(address newOwner) external;
    
    /**
     * @notice Renounces ownership (only owner)
     */
    function renounceOwnership() external;
    
    // ERC20 functions are inherited from IERC20
    
    /**
     * @notice Returns the name of the token
     * @return The token name
     */
    function name() external view returns (string memory);
    
    /**
     * @notice Returns the symbol of the token
     * @return The token symbol
     */
    function symbol() external view returns (string memory);
    
    /**
     * @notice Returns the decimals of the token
     * @return The token decimals
     */
    function decimals() external view returns (uint8);
}
