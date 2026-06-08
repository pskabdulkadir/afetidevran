import { ethers } from "ethers";
import dotenv from "dotenv";
import express from "express";
import logger from "./logger.js";

dotenv.config();

/**
 * 🚀 MULTI-STRATEGY ENGINE
 * Advanced Arbitrage Bot with Multi-Pool Support
 * 
 * Features:
 * ✅ Multi-Pool Scanner (5+ pairs simultaneously)
 * ✅ Async Parallel Scanning
 * ✅ Nonce-Safe Transaction Manager
 * ✅ Dynamic Gas Optimization
 * ✅ Fault Tolerance
 * ✅ Queue-based Execution
 */

class MultiStrategyEngine {
  constructor() {
    // 🔄 MULTIPLE RPC PROVIDERS - Fallback sistemi
    this.rpcProviders = [
      process.env.POLYGON_ARCHIVE_URL || "https://polygon-mainnet.g.alchemy.com/v2/demo",
      "https://polygon.llamarpc.com",
      "https://polygon-rpc.com",
    ];

    this.currentRpcIndex = 0;
    this.provider = new ethers.JsonRpcProvider(this.rpcProviders[0]);
    this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    this.contractAddress = process.env.CONTRACT_ADDRESS;

    // RPC sağlık takibi
    this.rpcHealth = {
      isConnected: true,
      lastError: null,
      failureCount: 0,
      maxFailures: 3,
      totalFailures: 0, // Circuit breaker için
      isInSafeMode: false,
    };

    // RPC Latency tracking
    this.rpcLatency = {};
    this.initializeRPCLatencies();

    // Recovery loop
    this.setupRecoveryLoop();

    // 📊 TARGET PAIRS CONFIGURATION
    this.targetPairs = [
      {
        name: "WETH-USDC",
        token0: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", // WETH
        token1: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // USDC
        decimals0: 18,
        decimals1: 6,
        active: true,
      },
      {
        name: "MATIC-USDC",
        token0: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", // WMATIC
        token1: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // USDC
        decimals0: 18,
        decimals1: 6,
        active: true,
      },
      {
        name: "LINK-USDC",
        token0: "0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39", // LINK
        token1: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // USDC
        decimals0: 18,
        decimals1: 6,
        active: false, // ⚠️ DISABLED - Unrealistic spreads detected
      },
      {
        name: "UNI-USDC",
        token0: "0xb33EaAd8d922B1083446DC23f610c28dF6b56850", // UNI
        token1: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // USDC
        decimals0: 18,
        decimals1: 6,
        active: true,
      },
      {
        name: "WBTC-USDC",
        token0: "0x1bfd67037B42cf73acF2047067bd4303cb8e5b4a", // WBTC
        token1: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // USDC
        decimals0: 8,
        decimals1: 6,
        active: true,
      },
    ];

    // 🔄 DEXES
    this.dexes = [
      {
        name: "QuickSwap",
        router: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff",
        fee: 0.0025, // 0.25%
      },
      {
        name: "SushiSwap",
        router: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
        fee: 0.003, // 0.3%
      },
      {
        name: "Uniswap V3",
        router: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
        fee: 0.0005, // 0.05%
      },
    ];

    // 🎯 NONCE MANAGEMENT
    this.nonceManager = {
      currentNonce: null,
      pendingNonce: null,
      queue: [],
      isProcessing: false,
    };

    // 📊 MARKET DATA
    this.marketData = {
      pairs: {},
      spreads: {},
      lastUpdate: Date.now(),
      opportunities: [],
    };

    // 📈 STATS
    this.stats = {
      scansTotal: 0,
      opportunitiesFound: 0,
      tradesExecuted: 0,
      totalProfit: 0,
      startTime: Date.now(),
    };

    logger.info("✅ Multi-Strategy Engine initialized");
  }

