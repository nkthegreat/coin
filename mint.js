const { ethers } = require("ethers");

const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
const CONTRACT_ADDRESS = "0x3300f11d80eda5A056f93afb2bFf98A3D5DEcfB1";
const PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;

// Διεύθυνση του Πολίτη (αυτή που σου έβγαλε η οθόνη)
const CITIZEN_ADDRESS = "0x9afE7A2CA26f9623c8af16d2eB3D15AC3E4Da3cc";
const AMOUNT_TO_MINT = "5.0"; // 5 Green Coins

const ABI = [
  "function rewardRecycling(address citizen, uint256 amount) external"
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

  console.log(`Πίστωση ${AMOUNT_TO_MINT} GRC στον πολίτη: ${CITIZEN_ADDRESS}...`);
  
  const tx = await contract.rewardRecycling(
    CITIZEN_ADDRESS, 
    ethers.parseEther(AMOUNT_TO_MINT)
  );

  console.log("Αναμονή επιβεβαίωσης στο blockchain (Sepolia)...");
  await tx.wait();

  console.log("🎉 ΕΠΙΤΥΧΙΑ!");
  console.log("Tx Hash:", tx.hash);
  console.log(`Δες τη συναλλαγή: https://sepolia.etherscan.io/tx/${tx.hash}`);
}

main().catch(console.error);
