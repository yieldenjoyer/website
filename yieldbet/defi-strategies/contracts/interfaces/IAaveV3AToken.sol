// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./IERC20.sol";

/**
 * @title IAaveV3AToken
 * @dev Interface for Aave V3 AToken contracts
 * @notice ATokens are interest-bearing tokens that are minted and burned upon supply and withdraw of assets
 * to the Aave protocol. They represent the user's underlying asset balance in the protocol.
 */
interface IAaveV3AToken is IERC20 {
    
    // Events
    event Initialized(
        address indexed underlyingAsset,
        address indexed pool,
        address treasury,
        address incentivesController,
        uint8 aTokenDecimals,
        string aTokenName,
        string aTokenSymbol,
        bytes params
    );
    
    event BalanceTransfer(
        address indexed from,
        address indexed to,
        uint256 value,
        uint256 index
    );
    
    event Mint(
        address indexed caller,
        address indexed onBehalfOf,
        uint256 value,
        uint256 balanceIncrease,
        uint256 index
    );
    
    event Burn(
        address indexed from,
        address indexed target,
        uint256 value,
        uint256 balanceIncrease,
        uint256 index
    );
    
    // Core functions
    
    /**
     * @notice Initializes the aToken
     * @param pool The pool contract that is initializing this contract
     * @param treasury The address of the Aave treasury, receiving the fees on this aToken
     * @param underlyingAsset The address of the underlying asset of this aToken (E.g. WETH for aWETH)
     * @param incentivesController The smart contract managing potential incentives distribution
     * @param aTokenDecimals The decimals of the aToken, same as the underlying asset's
     * @param aTokenName The name of the aToken
     * @param aTokenSymbol The symbol of the aToken
     * @param params A set of encoded parameters for additional initialization
     */
    function initialize(
        address pool,
        address treasury,
        address underlyingAsset,
        address incentivesController,
        uint8 aTokenDecimals,
        string calldata aTokenName,
        string calldata aTokenSymbol,
        bytes calldata params
    ) external;
    
    /**
     * @notice Mints `amount` aTokens to `user`
     * @param caller The address performing the mint
     * @param onBehalfOf The address of the user that will receive the minted aTokens
     * @param amount The amount of tokens getting minted
     * @param index The next liquidity index of the reserve
     * @return `true` if the the previous balance of the user was 0
     */
    function mint(
        address caller,
        address onBehalfOf,
        uint256 amount,
        uint256 index
    ) external returns (bool);
    
    /**
     * @notice Burns aTokens from `user` and sends the equivalent amount of underlying to `receiverOfUnderlying`
     * @param from The address from which the aTokens will be burned
     * @param receiverOfUnderlying The address that will receive the underlying
     * @param amount The amount being burned
     * @param index The next liquidity index of the reserve
     */
    function burn(
        address from,
        address receiverOfUnderlying,
        uint256 amount,
        uint256 index
    ) external;
    
    /**
     * @notice Mints aTokens to the reserve treasury
     * @param amount The amount of tokens getting minted
     * @param index The next liquidity index of the reserve
     */
    function mintToTreasury(uint256 amount, uint256 index) external;
    
    /**
     * @notice Transfers aTokens in the event of a borrow being liquidated, in case the liquidators reclaims the aToken
     * @param from The address getting liquidated, current owner of the aTokens
     * @param to The recipient
     * @param value The amount of tokens getting transferred
     */
    function transferOnLiquidation(
        address from,
        address to,
        uint256 value
    ) external;
    
    /**
     * @notice Transfers the underlying asset to `target`. Used by the Pool to transfer
     * assets in borrow(), withdraw() and flashLoan()
     * @param target The recipient of the underlying asset
     * @param amount The amount getting transferred
     */
    function transferUnderlyingTo(address target, uint256 amount) external;
    
    /**
     * @notice Handles the underlying received by the aToken after the transfer has been completed.
     * @param user The user executing the withdrawal
     * @param amount The amount getting withdrawn
     */
    function handleRepayment(address user, uint256 amount) external;
    
    /**
     * @notice Allow passing a signed message to approve spending
     * @param owner The owner of the funds
     * @param spender The spender
     * @param value The amount
     * @param deadline The deadline timestamp, type(uint256).max for max deadline
     * @param v Signature param
     * @param s Signature param
     * @param r Signature param
     */
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
    
    // View functions
    
