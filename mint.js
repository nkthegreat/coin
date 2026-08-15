const { ethers } = require("ethers");

async function main() {
  const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
  const privateKey = process.env.ADMIN_PRIVATE_KEY;
  
  // Το πορτοφόλι του πολίτη που χρειάζεται Gas
  const citizenAddress = "0x9afE7A2CA26f9623c8af16d2eB3D15AC3E4Da3cc";
  const amountEth = "0.01"; // Στέλνουμε 0.01 Sepolia ETH

  if (!privateKey) {
    throw new Error("❌ Λείπει το ADMIN_PRIVATE_KEY!");
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(privateKey, provider);

  const balance = await provider.getBalance(wallet.address);
  console.log(`Admin Wallet: ${wallet.address} | Balance: ${ethers.formatEther(balance)} ETH`);
  console.log(`🚀 Αποστολή ${amountEth} Sepolia ETH στον πολίτη: ${citizenAddress}...`);

  const tx = await wallet.sendTransaction({
    to: citizenAddress,
    value: ethers.parseEther(amountEth)
  });

  console.log("Tx Hash:", tx.hash);
  console.log(`Explorer: https://sepolia.etherscan.io/tx/${tx.hash}`);

  await tx.wait();
  console.log("🎉 Επιτυχία! Το πορτοφόλι του πολίτη γέμισε με Gas ETH!");
}

main().catch((err) => {
  console.error("❌ Σφάλμα:", err);
  process.exit(1);
});
