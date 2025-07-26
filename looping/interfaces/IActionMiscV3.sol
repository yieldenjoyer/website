// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * @title IActionMiscV3
 * @dev Interface for Pendle ActionMiscV3 contract
 * @notice This contract provides various utility functions for Pendle operations
 * including token swaps, PT/YT minting/redeeming, and market exit strategies.
 */
interface IActionMiscV3 {
    
    // Structs for complex operations
    struct TokenInput {
        address tokenIn;
        uint256 netTokenIn;
        address tokenMintSy;
        address pendleSwap;
        SwapData swapData;
    }
    
    struct TokenOutput {
        address tokenOut;
        uint256 minTokenOut;
        address tokenRedeemSy;
        address pendleSwap;
        SwapData swapData;
    }
    
    struct SwapData {
        uint8 swapType;
        address extRouter;
        bytes extCalldata;
        bool needScale;
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
        uint256 expiry;
        uint256 nonce;
        uint8 orderType;
        address token;
        address YT;
        address maker;
        address receiver;
        uint256 makingAmount;
        uint256 lnImpliedRate;
        uint256 failSafeRate;
        bytes permit;
    }
    
    struct SwapTokenData {
        address tokenIn;
        address tokenOut;
        uint256 minOut;
        SwapData swapData;
    }
    
    struct Call {
        bool allowFailure;
        bytes callData;
    }
    
    struct CallResult {
        bool success;
        bytes returnData;
    }
    
    struct YTRedemptionData {
        address yt;
        bool doRedeemInterest;
        bool doRedeemRewards;
        address tokenRedeemSy;
        uint256 minTokenRedeemOut;
    }
    
    struct ExitPostExpParams {
        uint256 netPtFromRemove;
        uint256 netSyFromRemove;
        uint256 netPtRedeem;
        uint256 netSyFromRedeem;
        uint256 totalSyOut;
    }
    
    struct ExitPreExpParams {
        uint256 netPtFromRemove;
        uint256 netSyFromRemove;
        uint256 netPyRedeem;
        uint256 netSyFromRedeem;
        uint256 netPtSwap;
        uint256 netYtSwap;
        uint256 netSyFromSwap;
        uint256 netSyFee;
        uint256 totalSyOut;
    }
    
    // Events
    event RedeemPyToToken(
        address caller,
        address tokenOut,
        address YT,
        address receiver,
        uint256 netPyIn,
        uint256 netTokenOut,
        uint256 netSyInterm
    );
    
    event RedeemPyToSy(
        address caller,
        address receiver,
        address YT,
        uint256 netPyIn,
        uint256 netSyOut
    );
    
    event MintSyFromToken(
        address caller,
        address tokenIn,
        address SY,
        address receiver,
        uint256 netTokenIn,
        uint256 netSyOut
    );
    
    event MintPyFromToken(
        address caller,
        address tokenIn,
        address YT,
        address receiver,
        uint256 netTokenIn,
        uint256 netPyOut,
        uint256 netSyInterm
    );
    
    event ExitPreExpToToken(
        address caller,
        address market,
        address token,
        address receiver,
        uint256 netLpIn,
        uint256 totalTokenOut,
        ExitPreExpParams params
    );
    
    event ExitPostExpToToken(
        address caller,
        address market,
        address token,
        address receiver,
        uint256 netLpIn,
        uint256 totalTokenOut,
        ExitPostExpParams params
    );
    
    // Core functions
    
    /**
     * @notice Performs a multi-call with optional failure handling
     * @param calls Array of calls to execute
     * @return res Array of results from each call
     */
    function multicall(Call[] calldata calls) external payable returns (CallResult[] memory res);
    
    /**
     * @notice Simulates a call to a target contract
     * @param target The target contract address
     * @param data The call data
     */
    function simulate(address target, bytes calldata data) external payable;
    
    /**
     * @notice Mints SY tokens from input tokens
     * @param receiver Address to receive the SY tokens
     * @param SY The SY token address
     * @param minSyOut Minimum amount of SY tokens to receive
     * @param input Token input configuration
     * @return netSyOut Amount of SY tokens received
     */
    function mintSyFromToken(
        address receiver,
        address SY,
        uint256 minSyOut,
        TokenInput calldata input
    ) external payable returns (uint256 netSyOut);
    
