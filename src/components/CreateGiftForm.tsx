import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { formatEther, parseEther, type Address } from 'viem'
import { useAccount, usePublicClient, useSwitchChain, useWalletClient } from 'wagmi'
import { createGiftPayload, toClaimLink } from '../giftLink'
import { getShortHash, getTxExplorerUrl, resolveGasPrice } from '../lib/web3'
import { rootstockTestnet } from '../wagmi'

function validateAmountInput(amount: string): string | null {
  if (!amount.trim()) {
    return 'Enter an amount before creating a gift.'
  }
  const parsed = Number(amount)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 'Amount must be a positive number.'
  }
  return null
}

export function CreateGiftForm() {
  const { address, isConnected, chainId } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient({ chainId: rootstockTestnet.id })
  const { switchChainAsync } = useSwitchChain()

  const [amount, setAmount] = useState('0.001')
  const [claimLink, setClaimLink] = useState('')
  const [status, setStatus] = useState('')
  const [txHash, setTxHash] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const txUrl = useMemo(() => (txHash ? getTxExplorerUrl(txHash) : null), [txHash])

  async function handleCreateGift(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCopied(false)
    setTxHash(null)

    if (!isConnected || !address || !walletClient || !publicClient) {
      setStatus('Connect a wallet first (MetaMask or WalletConnect connector).')
      return
    }

    const amountError = validateAmountInput(amount)
    if (amountError) {
      setStatus(amountError)
      return
    }

    try {
      setIsCreating(true)
      setStatus('Preparing disposable wallet...')
      const amountWei = parseEther(amount)
      if (amountWei <= 0n) {
        throw new Error('Amount must be greater than 0.')
      }

      const payload = createGiftPayload(address, amountWei)

      if (chainId !== rootstockTestnet.id) {
        await switchChainAsync({ chainId: rootstockTestnet.id })
      }

      setStatus('Sending RBTC to gift wallet...')

      const [senderBalance, gasPrice] = await Promise.all([
        publicClient.getBalance({ address }),
        resolveGasPrice(publicClient),
      ])
      const gasLimit = 21_000n
      const totalCost = amountWei + gasPrice * gasLimit

      if (senderBalance < totalCost) {
        throw new Error(
          `Insufficient balance. Need about ${formatEther(totalCost)} RBTC (amount + gas), have ${formatEther(senderBalance)} RBTC.`,
        )
      }

      const hash = await walletClient.sendTransaction({
        account: walletClient.account?.address as Address,
        to: payload.giftWallet as Address,
        value: amountWei,
        gas: gasLimit,
        gasPrice,
        type: 'legacy',
        chain: rootstockTestnet,
      })
      await publicClient.waitForTransactionReceipt({ hash })

      const shareableLink = toClaimLink(payload)
      setClaimLink(shareableLink)
      setTxHash(hash)
      setStatus('Gift funded successfully.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      setStatus(`Failed to create gift: ${message}`)
    } finally {
      setIsCreating(false)
    }
  }

  async function handleCopyClaimLink() {
    if (!claimLink) {
      return
    }
    try {
      await navigator.clipboard.writeText(claimLink)
      setCopied(true)
      setStatus('Claim link copied to clipboard.')
    } catch {
      setStatus('Could not copy automatically. Please copy the link manually.')
    }
  }

  return (
    <section className="card">
      <h2>Create Gift Link</h2>
      <p className="muted-text">Creates a fresh disposable wallet, then funds it with RBTC.</p>
      <form onSubmit={handleCreateGift} className="form-stack">
        <label htmlFor="gift-amount">
          Amount (tRBTC)
          <input
            id="gift-amount"
            type="number"
            min="0.0001"
            step="0.0001"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={isCreating}>
          {isCreating ? 'Creating...' : 'Create and Fund Gift'}
        </button>
      </form>

      {status && (
        <p className="status" role="status" aria-live="polite">
          {status}
        </p>
      )}

      {txHash && txUrl && (
        <p className="muted-text">
          Transaction:{' '}
          <a className="inline-link" href={txUrl} target="_blank" rel="noreferrer">
            {getShortHash(txHash)}
          </a>
        </p>
      )}

      {claimLink && (
        <div className="result">
          <p className="muted-text">Share this claim link:</p>
          <code>{claimLink}</code>
          <button type="button" className="secondary" onClick={handleCopyClaimLink}>
            {copied ? 'Copied' : 'Copy Claim Link'}
          </button>
        </div>
      )}
    </section>
  )
}
