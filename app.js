// --- ΡΥΘΜΙΣΕΙΣ GITHUB & BLOCKCHAIN ---
const GITHUB_USERNAME = "nkthegreat";
const GITHUB_REPO = "coin";
const GITHUB_TOKEN = "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";

const RPC_ENDPOINTS = [
  "https://ethereum-sepolia.publicnode.com",
  "https://rpc.sepolia.ethpandaops.io",
  "https://gateway.tenderly.co/public/sepolia",
  "https://rpc2.sepolia.org"
];

const CONTRACT_ADDRESS = "0x20C43f2926198C9889878425474973F316d077c2";
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
      const balance = await contract.balanceOf(citizenWallet.address);
      const formatted = ethers.formatEther(balance);
      
      if (balEl) balEl.innerText = `${formatted} GRC`;
      balanceRead = true;
      break;
    } catch (err) {
      console.warn(`RPC Fail: ${rpc}`);
    }
  }

  if (!balanceRead && balEl) {
    balEl.innerText = "Σφάλμα RPC";
  }
}

// 4. Scanner Κάμερας
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
      logStatus(`✅ Επιτυχής ανάγνωση: ${decodedText}`);
    },
    () => {}
  ).catch(err => console.log("Camera error:", err));
}

// 5. Λειτουργία Επιβράβευσης (Trigger GitHub Action)
async function rewardCitizen() {
  const targetCitizen = document.getElementById("scannedCitizen").value.trim();
  const weight = document.getElementById("wasteWeight").value;
  const btn = document.getElementById("btnReward");

  if (!targetCitizen || !targetCitizen.startsWith("0x") || targetCitizen.length !== 42) {
    alert("Παρακαλώ σκανάρετε πρώτα ένα έγκυρο QR Code πολίτη!");
    return;
  }

  btn.disabled = true;
  btn.innerText = "⏳ Εκτέλεση Minting στο Blockchain...";
  logStatus(`Αποστολή εντολής για ${weight} GRC στον πολίτη ${targetCitizen.substring(0, 8)}...`);

  try {
    const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/actions/workflows/mint.yml/dispatches`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Accept": "application/vnd.github.v3+json",
        "Authorization": `token ${GITHUB_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ref: "main",
        inputs: {
          citizen: targetCitizen,
          amount: weight.toString()
        }
      })
    });

    if (response.status === 204 || response.ok) {
      logStatus(`🚀 Η εντολή στάλθηκε! Το GitHub Action εκτελείται στο Blockchain...`);
      alert(`🎉 Επιτυχία! Η εντολή στάλθηκε στο blockchain.\nΣε περίπου 15 δευτερόλεπτα τα ${weight} GRC θα πιστωθούν στον πολίτη!`);
    } else {
      const errData = await response.json().catch(() => ({}));
      logStatus(`❌ Σφάλμα GitHub API (${response.status}): ${errData.message || 'Check Token'}`);
      alert("Αποτυχία: Ελέγξτε τα δικαιώματα του token.");
    }
  } catch (err) {
    logStatus(`❌ Σφάλμα σύνδεσης: ${err.message}`);
    alert("Σφάλμα επικοινωνίας.");
  } finally {
    btn.disabled = false;
    btn.innerText = "Επιβράβευση με Coins (Mint)";
  }
}

// 6. Εναλλαγή Tabs
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