    /**
     * @notice Redeems SY tokens for output tokens
     * @param receiver Address to receive the output tokens
     * @param SY The SY token address
     * @param netSyIn Amount of SY tokens to redeem
     * @param output Token output configuration
     * @return netTokenOut Amount of output tokens received
     */
    function redeemSyToToken(
        address receiver,
        address SY,
        uint256 netSyIn,
        TokenOutput calldata output
    ) external returns (uint256 netTokenOut);
    
    /**
     * @notice Mints PT and YT tokens from SY tokens
     * @param receiver Address to receive the PT and YT tokens
     * @param YT The YT token address
     * @param netSyIn Amount of SY tokens to use
     * @param minPyOut Minimum amount of PT/YT tokens to receive
     * @return netPyOut Amount of PT/YT tokens received
     */
    function mintPyFromSy(
        address receiver,
        address YT,
        uint256 netSyIn,
        uint256 minPyOut
    ) external returns (uint256 netPyOut);
    
    /**
     * @notice Mints PT and YT tokens from input tokens
     * @param receiver Address to receive the PT and YT tokens
     * @param YT The YT token address
     * @param minPyOut Minimum amount of PT/YT tokens to receive
     * @param input Token input configuration
     * @return netPyOut Amount of PT/YT tokens received
     * @return netSyInterm Intermediate SY tokens used
     */
    function mintPyFromToken(
        address receiver,
        address YT,
        uint256 minPyOut,
        TokenInput calldata input
    ) external payable returns (uint256 netPyOut, uint256 netSyInterm);
    
    /**
     * @notice Redeems PT and YT tokens for SY tokens
     * @param receiver Address to receive the SY tokens
     * @param YT The YT token address
     * @param netPyIn Amount of PT/YT tokens to redeem
     * @param minSyOut Minimum amount of SY tokens to receive
     * @return netSyOut Amount of SY tokens received
     */
    function redeemPyToSy(
        address receiver,
        address YT,
        uint256 netPyIn,
        uint256 minSyOut
    ) external returns (uint256 netSyOut);
    
    /**
     * @notice Redeems PT and YT tokens for output tokens
     * @param receiver Address to receive the output tokens
     * @param YT The YT token address
     * @param netPyIn Amount of PT/YT tokens to redeem
     * @param output Token output configuration
     * @return netTokenOut Amount of output tokens received
     * @return netSyInterm Intermediate SY tokens used
     */
    function redeemPyToToken(
        address receiver,
        address YT,
        uint256 netPyIn,
        TokenOutput calldata output
    ) external returns (uint256 netTokenOut, uint256 netSyInterm);
    
    /**
     * @notice Swaps one token for another via SY
     * @param receiver Address to receive the output tokens
     * @param SY The SY token address
     * @param input Token input configuration
     * @param tokenRedeemSy Token to redeem from SY
     * @param minTokenOut Minimum amount of output tokens to receive
     * @return netTokenOut Amount of output tokens received
     * @return netSyInterm Intermediate SY tokens used
     */
    function swapTokenToTokenViaSy(
        address receiver,
        address SY,
        TokenInput calldata input,
        address tokenRedeemSy,
        uint256 minTokenOut
    ) external payable returns (uint256 netTokenOut, uint256 netSyInterm);
    
    /**
     * @notice Swaps multiple tokens in a single transaction
     * @param pendleSwap The Pendle swap contract address
     * @param swaps Array of swap configurations
     * @param netSwaps Array of net amounts for each swap
     * @return netOutFromSwaps Array of output amounts from each swap
     */
    function swapTokensToTokens(
        address pendleSwap,
        SwapTokenData[] calldata swaps,
        uint256[] calldata netSwaps
    ) external payable returns (uint256[] memory netOutFromSwaps);
    
