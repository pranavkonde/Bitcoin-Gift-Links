import { useMemo, useState } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import { BrowserProvider, JsonRpcProvider, Wallet, formatEther, parseEther } from 'ethers'
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { createGiftPayload, formatRbtc, parseClaimLink, toClaimLink } from './giftLink'
import { rootstockTestnet } from './wagmi'

function WalletStatus() {
  const { address, isConnected, chainId } = useAccount()
  const { disconnect } = useDisconnect()
  const { connect, connectors, isPending } = useConnect()

  return (
    <div className="card wallet-card">
      <div className="section-title-row">
        <h3>Wallet</h3>
        <span className={`pill ${isConnected ? 'success' : 'muted'}`}>
          {isConnected ? 'Connected' : 'Not Connected'}
        </span>
      </div>
      {!isConnected ? (
        <div className="row wrap">
          {connectors.map((connector) => (
            <button
              key={connector.uid}
              onClick={() => connect({ connector })}
              disabled={isPending}
            >
              Connect {connector.name}
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="kv">
            <span>Address</span>
            <code>{address}</code>
          </div>
          <div className="kv">
            <span>Network</span>
            <span>
              <code>{chainId}</code> (Expected: <code>31</code>)
            </span>
          </div>
          <button className="secondary" onClick={() => disconnect()}>
            Disconnect
          </button>
        </>
      )}
    </div>
  )
}

function CreateGiftPage() {
  const { address, isConnected, chainId } = useAccount()
  const { switchChainAsync } = useSwitchChain()
  const [amount, setAmount] = useState('0.001')
  const [claimLink, setClaimLink] = useState('')
  const [status, setStatus] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  async function handleCreateGift() {
    if (!isConnected || !address || !window.ethereum) {
      setStatus('Connect a wallet first (MetaMask or WalletConnect connector).')
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
      // Recreate provider/signer after a potential chain switch to avoid stale state.
      const provider = new BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const rpcProvider = new JsonRpcProvider(rootstockTestnet.rpcUrls.default.http[0])
      const [senderAddress, senderBalance, feeData] = await Promise.all([
        signer.getAddress(),
        provider.getBalance(address),
        rpcProvider.getFeeData(),
      ])
      const gasLimit = 21_000n
      const gasPrice = feeData.gasPrice && feeData.gasPrice > 0n ? feeData.gasPrice : 60_000_000n
      const totalCost = amountWei + gasPrice * gasLimit

      if (senderBalance < totalCost) {
        throw new Error(
          `Insufficient balance. Need about ${formatEther(totalCost)} RBTC (amount + gas), have ${formatEther(senderBalance)} RBTC.`,
        )
      }

      const tx = await signer.sendTransaction({
        to: payload.giftWallet,
        value: amountWei,
        gasLimit,
        gasPrice,
        type: 0,
        chainId: rootstockTestnet.id,
        from: senderAddress,
      })
      await tx.wait()

      setClaimLink(toClaimLink(payload))
      setStatus(`Gift funded. Tx: ${tx.hash}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      const normalized = message.toLowerCase()
      if (
        normalized.includes('internal server error') ||
        normalized.includes('-32003') ||
        normalized.includes('could not coalesce error')
      ) {
        setStatus(
          `Failed to create gift: wallet/RPC rejected the transfer. Check sender testnet RBTC balance and try again (we now use legacy Rootstock tx params). Details: ${message}`,
        )
      } else {
        setStatus(`Failed to create gift: ${message}`)
      }
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="card">
      <h2>Create Gift Link</h2>
      <p className="muted-text">Creates a fresh disposable wallet, then funds it with RBTC.</p>
      <label>
        Amount (tRBTC)
        <input value={amount} onChange={(e) => setAmount(e.target.value)} />
      </label>
      <button onClick={handleCreateGift} disabled={isCreating}>
        {isCreating ? 'Creating...' : 'Create and Fund Gift'}
      </button>
      {status && <p className="status">{status}</p>}
      {claimLink && (
        <div className="result">
          <p className="muted-text">Share this claim link:</p>
          <code>{claimLink}</code>
        </div>
      )}
    </div>
  )
}

function ClaimGiftPage() {
  const location = useLocation()
  const payload = useMemo(() => parseClaimLink(location.search), [location.search])
  const { address, isConnected, chainId } = useAccount()
  const { switchChainAsync } = useSwitchChain()
  const [status, setStatus] = useState('')
  const [isClaiming, setIsClaiming] = useState(false)

  async function handleClaim() {
    if (!payload) {
      setStatus('Invalid claim link.')
      return
    }
    if (!isConnected || !address || !window.ethereum) {
      setStatus('Connect your wallet to receive the gift.')
      return
    }

    try {
      setIsClaiming(true)
      if (chainId !== rootstockTestnet.id) {
        await switchChainAsync({ chainId: rootstockTestnet.id })
      }

      setStatus('Sweeping funds from disposable wallet...')
      const rpcProvider = new JsonRpcProvider(rootstockTestnet.rpcUrls.default.http[0])
      const giftWallet = new Wallet(payload.pk, rpcProvider)
      const recipientProvider = new BrowserProvider(window.ethereum)
      const recipientSigner = await recipientProvider.getSigner()
      const recipientAddress = await recipientSigner.getAddress()

      const balance = await rpcProvider.getBalance(giftWallet.address)
      const feeData = await rpcProvider.getFeeData()
      const gasPrice = feeData.gasPrice ?? BigInt(0)
      const gasLimit = BigInt(21_000)
      const maxTransferable = balance - gasPrice * gasLimit

      if (maxTransferable <= 0n) {
        throw new Error('Gift wallet has no claimable balance after gas costs.')
      }

      const tx = await giftWallet.sendTransaction({
        to: recipientAddress,
        value: maxTransferable,
        gasLimit,
        gasPrice,
      })
      await tx.wait()
      setStatus(`Claimed ${formatRbtc(maxTransferable)}. Tx: ${tx.hash}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      setStatus(`Claim failed: ${message}`)
    } finally {
      setIsClaiming(false)
    }
  }

  if (!payload) {
    return (
      <div className="card">
        <h2>Claim Gift</h2>
        <p>Invalid or incomplete claim link.</p>
      </div>
    )
  }

  return (
    <div className="card">
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
        <span>Approx value</span>
        <code>{formatEther(payload.amountWei)} RBTC</code>
      </div>
      <button onClick={handleClaim} disabled={isClaiming}>
        {isClaiming ? 'Claiming...' : 'Claim to Connected Wallet'}
      </button>
      {status && <p className="status">{status}</p>}
    </div>
  )
}

function App() {
  return (
    <main className="container">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<GiftAppPage />} />
        <Route path="/claim" element={<ClaimGiftPage />} />
      </Routes>
    </main>
  )
}

function LandingPage() {
  return (
    <>
      <header className="site-nav card">
        <div className="brand">
          <span className="brand-dot" />
          <strong>Bitcoin Gift Links</strong>
        </div>
        <nav className="row wrap">
          <Link className="nav-link" to="/app">
            App
          </Link>
          <Link className="nav-link cta-primary" to="/app">
            Get Started
          </Link>
        </nav>
      </header>

      <header className="hero landing-hero hero-split">
        <div className="hero-content">
          <p className="eyebrow">Bitcoin Gift Links on Rootstock</p>
          <h1>Gift Bitcoin with the quality of a modern product</h1>
          <p className="hero-subtitle">
            Send tRBTC through beautiful shareable links. Recipients can claim directly to
            their wallet in one smooth flow, even if they start with zero crypto context.
          </p>
          <div className="row wrap nav-row">
            <Link className="nav-link cta-primary" to="/app">
              Launch App
            </Link>
            <Link className="nav-link" to="/claim">
              Claim Gift
            </Link>
          </div>
        </div>

        <aside className="hero-panel">
          <p className="eyebrow">Why teams use this</p>
          <div className="metric-grid">
            <div>
              <h3>1-click</h3>
              <p className="muted-text">claim experience</p>
            </div>
            <div>
              <h3>31</h3>
              <p className="muted-text">Rootstock testnet chain</p>
            </div>
            <div>
              <h3>0 setup</h3>
              <p className="muted-text">needed for recipients</p>
            </div>
            <div>
              <h3>Web3 native</h3>
              <p className="muted-text">wallet integrations</p>
            </div>
          </div>
        </aside>
      </header>

      <section className="logo-strip card">
        <p className="muted-text">Perfect for hackathons, demos, onboarding campaigns, and community rewards.</p>
      </section>

      <section className="feature-grid">
        <article className="card feature-card">
          <p className="feature-icon">01</p>
          <h3>Disposable Wallets</h3>
          <p className="muted-text">
            Every gift generates a fresh wallet, so funds can be sent even if the recipient
            has not connected a wallet yet.
          </p>
        </article>
        <article className="card feature-card">
          <p className="feature-icon">02</p>
          <h3>Instant Claim Links</h3>
          <p className="muted-text">
            Share one URL and let recipients claim funds into MetaMask or any supported wallet
            on Rootstock testnet.
          </p>
        </article>
        <article className="card feature-card">
          <p className="feature-icon">03</p>
          <h3>Built for Onboarding</h3>
          <p className="muted-text">
            Perfect for demos, campaigns, and community growth where a smooth first-time user
            experience matters most.
          </p>
        </article>
      </section>

      <section className="card">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <span className="pill muted">1</span>
            <p>Create a gift and fund a temporary wallet.</p>
          </div>
          <div className="step">
            <span className="pill muted">2</span>
            <p>Share the generated claim link with the recipient.</p>
          </div>
          <div className="step">
            <span className="pill muted">3</span>
            <p>Recipient opens the link and claims tRBTC to their wallet.</p>
          </div>
        </div>
      </section>

      <section className="card cta-band">
        <h2>Start gifting on Rootstock in under a minute</h2>
        <p className="muted-text">
          Launch the app, fund a gift wallet, and share the claim link instantly.
        </p>
        <div className="row wrap">
          <Link className="nav-link cta-primary" to="/app">
            Launch App
          </Link>
        </div>
      </section>
    </>
  )
}

function GiftAppPage() {
  return (
    <>
      <header className="hero">
        <p className="eyebrow">Rootstock Testnet dApp</p>
        <h1>Bitcoin Gift Links App</h1>
        <p className="hero-subtitle">
          Create and fund gifts in seconds. Recipients can claim with one click.
        </p>
        <nav className="row nav-row">
          <Link className="nav-link" to="/">
            Landing
          </Link>
        </nav>
      </header>
      <WalletStatus />
      <CreateGiftPage />
    </>
  )
}

export default App
