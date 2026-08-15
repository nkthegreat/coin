const { ethers } = require("ethers");

async function main() {
  // Ethereum Sepolia RPC
  const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
  const CONTRACT_ADDRESS = "0xCCbF413FdA35E498215E5c8E35A1C00dF1fd3d57";

  const privateKey = process.env.ADMIN_PRIVATE_KEY;
  const citizenAddress = process.env.CITIZEN_ADDRESS;
  const amount = process.env.AMOUNT || "5";

  if (!privateKey) {
    throw new Error("❌ Λείπει το ADMIN_PRIVATE_KEY από τα Secrets!");
  }

  if (!citizenAddress || !citizenAddress.startsWith("0x") || citizenAddress.length !== 42) {
    throw new Error("❌ Μη έγκυρη διεύθυνση πολίτη!");
  }

  // Το πραγματικό ABI του συμβολαίου σου
  const CONTRACT_ABI = [
    "function rewardRecycling(address citizen, uint256 amount) external",
    "function redeemMerchantCoins(address merchant, uint256 amount) external",
    "function balanceOf(address account) external view returns (uint256)"
  ];

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

  console.log("==========================================");
  console.log(`👤 Admin Wallet:  ${wallet.address}`);
  console.log(`🎯 Παραλήπτης:    ${citizenAddress}`);
  console.log(`🪙 Ποσό Επιβράβευσης: ${amount} GRC`);
  console.log("==========================================");

  const amountWei = ethers.parseEther(amount.toString());

  console.log("⏳ Εκτέλεση rewardRecycling()...");
  const tx = await contract.rewardRecycling(citizenAddress, amountWei);

  console.log("Tx Hash:", tx.hash);
  console.log(`Explorer: https://sepolia.etherscan.io/tx/${tx.hash}`);

  await tx.wait();
  console.log("🎉 Επιτυχής επιβράβευση πολίτη με GRC!");

  const citizenBal = await contract.balanceOf(citizenAddress);
  console.log(`💰 Νέο Υπόλοιπο Πολίτη: ${ethers.formatEther(citizenBal)} GRC`);
}

main().catch((err) => {
  console.error("❌ Σφάλμα:", err);
  process.exit(1);
});
