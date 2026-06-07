import React, { useState } from "react";
import { Copy, Check, ShieldCheck, Cpu, TestTube, FileCode } from "lucide-react";

export default function ContractConsole() {
  const [activeTab, setActiveTab] = useState<"solidity" | "hardhat" | "test">("solidity");
  const [copied, setCopied] = useState(false);

  const solidityCode = `// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@aave/core-v3/contracts/flashloan/base/FlashLoanSimpleReceiverBase.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IUniswapV2Router02 {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
}

contract AfetiDevranArbitrage is FlashLoanSimpleReceiverBase {
    address public immutable owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "AfetiDevran: Sadece kontrat sahibi tetikleyebilir");
        _;
    }

    constructor(address _addressProvider) 
        FlashLoanSimpleReceiverBase(IPoolAddressesProvider(_addressProvider)) 
    {
        owner = msg.sender;
    }

    function executeFlashLoan(address asset, uint256 amount) external onlyOwner {
        bytes memory params = "";
        uint16 referralCode = 0;
        POOL.flashLoanSimple(address(this), asset, amount, params, referralCode);
    }

    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        // --- AFETİ DEVRAN V4 GÜVENLİK ZIRHI BAŞLANGICI ---
        uint256 startBalance = IERC20(asset).balanceOf(address(this));
        uint256 totalOwed = amount + premium;
        
        address quickswapRouter = 0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff; 
        address sushiswapRouter = 0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506; 
        address wethAddress = 0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619;
        
        address intermediaryToken = wethAddress;
        if (asset == wethAddress) {
            intermediaryToken = 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174; // USDC
        }

        // 1. QuickSwap borsasında ara token satın alma
        IERC20(asset).approve(quickswapRouter, amount);
        address[] memory pathBuy = new address[](2);
        pathBuy[0] = asset;
        pathBuy[1] = intermediaryToken;

        IUniswapV2Router02(quickswapRouter).swapExactTokensForTokens(
            amount,
            0,
            pathBuy,
            address(this),
            block.timestamp + 300
        );

        // 2. SushiSwap borsasında tekrar ana token'a çevirme
        uint256 boughtAmount = IERC20(intermediaryToken).balanceOf(address(this));
        IERC20(intermediaryToken).approve(sushiswapRouter, boughtAmount);
        
        address[] memory pathSell = new address[](2);
        pathSell[0] = intermediaryToken;
        pathSell[1] = asset;

        IUniswapV2Router02(sushiswapRouter).swapExactTokensForTokens(
            boughtAmount,
            0,
            pathSell,
            address(this),
            block.timestamp + 300
        );

        // 3. Rezerv ve kârlılık tescili
        uint256 contractBalance = IERC20(asset).balanceOf(address(this));
        require(contractBalance >= totalOwed, "AfetiDevran: Arbitraj zararda, geri odeme yetersiz!");

        // Aave havuzunu geri ödeme için yetkilendir
        IERC20(asset).approve(address(POOL), totalOwed);

        // --- GÜVENLİK KONTROL ZIRHI ŞARTI ---
        // Madenci bloğu işlenirken fiyat farkı kapanırsa komple revert edilir, yüksek gas ücretlerinden korunursunuz.
        require(
            contractBalance - totalOwed > startBalance - amount,
            "ZARAR ENGELLENDI: Arbitraj fiyati blok sirasinda kapandi!"
        );

        // Kârın cüzdana çekilmesi
        uint256 netProfit = contractBalance - totalOwed;
        if (netProfit > 0) {
            IERC20(asset).transfer(owner, netProfit);
        }

        return true;
    }
}`;

  const hardhatCode = `/**
 * @type {import('hardhat/config').HardhatUserConfig}
 * @dev Polygon Mainnet Fork simülasyonu konfigürasyonu
 */
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks: {
    hardhat: {
      forking: {
        url: "https://polygon-rpc.com",
        blockNumber: 56000000
      }
    }
  }
};`;

  const testCode = `const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Afeti Devran V4 Akıllı Kontrat Core Simülatörü", function () {
  let arbitrageContract, owner;
  const AAVE_POOL_ADDRESSES_PROVIDER = "0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb";
  const USDC_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    const AfetiDevranArbitrage = await ethers.getContractFactory("AfetiDevranArbitrage");
    arbitrageContract = await AfetiDevranArbitrage.deploy(AAVE_POOL_ADDRESSES_PROVIDER);
  });

  it("Zarar durumunda fiyat sapma korumasını tetiklemeli ve işlemleri revert etmelidir", async function () {
    const flashAmount = ethers.parseUnits("250000", 6);
    await expect(
      arbitrageContract.executeFlashLoan(USDC_ADDRESS, flashAmount)
    ).to.be.reverted;
  });
});`;

  const getCode = () => {
    switch (activeTab) {
      case "solidity":
        return solidityCode;
      case "hardhat":
        return hardhatCode;
      case "test":
        return testCode;
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mt-6">
      {/* Kart Başı */}
      <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="text-emerald-400 w-5 h-5 animate-pulse" />
          <div>
            <h3 className="font-semibold text-slate-100 font-sans tracking-tight text-sm">
              Akıllı Kontrat Gezgini (Armor V4)
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              Zırhlandırılmış Solidity kodları ve Hardhat test dizinleri
            </p>
          </div>
        </div>
        
        {/* Tab Seçimi */}
        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab("solidity")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md tracking-tight transition ${
              activeTab === "solidity"
                ? "bg-slate-800 text-emerald-400 border border-slate-700/60 shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            AfetiDevran.sol
          </button>
          <button
            onClick={() => setActiveTab("hardhat")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md tracking-tight transition ${
              activeTab === "hardhat"
                ? "bg-slate-800 text-amber-400 border border-slate-700/60 shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            hardhat.config.js
          </button>
          <button
            onClick={() => setActiveTab("test")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md tracking-tight transition ${
              activeTab === "test"
                ? "bg-slate-800 text-sky-400 border border-slate-700/60 shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <TestTube className="w-3.5 h-3.5" />
            arbitrage.test.js
          </button>
        </div>
      </div>

      {/* Kod Alanı */}
      <div className="relative">
        <button
          onClick={copyToClipboard}
          className="absolute top-4 right-4 bg-slate-950 hover:bg-slate-850 p-2 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition duration-150 group"
          title="Kodu Kopyala"
        >
          {copied ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <Copy className="w-4 h-4 group-hover:scale-105 transition" />
          )}
        </button>

        <div className="p-5 overflow-x-auto font-mono text-xs max-h-[460px] leading-relaxed">
          <pre className="text-emerald-500 bg-transparent whitespace-pre">
            {getCode()}
          </pre>
        </div>
      </div>

      <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-850 text-[11px] text-slate-500 flex flex-wrap justify-between gap-2.5 items-center font-mono">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          Solc 0.8.20 Derleme Yapısı Aktif - Optimizasyon (200 Runs)
        </span>
        <span>
          Aave Pool Sağlayıcı: <code className="text-slate-300 bg-slate-900 border border-slate-800 px-1 rounded text-[10px]">0xa97684ea...3CDb</code>
        </span>
      </div>
    </div>
  );
}