    /**
     * @notice Exits a position before expiry to tokens
     * @param receiver Address to receive the tokens
     * @param market The market address
     * @param netPtIn Amount of PT tokens to use
     * @param netYtIn Amount of YT tokens to use
     * @param netLpIn Amount of LP tokens to use
     * @param output Token output configuration
     * @param limit Limit order configuration
     * @return totalTokenOut Total amount of tokens received
     * @return params Detailed exit parameters
     */
    function exitPreExpToToken(
        address receiver,
        address market,
        uint256 netPtIn,
        uint256 netYtIn,
        uint256 netLpIn,
        TokenOutput calldata output,
        LimitOrderData calldata limit
    ) external returns (uint256 totalTokenOut, ExitPreExpParams memory params);
    
    /**
     * @notice Exits a position before expiry to SY tokens
     * @param receiver Address to receive the SY tokens
     * @param market The market address
     * @param netPtIn Amount of PT tokens to use
     * @param netYtIn Amount of YT tokens to use
     * @param netLpIn Amount of LP tokens to use
     * @param minSyOut Minimum amount of SY tokens to receive
     * @param limit Limit order configuration
     * @return params Detailed exit parameters
     */
    function exitPreExpToSy(
        address receiver,
        address market,
        uint256 netPtIn,
        uint256 netYtIn,
        uint256 netLpIn,
        uint256 minSyOut,
        LimitOrderData calldata limit
    ) external returns (ExitPreExpParams memory params);
    
    /**
     * @notice Exits a position after expiry to tokens
     * @param receiver Address to receive the tokens
     * @param market The market address
     * @param netPtIn Amount of PT tokens to use
     * @param netLpIn Amount of LP tokens to use
     * @param output Token output configuration
     * @return totalTokenOut Total amount of tokens received
     * @return params Detailed exit parameters
     */
    function exitPostExpToToken(
        address receiver,
        address market,
        uint256 netPtIn,
        uint256 netLpIn,
        TokenOutput calldata output
    ) external returns (uint256 totalTokenOut, ExitPostExpParams memory params);
    
    /**
     * @notice Exits a position after expiry to SY tokens
     * @param receiver Address to receive the SY tokens
     * @param market The market address
     * @param netPtIn Amount of PT tokens to use
     * @param netLpIn Amount of LP tokens to use
     * @param minSyOut Minimum amount of SY tokens to receive
     * @return params Detailed exit parameters
     */
    function exitPostExpToSy(
        address receiver,
        address market,
        uint256 netPtIn,
        uint256 netLpIn,
        uint256 minSyOut
    ) external returns (ExitPostExpParams memory params);
    
    /**
     * @notice Redeems due interest and rewards
     * @param user The user address
     * @param sys Array of SY token addresses
     * @param yts Array of YT token addresses
     * @param markets Array of market addresses
     */
    function redeemDueInterestAndRewards(
        address user,
        address[] calldata sys,
        address[] calldata yts,
        address[] calldata markets
    ) external;
    
    /**
     * @notice Redeems due interest and rewards with token swaps
     * @param SYs Array of SY token addresses
     * @param YTs Array of YT redemption data
     * @param markets Array of market addresses
     * @param pendleSwap The Pendle swap contract address
     * @param swaps Array of swap configurations
     * @return netOutFromSwaps Array of output amounts from swaps
     * @return netInterests Array of interest amounts redeemed
     */
    function redeemDueInterestAndRewardsV2(
        address[] calldata SYs,
        YTRedemptionData[] calldata YTs,
        address[] calldata markets,
        address pendleSwap,
        SwapTokenData[] calldata swaps
    ) external returns (uint256[] memory netOutFromSwaps, uint256[] memory netInterests);
    
    /**
     * @notice Boosts multiple markets
     * @param markets Array of market addresses to boost
     */
    function boostMarkets(address[] calldata markets) external;
    
    /**
     * @notice Performs a complex multi-call with reflection
     * @param reflector The reflector contract address
     * @param selfCall1 First self-call data
     * @param selfCall2 Second self-call data
     * @param reflectCall Reflection call data
     * @return selfRes1 Result from first self-call
     * @return selfRes2 Result from second self-call
     * @return reflectRes Result from reflection call
     */
    function callAndReflect(
        address reflector,
        bytes calldata selfCall1,
        bytes calldata selfCall2,
        bytes calldata reflectCall
    ) external returns (bytes memory selfRes1, bytes memory selfRes2, bytes memory reflectRes);
}
