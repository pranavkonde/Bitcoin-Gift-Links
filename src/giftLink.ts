import { Wallet, formatEther, getAddress } from 'ethers'

export type GiftPayload = {
  pk: string
  sender: string
  amountWei: string
  giftWallet: string
}

export function createGiftPayload(sender: string, amountWei: bigint | string): GiftPayload {
  const wallet = Wallet.createRandom()
  return {
    pk: wallet.privateKey,
    sender: getAddress(sender),
    amountWei: amountWei.toString(),
    giftWallet: wallet.address,
  }
}

export function toClaimLink(payload: GiftPayload): string {
  const url = new URL(`${window.location.origin}/claim`)
  url.searchParams.set('pk', payload.pk)
  url.searchParams.set('sender', payload.sender)
  url.searchParams.set('amountWei', payload.amountWei)
  url.searchParams.set('giftWallet', payload.giftWallet)
  return url.toString()
}

export function parseClaimLink(search: string): GiftPayload | null {
  const params = new URLSearchParams(search)
  const pk = params.get('pk')
  const sender = params.get('sender')
  const amountWei = params.get('amountWei')
  const giftWallet = params.get('giftWallet')

  if (!pk || !sender || !amountWei || !giftWallet) {
    return null
  }

  try {
    const wallet = new Wallet(pk)
    if (wallet.address !== getAddress(giftWallet)) {
      return null
    }
    return {
      pk: wallet.privateKey,
      sender: getAddress(sender),
      amountWei,
      giftWallet: wallet.address,
    }
  } catch {
    return null
  }
}

export function formatRbtc(wei: bigint | string): string {
  return `${formatEther(wei)} RBTC`
}
