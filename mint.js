const { ethers } = require("ethers");

async function main() {
  const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
  const CONTRACT_ADDRESS = "0x59DdAD0414fc513524b1d15871F744C9987A855E";

  const privateKey = process.env.ADMIN_PRIVATE_KEY;
  const citizenAddress = process.env.CITIZEN_ADDRESS;
  const amount = process.env.AMOUNT || "5";

  if (!privateKey) {
    throw new Error("❌ Λείπει το ADMIN_PRIVATE_KEY!");
  }

  if (!citizenAddress || !citizenAddress.startsWith("0x") || citizenAddress.length !== 42) {
    throw new Error("❌ Μη έγκυρη διεύθυνση παραλήπτη!");
  }

  // Προσθήκη owner() στο ABI για αυτόματο έλεγχο
  const CONTRACT_ABI = [
    "function owner() view returns (address)",
    "function mint(address to, uint256 amount) public",
    "function balanceOf(address owner) view returns (uint256)"
  ];

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const adminWallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, adminWallet);

  console.log("==========================================");
  console.log(`👤 Admin Wallet:  ${adminWallet.address}`);
  console.log(`🎯 Παραλήπτης:    ${citizenAddress}`);
  console.log(`🪙 Ποσό:          ${amount} GRC`);

  // 1. Έλεγχος Υπολοίπου ETH του Admin
  const adminEthBal = await provider.getBalance(adminWallet.address);
  console.log(`⛽ Admin Gas ETH:  ${ethers.formatEther(adminEthBal)} Sepolia ETH`);
  if (adminEthBal === 0n) {
    throw new Error("❌ Το Admin Wallet έχει 0 Sepolia ETH και δεν μπορεί να πληρώσει gas!");
  }

  // 2. Έλεγχος αν ο Admin είναι ο Contract Owner
  try {
    const contractOwner = await contract.owner();
    console.log(`👑 Contract Owner: ${contractOwner}`);
    if (contractOwner.toLowerCase() !== adminWallet.address.toLowerCase()) {
      throw new Error(`❌ ΑΠΑΓΟΡΕΥΣΗ: Το wallet (${adminWallet.address}) ΔΕΝ είναι ο Owner (${contractOwner}) του συμβολαίου!`);
    }
  } catch (err) {
    if (err.message.includes("ΑΠΑΓΟΡΕΥΣΗ")) throw err;
    console.log("ℹ️ Το συμβόλαιο δεν έχει δημόσια μέθοδο owner(), συνεχίζουμε...");
  }
  console.log("==========================================");

  const amountWei = ethers.parseEther(amount.toString());
  console.log("⏳ Αποστολή Mint συναλλαγής...");
  
  const tx = await contract.mint(citizenAddress, amountWei);
  console.log("Tx Hash:", tx.hash);
  console.log(`Explorer: https://sepolia.etherscan.io/tx/${tx.hash}`);

  await tx.wait();
  console.log("🎉 Επιτυχές Minting GRC!");

  const newBal = await contract.balanceOf(citizenAddress);
  console.log(`💰 Νέο Υπόλοιπο Πολίτη: ${ethers.formatEther(newBal)} GRC`);
}

main().catch((err) => {
  console.error("❌ Σφάλμα:", err.message || err);
  process.exit(1);
});
