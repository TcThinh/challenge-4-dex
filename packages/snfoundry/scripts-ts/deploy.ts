import { CallData } from "starknet";
import {
  deployContract,
  executeDeployCalls,
  exportDeployments,
  deployer,
  assertDeployerDefined,
  assertRpcNetworkActive,
  assertDeployerSignable,
} from "./deploy-contract";
import { green, yellow } from "./helpers/colorize-log";

// Constants for DEX initialization
const INITIAL_SUPPLY = 1000n * 10n ** 18n; // 1000 tokens with 18 decimals

/**
 * Deploy DEX and Balloons contracts for the challenge
 *
 * Based on project.md requirements:
 * 1. Deploy Balloons (ERC20 token) - mints 1000 $BAL to deployer
 * 2. Deploy DEX contract - takes Balloons token address
 * 3. Initialize DEX with liquidity (1000 BAL + 1000 STRK)
 */
const deployScript = async (): Promise<{
  balloons: { classHash: string; address: string };
  dex: { classHash: string; address: string };
}> => {
  console.log("🚀 Starting DEX deployment...");
  console.log(`👤 Deploying from: ${deployer.address}`);

  // Step 1: Deploy Balloons contract (ERC20 token)
  console.log("\n📄 Deploying Balloons contract...");
  const balloons = await deployContract({
    contract: "Balloons",
    contractName: "Balloons",
    constructorArgs: {
      recipient: deployer.address,
      initial_supply: INITIAL_SUPPLY,
    },
  });
  console.log(`✅ Balloons deployed at: ${balloons.address}`);

  // Step 2: Deploy DEX contract
  console.log("\n📄 Deploying DEX contract...");
  const dex = await deployContract({
    contract: "DEX",
    contractName: "DEX",
    constructorArgs: {
      token_addr: balloons.address,
      strk_addr:
        "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
    },
  });
  console.log(`✅ DEX deployed at: ${dex.address}`);

  console.log("\n🎯 Deployment Summary:");
  console.log(`📄 Balloons (BAL): ${balloons.address}`);
  console.log(`⚡ DEX: ${dex.address}`);

  // Step 3: Store deployment info for initialization
  console.log("\n💾 Storing deployment info...");

  // Note: The actual initialization (approve + init) will happen after executeDeployCalls
  // This is because we need the contracts to be actually deployed first

  return { balloons, dex };
};

/**
 * Initialize the DEX with initial liquidity after deployment
 */
const initializeDEX = async (
  balloonsAddress: string,
  dexAddress: string
): Promise<void> => {
  console.log("\n🎈 Initializing DEX with liquidity...");
  console.log(`💧 Adding initial liquidity: 1000 BAL + 1000 STRK`);

  try {
    // Step 1: Approve DEX to spend Balloons tokens
    console.log("1️⃣ Approving DEX to spend Balloons tokens...");
    const approveResponse = await deployer.execute([
      {
        contractAddress: balloonsAddress,
        entrypoint: "approve",
        calldata: CallData.compile({
          spender: dexAddress,
          amount: INITIAL_SUPPLY,
        }),
      },
    ]);
    console.log(`✅ Approval transaction: ${approveResponse.transaction_hash}`);

    // Step 2: Initialize DEX with tokens and STRK
    console.log("2️⃣ Initializing DEX with liquidity...");
    const initResponse = await deployer.execute([
      {
        contractAddress: dexAddress,
        entrypoint: "init",
        calldata: CallData.compile({
          tokens: INITIAL_SUPPLY, // 1000 BAL tokens
          strk: INITIAL_SUPPLY, // 1000 STRK tokens (equivalent)
        }),
      },
    ]);
    console.log(
      `✅ DEX initialization transaction: ${initResponse.transaction_hash}`
    );

    console.log("\n🚀 DEX is ready for trading!");
    console.log("💰 Initial reserves: 1000 BAL ↔ 1000 STRK");
    console.log("📊 Initial price: 1 BAL = 1 STRK");
  } catch (error) {
    console.log(
      yellow("\n⚠️  DEX initialization failed. Manual setup required:")
    );
    console.log(
      `1. Call approve(${dexAddress}, ${INITIAL_SUPPLY}) on Balloons contract`
    );
    console.log(
      `2. Call init(${INITIAL_SUPPLY}, ${INITIAL_SUPPLY}) on DEX contract`
    );
    console.log("Error details:", error.message);
  }
};

const main = async (): Promise<void> => {
  try {
    // Pre-deployment checks
    assertDeployerDefined();
    await Promise.all([assertRpcNetworkActive(), assertDeployerSignable()]);

    // Deploy contracts
    const { balloons, dex } = await deployScript();

    // Execute all deployment calls
    console.log("\n⚡ Executing deployment transactions...");
    await executeDeployCalls();

    // Export deployment addresses
    exportDeployments();

    // Initialize DEX with liquidity
    await initializeDEX(balloons.address, dex.address);

    console.log(green("\n✅ All Setup Done!"));
    console.log("🔗 Your DEX is ready for testing!");
    console.log("🌐 Access your app at: http://localhost:3000");
    console.log("🐛 Debug contracts at: http://localhost:3000/debug");
  } catch (err) {
    console.error("❌ Deployment failed:", err);
    process.exit(1);
  }
};

main();
