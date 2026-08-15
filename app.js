// --- ΡΥΘΜΙΣΕΙΣ GITHUB & BLOCKCHAIN ---
const GITHUB_USERNAME = "nkthegreat";
const GITHUB_REPO = "coin";
const GITHUB_TOKEN = "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";

// Διεύθυνση Smart Contract στο Base Sepolia
const CONTRACT_ADDRESS = "0x59DdAD0414fc513524b1d15871F744C9987A855E";

// Base Sepolia Endpoints (Δίκτυο στο οποίο έγινε το deploy)
const RPC_ENDPOINTS = [
  "https://sepolia.base.org",
  "https://base-sepolia-rpc.publicnode.com",
  "https://1rpc.io/base-sepolia"
];

const CONTRACT_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function rewardRecycling(address citizen, uint256 amount) external",
  "function transfer(address to, uint256 amount) returns (bool)"
];
