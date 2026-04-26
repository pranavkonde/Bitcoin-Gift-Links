import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { createWalletClient, formatEther, http, type Address, type Hex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { useAccount, usePublicClient, useSwitchChain, useWalletClient } from 'wagmi'
import { parseClaimLink } from '../giftLink'
import { getShortHash, getTxExplorerUrl, resolveGasPrice } from '../lib/web3'
import { rootstockTestnet } from '../wagmi'

export function ClaimGiftPage() {
  const location = useLocation()
  const payload = useMemo(() => parseClaimLink(location.hash), [location.hash])
  const { isConnected, chainId } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient({ chainId: rootstockTestnet.id })
  const { switchChainAsync } = useSwitchChain()

  const [status, setStatus] = useState('')
  const [txHash, setTxHash] = useState<string | null>(null)
  const [isClaiming, setIsClaiming] = useState(false)

  const { data: liveBalance = 0n, isLoading: isBalanceLoading } = useQuery({
    queryKey: ['gift-balance', payload?.giftWallet],
    queryFn: async () => {
      if (!payload || !publicClient) {
        return 0n
      }
      return publicClient.getBalance({ address: payload.giftWallet as Address })
    },
    enabled: Boolean(payload && publicClient),
    refetchInterval: 10_000,
  })

  const { data: claimableAmount = 0n } = useQuery({
    queryKey: ['claimable-amount', payload?.giftWallet, liveBalance.toString()],
    queryFn: async () => {
      if (!publicClient) {
        return 0n
      }
      const gasPrice = await resolveGasPrice(publicClient)
      const gasLimit = 21_000n
      const claimable = liveBalance - gasPrice * gasLimit
      return claimable > 0n ? claimable : 0n
    },
    enabled: Boolean(payload && publicClient),
    refetchInterval: 10_000,
  })

  async function handleClaim() {
    setTxHash(null)

    if (!payload) {
      setStatus('Invalid claim link.')
      return
    }
    if (!isConnected || !walletClient || !publicClient) {
      setStatus('Connect your wallet to receive the gift.')
      return
    }
    if (!walletClient.account) {
      setStatus('No connected wallet account found.')
      return
    }
    if (claimableAmount <= 0n) {
      setStatus('Gift wallet has no claimable balance after gas costs.')
      return
    }

    try {
      setIsClaiming(true)
      if (chainId !== rootstockTestnet.id) {
        await switchChainAsync({ chainId: rootstockTestnet.id })
      }

      setStatus('Sweeping funds from disposable wallet...')

      const recipientAddress = walletClient.account.address
      const giftAccount = privateKeyToAccount(payload.pk as Hex)
      const giftWalletClient = createWalletClient({
        account: giftAccount,
        chain: rootstockTestnet,
        transport: http(rootstockTestnet.rpcUrls.default.http[0]),
      })

      const gasPrice = await resolveGasPrice(publicClient)
      const gasLimit = 21_000n
      const balance = await publicClient.getBalance({ address: giftAccount.address })
      const maxTransferable = balance - gasPrice * gasLimit

      if (maxTransferable <= 0n) {
        throw new Error('Gift wallet has no claimable balance after gas costs.')
      }

      const hash = await giftWalletClient.sendTransaction({
        account: giftAccount,
        to: recipientAddress,
        value: maxTransferable,
        gas: gasLimit,
        gasPrice,
        type: 'legacy',
        chain: rootstockTestnet,
      })
      await publicClient.waitForTransactionReceipt({ hash })
      setTxHash(hash)
      setStatus(`Claimed ${formatEther(maxTransferable)} RBTC.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      setStatus(`Claim failed: ${message}`)
    } finally {
      setIsClaiming(false)
    }
  }

  if (!payload) {
    return (
      <section className="card">
        <h2>Claim Gift</h2>
        <p>Invalid or incomplete claim link.</p>
      </section>
    )
  }

  return (
    <section className="card">
      <h2>Claim Gift</h2>
      <div className="kv">
        <span>Gift wallet</span>
        <code>{payload.giftWallet}</code>
      </div>
      <div className="kv">
        <span>Sender</span>
        <code>{payload.sender}</code>
      </div>
      <div className="kv">
        <span>Live balance</span>
        <code>{isBalanceLoading ? 'Loading...' : `${formatEther(liveBalance)} RBTC`}</code>
      </div>
      <div className="kv">
        <span>Claimable (after gas)</span>
        <code>{formatEther(claimableAmount)} RBTC</code>
      </div>
      <button onClick={handleClaim} disabled={isClaiming || claimableAmount <= 0n} type="button">
        {isClaiming ? 'Claiming...' : 'Claim to Connected Wallet'}
      </button>
      {status && (
        <p className="status" role="status" aria-live="polite">
          {status}
        </p>
      )}
      {txHash && (
        <p className="muted-text">
          Transaction:{' '}
          <a className="inline-link" href={getTxExplorerUrl(txHash)} target="_blank" rel="noreferrer">
            {getShortHash(txHash)}
          </a>
        </p>
      )}
    </section>
  )
}
