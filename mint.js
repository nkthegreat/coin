name: Reward Citizen (Mint GRC)

on:
  workflow_dispatch:
    inputs:
      citizen:
        description: 'Citizen Wallet Address'
        required: true
        default: '0x9afE7A2CA26f9623c8af16d2eB3D15AC3E4Da3cc'
      amount:
        description: 'Amount of GRC (Waste in Kg)'
        required: true
        default: '5'

jobs:
  mint:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install Dependencies
        run: npm install ethers

      - name: Run Mint Script
        env:
          ADMIN_PRIVATE_KEY: ${{ secrets.ADMIN_PRIVATE_KEY }}
          CITIZEN_ADDRESS: ${{ github.event.inputs.citizen }}
          MINT_AMOUNT: ${{ github.event.inputs.amount }}
        run: node mint.js
