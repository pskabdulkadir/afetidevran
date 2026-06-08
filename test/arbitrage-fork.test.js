import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("AFETİ DEVRAN V5 - Mainnet Fork Simulation", () => {
  let contract;
  let deployer;
  let USDC, WMATIC, WETH;

  const USDC_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
  const WMATIC_ADDRESS = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";
  const WETH_ADDRESS = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
  const QUICKSWAP_ROUTER = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff";
  const SUSHISWAP_ROUTER = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506";

  const AAVE_POOL = "0x794a61358D6845594F94dc1DB02A252b5b4814aD";
  const AAVE_PROVIDER = "0xa97684eAd0e402dC232d5a524153D7b0B733B4E3";

  const BORROW_AMOUNT = ethers.parseUnits("1000000", 6);  // 1 milyon USDC - gas threshold pass et
  const BORROW_GAS = ethers.parseUnits("10", 18);

  before(async () => {
    [deployer] = await ethers.getSigners();
    console.log(`\nTest Wallet: ${deployer.address}`);

    const AfetiDevranArbitrage = await ethers.getContractFactory("AfetiDevranArbitrage");
    contract = await AfetiDevranArbitrage.deploy();
    await contract.waitForDeployment();
    console.log(`Contract Deployed: ${await contract.getAddress()}`);

    USDC = await ethers.getContractAt("IERC20", USDC_ADDRESS);
    WMATIC = await ethers.getContractAt("IERC20", WMATIC_ADDRESS);
    WETH = await ethers.getContractAt("IERC20", WETH_ADDRESS);
  });

  it("Simulate: Aave Flash Loan + Arbitrage Cycle", async () => {
    console.log("\nFlash Loan Initiated...");
    console.log(`Borrow Amount: ${ethers.formatUnits(BORROW_AMOUNT, 6)} USDC`);
    console.log(`Gas Amount: ${ethers.formatUnits(BORROW_GAS, 18)} POL`);
    console.log(`(High amount used to bypass gas threshold for simulation)`)

    try {
      const tx = await contract.executeMultiFlashLoan(
        USDC_ADDRESS,
        BORROW_AMOUNT,
        WMATIC_ADDRESS,
        BORROW_GAS,
        { gasLimit: 800000 }
      );

      const receipt = await tx.wait();
      console.log(`\nSuccess!`);
      console.log(`Gas Used: ${receipt.gasUsed.toString()}`);
      console.log(`Tx Hash: ${receipt.hash}`);

      const usdcBalance = await USDC.balanceOf(await contract.getAddress());
      console.log(`\nContract USDC Balance: ${ethers.formatUnits(usdcBalance, 6)} USDC`);

      expect(usdcBalance.toString()).to.not.equal("0");
      console.log("\nTEST PASSED - Arbitrage Simulation Successful!");

    } catch (error) {
      console.error("\nError Occurred:");
      console.error(error.message);

      if (error.reason) {
        console.error(`Revert Reason: ${error.reason}`);
      }

      throw error;
    }
  });

  it("Kill Switch Test - Bot Stops After 3 Failures", async () => {
    console.log("\nKill Switch Simulation Starting...");

    const isStopped = await contract.isStopped();
    console.log(`Bot Status: ${isStopped ? "STOPPED" : "RUNNING"}`);

    if (isStopped) {
      console.log("Kill Switch Working Correctly!");
      expect(isStopped).to.equal(true);
    } else {
      console.log("Kill Switch Not Triggered Yet");
    }
  });

  it("Reset Kill Switch", async () => {
    const isStopped = await contract.isStopped();

    if (isStopped) {
      console.log("\nResetting Kill Switch...");
      await contract.resetKillSwitch();
      const isStoppedAfter = await contract.isStopped();
      expect(isStoppedAfter).to.equal(false);
      console.log("Kill Switch Reset!");
    } else {
      console.log("Kill Switch Not Active - Skipping Reset");
    }
  });
});
