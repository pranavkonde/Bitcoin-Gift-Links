import { formatEther, getAddress, isAddress } from 'viem'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'

export type GiftPayload = {
  pk: string
  sender: string
  amountWei: string
  giftWallet: string
}

export function createGiftPayload(sender: string, amountWei: bigint | string): GiftPayload {
  const pk = generatePrivateKey()
  const account = privateKeyToAccount(pk)
  return {
    pk,
    sender: getAddress(sender),
    amountWei: amountWei.toString(),
    giftWallet: account.address,
  }
}

export function toClaimLink(payload: GiftPayload): string {
  const url = new URL(`${window.location.origin}/claim`)
  const hashParams = new URLSearchParams()
  hashParams.set('pk', payload.pk)
  hashParams.set('sender', payload.sender)
  hashParams.set('amountWei', payload.amountWei)
  hashParams.set('giftWallet', payload.giftWallet)
  url.hash = hashParams.toString()
  return url.toString()
}

export function parseClaimLink(hash: string): GiftPayload | null {
  const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash
  const params = new URLSearchParams(cleanHash)
  const pk = params.get('pk')
  const sender = params.get('sender')
  const amountWei = params.get('amountWei')
  const giftWallet = params.get('giftWallet')

  if (!pk || !sender || !amountWei || !giftWallet) {
    return null
  }

  try {
    if (!/^\d+$/.test(amountWei)) {
      return null
    }
    if (!isAddress(sender) || !isAddress(giftWallet)) {
      return null
    }
    const account = privateKeyToAccount(pk as `0x${string}`)
    if (account.address !== getAddress(giftWallet)) {
      return null
    }
    return {
      pk,
      sender: getAddress(sender),
      amountWei,
      giftWallet: account.address,
    }
  } catch {
    return null
  }
}

export function formatRbtc(wei: bigint | string): string {
  return `${formatEther(typeof wei === 'string' ? BigInt(wei) : wei)} RBTC`
}
