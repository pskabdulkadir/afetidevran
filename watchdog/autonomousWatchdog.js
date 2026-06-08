import { ethers } from "ethers";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const ARBITRAGE_ABI = [
  "function executeMultiFlashLoan(address,uint256,address,uint256) external",
  "function updateSlippageTolerance(uint256) external",
  "function updateMinProfit(uint256) external",
  "function captureMarketData(uint256,uint256) external",
  "function logError(string) external",
  "event FailureLogged(string,uint256)",
  "event ArbitrageSuccess(uint256,address)",
  "event ParameterUpdated(string,uint256,uint256)",
];

class AutonomousWatchdog {
  constructor() {
    try {
      this.provider = new ethers.JsonRpcProvider(process.env.POLYGON_ARCHIVE_URL);
      this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
      this.contractAddress = process.env.CONTRACT_ADDRESS;
      this.contract = new ethers.Contract(
        this.contractAddress,
        ARBITRAGE_ABI,
        this.signer
      );

      this.errorLog = {};
      this.marketData = { spread: 0, lastUpdate: 0 };
      this.parameters = {
        slippageTolerance: 995,
        minProfit: 100,
        borrowAmount: ethers.parseUnits("10000", 6),
      };

      console.log("✅ Watchdog initialized successfully");
    } catch (error) {
      console.error("❌ Watchdog initialization error:", error.message);
      process.exit(1);
    }
  }

  async captureMarketData() {
    try {
      console.log("📊 Capturing market data...");

      const QUICKSWAP_ROUTER = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff";
      const USDC = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
      const WETH = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";

      const routerABI = [
        "function getAmountsOut(uint256 amountIn, address[] memory path) external view returns (uint256[] memory)",
      ];
      const router = new ethers.Contract(QUICKSWAP_ROUTER, routerABI, this.provider);

      const amount = ethers.parseUnits("1000", 6);
      const pricesForward = await router.getAmountsOut(amount, [USDC, WETH]);
      const pricesBackward = await router.getAmountsOut(pricesForward[1], [WETH, USDC]);

      // Convert BigInt to number for calculation
      const amountNum = Number(amount);
      const backwardNum = Number(pricesBackward[1]);
      const spread = ((backwardNum - amountNum) / amountNum) * 100;

      this.marketData = {
        spread: spread.toFixed(4),
        lastUpdate: Date.now(),
        usdcWethPrice: pricesForward[1].toString(),
        wethUsdcPrice: pricesBackward[1].toString(),
      };

      console.log(`📊 Market Data: Spread = ${this.marketData.spread}%`);

      // Try to send to contract
      if (this.contractAddress) {
        try {
          await this.contract.captureMarketData(
            pricesForward[1],
            pricesBackward[1]
          );
        } catch (err) {
          console.log(`⚠️ Could not log to contract: ${err.message}`);
        }
      }
    } catch (error) {
      console.error("❌ Market data capture failed:", error.message);
    }
  }

  async analyzeAndRepair() {
    try {
      console.log("🔍 Setting up error monitoring...");

      if (!this.contract.listenerCount) {
        console.log("⚠️ Contract events unavailable, using fallback mode");
        return;
      }

      this.contract.on("FailureLogged", async (reason, attemptNumber) => {
        console.log(`⚠️ Error #${attemptNumber}: ${reason}`);
        this.errorLog[reason] = (this.errorLog[reason] || 0) + 1;

        const solution = await this.generateAISolution(reason);
        console.log(`💡 AI Solution: ${solution}`);

        await this.applyAutoFix(reason, solution);
      });
    } catch (error) {
      console.error("⚠️ Error analysis setup:", error.message);
    }
  }

  async generateAISolution(errorMsg) {
    try {
      const solutions = {
        "Profit too low relative to gas cost": "Reduce borrow amount",
        "Insufficient spread or excessive slippage": "Increase slippage tolerance to 1%",
        "Insufficient liquidity": "Try different DEX or split trade",
        default: "Retry with different parameters",
      };

      return solutions[errorMsg] || solutions.default;
    } catch (error) {
      return "Manual intervention required";
    }
  }

  async applyAutoFix(errorMsg, solution) {
    try {
      console.log(`🔧 Auto-fix: ${solution}`);

      if (errorMsg.includes("slippage")) {
        const newSlippage = Math.min(this.parameters.slippageTolerance - 5, 1000);
        try {
          await this.contract.updateSlippageTolerance(newSlippage);
          this.parameters.slippageTolerance = newSlippage;
          console.log(`✅ Slippage updated to ${newSlippage / 1000}%`);
        } catch (err) {
          console.log(`⚠️ Could not update slippage: ${err.message}`);
        }
      }

      if (errorMsg.includes("Profit")) {
        const newMinProfit = Math.max(this.parameters.minProfit - 10, 10);
        try {
          await this.contract.updateMinProfit(newMinProfit);
          this.parameters.minProfit = newMinProfit;
          console.log(`✅ Min profit updated to ${newMinProfit}`);
        } catch (err) {
          console.log(`⚠️ Could not update min profit: ${err.message}`);
        }
      }

      try {
        await this.contract.logError(errorMsg);
      } catch (err) {
        console.log(`⚠️ Could not log error: ${err.message}`);
      }
    } catch (error) {
      console.error("❌ Auto-fix failed:", error.message);
    }
  }

  async startMonitoring() {
    console.log("\n🚀 Starting autonomous monitoring...\n");

    // Market data every 30 seconds
    setInterval(() => this.captureMarketData(), 30000);

    // Error analysis
    await this.analyzeAndRepair();

    // Opportunity detection every 5 minutes
    setInterval(async () => {
      if (parseFloat(this.marketData.spread) > 0.3) {
        console.log("\n💰 Profitable opportunity detected!");
        console.log(`   Spread: ${this.marketData.spread}%`);
      }
    }, 300000);
  }

  generateReport() {
    return {
      timestamp: new Date().toISOString(),
      market: this.marketData,
      parameters: this.parameters,
      errors: this.errorLog,
      status: "Monitoring Active",
      uptime: process.uptime(),
    };
  }
}

// Initialize
console.log("=================================================");
console.log("🤖 AUTONOMOUS WATCHDOG SYSTEM");
console.log("=================================================\n");

const watchdog = new AutonomousWatchdog();

// Start monitoring
watchdog.startMonitoring();

// Initial market capture
await watchdog.captureMarketData();

// HTTP Server
const app = express();

app.get("/report", (req, res) => {
  res.json(watchdog.generateReport());
});

app.get("/health", (req, res) => {
  res.json({
    status: "Watchdog running",
    uptime: process.uptime(),
    lastUpdate: watchdog.marketData.lastUpdate,
  });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`\n📊 Dashboard running on http://localhost:${PORT}/report`);
  console.log(`💚 Health check: http://localhost:${PORT}/health\n`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`⚠️ Port ${PORT} in use, trying ${PORT + 1}...`);
    app.listen(PORT + 1);
  }
});

export default AutonomousWatchdog;
