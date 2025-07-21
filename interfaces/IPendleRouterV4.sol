// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * @title IPendleRouterV4
 * @dev Interface for Pendle Router V4 contract
 * @notice The Pendle Router is the main entry point for all Pendle operations
 * including swapping, adding liquidity, and performing PT/YT operations.
 */
interface IPendleRouterV4 {
    
    // Structs for complex operations
    struct SwapData {
        SwapType swapType;
        address extRouter;
        bytes extCalldata;
        bool needScale;
    }
    
    struct TokenInput {
        address tokenIn;
        uint256 netTokenIn;
        address tokenMintSy;
        address bulk;
        address pendleSwap;
        SwapData swapData;
    }
    
    struct TokenOutput {
        address tokenOut;
        uint256 minTokenOut;
        address tokenRedeemSy;
        address bulk;
        address pendleSwap;
        SwapData swapData;
    }
    
    struct ApproxParams {
        uint256 guessMin;
        uint256 guessMax;
        uint256 guessOffchain;
        uint256 maxIteration;
        uint256 eps;
    }
    
    struct LimitOrderData {
        address limitRouter;
        uint256 epsSkipMarket;
        FillOrderParams[] normalFills;
        FillOrderParams[] flashFills;
        bytes optData;
    }
    
    struct FillOrderParams {
        Order order;
        bytes signature;
        uint256 makingAmount;
    }
    
    struct Order {
        uint256 salt;
        address maker;
        address receiver;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOut;
        uint256 deadline;
    }
    
    enum SwapType {
        NONE,
        KYBERSWAP,
        ONE_INCH,
        ETH_WETH
    }
    
    // Events
    event SwapPtForToken(
        address indexed receiver,
        address indexed market,
        address indexed token,
        uint256 exactPtIn,
        uint256 netTokenOut
    );
    
    event SwapTokenForPt(
        address indexed receiver,
        address indexed market,
        address indexed token,
        uint256 exactTokenIn,
        uint256 netPtOut
    );
    
    event SwapYtForToken(
        address indexed receiver,
        address indexed market,
        address indexed token,
        uint256 exactYtIn,
        uint256 netTokenOut
    );
    
    event SwapTokenForYt(
        address indexed receiver,
        address indexed market,
        address indexed token,
        uint256 exactTokenIn,
        uint256 netYtOut
    );
    
    // Core trading functions
    
    /**
     * @notice Swaps exact PT tokens for tokens
     * @param receiver The address to receive the output tokens
     * @param market The Pendle market address
     * @param exactPtIn The exact amount of PT tokens to swap
     * @param output The token output configuration
     * @param limit The limit order data (optional)
     * @return netTokenOut The amount of tokens received
     */
    function swapExactPtForToken(
        address receiver,
        address market,
        uint256 exactPtIn,
        TokenOutput calldata output,
        LimitOrderData calldata limit
    ) external payable returns (uint256 netTokenOut);
    
    /**
     * @notice Swaps tokens for exact PT tokens
     * @param receiver The address to receive the PT tokens
     * @param market The Pendle market address
     * @param exactPtOut The exact amount of PT tokens to receive
     * @param input The token input configuration
     * @param limit The limit order data (optional)
     * @return netTokenIn The amount of tokens used
     */
    function swapTokenForExactPt(
        address receiver,
        address market,
        uint256 exactPtOut,
        TokenInput calldata input,
        LimitOrderData calldata limit
    ) external payable returns (uint256 netTokenIn);
    
    /**
     * @notice Swaps exact tokens for PT tokens
     * @param receiver The address to receive the PT tokens
     * @param market The Pendle market address
     * @param minPtOut The minimum amount of PT tokens to receive
     * @param approx The approximation parameters
     * @param input The token input configuration
     * @param limit The limit order data (optional)
     * @return netPtOut The amount of PT tokens received
     */
    function swapExactTokenForPt(
        address receiver,
        address market,
        uint256 minPtOut,
        ApproxParams calldata approx,
        TokenInput calldata input,
        LimitOrderData calldata limit
    ) external payable returns (uint256 netPtOut);
    
    /**
     * @notice Swaps exact YT tokens for tokens
     * @param receiver The address to receive the output tokens
     * @param market The Pendle market address
     * @param exactYtIn The exact amount of YT tokens to swap
     * @param output The token output configuration
     * @param limit The limit order data (optional)
     * @return netTokenOut The amount of tokens received
     */
    function swapExactYtForToken(
        address receiver,
        address market,
        uint256 exactYtIn,
        TokenOutput calldata output,
        LimitOrderData calldata limit
    ) external payable returns (uint256 netTokenOut);
    
    /**
     * @notice Swaps exact tokens for YT tokens
     * @param receiver The address to receive the YT tokens
     * @param market The Pendle market address
     * @param minYtOut The minimum amount of YT tokens to receive
     * @param approx The approximation parameters
     * @param input The token input configuration
     * @param limit The limit order data (optional)
     * @return netYtOut The amount of YT tokens received
     */
    function swapExactTokenForYt(
        address receiver,
        address market,
        uint256 minYtOut,
        ApproxParams calldata approx,
        TokenInput calldata input,
        LimitOrderData calldata limit
    ) external payable returns (uint256 netYtOut);
    
