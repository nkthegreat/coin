const { ethers } = require("ethers");

async function main() {
  const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
  const privateKey = process.env.ADMIN_PRIVATE_KEY;
  const recipientAddress = process.env.RECIPIENT_ADDRESS;
  const amountEth = process.env.AMOUNT_ETH || "0.005";

  if (!privateKey) {
    throw new Error("❌ Λείπει το ADMIN_PRIVATE_KEY!");
  }

  if (!recipientAddress || !recipientAddress.startsWith("0x") || recipientAddress.length !== 42) {
    throw new Error("❌ Μη έγκυρη διεύθυνση παραλήπτη!");
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(privateKey, provider);

  const balance = await provider.getBalance(wallet.address);
  console.log(`Admin Wallet: ${wallet.address} | Balance: ${ethers.formatEther(balance)} ETH`);
  console.log(`🚀 Αποστολή ${amountEth} Sepolia ETH στον: ${recipientAddress}...`);

  const tx = await wallet.sendTransaction({
    to: recipientAddress,
    value: ethers.parseEther(amountEth)
  });

  console.log("Tx Hash:", tx.hash);
  console.log(`Explorer: https://sepolia.etherscan.io/tx/${tx.hash}`);

  await tx.wait();
  console.log("🎉 Επιτυχία! Στάλθηκε το Gas ETH!");
}

main().catch((err) => {
  console.error("❌ Σφάλμα:", err);
  process.exit(1);
});
