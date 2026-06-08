// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

interface IUniswapV2Router02 {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    function getAmountsOut(
        uint amountIn,
        address[] calldata path
    ) external view returns (uint[] memory amounts);
}

interface IPoolAddressesProvider {
    function getPool() external view returns (address);
}

interface IPool {
    function flashLoan(
        address receiverAddress,
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata interestRateModes,
        address onBehalfOf,
        bytes calldata params,
        uint16 referralCode
    ) external;
}

interface IFlashLoanReceiver {
    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external returns (bool);

    function ADDRESSES_PROVIDER() external view returns (IPoolAddressesProvider);
    function POOL() external view returns (IPool);
}

contract AfetiDevranArbitrage is IFlashLoanReceiver {
    address public immutable owner;
    IPoolAddressesProvider public immutable override ADDRESSES_PROVIDER;
    IPool public immutable override POOL;

    event MultiFlashLoanInitiated(address[] assets, uint256[] amounts);
    event ArbitrageSuccess(uint256 netProfit, address indexed asset);
    event SwapExecuted(string exchange, uint256 inputAmount, uint256 outputAmount);
    event KillSwitchActivated(uint256 failureCount);
    event FailureLogged(string reason, uint256 attemptNumber);

    uint256 private failureCount = 0;
    bool public isStopped = false;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner can call this");
        _;
    }

    modifier whenNotStopped() {
        require(!isStopped, "Kill Switch activated - bot stopped");
        _;
    }

    constructor() {
        owner = msg.sender;
        ADDRESSES_PROVIDER = IPoolAddressesProvider(0xA97684eAd0e402DC232d5a524153D7b0B733B4E3);
        POOL = IPool(0x794a61358D6845594F94dc1DB02A252b5b4814aD);
    }

    function executeMultiFlashLoan(
        address tradeAsset,
        uint256 tradeAmount,
        address gasAsset,
        uint256 gasAmount
    ) external onlyOwner whenNotStopped {
        // Gas threshold check: profit must exceed 2x estimated gas cost
        // For production: uncomment the line below
        // uint256 estimatedGasCost = 500000 * tx.gasprice;
        // require(tradeAmount > estimatedGasCost * 2, "Profit too low relative to gas cost");

        address[] memory assets = new address[](2);
        assets[0] = tradeAsset;
        assets[1] = gasAsset;

        uint256[] memory amounts = new uint256[](2);
        amounts[0] = tradeAmount;
        amounts[1] = gasAmount;

        uint256[] memory interestRateModes = new uint256[](2);
        interestRateModes[0] = 0;
        interestRateModes[1] = 0;

        emit MultiFlashLoanInitiated(assets, amounts);

        POOL.flashLoan(
            address(this),
            assets,
            amounts,
            interestRateModes,
            address(this),
            "",
            0
        );
    }

    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        require(msg.sender == address(POOL), "Caller must be Aave Pool");
        require(!isStopped, "Kill Switch active - operation blocked");

        address tradeAsset = assets[0];
        address gasAsset = assets[1];

        uint256 tradeAmount = amounts[0];
        uint256 gasAmount = amounts[1];

        uint256 tradeOwed = tradeAmount + premiums[0];
        uint256 gasOwed = gasAmount + premiums[1];

        uint256 startTradeBalance = IERC20(tradeAsset).balanceOf(address(this)) - tradeAmount;

        address quickswapRouter = 0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff;
        address sushiswapRouter = 0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506;
        address wethAddress = 0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619;

        address intermediaryToken = wethAddress;
        if (tradeAsset == wethAddress) {
            intermediaryToken = 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174;
        }

        // Step 1: Swap on QuickSwap
        IERC20(tradeAsset).approve(quickswapRouter, tradeAmount);

        address[] memory pathBuy = new address[](2);
        pathBuy[0] = tradeAsset;
        pathBuy[1] = intermediaryToken;

        uint256 deadline = block.timestamp + 300;
        uint256 minBuyAmount = (tradeAmount * 995) / 1000;

        uint[] memory buyAmounts = IUniswapV2Router02(quickswapRouter).swapExactTokensForTokens(
            tradeAmount,
            minBuyAmount,
            pathBuy,
            address(this),
            deadline
        );
        uint256 boughtIntermediaryAmount = buyAmounts[buyAmounts.length - 1];
        emit SwapExecuted("QuickSwap", tradeAmount, boughtIntermediaryAmount);

        // Step 2: Swap back on SushiSwap
        IERC20(intermediaryToken).approve(sushiswapRouter, boughtIntermediaryAmount);

        address[] memory pathSell = new address[](2);
        pathSell[0] = intermediaryToken;
        pathSell[1] = tradeAsset;

        uint256 minSellAmount = (boughtIntermediaryAmount * 995) / 1000;
        uint[] memory sellAmounts = IUniswapV2Router02(sushiswapRouter).swapExactTokensForTokens(
            boughtIntermediaryAmount,
            minSellAmount,
            pathSell,
            address(this),
            deadline
        );
        uint256 finalAssetAmount = sellAmounts[sellAmounts.length - 1];
        emit SwapExecuted("SushiSwap", boughtIntermediaryAmount, finalAssetAmount);

        // Step 3: Handle gas repayment
        uint256 currentTradeBalance = IERC20(tradeAsset).balanceOf(address(this));
        uint256 currentGasBalance = IERC20(gasAsset).balanceOf(address(this));

        if (currentGasBalance < gasOwed) {
            uint256 missingGas = gasOwed - currentGasBalance;
            IERC20(tradeAsset).approve(quickswapRouter, currentTradeBalance);

            address[] memory pathGasBuy = new address[](2);
            pathGasBuy[0] = tradeAsset;
            pathGasBuy[1] = gasAsset;

            IUniswapV2Router02(quickswapRouter).swapExactTokensForTokens(
                missingGas,
                0,
                pathGasBuy,
                address(this),
                deadline
            );
        }

        currentTradeBalance = IERC20(tradeAsset).balanceOf(address(this));
        currentGasBalance = IERC20(gasAsset).balanceOf(address(this));

        require(currentTradeBalance >= tradeOwed, "Insufficient trade balance for repayment");
        require(currentGasBalance >= gasOwed, "Insufficient gas balance for repayment");

        IERC20(tradeAsset).approve(address(POOL), tradeOwed);
        IERC20(gasAsset).approve(address(POOL), gasOwed);

        // Step 4: Check profit and handle Kill Switch
        uint256 profit = currentTradeBalance - tradeOwed - startTradeBalance;

        if (profit <= 0) {
            failureCount++;
            emit FailureLogged("Negative arbitrage profit", failureCount);

            if (failureCount >= 3) {
                isStopped = true;
                emit KillSwitchActivated(failureCount);
                revert("Kill Switch triggered - 3 failed attempts");
            }
            revert("Arbitrage unprofitable - insufficient spread or excessive slippage");
        }

        failureCount = 0;
        emit ArbitrageSuccess(profit, tradeAsset);

        uint256 netProfit = currentTradeBalance - tradeOwed;
        if (netProfit > 0) {
            IERC20(tradeAsset).transfer(owner, netProfit);
        }

        uint256 extraGas = currentGasBalance - gasOwed;
        if (extraGas > 0) {
            IERC20(gasAsset).transfer(owner, extraGas);
        }

        return true;
    }

    function resetKillSwitch() external onlyOwner {
        require(isStopped, "Kill Switch is not active");
        isStopped = false;
        failureCount = 0;
    }

    function withdrawToken(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        IERC20(token).transfer(owner, balance);
    }
}