  /**
   * 🔄 ASYNC PARALLEL SCANNING
   * Scan all pairs simultaneously + RPC health check + Safe Mode
   */
  async scanAllPairs() {
    try {
      // 🏥 Check RPC health before scanning
      const isRpcHealthy = await this.checkRPCHealth();

      if (!isRpcHealthy && !this.rpcHealth.isConnected) {
        if (this.rpcHealth.isInSafeMode) {
          logger.warn(`🔴 SAFE MODE - Waiting for RPC recovery...`);
        } else {
          logger.error(`🚨 RPC DISCONNECTED - Cannot scan pairs. Waiting for reconnection...`);
        }
        this.stats.scansTotal++;
        return; // Skip scanning if RPC is down
      }

      const scanPromises = this.targetPairs
        .filter(p => p.active)
        .map(pair => this.scanPair(pair));

      const results = await Promise.allSettled(scanPromises);

      results.forEach((result, idx) => {
        const pair = this.targetPairs[idx];
        if (result.status === "fulfilled") {
          this.marketData.pairs[pair.name] = result.value;
        } else if (result.status === "rejected") {
          logger.warn(`⚠️ ${pair.name}: Scan failed, marking as inactive temporarily`);
          pair.active = false;
          setTimeout(() => {
            pair.active = true;
          }, 30000); // Re-enable after 30 seconds
        }
      });

      this.stats.scansTotal++;
      this.checkForOpportunities();

      logger.info(`📊 Scanned ${this.stats.scansTotal} times | Opportunities: ${this.stats.opportunitiesFound}`);
    } catch (error) {
      logger.error(`❌ Scan error: ${error.message}`);
    }
  }

  /**
   * 🔍 SCAN SINGLE PAIR
   * Get prices from both DEXes for a pair
   *
   * ⚠️ With bad data validation
   */
  async scanPair(pair) {
    const routerABI = [
      "function getAmountsOut(uint256 amountIn, address[] memory path) external view returns (uint256[] memory)",
    ];

    const prices = {};

    // Scan both DEXes for this pair
    const dexPromises = this.dexes.slice(0, 2).map(async (dex) => {
      try {
        const router = new ethers.Contract(
          dex.router,
          routerABI,
          this.provider
        );

        const amount = ethers.parseUnits("1", pair.decimals0);
        const path = [pair.token0, pair.token1];
        const result = await router.getAmountsOut(amount, path);

        const priceOut = Number(result[1]) / Math.pow(10, pair.decimals1);

        // 🚨 SANITY CHECK - Detect unrealistic prices
        if (priceOut > 1000000 || priceOut < 0.0000001) {
          console.log(`   ⚠️ ${dex.name}: Price ${priceOut} seems unrealistic - BAD DATA`);
          return null; // Reject unrealistic price
        }

        return {
          dex: dex.name,
          priceOut: priceOut,
        };
      } catch (error) {
        return null;
      }
    });

    const dexResults = await Promise.allSettled(dexPromises);

    dexResults.forEach((result) => {
      if (result.status === "fulfilled" && result.value) {
        prices[result.value.dex] = result.value.priceOut;
      }
    });

    if (Object.keys(prices).length >= 2) {
      const dexArray = Object.entries(prices);

      // 🔍 VALIDATE PRICE CONSISTENCY
      const price1 = dexArray[0][1];
      const price2 = dexArray[1][1];

      // If one price is 0 or NaN, reject
      if (price1 === 0 || price2 === 0 || isNaN(price1) || isNaN(price2)) {
        throw new Error(`Invalid prices for ${pair.name}`);
      }

      const spread = ((price2 - price1) / price1) * 100;

      this.marketData.spreads[pair.name] = {
        spread: spread.toFixed(4),
        prices,
        timestamp: Date.now(),
        valid: true,
      };

      return { pair: pair.name, spread, prices };
    }

    throw new Error(`Could not get valid prices for ${pair.name}`);
  }

