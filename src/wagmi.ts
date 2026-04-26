import { createConfig, http } from 'wagmi'
import { injected, walletConnect } from 'wagmi/connectors'
import { defineChain } from 'viem'

const rootstockTestnet = defineChain({
  id: 31,
  name: 'Rootstock Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Rootstock BTC',
    symbol: 'tRBTC',
  },
  rpcUrls: {
    default: { http: ['https://public-node.testnet.rsk.co'] },
    public: { http: ['https://public-node.testnet.rsk.co'] },
  },
  blockExplorers: {
    default: {
      name: 'RSK Testnet Explorer',
      url: 'https://explorer.testnet.rootstock.io',
    },
  },
  testnet: true,
})

const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID

const connectors = walletConnectProjectId
  ? [injected(), walletConnect({ projectId: walletConnectProjectId, showQrModal: true })]
  : [injected()]

export const wagmiConfig = createConfig({
  chains: [rootstockTestnet],
  connectors,
  transports: {
    [rootstockTestnet.id]: http('https://public-node.testnet.rsk.co'),
  },
})

export { rootstockTestnet }
