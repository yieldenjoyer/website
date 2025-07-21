// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

// Pendle Protocol Interfaces
interface IPendleRouter {
    function mintPtYt(
        address market,
        uint256 amount,
        address recipient
    ) external returns (uint256 ptMinted, uint256 ytMinted);
    
    function swapPtForToken(
        address market,
        uint256 ptAmount,
        address tokenOut,
        uint256 minTokenOut,
        address recipient
    ) external returns (uint256 amountOut);
    
    function swapYtForToken(
        address market,
        uint256 ytAmount,
        address tokenOut,
        uint256 minTokenOut,
        address recipient
    ) external returns (uint256 amountOut);
}

interface IPendleMarket {
    function readTokens() external view returns (
        address pt,
        address yt,
        address sy
    );
    
    function activeBalance(address user) external view returns (uint256);
    
    function totalActiveSupply() external view returns (uint256);
}

// Aave V3 Interfaces
interface IAavePool {
    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external;
    
    function borrow(
        address asset,
        uint256 amount,
        uint256 interestRateMode,
        uint16 referralCode,
        address onBehalfOf
    ) external;
    
    function repay(
        address asset,
        uint256 amount,
        uint256 interestRateMode,
        address onBehalfOf
    ) external returns (uint256);
    
    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external returns (uint256);
    
    function getUserAccountData(address user)
        external
        view
        returns (
            uint256 totalCollateralBase,
            uint256 totalDebtBase,
            uint256 availableBorrowsBase,
            uint256 currentLiquidationThreshold,
            uint256 ltv,
            uint256 healthFactor
        );
}

// Uniswap V3 Interfaces
interface IUniswapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }
    
    function exactInputSingle(ExactInputSingleParams calldata params)
        external
        payable
        returns (uint256 amountOut);
}

// Balancer V2 Interfaces
interface IBalancerVault {
    function flashLoan(
        IFlashLoanRecipient recipient,
        address[] calldata tokens,
        uint256[] calldata amounts,
        bytes calldata userData
    ) external;
}

interface IFlashLoanRecipient {
    function receiveFlashLoan(
        address[] calldata tokens,
        uint256[] calldata amounts,
        uint256[] calldata feeAmounts,
        bytes calldata userData
    ) external;
}

// Price Oracle Interfaces
interface IPriceOracle {
    function getAssetPrice(address asset) external view returns (uint256);
    
    function getAssetsPrices(address[] calldata assets)
        external
        view
        returns (uint256[] memory);
}

// Chainlink Price Feed Interface
interface AggregatorV3Interface {
    function decimals() external view returns (uint8);
    
    function description() external view returns (string memory);
    
    function version() external view returns (uint256);
    
    function getRoundData(uint80 _roundId)
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
    
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
}