  /**
   * 🎯 CHECK FOR OPPORTUNITIES
   * Identify profitable arbitrage opportunities
   *
   * ⚠️ IMPORTANT: Filter out impossible spreads (honeypots, bad data)
   */
  checkForOpportunities() {
    const opportunities = [];

    // 🚨 SPREAD VALIDATION FILTERS
    const MIN_SPREAD = 0.05;    // Minimum 0.05% (realistic)
    const MAX_SPREAD = 5.0;     // Maximum 5% (anything above is suspicious)
    const REASONABLE_RANGE = { min: -0.5, max: 5.0 }; // Realistic spread range

    Object.entries(this.marketData.spreads).forEach(([pairName, data]) => {
      const spread = parseFloat(data.spread);

      // 🔍 VALIDATION CHECKS
      const isReasonable = spread >= REASONABLE_RANGE.min && spread <= REASONABLE_RANGE.max;
      const isOpportunity = spread >= MIN_SPREAD && spread <= MAX_SPREAD;

      if (!isReasonable) {
        console.log(`   ⚠️ ${pairName}: Spread ${spread.toFixed(4)}% - FILTERED OUT (unrealistic)`);
        return; // Skip this - likely bad data or honeypot
      }

      if (isOpportunity) {
        opportunities.push({
          pair: pairName,
          spread: spread.toFixed(4),
          prices: data.prices,
          profitEstimate: `$${Math.abs(spread * 5).toFixed(2)}`, // 500 USDC * spread%
          timestamp: new Date().toISOString(),
          riskLevel: spread > 3 ? "HIGH" : "NORMAL",
        });

        this.stats.opportunitiesFound++;
      }
    });

    this.marketData.opportunities = opportunities;

    if (opportunities.length > 0) {
      logger.info(`💰 OPPORTUNITIES DETECTED: ${opportunities.length}`);
      opportunities.forEach(opp => {
        const riskIcon = opp.riskLevel === "HIGH" ? "⚠️" : "✅";
        logger.info(`   ${riskIcon} ${opp.pair}: Spread ${opp.spread}% → ${opp.profitEstimate}`);
      });
    }
  }

  /**
   * ⛽ DYNAMIC GAS OPTIMIZATION
   * Get current gas price and optimize
   */
  async getOptimizedGasPrice() {
    try {
      const feeData = await this.provider.getFeeData();
      
      // Use fast gas price
      const gasPrice = feeData.gasPrice;
      const maxPriorityFee = feeData.maxPriorityFeePerGas;

      return {
        gasPrice: gasPrice ? (gasPrice * BigInt(110)) / BigInt(100) : null, // +10% for priority
        maxPriorityFee: maxPriorityFee || ethers.parseUnits("50", "gwei"),
        maxFeePerGas: feeData.maxFeePerGas || ethers.parseUnits("300", "gwei"),
      };
    } catch (error) {
      console.log("⚠️ Could not get dynamic gas price, using fallback");
      return {
        gasPrice: ethers.parseUnits("100", "gwei"),
        maxPriorityFee: ethers.parseUnits("50", "gwei"),
        maxFeePerGas: ethers.parseUnits("200", "gwei"),
      };
    }
  }

  /**
   * ⚡ INITIALIZE RPC LATENCIES
   * Measure latency for each RPC on startup
   */
  async initializeRPCLatencies() {
    logger.info("⚡ Measuring RPC latencies...");

    for (const rpcUrl of this.rpcProviders) {
      try {
        const start = Date.now();
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        await provider.getBlockNumber();
        const latency = Date.now() - start;

        this.rpcLatency[rpcUrl] = latency;
        logger.info(`   ${rpcUrl.substring(0, 40)}... → ${latency}ms`);
      } catch (error) {
        this.rpcLatency[rpcUrl] = Infinity; // Mark as unavailable
        logger.warn(`   ${rpcUrl.substring(0, 40)}... → UNAVAILABLE`);
      }
    }

    // En hızlısını seç ve primary olarak koy
    const fastestRpc = Object.entries(this.rpcLatency).sort(
      ([, a], [, b]) => a - b
    )[0];

    if (fastestRpc) {
      const fastestIndex = this.rpcProviders.indexOf(fastestRpc[0]);
      [this.rpcProviders[0], this.rpcProviders[fastestIndex]] = [
        this.rpcProviders[fastestIndex],
        this.rpcProviders[0],
      ];
      logger.info(
        `✅ Fastest RPC selected: ${fastestRpc[0].substring(0, 40)}... (${fastestRpc[1]}ms)`
      );
    }
  }

