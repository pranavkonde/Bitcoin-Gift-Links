import { Link } from 'react-router-dom'
import { CreateGiftForm } from '../components/CreateGiftForm'
import { WalletStatus } from '../components/WalletStatus'

export function GiftAppPage() {
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
          <Link className="nav-link" to="/claim">
            Claim
          </Link>
        </nav>
      </header>
      <WalletStatus />
      <CreateGiftForm />
    </>
  )
}
