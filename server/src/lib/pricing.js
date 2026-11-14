import { config } from '../config.js'

/** Server-side source of truth for money. Whole cedis in, whole cedis out. */
export function priceFor(treatment) {
  const total = treatment.price_ghs
  const deposit = Math.round(total * config.depositRate)
  return { total, deposit, balance: total - deposit }
}

/** Paystack wants the smallest unit: pesewas. */
export const toPesewas = (ghs) => ghs * 100
