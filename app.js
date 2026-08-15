// --- ΡΥΘΜΙΣΕΙΣ GITHUB & BLOCKCHAIN ---
const GITHUB_USERNAME = "nkthegreat";
const GITHUB_REPO = "coin";
const GITHUB_TOKEN = "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";

// Διεύθυνση Smart Contract
const CONTRACT_ADDRESS = "0x20C43f2926198C9889878425474973F316d077c2";

// Fallback RPCs (Sepolia πρώτα)
const RPC_ENDPOINTS = [
  "https://ethereum-sepolia-rpc.publicnode.com",
  "https://1rpc.io/sepolia",
  "https://gateway.tenderly.co/public/sepolia",
  "https://rpc.sepolia.org",
  "https://sepolia.base.org"
];

const CONTRACT_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function rewardRecycling(address citizen, uint256 amount) external",
  "function transfer(address to, uint256 amount) returns (bool)"
];

// 1. Δημιουργία ή φόρτωση wallet πολίτη
let citizenWallet;
try {
  let savedKey = localStorage.getItem("demo_citizen_key");
  if (!savedKey) {
    const newWallet = ethers.Wallet.createRandom();
    localStorage.setItem("demo_citizen_key", newWallet.privateKey);
    citizenWallet = newWallet;
  } else {
    citizenWallet = new ethers.Wallet(savedKey);
  }
} catch (e) {
  console.error("Wallet error:", e);
}

// 2. Εκκίνηση και εμφάνιση QR
document.addEventListener("DOMContentLoaded", () => {
  const addrEl = document.getElementById("citizenAddress");
  if (addrEl && citizenWallet) addrEl.innerText = citizenWallet.address;

  const qrContainer = document.getElementById("qrcode");
  if (qrContainer && citizenWallet) {
    qrContainer.innerHTML = "";
    new QRCode(qrContainer, {
      text: citizenWallet.address,
      width: 160,
      height: 160
    });
  }

  refreshBalance();
});

// 3. Ανάγνωση Υπολοίπου
async function refreshBalance() {
  const balEl = document.getElementById("citizenBalance");
  if (balEl) balEl.innerText = "Φόρτωση...";

  if (!citizenWallet) {
    if (balEl) balEl.innerText = "Σφάλμα Wallet";
    return;
  }

  let balanceFound = false;

  for (const rpc of RPC_ENDPOINTS) {
    try {
      const provider = new ethers.JsonRpcProvider(rpc);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      
      const balancePromise = contract.balanceOf(citizenWallet.address);
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3500));
      
      const balance = await Promise.race([balancePromise, timeoutPromise]);
      const formatted = ethers.formatEther(balance);
      
      if (balEl) balEl.innerText = `${parseFloat(formatted).toFixed(2)} GRC`;
      balanceFound = true;
      console.log(`✅ Balance: ${formatted} GRC (από ${rpc})`);
      break;
    } catch (err) {
      console.warn(`RPC Fail [${rpc}]:`, err.message);
    }
  }

  if (!balanceFound && balEl) {
    balEl.innerText = "0.00 GRC";
  }
}

// 4. Scanner Κάμερας
let html5QrCode;
function startScanner() {
  const readerEl = document.getElementById("reader");
  if (!readerEl) return;

  if (html5QrCode) {
    html5QrCode.stop().catch(() => {}).then(initScan);
  } else {
    initScan();
  }

  function initScan() {
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
        "Authorization": `Bearer ${GITHUB_TOKEN}`,
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
      setTimeout(refreshBalance, 15000);
    } else {
      const errData = await response.json().catch(() => ({}));
      logStatus(`❌ Σφάλμα GitHub API (${response.status}): ${errData.message || 'Check Token'}`);
      alert(`Αποτυχία (${response.status}): Ελέγξτε τα δικαιώματα του token.`);
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
