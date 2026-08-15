// ==========================================
// 1. ΡΥΘΜΙΣΕΙΣ BLOCKCHAIN (ETHEREUM SEPOLIA)
// ==========================================
const CONTRACT_ADDRESS = "0x59DdAD0414fc513524b1d15871F744C9987A855E";

const RPC_ENDPOINTS = [
  "https://ethereum-sepolia-rpc.publicnode.com",
  "https://rpc.sepolia.org",
  "https://1rpc.io/sepolia"
];

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
  console.error("Wallet setup error:", e);
}

// ==========================================
// 3. UI INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  if (citizenWallet) {
    const addrEl = document.getElementById("citizenAddress");
    if (addrEl) addrEl.innerText = citizenWallet.address;

    const qrContainer = document.getElementById("qrcode");
    if (qrContainer && typeof QRCode !== "undefined") {
      qrContainer.innerHTML = "";
      new QRCode(qrContainer, { text: citizenWallet.address, width: 150, height: 150 });
    }
  }

  if (merchantWallet) {
    const mAddrEl = document.getElementById("merchantAddress");
    if (mAddrEl) mAddrEl.innerText = merchantWallet.address;

    const mQrContainer = document.getElementById("merchantQrcode");
    if (mQrContainer && typeof QRCode !== "undefined") {
      mQrContainer.innerHTML = "";
      new QRCode(mQrContainer, { text: merchantWallet.address, width: 150, height: 150 });
    }
  }

  refreshBalance();
});

// ==========================================
// 4. ΑΝΑΓΝΩΣΗ ΥΠΟΛΟΙΠΩΝ (GRC & GAS ETH)
// ==========================================
async function refreshBalance() {
  const balEl = document.getElementById("citizenBalance");
  if (balEl) balEl.innerText = "Φόρτωση...";

  if (!citizenWallet) return;

  for (const rpc of RPC_ENDPOINTS) {
    try {
      const provider = new ethers.JsonRpcProvider(rpc);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      const [grcBalance, ethBalance] = await Promise.all([
        contract.balanceOf(citizenWallet.address),
        provider.getBalance(citizenWallet.address)
      ]);

      const formattedGrc = ethers.formatEther(grcBalance);
      const formattedEth = ethers.formatEther(ethBalance);

      console.log(`Citizen: ${citizenWallet.address}`);
      console.log(`GRC: ${formattedGrc} | Gas ETH: ${formattedEth}`);

      if (balEl) {
        balEl.innerText = `${parseFloat(formattedGrc).toFixed(2)} GRC`;
      }
      return;
    } catch (err) {
      console.warn(`RPC Fail [${rpc}]:`, err.message);
    }
  }

  if (balEl) balEl.innerText = "0.00 GRC";
}

// ==========================================
// 5. ΑΠΕΥΘΕΙΑΣ ΠΛΗΡΩΜΗ / ΜΕΤΑΦΟΡΑ (P2P TRANSFER)
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
  btn.innerText = "⏳ Εκτέλεση Πληρωμής...";

  try {
    const provider = new ethers.JsonRpcProvider(RPC_ENDPOINTS[0]);
    
    // Έλεγχος αν έχει ETH για Gas πριν σταλεί η συναλλαγή
    const ethBal = await provider.getBalance(citizenWallet.address);
    if (ethBal === 0n) {
      throw new Error("Το πορτοφόλι σας δεν έχει Sepolia ETH για το κόστος του Gas!");
    }

    const signer = citizenWallet.connect(provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    const amountWei = ethers.parseEther(amount.toString());
    const tx = await contract.transfer(recipient, amountWei);

    console.log("Tx Hash:", tx.hash);
    await tx.wait();

    alert(`🎉 Η πληρωμή ${amount} GRC ολοκληρώθηκε επιτυχώς!`);
    refreshBalance();
  } catch (err) {
    console.error(err);
    alert(`Σφάλμα: ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.innerText = "💸 Αποστολή GRC";
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
