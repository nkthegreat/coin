// --- ΡΥΘΜΙΣΕΙΣ BLOCKCHAIN (SEPOLIA TESTNET) ---
// Χρήση αξιόπιστων δημόσιων RPC endpoints με αυτόματο Fallback
const RPC_ENDPOINTS = [
  "https://ethereum-sepolia.publicnode.com",
  "https://rpc.sepolia.ethpandaops.io",
  "https://gateway.tenderly.co/public/sepolia",
  "https://rpc2.sepolia.org"
];

// Η διεύθυνση του Smart Contract
const CONTRACT_ADDRESS = "0x3300f11d80eda5A056f93afb2bFf98A3D5DEcfB1";

// ABI του Smart Contract
const CONTRACT_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function rewardRecycling(address citizen, uint256 amount) external",
  "function transfer(address to, uint256 amount) returns (bool)"
];

// 1. Δημιουργία ή φόρτωση wallet πολίτη
let citizenWallet = localStorage.getItem("demo_citizen_key");
if (!citizenWallet) {
  const newWallet = ethers.Wallet.createRandom();
  localStorage.setItem("demo_citizen_key", newWallet.privateKey);
  citizenWallet = newWallet;
} else {
  citizenWallet = new ethers.Wallet(citizenWallet);
}

// 2. Εκκίνηση και εμφάνιση QR
document.addEventListener("DOMContentLoaded", () => {
  const addrEl = document.getElementById("citizenAddress");
  if (addrEl) addrEl.innerText = citizenWallet.address;

  const qrContainer = document.getElementById("qrcode");
  if (qrContainer) {
    qrContainer.innerHTML = "";
    new QRCode(qrContainer, {
      text: citizenWallet.address,
      width: 160,
      height: 160
    });
  }

  refreshBalance();
});

// 3. Ανάγνωση Υπολοίπου (με Fallback RPCs)
async function refreshBalance() {
  const balEl = document.getElementById("citizenBalance");
  if (balEl) balEl.innerText = "Φόρτωση...";

  let balanceRead = false;

  for (const rpc of RPC_ENDPOINTS) {
    try {
      const provider = new ethers.JsonRpcProvider(rpc);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      
      // Διαβάζουμε το υπόλοιπο του πολίτη
      const balance = await contract.balanceOf(citizenWallet.address);
      const formatted = ethers.formatEther(balance);
      
      if (balEl) balEl.innerText = `${formatted} GRC`;
      balanceRead = true;
      console.log(`Υπόλοιπο ανακτήθηκε επιτυχώς από: ${rpc}`);
      break; // Αν πετύχει, σταματάμε
    } catch (err) {
      console.warn(`Αποτυχία σύνδεσης με ${rpc}, δοκιμή επόμενου...`);
    }
  }

  if (!balanceRead && balEl) {
    balEl.innerText = "Σφάλμα RPC";
  }
}

// 4. Scanner Κάμερας (HTML5 QR Scanner)
let html5QrCode;
function startScanner() {
  const readerEl = document.getElementById("reader");
  if (!readerEl) return;

  html5QrCode = new Html5Qrcode("reader");
  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    (decodedText) => {
      document.getElementById("scannedCitizen").value = decodedText;
      html5QrCode.stop();
      logStatus(`✅ Επιτυχής ανάγνωση διεύθυνσης: ${decodedText}`);
    },
    () => {}
  ).catch(err => console.log("Camera error:", err));
}

// 5. Εναλλαγή Tabs
function showTab(tabName) {
  ['citizen', 'agent', 'merchant'].forEach(t => {
    const tab = document.getElementById(`tab${t.charAt(0).toUpperCase() + t.slice(1)}`);
    const btn = document.getElementById(`tab${t.charAt(0).toUpperCase() + t.slice(1)}Btn`);
    if (tab) tab.classList.add('hidden');
    if (btn) {
      btn.classList.replace('text-green-700', 'text-gray-500');
      btn.classList.remove('border-b-2', 'border-green-700');
    }
  });

  const activeTab = document.getElementById(`tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
  const activeBtn = document.getElementById(`tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Btn`);
  
  if (activeTab) activeTab.classList.remove('hidden');
  if (activeBtn) {
    activeBtn.classList.replace('text-gray-500', 'text-green-700');
    activeBtn.classList.add('border-b-2', 'border-green-700');
  }

  if (tabName === 'agent') startScanner();
}

function logStatus(msg) {
  const box = document.getElementById("statusBox");
  if (box) {
    box.classList.remove("hidden");
    box.innerText = msg;
  }
}
