import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying ParkingFeeCalculator to Sepolia...\n");

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "ETH\n");

  // Deployment parameters
  const PRICE_PER_BLOCK = 50; // 50 cents = $0.50 per 30-minute block
  const MAX_BLOCKS = 96; // 96 blocks = 48 hours maximum

  console.log("Deployment parameters:");
  console.log("  - Price per block:", PRICE_PER_BLOCK, "cents ($" + (PRICE_PER_BLOCK / 100).toFixed(2) + ")");
  console.log("  - Max blocks:", MAX_BLOCKS, "(" + (MAX_BLOCKS * 30 / 60) + " hours)");
  console.log("");

  // Deploy contract
  console.log("Deploying contract...");
  const ParkingFeeCalculator = await ethers.getContractFactory("ParkingFeeCalculator");
  const contract = await ParkingFeeCalculator.deploy(PRICE_PER_BLOCK, MAX_BLOCKS);

  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("\n✅ ParkingFeeCalculator deployed successfully!");
  console.log("   Contract address:", contractAddress);

  // Verify deployment
  console.log("\n📋 Verifying deployment...");
  const version = await contract.version();
  const owner = await contract.owner();
  const price = await contract.pricePerBlock();
  const maxBlocks = await contract.maxBlocks();
  const blockMinutes = await contract.BLOCK_MINUTES();

  console.log("   Version:", version);
  console.log("   Owner:", owner);
  console.log("   Price per block:", price.toString(), "cents");
  console.log("   Max blocks:", maxBlocks.toString());
  console.log("   Block size:", blockMinutes.toString(), "minutes");

  // Output for frontend configuration
  console.log("\n" + "=".repeat(60));
  console.log("📝 Add this to your .env file:");
  console.log("=".repeat(60));
  console.log(`VITE_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("=".repeat(60));

  // Etherscan verification command
  console.log("\n🔍 To verify on Etherscan, run:");
  console.log(`npx hardhat verify --network sepolia ${contractAddress} ${PRICE_PER_BLOCK} ${MAX_BLOCKS}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
