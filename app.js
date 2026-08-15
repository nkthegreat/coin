// ==========================================
// 1. ΡΥΘΜΙΣΕΙΣ GITHUB & BLOCKCHAIN (BASE SEPOLIA)
// ==========================================
const GITHUB_USERNAME = "nkthegreat";
const GITHUB_REPO = "coin";
const GITHUB_TOKEN = "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";

// Το ενεργό Smart Contract στο Base Sepolia
const CONTRACT_ADDRESS = "0x59DdAD0414fc513524b1d15871F744C9987A855E";

// Λίστα Base Sepolia RPCs με σειρά προτεραιότητας
const RPC_ENDPOINTS = [
  "https://sepolia.base.org",
  "https://base-sepolia-rpc.publicnode.com",
  "https://base-sepolia.blockpi.network/v1/rpc/public",
  "https://1rpc.io/base-sepolia"
];

// ABI Συμβολαίου ERC-20
const CONTRACT_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function rewardRecycling(address citizen, uint256 amount) external",
  "function transfer(address to, uint256 amount) returns (bool)"
];

// ==========================================
// 2. ΔΗΜΙΟΥΡΓΙΑ / ΦΟΡΤΩΣΗ WALLETS
// ==========================================
let citizenWallet;
let merchantWallet;

try {
  // Wallet Πολίτη (αποθήκευση στο LocalStorage του browser)
  let savedKey = localStorage.getItem("demo_citizen_key");
  if (!savedKey) {
    citizenWallet = ethers.Wallet.createRandom();
    localStorage.setItem("demo_citizen_key", citizenWallet.privateKey);
  } else {
    citizenWallet = new ethers.Wallet(savedKey);
  }

  // Wallet Εμπόρου (για το demo)
  let merchantKey = localStorage.getItem("demo_merchant_key");
  if (!merchantKey) {
    merchantWallet = ethers.Wallet.createRandom();
    localStorage.setItem("demo_merchant_key", merchantWallet.privateKey);
  } else {
    merchantWallet = new ethers.Wallet(merchantKey);
  }
} catch (e) {
  console.error("Wallet init error:", e);
}

// ==========================================
// 3. ΕΚΚΙΝΗΣΗ UI (DOM READY)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // Αρχικοποίηση UI Πολίτη
  if (citizenWallet) {
    const addrEl = document.getElementById("citizenAddress");
    if (addrEl) addrEl.innerText = citizenWallet.address;

    const qrContainer = document.getElementById("qrcode");
    if (qrContainer && typeof QRCode !== "undefined") {
      qrContainer.innerHTML = "";
      new QRCode(qrContainer, { text: citizenWallet.address, width: 150, height: 150 });
    }
  }

  // Αρχικοποίηση UI Εμπόρου
  if (merchantWallet) {
    const mAddrEl = document.getElementById("merchantAddress");
    if (mAddrEl) mAddrEl.innerText = merchantWallet.address;

    const mQrContainer = document.getElementById("merchantQrcode");
    if (mQrContainer && typeof QRCode !== "undefined") {
      mQrContainer.innerHTML = "";
      new QRCode(mQrContainer, { text: merchantWallet.address, width: 150, height: 150 });
    }
  }

  // Αυτόματη πρώτη ανάγνωση υπολοίπου
  refreshBalance();
});

// ==========================================
// 4. ΑΝΑΓΝΩΣΗ ΥΠΟΛΟΙΠΟΥ (BALANCE)
// ==========================================
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

      const balance = await contract.balanceOf(citizenWallet.address);
      const formatted = ethers.formatEther(balance);

      console.log(`[Base Sepolia] Wallet: ${citizenWallet.address}`);
      console.log(`[Base Sepolia] Balance: ${formatted} GRC (μέσω ${rpc})`);

      if (balEl) {
        balEl.innerText = `${parseFloat(formatted).toFixed(2)} GRC`;
      }
      balanceFound = true;
      break; // Επιτυχία, δεν χρειάζεται να δοκιμάσουμε επόμενο RPC
    } catch (err) {
      console.warn(`RPC Fail [${rpc}]:`, err.message);
    }
  }

  if (!balanceFound && balEl) {
    balEl.innerText = "0.00 GRC";
  }
}

// ==========================================
// 5. ΜΕΤΑΦΟΡΑ TOKENS (TRANSFER)
// ==========================================
async function sendTransfer() {
  const recipient = document.getElementById("transferRecipient").value.trim();
  const amount = document.getElementById("transferAmount").value;
  const btn = document.getElementById("btnTransfer");

  if (!recipient || !recipient.startsWith("0x") || recipient.length !== 42) {
    alert("Παρακαλώ εισάγετε έγκυρη διεύθυνση παραλήπτη (0x...)!");
    return;
  }

  if (!amount || parseFloat(amount) <= 0) {
    alert("Παρακαλώ εισάγετε έγκυρο ποσό!");
    return;
  }

  btn.disabled = true;
  btn.innerText = "⏳ Εκτέλεση Μεταφοράς...";
  logStatus(`Αποστολή ${amount} GRC στον ${recipient.substring(0, 10)}...`);

  try {
    const provider = new ethers.JsonRpcProvider(RPC_ENDPOINTS[0]);
    const signer = citizenWallet.connect(provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    const amountWei = ethers.parseEther(amount.toString());
    const tx = await contract.transfer(recipient, amountWei);

    logStatus(`🚀 Η συναλλαγή στάλθηκε! Tx: ${tx.hash}`);
    await tx.wait();

    alert(`🎉 Επιτυχής μεταφορά ${amount} GRC!`);
    refreshBalance();
  } catch (err) {
    console.error(err);
    logStatus(`❌ Σφάλμα μεταφοράς: ${err.message}`);
    alert(`Σφάλμα: ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.innerText = "💸 Αποστολή GRC";
  }
}

// ==========================================
// 6. SCANNER QR CODE (ΥΠΑΛΛΗΛΟΣ)
// ==========================================
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

// ==========================================
// 7. ΕΠΙΒΡΑΒΕΥΣΗ (MINTING VIA GITHUB ACTIONS)
// ==========================================
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
      alert(`🎉 Επιτυχία! Η εντολή στάλθηκε στο blockchain.\nΣε λίγα δευτερόλεπτα τα ${weight} GRC θα πιστωθούν!`);
      setTimeout(refreshBalance, 12000);
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
    btn.innerText = "🌱 Επιβράβευση με Coins (Mint)";
  }
}

// ==========================================
// 8. TABS & UI HELPERS
// ==========================================
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
