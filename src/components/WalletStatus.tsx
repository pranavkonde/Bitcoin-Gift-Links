import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { rootstockTestnet } from '../wagmi'

export function WalletStatus() {
  const { address, isConnected, chainId } = useAccount()
  const { disconnect } = useDisconnect()
  const { connect, connectors, isPending } = useConnect()
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain()

  const isWrongNetwork = isConnected && chainId !== rootstockTestnet.id

  return (
    <section className="card wallet-card">
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
              type="button"
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
              <code>{chainId}</code> (Expected: <code>{rootstockTestnet.id}</code>)
            </span>
          </div>
          {isWrongNetwork && (
            <button
              type="button"
              onClick={() => switchChainAsync({ chainId: rootstockTestnet.id })}
              disabled={isSwitching}
            >
              {isSwitching ? 'Switching...' : 'Switch to Rootstock Testnet'}
            </button>
          )}
          <button className="secondary" onClick={() => disconnect()} type="button">
            Disconnect
          </button>
        </>
      )}
    </section>
  )
}