    // Liquidity functions
    
    /**
     * @notice Adds liquidity to a Pendle market
     * @param receiver The address to receive the LP tokens
     * @param market The Pendle market address
     * @param input The token input configuration
     * @param minLpOut The minimum amount of LP tokens to receive
     * @param approx The approximation parameters
     * @return netLpOut The amount of LP tokens received
     */
    function addLiquiditySingleToken(
        address receiver,
        address market,
        TokenInput calldata input,
        uint256 minLpOut,
        ApproxParams calldata approx
    ) external payable returns (uint256 netLpOut);
    
    /**
     * @notice Removes liquidity from a Pendle market
     * @param receiver The address to receive the output tokens
     * @param market The Pendle market address
     * @param netLpToRemove The amount of LP tokens to remove
     * @param output The token output configuration
     * @return netTokenOut The amount of tokens received
     */
    function removeLiquiditySingleToken(
        address receiver,
        address market,
        uint256 netLpToRemove,
        TokenOutput calldata output
    ) external returns (uint256 netTokenOut);
    
    // PT/YT minting and redeeming
    
    /**
     * @notice Mints PT and YT tokens from SY tokens
     * @param receiver The address to receive the PT and YT tokens
     * @param SY The Standardized Yield token address
     * @param netSyIn The amount of SY tokens to use
     * @param minPtOut The minimum amount of PT tokens to receive
     * @param minYtOut The minimum amount of YT tokens to receive
     * @return netPtOut The amount of PT tokens minted
     * @return netYtOut The amount of YT tokens minted
     */
    function mintPyFromSy(
        address receiver,
        address SY,
        uint256 netSyIn,
        uint256 minPtOut,
        uint256 minYtOut
    ) external returns (uint256 netPtOut, uint256 netYtOut);
    
    /**
     * @notice Mints PT and YT tokens from input tokens
     * @param receiver The address to receive the PT and YT tokens
     * @param YT The Yield Token address
     * @param minPtOut The minimum amount of PT tokens to receive
     * @param minYtOut The minimum amount of YT tokens to receive
     * @param input The token input configuration
     * @return netPtOut The amount of PT tokens minted
     * @return netYtOut The amount of YT tokens minted
     */
    function mintPyFromToken(
        address receiver,
        address YT,
        uint256 minPtOut,
        uint256 minYtOut,
        TokenInput calldata input
    ) external payable returns (uint256 netPtOut, uint256 netYtOut);
    
    /**
     * @notice Redeems PT and YT tokens for SY tokens
     * @param receiver The address to receive the SY tokens
     * @param SY The Standardized Yield token address
     * @param netPtIn The amount of PT tokens to redeem
     * @param netYtIn The amount of YT tokens to redeem
     * @param minSyOut The minimum amount of SY tokens to receive
     * @return netSyOut The amount of SY tokens received
     */
    function redeemPyToSy(
        address receiver,
        address SY,
        uint256 netPtIn,
        uint256 netYtIn,
        uint256 minSyOut
    ) external returns (uint256 netSyOut);
    
    /**
     * @notice Redeems PT and YT tokens for output tokens
     * @param receiver The address to receive the output tokens
     * @param YT The Yield Token address
     * @param netPtIn The amount of PT tokens to redeem
     * @param netYtIn The amount of YT tokens to redeem
     * @param output The token output configuration
     * @return netTokenOut The amount of tokens received
     */
    function redeemPyToToken(
        address receiver,
        address YT,
        uint256 netPtIn,
        uint256 netYtIn,
        TokenOutput calldata output
    ) external returns (uint256 netTokenOut);
    
    // Utility functions
    
    /**
     * @notice Returns the factory address
     * @return The factory contract address
     */
    function factory() external view returns (address);
    
    /**
     * @notice Returns the WETH address
     * @return The WETH contract address
     */
    function weth() external view returns (address);
    
    /**
     * @notice Performs a multicall
     * @param data The array of call data
     * @return results The array of results
     */
    function multicall(bytes[] calldata data) external payable returns (bytes[] memory results);
    
    /**
     * @notice Performs a multicall with deadline
     * @param deadline The deadline for the multicall
     * @param data The array of call data
     * @return results The array of results
     */
    function multicallWithDeadline(
        uint256 deadline,
        bytes[] calldata data
    ) external payable returns (bytes[] memory results);
    
    /**
     * @notice Refunds ETH to the sender
     */
    function refundETH() external payable;
    
    /**
     * @notice Sweeps tokens to a recipient
     * @param token The token address
     * @param amountMinimum The minimum amount to sweep
     * @param recipient The recipient address
     */
    function sweepToken(address token, uint256 amountMinimum, address recipient) external payable;
    
    /**
     * @notice Unwraps WETH and sends ETH to recipient
     * @param amountMinimum The minimum amount to unwrap
     * @param recipient The recipient address
     */
    function unwrapWETH(uint256 amountMinimum, address recipient) external payable;
}
