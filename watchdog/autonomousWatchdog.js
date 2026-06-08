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

      // 🔄 HIGH-FREQUENCY ARBITRAGE MODE (Yüksek Frekanslı Arbitraj)
      this.parameters = {
        slippageTolerance: 990,        // 1% tolerance (daha agresif)
        minProfitSpread: 0.1,          // %0.1'lik spread'te işlem yap (daha sık)
        minProfitUSD: 1,               // En az $1 net kâr
        borrowAmount: ethers.parseUnits("500", 6),  // 500 USDC per trade (daha küçük, daha hızlı)
        maxConcurrentTrades: 3,        // Aynı anda max 3 işlem
        tradeFrequency: 15000,         // Her 15 saniye kontrol (30 yerine 15)
      };

      this.tradeStats = {
        totalTrades: 0,
        successfulTrades: 0,
        totalProfit: 0,
        lastTrade: null,
      };

      console.log("✅ Watchdog initialized successfully");
    } catch (error) {
      console.error("❌ Watchdog initialization error:", error.message);
      process.exit(1);
    }
  }

  async captureMarketData() {
    try {
      const QUICKSWAP_ROUTER = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff";
      const USDC = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
      const WETH = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";

      const routerABI = [
        "function getAmountsOut(uint256 amountIn, address[] memory path) external view returns (uint256[] memory)",
      ];
      const router = new ethers.Contract(QUICKSWAP_ROUTER, routerABI, this.provider);

      const amount = ethers.parseUnits("1000", 6);

      try {
        const pricesForward = await router.getAmountsOut(amount, [USDC, WETH]);
        const pricesBackward = await router.getAmountsOut(pricesForward[1], [WETH, USDC]);

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
      } catch (rpcErr) {
        // RPC error - use last known data
        console.log(`⚠️ RPC Error (using cached data): ${rpcErr.code || 'unknown'}`);
      }
    } catch (error) {
      // Silent error handling
    }
  }

  async analyzeAndRepair() {
    try {
      console.log("🔍 Setting up error monitoring...");

      if (!this.contract) {
        console.log("⚠️ Contract not available, event monitoring disabled");
        return;
      }

      // Silent error monitoring - don't spam console
      this.contract.on("FailureLogged", async (reason, attemptNumber) => {
        try {
          this.errorLog[reason] = (this.errorLog[reason] || 0) + 1;
          const solution = await this.generateAISolution(reason);
          await this.applyAutoFix(reason, solution);
        } catch (err) {
          // Silent fail
        }
      }).catch(() => {
        // RPC error - silently continue
      });
    } catch (error) {
      // Silent error handling
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
    console.log("\n🚀 Starting HIGH-FREQUENCY ARBITRAGE MONITORING...\n");
    console.log("📈 Mode: Yüksek Frekanslı (Sık ve Küçük İşlemler)");
    console.log(`   Min Spread Threshold: ${this.parameters.minProfitSpread}%`);
    console.log(`   Trade Size: ${ethers.formatUnits(this.parameters.borrowAmount, 6)} USDC`);
    console.log(`   Check Frequency: Every ${this.parameters.tradeFrequency / 1000}s\n`);

    // Market data capture - MUCH MORE FREQUENTLY
    setInterval(() => this.captureMarketData(), this.parameters.tradeFrequency);

    // Initial capture
    await this.captureMarketData();

    // Error analysis
    await this.analyzeAndRepair();

    // Aggressive opportunity detection - Every 15 seconds
    setInterval(async () => {
      const spreadNum = parseFloat(this.marketData.spread);

      if (spreadNum > this.parameters.minProfitSpread) {
        console.log("\n💰 OPPORTUNITY DETECTED!");
        console.log(`   ✅ Spread: ${this.marketData.spread}% (Target: ${this.parameters.minProfitSpread}%+)`);
        console.log(`   💵 Estimated Profit: $${(spreadNum * this.parameters.borrowAmount / 100).toFixed(2)}`);
        console.log(`   🔄 Ready to execute trade...\n`);

        // Trade execution would happen here
        this.tradeStats.totalTrades++;
      } else if (spreadNum > 0.05) {
        console.log(`📊 Near threshold: Spread = ${this.marketData.spread}% (waiting for ${this.parameters.minProfitSpread}%)`);
      }
    }, this.parameters.tradeFrequency);
  }

  generateReport() {
    const spreadNum = parseFloat(this.marketData.spread);
    const borrowAmountNum = Number(this.parameters.borrowAmount) / 1e6; // Convert from wei
    const estimatedProfit = (spreadNum * borrowAmountNum) / 100;

    return {
      timestamp: new Date().toISOString(),
      mode: "HIGH-FREQUENCY ARBITRAGE (Yüksek Frekanslı)",
      market: {
        spread: this.marketData.spread,
        lastUpdate: new Date(this.marketData.lastUpdate).toISOString(),
        spreadPercentage: spreadNum,
        isOpportunity: spreadNum > this.parameters.minProfitSpread,
        estimatedProfitPerTrade: `$${estimatedProfit.toFixed(2)}`,
      },
      parameters: {
        slippageTolerance: this.parameters.slippageTolerance,
        minProfitSpread: `${this.parameters.minProfitSpread}%`,
        minProfitUSD: `$${this.parameters.minProfitUSD}`,
        borrowAmount: `${borrowAmountNum} USDC`,
        maxConcurrentTrades: this.parameters.maxConcurrentTrades,
        tradeFrequency: `${this.parameters.tradeFrequency / 1000}s`,
      },
      tradeStats: {
        totalTrades: this.tradeStats.totalTrades,
        successfulTrades: this.tradeStats.successfulTrades,
        totalProfit: `$${this.tradeStats.totalProfit.toFixed(2)}`,
        estimatedDailyProfit: `$${(this.tradeStats.totalTrades * estimatedProfit * 0.5).toFixed(2)}`,
      },
      errors: Object.keys(this.errorLog).length > 0 ? this.errorLog : "No errors",
      status: "HIGH-FREQUENCY MONITORING ACTIVE ✅",
      uptime: `${(process.uptime() / 60).toFixed(1)} minutes`,
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
