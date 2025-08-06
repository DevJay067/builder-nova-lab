const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting HealthRecordRegistry deployment...");

  // Get the contract factory
  const HealthRecordRegistry = await ethers.getContractFactory(
    "HealthRecordRegistry",
  );

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const deployerBalance = await ethers.provider.getBalance(deployerAddress);

  console.log("📋 Deployment Details:");
  console.log("   Deployer address:", deployerAddress);
  console.log(
    "   Deployer balance:",
    ethers.formatEther(deployerBalance),
    "ETH",
  );
  console.log("   Network:", (await ethers.provider.getNetwork()).name);
  console.log("   Chain ID:", (await ethers.provider.getNetwork()).chainId);

  // Estimate deployment cost
  const deploymentData = HealthRecordRegistry.interface.encodeDeploy([]);
  const estimatedGas = await ethers.provider.estimateGas({
    data: deploymentData,
  });
  const gasPrice = await ethers.provider.getFeeData();
  const estimatedCost = estimatedGas * gasPrice.gasPrice;

  console.log(
    "💰 Estimated deployment cost:",
    ethers.formatEther(estimatedCost),
    "ETH",
  );

  // Deploy the contract
  console.log("📤 Deploying HealthRecordRegistry contract...");

  const healthRegistry = await HealthRecordRegistry.deploy();
  await healthRegistry.waitForDeployment();

  const contractAddress = await healthRegistry.getAddress();
  const deploymentTx = healthRegistry.deploymentTransaction();

  console.log("✅ HealthRecordRegistry deployed successfully!");
  console.log("   Contract address:", contractAddress);
  console.log("   Transaction hash:", deploymentTx.hash);
  console.log("   Block number:", deploymentTx.blockNumber);
  console.log("   Gas used:", deploymentTx.gasLimit?.toString());

  // Wait for a few confirmations
  console.log("⏳ Waiting for confirmations...");
  await deploymentTx.wait(3);
  console.log("✅ Deployment confirmed with 3 blocks");

  // Verify contract state
  console.log("🔍 Verifying contract deployment...");
  try {
    const totalRecords = await healthRegistry.totalRecords();
    const owner = await healthRegistry.owner();

    console.log("   Total records:", totalRecords.toString());
    console.log("   Contract owner:", owner);
    console.log(
      "   Owner matches deployer:",
      owner.toLowerCase() === deployerAddress.toLowerCase(),
    );
  } catch (error) {
    console.warn("⚠️ Could not verify contract state:", error.message);
  }

  // Save deployment information
  const deploymentInfo = {
    contractName: "HealthRecordRegistry",
    contractAddress: contractAddress,
    deployerAddress: deployerAddress,
    transactionHash: deploymentTx.hash,
    blockNumber: deploymentTx.blockNumber,
    gasUsed: deploymentTx.gasLimit?.toString(),
    network: (await ethers.provider.getNetwork()).name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    deploymentTimestamp: new Date().toISOString(),
    abi: HealthRecordRegistry.interface.format("json"),
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info to file
  const networkName = (await ethers.provider.getNetwork()).name;
  const deploymentFile = path.join(
    deploymentsDir,
    `${networkName}-deployment.json`,
  );
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log("💾 Deployment info saved to:", deploymentFile);

  // Generate environment variables
  console.log("\n🔧 Environment Variables:");
  console.log(`HEALTH_REGISTRY_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(
    `BLOCKCHAIN_NETWORK_ID=${(await ethers.provider.getNetwork()).chainId}`,
  );
  console.log(
    `BLOCKCHAIN_PROVIDER_URL=${ethers.provider._getConnection().url}`,
  );

  // Generate frontend configuration
  const frontendConfig = {
    contractAddress: contractAddress,
    contractABI: JSON.parse(HealthRecordRegistry.interface.format("json")),
    networkId: Number((await ethers.provider.getNetwork()).chainId),
    networkName: (await ethers.provider.getNetwork()).name,
  };

  const frontendConfigFile = path.join(
    deploymentsDir,
    `${networkName}-frontend-config.json`,
  );
  fs.writeFileSync(frontendConfigFile, JSON.stringify(frontendConfig, null, 2));

  console.log("🌐 Frontend config saved to:", frontendConfigFile);

  // Contract verification instructions
  console.log("\n📝 Contract Verification:");
  console.log("To verify the contract on Etherscan/Polygonscan, run:");
  console.log(`npx hardhat verify --network ${networkName} ${contractAddress}`);

  console.log("\n🎉 Deployment completed successfully!");

  return {
    contractAddress,
    deploymentInfo,
  };
}

// Execute deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Deployment failed:", error);
      process.exit(1);
    });
}

module.exports = main;
