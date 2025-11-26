import { keccak256, stringToHex, type Hex } from 'viem';

export function stringIdToBytes32(id: string): Hex {
  if (!id) {
    throw new Error('Cannot derive bytes32 from empty identifier');
  }
  return keccak256(stringToHex(id));
}
