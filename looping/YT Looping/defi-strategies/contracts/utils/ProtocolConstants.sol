// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/**
 * @title Protocol Constants
 * @notice Centralized constants for DeFi protocol addresses on Ethereum mainnet
 * @dev This library consolidates all protocol addresses to reduce code duplication
 *      and ensure consistency across all contracts
 */
library ProtocolConstants {
    
    // =============================================================
    //                        TOKEN ADDRESSES
    // =============================================================
    
    /// @notice Wrapped Ethereum (WETH) token address
    address internal constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    
    /// @notice USD Coin (USDC) token address
    address internal constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    
    /// @notice Tether USD (USDT) token address
    address internal constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
    
    /// @notice Ethena USD (USDe) token address
    address internal constant USDE = 0x4c9edd5852cd905f086c759e0a72d757;
    
    /// @notice Ethena Staked USD (eUSDe) token address - placeholder
    address internal constant EUSDE = address(0); // TODO: Update with correct eUSDe address when available

    // =============================================================
    //                        PENDLE PROTOCOL
    // =============================================================
    
    /// @notice Pendle Router V3 address
    address internal constant PENDLE_ROUTER = 0x888888888889758F76e7103c6CbF23ABbF58F946;
    
    /// @notice Pendle Market Factory address
    address internal constant PENDLE_MARKET_FACTORY = 0x1A6fCc85557BC4fB7B534ed835a03EF056552D52;
    
    /// @notice Pendle Adapter address
    address internal constant PENDLE_ADAPTER = 0xBf9fC05C99bDBa25fb44dfB323dE445178C0FbF3;

    // =============================================================
    //                        AAVE V3 PROTOCOL
    // =============================================================
    
    /// @notice Aave V3 Pool address
    address internal constant AAVE_POOL = 0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2;
    
    /// @notice Aave V3 Pool (alternative address)
    address internal constant AAVE_V3_POOL = 0x87870Bcd3e37e6C3cca04C8d0E4f82D2bC18aA18;
    
    /// @notice Aave Price Oracle address
    address internal constant AAVE_PRICE_ORACLE = 0x54586bE62E3c3580375aE3723C145253060Ca0C2;

    // =============================================================
    //                        UNISWAP V3 PROTOCOL
    // =============================================================
    
    /// @notice Uniswap V3 Router address
    address internal constant UNISWAP_ROUTER = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    
    /// @notice Uniswap V3 Factory address
    address internal constant UNISWAP_FACTORY = 0x1F98431c8aD98523631AE4a59f267346ea31F984;

    // =============================================================
    //                        BALANCER PROTOCOL
    // =============================================================
    
    /// @notice Balancer Vault address
    address internal constant BALANCER_VAULT = 0xBA12222222228d8Ba445958a75a0704d566BF2C8;

    // =============================================================
    //                        MORPHO PROTOCOL
    // =============================================================
    
    /// @notice Morpho Blue address
    address internal constant MORPHO_BLUE = 0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb;
    
    /// @notice Morpho Aave V3 address
    address internal constant MORPHO_AAVE_V3 = 0x33333aea097c193e66081E930c33020272b33333;

    // =============================================================
    //                        EULER PROTOCOL
    // =============================================================
    
    /// @notice Euler Main Pool address
    address internal constant EULER_MAIN_POOL = 0x27182842E098f60e3D576794A5bFFb0777E025d3;
    
    /// @notice Euler eUSDe Debt Token address
    address internal constant EULER_EUSDE_DEBT_TOKEN = 0x0Ef00DbAe1987AF7B80E7d05D4351e4b44F6DAA2;

    // =============================================================
    //                        ETHEREAL PROTOCOL
    // =============================================================
    
    /// @notice Ethereal Vault Factory address
    address internal constant ETHEREAL_VAULT_FACTORY = 0x4444444444444444444444444444444444444444;

    // =============================================================
    //                        USDE MARKET ADDRESSES
    // =============================================================
    
    /// @notice USDe Pendle Market address
    address internal constant USDE_MARKET = 0x9Df192D13D61609D1852461c4850595e1F56E714;
    
    /// @notice USDe SY token address
    address internal constant USDE_SY = 0xb47cbf6697a6518222c7af4098a43aefe2739c8c;
    
    /// @notice USDe YT token address
    address internal constant USDE_YT = 0x733ee9ba88f16023146ebc965b7a1da18a322464;
    
    /// @notice USDe PT token address
    address internal constant USDE_PT = 0x917459337caac939d41d7493b3999f571d20d667;

    // =============================================================
    //                        EUSDE MARKET ADDRESSES
    // =============================================================
    
    /// @notice eUSDe Pendle Market address
    address internal constant EUSDE_PENDLE_MARKET = 0x9Df192D13D61609D1852461c4850595e1F56E714;
    
    /// @notice eUSDe SY token address (actual)
    address internal constant EUSDE_SY_ACTUAL = 0x7ac8ca87959b1d5EDfe2df5325A37c304DCea4D0;

    // =============================================================
    //                        AAVE DEBT TOKENS
    // =============================================================
    
    /// @notice Aave USDe Variable Debt Token address
    address internal constant AAVE_USDE_DEBT_TOKEN = 0x015396E1F286289aE23a762088E863b3ec465145;
    
    /// @notice Aave USDe aToken address
    address internal constant AAVE_USDE_ATOKEN = 0x4F5923Fc5FD4a93352581b38B7cD26943012DECF;
    
    /// @notice Aave PT-USDe Debt Token address
    address internal constant AAVE_PT_USDE_DEBT_TOKEN = 0x312ffC57778CEfa11989733e6E08143E7E229c1c;
    
    /// @notice Aave eUSDe Variable Debt Token address - placeholder
    address internal constant AAVE_EUSDE_DEBT_TOKEN = 0x0000000000000000000000000000000000000000;
    
    /// @notice Aave eUSDe aToken address - placeholder
    address internal constant AAVE_EUSDE_ATOKEN = 0x0000000000000000000000000000000000000000;
    
    /// @notice Aave PT-eUSDe Debt Token address - placeholder
    address internal constant AAVE_PT_EUSDE_DEBT_TOKEN = 0x0000000000000000000000000000000000000000;

    // =============================================================
    //                        EULER VAULT ADDRESSES
    // =============================================================
    
    /// @notice Euler PT-USDe Vault address
    address internal constant EULER_PT_USDE_VAULT = 0x43356281a62dc8712C7186Ca02BA3aD906B6181D;
    
    /// @notice Euler PT-eUSDe Vault address - placeholder
    address internal constant EULER_PT_EUSDE_VAULT = 0x0000000000000000000000000000000000000000;

    // =============================================================
    //                        CONFIGURATION CONSTANTS
    // =============================================================
    
    /// @notice Maximum number of loops allowed in strategies
    uint256 internal constant MAX_LOOPS = 10;
    
    /// @notice Default maximum leverage (500 = 5x)
    uint256 internal constant DEFAULT_MAX_LEVERAGE = 500;
    
    /// @notice Default minimum health factor (150 = 1.5x)
    uint256 internal constant DEFAULT_MIN_HEALTH_FACTOR = 150;
    
    /// @notice Percentage denominator (10000 = 100%)
    uint256 internal constant PERCENTAGE_DENOMINATOR = 10000;
    
    /// @notice Default slippage tolerance (200 = 2%)
    uint256 internal constant DEFAULT_SLIPPAGE = 200;
}
