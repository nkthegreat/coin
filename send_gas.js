const { ethers } = require("ethers");

async function main() {
  const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
  const privateKey = process.env.ADMIN_PRIVATE_KEY;
  const recipientAddress = process.env.RECIPIENT_ADDRESS;
  const amountEth = process.env.AMOUNT_ETH || "0.005"; // Προεπιλογή 0.005 ETH

  if (!privateKey) {
    throw new Error("❌ Λείπει το ADMIN_PRIVATE_KEY από τα GitHub Secrets!");
  }

  if (!recipientAddress || !recipientAddress.startsWith("0x") || recipientAddress.length !== 42) {
    throw new Error("❌ Μη έγκυρη διεύθυνση παραλήπτη!");
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const adminWallet = new ethers.Wallet(privateKey, provider);

  const adminBalance = await provider.getBalance(adminWallet.address);
  console.log(`Admin Wallet: ${adminWallet.address}`);
  console.log(`Admin Balance: ${ethers.formatEther(adminBalance)} Sepolia ETH`);
  console.log(`🚀 Αποστολή ${amountEth} ETH στον παραλήπτη: ${recipientAddress}...`);

  const tx = await adminWallet.sendTransaction({
    to: recipientAddress,
    value: ethers.parseEther(amountEth.toString())
  });

  console.log("Tx Hash:", tx.hash);
  console.log(`Explorer: https://sepolia.etherscan.io/tx/${tx.hash}`);

  await tx.wait();
  console.log("✅ Η μεταφορά Gas ETH ολοκληρώθηκε επιτυχώς!");
}

main().catch((err) => {
  console.error("❌ Σφάλμα:", err);
  process.exit(1);
});
