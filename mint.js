const { ethers } = require("ethers");

async function main() {
  const RPC_URL = "https://ethereum-sepolia.publicnode.com"; // ή Base Sepolia
  const CONTRACT_ADDRESS = "0x2Cf9Ba822670EC6c4b2AA04D871ceB9026aa6EB3"; // Το νέο σου address

  const privateKey = process.env.ADMIN_PRIVATE_KEY;
  const citizenAddress = process.env.CITIZEN_ADDRESS;
  const amountToMint = process.env.AMOUNT;

  if (!citizenAddress || !amountToMint) {
    throw new Error("Λείπουν οι παράμετροι citizen ή amount!");
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(privateKey, provider);

  const abi = [
    "function rewardRecycling(address citizen, uint256 amount) external"
  ];
  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

  console.log(`Πίστωση ${amountToMint} GRC στον πολίτη: ${citizenAddress}`);

  const amountWei = ethers.parseEther(amountToMint);
  const tx = await contract.rewardRecycling(citizenAddress, amountWei);
  console.log("Tx sent, Hash:", tx.hash);

  await tx.wait();
  console.log("✅ Minting ολοκληρώθηκε επιτυχώς!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