    /**
     * @notice Returns the address of the underlying asset of this aToken (E.g. WETH for aWETH)
     * @return The address of the underlying asset
     */
    function UNDERLYING_ASSET_ADDRESS() external view returns (address);
    
    /**
     * @notice Returns the address of the Aave pool
     * @return The address of the pool
     */
    function POOL() external view returns (address);
    
    /**
     * @notice Returns the address of the incentives controller contract
     * @return The address of the incentives controller
     */
    function getIncentivesController() external view returns (address);
    
    /**
     * @notice Returns the scaled balance of the user
     * @param user The address of the user
     * @return The scaled balance of the user
     */
    function scaledBalanceOf(address user) external view returns (uint256);
    
    /**
     * @notice Returns the scaled balance of the user and the scaled total supply
     * @param user The address of the user
     * @return The scaled balance of the user
     * @return The scaled total supply
     */
    function getScaledUserBalanceAndSupply(address user)
        external
        view
        returns (uint256, uint256);
    
    /**
     * @notice Returns the scaled total supply of the variable debt token. Represents sum(debt/index)
     * @return The scaled total supply
     */
    function scaledTotalSupply() external view returns (uint256);
    
    /**
     * @notice Returns the previous balance of an user
     * @param user The address of the user
     * @return The previous balance of the user
     */
    function getPreviousIndex(address user) external view returns (uint256);
    
    /**
     * @notice Returns the domain separator for the token
     * @return The domain separator
     */
    function DOMAIN_SEPARATOR() external view returns (bytes32);
    
    /**
     * @notice Returns the nonce for owner
     * @param owner The address of the owner
     * @return The nonce
     */
    function nonces(address owner) external view returns (uint256);
    
    /**
     * @notice Rescue and transfer tokens locked in this contract
     * @param token The address of the token
     * @param to The address of the recipient
     * @param amount The amount of token to transfer
     */
    function rescueTokens(
        address token,
        address to,
        uint256 amount
    ) external;
    
    /**
     * @notice Returns the revision number of the contract
     * @return The revision number
     */
    function ATOKEN_REVISION() external view returns (uint256);
    
    // Additional utility functions
    
    /**
     * @notice Returns the user's current balance including accrued interest
     * @param user The address of the user
     * @return The current balance of the user
     */
    function balanceOf(address user) external view returns (uint256);
    
    /**
     * @notice Returns the total supply of the aToken
     * @return The total supply
     */
    function totalSupply() external view returns (uint256);
    
    /**
     * @notice Returns the name of the token
     * @return The name of the token
     */
    function name() external view returns (string memory);
    
    /**
     * @notice Returns the symbol of the token
     * @return The symbol of the token
     */
    function symbol() external view returns (string memory);
    
    /**
     * @notice Returns the decimals of the token
     * @return The decimals of the token
     */
    function decimals() external view returns (uint8);
    
    /**
     * @notice Returns the allowance of spender on behalf of owner
     * @param owner The owner of the tokens
     * @param spender The spender of the tokens
     * @return The allowance
     */
    function allowance(address owner, address spender) external view returns (uint256);
    
    /**
     * @notice Transfers amount tokens from the caller to recipient
     * @param recipient The recipient of the tokens
     * @param amount The amount of tokens to transfer
     * @return True if the transfer was successful
     */
    function transfer(address recipient, uint256 amount) external returns (bool);
    
    /**
     * @notice Approves spender to spend amount tokens on behalf of the caller
     * @param spender The spender of the tokens
     * @param amount The amount of tokens to approve
     * @return True if the approval was successful
     */
    function approve(address spender, uint256 amount) external returns (bool);
    
    /**
     * @notice Transfers amount tokens from sender to recipient
     * @param sender The sender of the tokens
     * @param recipient The recipient of the tokens
     * @param amount The amount of tokens to transfer
     * @return True if the transfer was successful
     */
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);
    
    /**
     * @notice Increases the allowance of spender by addedValue
     * @param spender The spender of the tokens
     * @param addedValue The amount to increase the allowance by
     * @return True if the operation was successful
     */
    function increaseAllowance(address spender, uint256 addedValue) external returns (bool);
    
    /**
     * @notice Decreases the allowance of spender by subtractedValue
     * @param spender The spender of the tokens
     * @param subtractedValue The amount to decrease the allowance by
     * @return True if the operation was successful
     */
    function decreaseAllowance(address spender, uint256 subtractedValue) external returns (bool);
}
