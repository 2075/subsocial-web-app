import BN from 'bn.js'
import { Text, GenericAccountId, Option } from '@polkadot/types'
import { AccountId } from '@polkadot/types/interfaces'
import AbstractInt from '@polkadot/types/codec/AbstractInt'
import { AddressProps } from 'src/components/profiles/address-views/utils/types'
import { toShortAddress, resolveBn } from 'src/components/utils'
import { Codec } from '@polkadot/types/types'
import { SubstrateId, AnyAccountId } from '@subsocial/types'
import { SubmittableResult } from '@polkadot/api'
import { getSubsocialApi } from 'src/components/utils/SubsocialConnect'
import { SubsocialApi } from '@subsocial/api/subsocial'
import { asAccountId } from '@subsocial/api/utils'
export * from './getTxParams'
export { isEqual } from './isEqual'
export { triggerChange } from './triggerChange'

function toString<DFT> (
  value?: { toString: () => string },
  _default?: DFT
): string | DFT | undefined {

  return value && typeof value.toString === 'function'
    ? value.toString()
    : _default
}

export type AnyText = string | Text | Option<Text>

export type AnyNumber = number | BN | AbstractInt | Option<AbstractInt>

export type AnyAddress = string | AccountId | GenericAccountId | Option<AccountId> | Option<GenericAccountId>

export function stringifyAny<DFT> (value?: any, _default?: DFT): string | DFT | undefined {
  if (typeof value !== 'undefined') {
    if (value instanceof Option) {
      return stringifyText(value.unwrapOr(undefined))
    } else {
      return toString(value)
    }
  }
  return _default
}

export function stringifyText<DFT extends string> (value?: AnyText, _default?: DFT): string | DFT | undefined {
  return stringifyAny(value, _default)
}

export function stringifyNumber<DFT> (value?: AnyNumber, _default?: DFT): string | DFT | undefined {
  return stringifyAny(value, _default)
}

export function stringifyAddress<DFT> (value?: AnyAddress, _default?: DFT): string | DFT | undefined {
  return stringifyAny(value, _default)
}

export const getSpaceId = async (idOrHandle: string, subsocial?: SubsocialApi): Promise<BN | undefined> => {
  if (idOrHandle.startsWith('@')) {
    // Drop '@' char and lowercase handle before searching for its space.
    const handle = idOrHandle.substring(1).toLowerCase()
    const { substrate } = subsocial || await getSubsocialApi()
    return substrate.getSpaceIdByHandle(handle)
  } else {
    return resolveBn(idOrHandle)
  }
}

export function getNewIdsFromEvent (txResult: SubmittableResult): BN[] {
  const newIds: BN[] = []

  txResult.events.find(event => {
    const { event: { data, method } } = event
    if (method.indexOf('Created') >= 0) {
      const [ /* owner */, ...ids ] = data.toArray()
      newIds.push(...ids as unknown as BN[])
      return true
    }
    return false
  })

  return newIds
}

export function getNewIdFromEvent (txResult: SubmittableResult): BN | undefined {
  const [ newId ] = getNewIdsFromEvent(txResult)
  return newId
}

export const getAccountId = async (addressOrHandle: string): Promise<AnyAccountId | undefined> => {
  if (addressOrHandle.startsWith('@')) {
    const handle = addressOrHandle.substring(1) // Drop '@' char.
    const { substrate } = await getSubsocialApi()
    return substrate.getAccountIdByHandle(handle)
  } else {
    return addressOrHandle
  }
}

type MaybeAccAddr = undefined | AnyAccountId

export function equalAddresses (addr1: MaybeAccAddr, addr2: MaybeAccAddr) {
  if (addr1 === addr2) {
    return true
  } else if (!addr1 || !addr2) {
    return false
  } else {
    return true === asAccountId(addr1)?.eq(asAccountId(addr2))
  }
}

type GetNameOptions = AddressProps & {
  isShort?: boolean
}

export const getProfileName = (options: GetNameOptions) => {
  const { owner, isShort = true, address } = options
  return (
    owner?.content?.name ||
    (isShort ? toShortAddress(address) : address)
  ).toString()
}

export const unwrapSubstrateId = (optId?: Option<Codec>): SubstrateId | undefined => {
  if (optId instanceof Option) {
    return optId.unwrapOr(undefined) as SubstrateId | undefined
  }

  return optId && optId as SubstrateId
}

export * from './getTxParams'