  /**
   * 🔄 RPC HEALTH CHECK & FAILOVER
   * Switch to backup RPC if primary fails
   */
  async switchToNextRPC() {
    try {
      this.currentRpcIndex = (this.currentRpcIndex + 1) % this.rpcProviders.length;
      const newRpcUrl = this.rpcProviders[this.currentRpcIndex];

      logger.warn(`🔄 Switching to backup RPC: ${newRpcUrl}`);

      this.provider = new ethers.JsonRpcProvider(newRpcUrl);
      this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);

      // Test connection
      await this.provider.getNetwork();

      this.rpcHealth.isConnected = true;
      this.rpcHealth.failureCount = 0;

      logger.info(`✅ Successfully switched to backup RPC`);
      return true;
    } catch (error) {
      logger.error(`❌ Failed to switch RPC: ${error.message}`);
      return false;
    }
  }

  /**
   * 🏥 CHECK RPC HEALTH
   */
  async checkRPCHealth() {
    try {
      const blockNumber = await this.provider.getBlockNumber();

      if (blockNumber === 0) {
        throw new Error("Invalid block number");
      }

      this.rpcHealth.isConnected = true;
      this.rpcHealth.failureCount = 0;

      // Exit safe mode if we recover
      if (this.rpcHealth.isInSafeMode) {
        logger.info("🟢 Exiting SAFE MODE - Connection restored!");
        this.rpcHealth.isInSafeMode = false;
      }

      return true;
    } catch (error) {
      logger.error(`⚠️ RPC Health Check Failed: ${error.message}`);

      this.rpcHealth.isConnected = false;
      this.rpcHealth.lastError = error.message;
      this.rpcHealth.failureCount++;
      this.rpcHealth.totalFailures++;

      // 3 başarısız deneme sonra fallback
      if (this.rpcHealth.failureCount >= this.rpcHealth.maxFailures) {
        logger.error(`🚨 RPC connection lost! Attempting failover...`);
        const switchSuccess = await this.switchToNextRPC();

        if (!switchSuccess && this.rpcHealth.totalFailures >= 9) {
          // Tüm RPC'ler fail (3 RPC × 3 fail = 9)
          this.activateSafeMode();
        }

        return switchSuccess;
      }

      return false;
    }
  }

  /**
   * 🔴 CIRCUIT BREAKER - SAFE MODE
   * Activate when all RPCs are down
   */
  activateSafeMode() {
    logger.error(`🔴 ALL RPC PROVIDERS DOWN - Entering SAFE MODE`);
    logger.error(`⏰ Bot will attempt automatic recovery every 30 seconds`);

    this.rpcHealth.isInSafeMode = true;
    this.marketData.opportunities = []; // Clear opportunities in safe mode
  }

  /**
   * 🔄 SETUP RECOVERY LOOP
   * Automatic recovery attempt when in safe mode
   */
  setupRecoveryLoop() {
    setInterval(async () => {
      if (this.rpcHealth.isInSafeMode) {
        logger.warn(`🔄 Safe Mode - Attempting recovery...`);

        const recovered = await this.checkRPCHealth();

        if (recovered) {
          logger.info(`✅ RECOVERED FROM SAFE MODE!`);
          this.rpcHealth.isInSafeMode = false;
          this.rpcHealth.totalFailures = 0;
        }
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * 🔐 NONCE-SAFE TRANSACTION MANAGER
   * Queue and execute transactions safely
   */
  async initializeNonceManager() {
    try {
      this.nonceManager.currentNonce = await this.provider.getTransactionCount(
        this.signer.address
      );
      this.nonceManager.pendingNonce = this.nonceManager.currentNonce;
      logger.info(`✅ Nonce Manager initialized (Current: ${this.nonceManager.currentNonce})`);
    } catch (error) {
      console.error("❌ Nonce initialization failed:", error.message);
    }
  }

  /**
   * 📤 QUEUE TRANSACTION FOR EXECUTION
   */
  queueTransaction(txData) {
    this.nonceManager.queue.push({
      ...txData,
      nonce: this.nonceManager.pendingNonce++,
      createdAt: Date.now(),
    });

    if (!this.nonceManager.isProcessing) {
      this.processTransactionQueue();
    }
  }

  /**
   * 🔄 PROCESS TRANSACTION QUEUE
   * Execute queued transactions sequentially
   */
  async processTransactionQueue() {
    if (this.nonceManager.isProcessing || this.nonceManager.queue.length === 0) {
      return;
    }

    this.nonceManager.isProcessing = true;

    while (this.nonceManager.queue.length > 0) {
      const txData = this.nonceManager.queue.shift();

      try {
        const gasConfig = await this.getOptimizedGasPrice();

        const tx = await this.signer.sendTransaction({
          to: txData.to,
          data: txData.data,
          nonce: txData.nonce,
          ...gasConfig,
          gasLimit: 800000,
        });

        console.log(`✅ TX #${txData.nonce} sent: ${tx.hash}`);
        this.stats.tradesExecuted++;

        // Wait for confirmation
        const receipt = await tx.wait();
        console.log(`✅ TX #${txData.nonce} confirmed`);
      } catch (error) {
        console.error(`❌ TX #${txData.nonce} failed:`, error.message);
      }

      // Wait before next transaction
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.nonceManager.isProcessing = false;
  }

  /**
   * 📊 GENERATE COMPREHENSIVE REPORT
   */
  generateReport() {
    const uptime = (Date.now() - this.stats.startTime) / 1000 / 60; // minutes

    return {
      mode: "MULTI-STRATEGY ENGINE (Piyasa Kontrol Merkezi)",
      status: this.rpcHealth.isConnected ? "🟢 ACTIVE" : "🔴 DISCONNECTED",
      rpcStatus: {
        connected: this.rpcHealth.isConnected,
        currentProvider: this.rpcProviders[this.currentRpcIndex],
        failureCount: this.rpcHealth.failureCount,
        totalFailures: this.rpcHealth.totalFailures,
        lastError: this.rpcHealth.lastError,
        safeMode: this.rpcHealth.isInSafeMode,
        safeModeTip: this.rpcHealth.isInSafeMode ? "Auto-recovery running (30s check interval)" : "Normal operation",
      },
      uptime: `${uptime.toFixed(1)} minutes`,
      pairs: {
        active: this.targetPairs.filter(p => p.active).length,
        total: this.targetPairs.length,
        list: this.targetPairs.map(p => ({
          name: p.name,
          status: p.active ? "🟢 Active" : "🔴 Inactive",
          spread: this.marketData.spreads[p.name]?.spread || "N/A",
        })),
      },
      opportunities: this.marketData.opportunities.slice(0, 5),
      statistics: {
        totalScans: this.stats.scansTotal,
        opportunitiesFound: this.stats.opportunitiesFound,
        tradesExecuted: this.stats.tradesExecuted,
        totalProfit: `$${this.stats.totalProfit.toFixed(2)}`,
        scanRate: `${(this.stats.scansTotal / uptime).toFixed(1)} scans/min`,
      },
      nonce: {
        current: this.nonceManager.currentNonce,
        pending: this.nonceManager.pendingNonce,
        queued: this.nonceManager.queue.length,
      },
    };
  }

  /**
   * 🚀 START ENGINE
   */
  async start() {
    logger.info("=================================================");
    logger.info("🚀 MULTI-STRATEGY ENGINE STARTING");
    logger.info("=================================================");

    await this.initializeNonceManager();

    // Scan pairs every 10 seconds (faster than before)
    setInterval(() => this.scanAllPairs(), 10000);

    // Initial scan
    await this.scanAllPairs();

    logger.info("✅ Engine started - Scanning all pairs...");
  }
}

// ==========================================
// INITIALIZE AND START
// ==========================================

const engine = new MultiStrategyEngine();

// Start the engine
engine.start();

// ==========================================
// EXPRESS DASHBOARD
// ==========================================

const app = express();

app.get("/report", (req, res) => {
  res.json(engine.generateReport());
});

app.get("/health", (req, res) => {
  res.json({
    status: "Multi-Strategy Engine Running ✅",
    pairsScanned: engine.targetPairs.filter(p => p.active).length,
    opportunitiesDetected: engine.stats.opportunitiesFound,
    uptime: `${((Date.now() - engine.stats.startTime) / 1000 / 60).toFixed(1)} minutes`,
  });
});

app.get("/pairs", (req, res) => {
  res.json(engine.targetPairs.map(p => ({
    name: p.name,
    status: p.active ? "✅ Active" : "⚠️ Inactive",
    spread: engine.marketData.spreads[p.name]?.spread || "N/A",
    prices: engine.marketData.spreads[p.name]?.prices || {},
  })));
});

app.get("/opportunities", (req, res) => {
  res.json(engine.marketData.opportunities);
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  logger.info(`📊 Dashboard: http://localhost:${PORT}/report`);
  logger.info(`💚 Health: http://localhost:${PORT}/health`);
  logger.info(`📈 Pairs: http://localhost:${PORT}/pairs`);
  logger.info(`💰 Opportunities: http://localhost:${PORT}/opportunities`);
  logger.info(`📁 Logs saved to: ./logs/`);
});

export default MultiStrategyEngine;
