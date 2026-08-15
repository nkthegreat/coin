const { ethers } = require("ethers");

async function main() {
  const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
  const CONTRACT_ADDRESS = "0x59DdAD0414fc513524b1d15871F744C9987A855E";

  const privateKey = process.env.ADMIN_PRIVATE_KEY;
  const citizenAddress = process.env.CITIZEN_ADDRESS;
  const amountToMint = process.env.AMOUNT;

  if (!privateKey) {
    throw new Error("❌ Λείπει το ADMIN_PRIVATE_KEY από τα GitHub Secrets!");
  }

  if (!citizenAddress || !amountToMint) {
    throw new Error("❌ Λείπουν οι παράμετροι citizen ή amount!");
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(privateKey, provider);

  const abi = [
    "function rewardRecycling(address citizen, uint256 amount) external"
  ];
  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

  console.log(`🚀 [Ethereum Sepolia] Πίστωση ${amountToMint} GRC στον πολίτη: ${citizenAddress}`);

  const amountWei = ethers.parseEther(amountToMint.toString());
  const tx = await contract.rewardRecycling(citizenAddress, amountWei);
  console.log("Tx sent! Hash:", tx.hash);
  console.log(`Explorer: https://sepolia.etherscan.io/tx/${tx.hash}`);

  await tx.wait();
  console.log("✅ Minting ολοκληρώθηκε επιτυχώς στο Ethereum Sepolia!");
}

main().catch((err) => {
  console.error("❌ Σφάλμα:", err);
  process.exit(1);
});
