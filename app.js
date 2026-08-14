// --- ΡΥΘΜΙΣΕΙΣ BLOCKCHAIN (BASE SEPOLIA) ---
const RPC_URL = "https://sepolia.base.org";
const provider = new ethers.JsonRpcProvider(RPC_URL);

// Διεύθυνση του Smart Contract (θα το συμπληρώσεις μετά το deploy)
const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";

// ABI του Smart Contract
const CONTRACT_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function rewardRecycling(address citizen, uint256 amount) external",
  "function transfer(address to, uint256 amount) returns (bool)"
];

// Για σκοπούς δοκιμής: Δημιουργία ή φόρτωση demo wallet πολίτη
let citizenWallet = localStorage.getItem("demo_citizen_key");
if (!citizenWallet) {
  const newWallet = ethers.Wallet.createRandom();
  localStorage.setItem("demo_citizen_key", newWallet.privateKey);
  citizenWallet = newWallet;
} else {
  citizenWallet = new ethers.Wallet(citizenWallet);
}

// 1. Προβολή QR Code Πολίτη κατά τη φόρτωση
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("citizenAddress").innerText = citizenWallet.address;
  
  new QRCode(document.getElementById("qrcode"), {
    text: citizenWallet.address,
    width: 160,
    height: 160
  });

  refreshBalance();
});

// 2. Ανάγνωση Υπολοίπου
async function refreshBalance() {
  try {
    if (CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
      document.getElementById("citizenBalance").innerText = "0 GRC (Demo Mode)";
      return;
    }
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    const balance = await contract.balanceOf(citizenWallet.address);
    document.getElementById("citizenBalance").innerText = `${ethers.formatEther(balance)} GRC`;
  } catch (err) {
    console.error(err);
  }
}

// 3. Scanner Κάμερας (HTML5 QR Scanner)
let html5QrCode;
function startScanner() {
  html5QrCode = new Html5Qrcode("reader");
  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    (decodedText) => {
      document.getElementById("scannedCitizen").value = decodedText;
      html5QrCode.stop();
      logStatus(`✅ Επιτυχής ανάγνωση διεύθυνσης: ${decodedText}`);
    },
    (errorMessage) => { /* scanning errors are ignored */ }
  ).catch(err => console.log("Camera error:", err));
}

// 4. Εναλλαγή Tabs
function showTab(tabName) {
  ['citizen', 'agent', 'merchant'].forEach(t => {
    document.getElementById(`tab${t.charAt(0).toUpperCase() + t.slice(1)}`).classList.add('hidden');
    document.getElementById(`tab${t.charAt(0).toUpperCase() + t.slice(1)}Btn`).classList.replace('text-green-700', 'text-gray-500');
    document.getElementById(`tab${t.charAt(0).toUpperCase() + t.slice(1)}Btn`).classList.remove('border-b-2', 'border-green-700');
  });

  document.getElementById(`tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`).classList.remove('hidden');
  document.getElementById(`tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Btn`).classList.replace('text-gray-500', 'text-green-700');
  document.getElementById(`tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Btn`).classList.add('border-b-2', 'border-green-700');

  if (tabName === 'agent') startScanner();
}

function logStatus(msg) {
  const box = document.getElementById("statusBox");
  box.classList.remove("hidden");
  box.innerText = msg;
}
