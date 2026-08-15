// ==========================================
// 1. BLOCKCHAIN SETTINGS (ETHEREUM SEPOLIA)
// ==========================================
const CONTRACT_ADDRESS = "0x59DdAD0414fc513524b1d15871F744C9987A855E";
const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";

const CONTRACT_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)"
];

// ==========================================
// 2. WALLET INITIALIZATION
// ==========================================
let citizenWallet;
let merchantWallet;

try {
  let savedCitizenKey = localStorage.getItem("demo_citizen_key");
  if (!savedCitizenKey) {
    citizenWallet = ethers.Wallet.createRandom();
    localStorage.setItem("demo_citizen_key", citizenWallet.privateKey);
  } else {
    citizenWallet = new ethers.Wallet(savedCitizenKey);
  }

  let savedMerchantKey = localStorage.getItem("demo_merchant_key");
  if (!savedMerchantKey) {
    merchantWallet = ethers.Wallet.createRandom();
    localStorage.setItem("demo_merchant_key", merchantWallet.privateKey);
  } else {
    merchantWallet = new ethers.Wallet(savedMerchantKey);
  }
} catch (e) {
  console.error("Wallet error:", e);
}

// ==========================================
// 3. UI INIT & QR GENERATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // Εμφάνιση διεύθυνσης Πολίτη
  if (citizenWallet) {
    const addrEl = document.getElementById("citizenAddress");
    if (addrEl) addrEl.innerText = citizenWallet.address;
  }

  // Εμφάνιση διεύθυνσης & QR Εμπόρου
  if (merchantWallet) {
    const mAddrEl = document.getElementById("merchantAddress");
    if (mAddrEl) mAddrEl.innerText = merchantWallet.address;

    const mQrContainer = document.getElementById("merchantQrcode");
    if (mQrContainer && typeof QRCode !== "undefined") {
      mQrContainer.innerHTML = "";
      new QRCode(mQrContainer, { 
        text: merchantWallet.address, 
        width: 180, 
        height: 180 
      });
    }
  }

  refreshBalance();
});

// ==========================================
// 4. ΑΝΑΓΝΩΣΗ ΥΠΟΛΟΙΠΟΥ
// ==========================================
async function refreshBalance() {
  const balEl = document.getElementById("citizenBalance");
  if (balEl) balEl.innerText = "Φόρτωση...";

  if (!citizenWallet) return;

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    const balance = await contract.balanceOf(citizenWallet.address);
    const formatted = ethers.formatEther(balance);

    if (balEl) {
      balEl.innerText = `${parseFloat(formatted).toFixed(2)} GRC`;
    }
  } catch (err) {
    console.error("RPC Error:", err);
    if (balEl) balEl.innerText = "Σφάλμα RPC";
  }
}

// ==========================================
// 5. QR CODE SCANNER & ΑΜΕΣΗ ΠΛΗΡΩΜΗ
// ==========================================
let html5QrScanner = null;

async function startCitizenScanner() {
  const amount = document.getElementById("transferAmount").value;
  if (!amount || parseFloat(amount) <= 0) {
    alert("Παρακαλώ εισάγετε πρώτα το ποσό GRC προς πληρωμή!");
    return;
  }

  const readerEl = document.getElementById("reader");
  const btnScan = document.getElementById("btnScanQR");

  if (html5QrScanner && html5QrScanner.isScanning) {
    await html5QrScanner.stop();
    readerEl.classList.add("hidden");
    btnScan.innerText = "📷 Σκανάρισμα QR & Άμεση Πληρωμή";
    return;
  }

  readerEl.classList.remove("hidden");
  btnScan.innerText = "❌ Ακύρωση Κάμερας";

  html5QrScanner = new Html5Qrcode("reader");

  try {
    await html5QrScanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 220, height: 220 } },
      async (decodedText) => {
        let cleanAddress = decodedText.trim();
        if (cleanAddress.includes(":")) cleanAddress = cleanAddress.split(":")[1];
        if (cleanAddress.includes("@")) cleanAddress = cleanAddress.split("@")[0];

        if (cleanAddress.startsWith("0x") && cleanAddress.length === 42) {
          await html5QrScanner.stop();
          readerEl.classList.add("hidden");
          btnScan.innerText = "📷 Σκανάρισμα QR & Άμεση Πληρωμή";

          await executeTransfer(cleanAddress, amount);
        }
      },
      () => {}
    );
  } catch (err) {
    console.error("Camera error:", err);
    alert("Δεν δόθηκε πρόσβαση στην κάμερα.");
    readerEl.classList.add("hidden");
    btnScan.innerText = "📷 Σκανάρισμα QR & Άμεση Πληρωμή";
  }
}

async function executeTransfer(recipient, amount) {
  const btnScan = document.getElementById("btnScanQR");
  const statusEl = document.getElementById("txStatus");

  btnScan.disabled = true;
  statusEl.classList.remove("hidden");
  statusEl.innerText = `⏳ Αποστολή ${amount} GRC...`;

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = citizenWallet.connect(provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    const amountWei = ethers.parseEther(amount.toString());
    const tx = await contract.transfer(recipient, amountWei);

    statusEl.innerText = `🚀 Η συναλλαγή στάλθηκε! Αναμονή επιβεβαίωσης...`;
    await tx.wait();

    alert(`🎉 Επιτυχής πληρωμή ${amount} GRC!`);
    document.getElementById("transferAmount").value = "";
    refreshBalance();
  } catch (err) {
    console.error(err);
    alert(`Σφάλμα: ${err.message}`);
  } finally {
    btnScan.disabled = false;
    statusEl.classList.add("hidden");
  }
}

// ==========================================
// 6. TABS
// ==========================================
function showTab(tabName) {
  ['citizen', 'merchant'].forEach(t => {
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
}
