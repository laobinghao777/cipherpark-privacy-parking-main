# CipherPark - Privacy-Preserving Parking Fee Calculator

A decentralized parking fee calculator that uses **Fully Homomorphic Encryption (FHE)** to compute parking fees while keeping your parking duration completely private.

## Features

- **Complete Privacy**: Your parking duration is encrypted before leaving your browser
- **Encrypted Computation**: Fees are calculated on encrypted data using FHE
- **User-Only Decryption**: Only you can decrypt the final fee with your wallet
- **On-Chain Verification**: All calculations are verifiable on Sepolia testnet

## Technology Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **FHE SDK**: @zama-fhe/relayer-sdk (v0.3.0-5)
- **Blockchain**: Ethers.js v6 + Sepolia Testnet
- **Smart Contract**: Solidity + FHEVM 0.9.1

## Quick Start

### Prerequisites

- Node.js 18+
- MetaMask or compatible Web3 wallet
- Sepolia testnet ETH (get from faucet)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd cipherpark-privacy-parking

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env and set your contract address
# VITE_CONTRACT_ADDRESS=0x...

# Start development server
npm run dev
```

### Deploy Smart Contract

1. Navigate to the `contracts/` directory
2. Deploy `index.sol` to Sepolia using Hardhat or Foundry
3. Copy the deployed contract address to `.env`

## Project Structure

```
src/
├── components/      # UI components
│   ├── ui/         # shadcn/ui components
│   └── Navigation.tsx
├── pages/
│   ├── Landing.tsx     # Homepage
│   ├── Calculator.tsx  # Fee calculator (FHE integration)
│   └── Admin.tsx       # Contract management
├── hooks/
│   ├── useWallet.ts    # MetaMask connection
│   └── useFHE.ts       # FHE encryption hooks
├── lib/
│   ├── fhe.ts          # FHE SDK wrapper
│   ├── contract.ts     # Smart contract interface
│   └── utils.ts        # Utilities
└── App.tsx
```

## How It Works

### 1. Encrypt Your Duration
Your parking time is encrypted locally using FHE before leaving your browser. The encryption uses Zama's Relayer SDK.

### 2. Compute on Encrypted Data
The smart contract receives the encrypted minutes and calculates:
- Blocks = ceil(minutes / 30)
- Fee = blocks × pricePerBlock

All computation happens on encrypted data - the contract never sees actual values.

### 3. Receive Encrypted Handle
The frontend returns the encrypted fee handle so you can keep it or decrypt it later with your preferred tooling (for example, via CLI scripts that call the Relayer SDK).

## Smart Contract

The `ParkingFeeCalculator` contract features:

- **Binary Subtraction Algorithm**: Efficient division without FHE div operation
- **Ceiling Function**: Rounds up to nearest 30-minute block
- **Max Blocks Cap**: Configurable maximum billing limit
- **Owner Functions**: Update price, max blocks, transfer ownership

```solidity
function quote(externalEuint64 minutesExt, bytes calldata proof)
    external returns (bytes32 feeHandle)
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_CONTRACT_ADDRESS` | Deployed contract address | Required |
| `VITE_CHAIN_ID` | Sepolia chain ID | 11155111 |
| `VITE_GATEWAY_URL` | Zama Gateway URL | https://gateway.sepolia.zama.ai |
| `VITE_RELAYER_URL` | Override the relayer base URL | Optional |

## FHE Configuration (Sepolia)

The following are the official Zama addresses for Sepolia testnet:

- **Gateway**: https://gateway.sepolia.zama.ai
- **KMS Verifier**: 0x208De73316E44722e16f6dDFF40881A3e4F86104
- **ACL**: 0xc9990FEfE0c27D31D0C2aa36196b085c0c4d456c

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Troubleshooting

### "Contract address not configured"
Set `VITE_CONTRACT_ADDRESS` in your `.env` file.

### "Wrong Network"
Click the "Wrong Network" button to switch to Sepolia testnet.

### FHE initialization fails
- Clear browser cache and `node_modules/.vite`
- Ensure you're using a modern browser with WASM support

## Resources

- [Zama FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Relayer SDK Guide](https://docs.zama.ai/fhevm/guides/relayer)
- [Sepolia Faucet](https://sepoliafaucet.com)

## License

MIT License
