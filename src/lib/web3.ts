import { rootstockTestnet } from '../wagmi'
import type { PublicClient } from 'viem'

const MIN_ROOTSTOCK_GAS_PRICE = 60_000_000n

export function normalizeGasPrice(gasPrice: bigint | null | undefined): bigint {
  if (!gasPrice || gasPrice <= 0n) {
    return MIN_ROOTSTOCK_GAS_PRICE
  }
  return gasPrice
}

export async function resolveGasPrice(publicClient: PublicClient): Promise<bigint> {
  try {
    const fees = await publicClient.estimateFeesPerGas()
    return normalizeGasPrice(fees.gasPrice)
  } catch {
    try {
      const gasPrice = await publicClient.getGasPrice()
      return normalizeGasPrice(gasPrice)
    } catch {
      return MIN_ROOTSTOCK_GAS_PRICE
    }
  }
}

export function getTxExplorerUrl(hash: string): string {
  return `${rootstockTestnet.blockExplorers.default.url}/tx/${hash}`
}

export function getShortHash(hash: string): string {
  if (hash.length < 12) {
    return hash
  }
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`
}
