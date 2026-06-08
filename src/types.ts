export interface TokenPair {
  id: string;
  name: string;
  symbolA: string;
  symbolB: string;
  routeType: string;
  addressA: string;
  addressB: string;
  decimalsA: number;
  decimalsB: number;
}

export interface ArbitrageOpportunity {
  id: string;
  timestamp: string;
  tokenPairId: string;
  tokenPairName: string;
  routeType: string;
  quickswapPrice: number;
  sushiswapPrice: number;
  spreadPercent: number;
  gasCostUsd: number;
  grossProfitUsd: number;
  netProfitUsd: number;
  isProfitable: boolean;
}

export interface BotConfig {
  polygonRpcUrl: string;
  minSpreadThreshold: number; // e.g. 1.5 (minimum spread % for execution)
  borrowAmountUsd: number; // e.g. 250000
  gasToBorrowPol: number; // e.g. 5
  isRunning: boolean;
  automaticExecution: boolean;
  gasLimitEstimate: number; // e.g. 360000;
  mevPrivateRelay: boolean;
  latencyThresholdMs: number; // e.g. 800
  omniChainEnabled: boolean;
  dynamicBatchingEnabled: boolean;
  mempoolScanningEnabled: boolean;
  contractAddress?: string; // Deployed arbitrage contract address
  forceExecutionThreshold?: number; // Force execution threshold (Siber Karargâh mode)
  skipProfitCheck?: boolean; // Skip profitability checks
  maxGasThreshold?: number; // Maximum gas limit
  minProfitThreshold?: number; // Minimum profit threshold in USD
}

export enum LogStatus {
  SUCCESS = "SUCCESS",
  FAILED_REVERT_PREVENTED = "FAILED_REVERT_PREVENTED",
  SKIPPED_GAS = "SKIPPED_GAS",
  BROADCAST_REVERTED = "BROADCAST_REVERTED",
  SCANNING = "SCANNING"
}

export interface ExecutionLog {
  id: string;
  timestamp: string;
  tokenPairId: string;
  tokenPairName: string;
  status: LogStatus;
  txHash?: string;
  borrowedAmountUsd: number;
  gasBorrowedPol: number; // Aave V5'ten otonom sızdırılan gaz POL miktarı
  gasCostUsd: number;
  grossProfitUsd: number;
  netProfitUsd: number;
  notes: string;
}

export interface WalletState {
  address: string;
  pol: number; // Abdulkadir'in cüzdanındaki POL (0 POL!)
  usdc: number;
  weth: number;
  wbtc: number;
  totalRevenueUsd: number;
  totalExpensesUsd: number; // POL harcanmadığı için 0 gider!
  totalGasBorrowedPol: number;
  loading?: boolean;
}

export interface SelfHealingLog {
  timestamp: string;
  title: string;
  desc: string;
  type: "INFO" | "WARNING" | "RESOLVED";
}

export interface ScannerState {
  currentBlockNumber: number;
  gasPriceGwei: number;
  maticPriceUsd: number;
  lastScannedAt: string;
}
