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

  const CONTRACT_ABI = [
    "function mint(address to, uint256 amount) public",
    "function balanceOf(address owner) view returns (uint256)"
  ];

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

  console.log(`👤 Minter Wallet: ${wallet.address}`);
  console.log(`🎯 Παραλήπτης: ${citizenAddress}`);
  console.log(`🪙 Minting: ${amount} GRC...`);

  const amountWei = ethers.parseEther(amount.toString());

  // Χειροκίνητο gasLimit για να παρακάμψει τυχόν κόλλημα στο estimateGas
  const tx = await contract.mint(citizenAddress, amountWei, {
    gasLimit: 150000
  });

  console.log("Tx Hash:", tx.hash);
  console.log(`Explorer: https://sepolia.etherscan.io/tx/${tx.hash}`);

  await tx.wait();
  console.log("🎉 Επιτυχία! Τα GRC δημιουργήθηκαν και στάλθηκαν!");

  const newBal = await contract.balanceOf(citizenAddress);
  console.log(`💰 Νέο Υπόλοιπο: ${ethers.formatEther(newBal)} GRC`);
}

main().catch((err) => {
  console.error("❌ Σφάλμα:", err);
  process.exit(1);
});
