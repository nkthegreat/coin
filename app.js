// ==========================================
// 1. BLOCKCHAIN SETTINGS (ETHEREUM SEPOLIA)
// ==========================================
const CONTRACT_ADDRESS = "0xCCbF413FdA35E498215E5c8E35A1C00dF1fd3d57";
const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";

const CONTRACT_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)"
];

// ==========================================
// 2. WALLET INITIALIZATION (ΕΝΙΑΙΟ ΠΟΡΤΟΦΟΛΙ)
// ==========================================
let appWallet;

try {
  let savedKey = localStorage.getItem("demo_unified_wallet_key");
  if (!savedKey) {
    appWallet = ethers.Wallet.createRandom();
    localStorage.setItem("demo_unified_wallet_key", appWallet.privateKey);
  } else {
    appWallet = new ethers.Wallet(savedKey);
  }
} catch (e) {
  console.error("Wallet initialization error:", e);
}

// ==========================================
// 3. UI INIT, DISPLAY ADDRESSES & QR CODE
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  if (appWallet) {
    // 1. Εμφάνιση διεύθυνσης στην καρτέλα Πολίτη
    const citizenAddrEl = document.getElementById("citizenAddress");
    if (citizenAddrEl) {
      citizenAddrEl.innerText = appWallet.address;
    }

    // 2. Εμφάνιση της ΙΔΙΑΣ διεύθυνσης στην καρτέλα Εμπόρου
    const merchantAddrEl = document.getElementById("merchantAddress");
    if (merchantAddrEl) {
      merchantAddrEl.innerText = appWallet.address;
    }

    // 3. Παραγωγή QR Code με τη διεύθυνση του κοινού πορτοφολιού
    const qrContainer = document.getElementById("merchantQrcode");
    if (qrContainer && typeof QRCode !== "undefined") {
      qrContainer.innerHTML = "";
      new QRCode(qrContainer, {
        text: appWallet.address,
        width: 180,
        height: 180,
        correctLevel: QRCode.CorrectLevel.H
      });
    }
  }

  refreshBalance();
});

// ==========================================
// 4. ΑΝΑΓΝΩΣΗ ΥΠΟΛΟΙΠΟΥ (GRC BALANCE)
// ==========================================
async function refreshBalance() {
  const balEl = document.getElementById("citizenBalance");
  if (balEl) balEl.innerText = "Φόρτωση...";

  if (!appWallet) return;

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    const balance = await contract.balanceOf(appWallet.address);
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
  const amountInput = document.getElementById("transferAmount");
  const amount = amountInput.value.trim();

  if (!amount || parseFloat(amount) <= 0) {
    alert("Παρακαλώ εισάγετε πρώτα το ποσό GRC προς πληρωμή!");
    amountInput.focus();
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

// ==========================================
// 6. ON-CHAIN ΜΕΤΑΦΟΡΑ GRC
// ==========================================
async function executeTransfer(recipient, amount) {
  const btnScan = document.getElementById("btnScanQR");
  const statusEl = document.getElementById("txStatus");

  btnScan.disabled = true;
  statusEl.classList.remove("hidden");
  statusEl.innerText = `⏳ Αποστολή ${amount} GRC...`;

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = appWallet.connect(provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    const amountWei = ethers.parseEther(amount.toString());
    const tx = await contract.transfer(recipient, amountWei);

    statusEl.innerText = `🚀 Η συναλλαγή στάλθηκε! Αναμονή επιβεβαίωσης...`;
    await tx.wait();

    alert(`🎉 Επιτυχής πληρωμή ${amount} GRC!`);
    document.getElementById("transferAmount").value = "";
    refreshBalance();
  } catch (err) {
    console.error("Transfer Error:", err);
    alert(`Σφάλμα μεταφοράς: ${err.reason || err.message}`);
  } finally {
    btnScan.disabled = false;
    statusEl.classList.add("hidden");
  }
}

// ==========================================
// 7. TABS NAVIGATION
// ==========================================
function showTab(tabName) {
  ['citizen', 'merchant'].forEach((t) => {
    const tab = document.getElementById(`tab${t.charAt(0).toUpperCase() + t.slice(1)}`);
    const btn = document.getElementById(`tab${t.charAt(0).toUpperCase() + t.slice(1)}Btn`);
    if (tab) tab.classList.add("hidden");
    if (btn) {
      btn.classList.replace("text-green-700", "text-gray-500");
      btn.classList.remove("border-b-2", "border-green-700");
    }
  });

  const activeTab = document.getElementById(`tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
  const activeBtn = document.getElementById(`tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Btn`);

  if (activeTab) activeTab.classList.remove("hidden");
  if (activeBtn) {
    activeBtn.classList.replace("text-gray-500", "text-green-700");
    activeBtn.classList.add("border-b-2", "border-green-700");
  }
}
