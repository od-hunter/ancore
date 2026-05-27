import { Address, StrKey, xdr } from '@stellar/stellar-sdk';
import {
  ACCOUNT_CONTRACT_EVENT_TOPICS,
  decodeAccountContractEventData,
  type AccountContractEventTopic,
} from '../event-decoders';
import { publicKeyToBytes32ScVal, symbolToScVal, u64ToScVal } from '../xdr-utils';

const OWNER_ADDRESS = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
const CONTRACT_ADDRESS = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM';
const SESSION_PUBLIC_KEY = 'GCM5WPR4DDR24FSAX5LIEM4J7AI3KOWJYANSXEPKYXCSZOTAYXE75AFN';

function decode(topic: AccountContractEventTopic, data: xdr.ScVal) {
  return decodeAccountContractEventData(topic, data);
}

describe('decodeAccountContractEventData', () => {
  it('decodes initialized event payload', () => {
    expect(
      decode(
        ACCOUNT_CONTRACT_EVENT_TOPICS.initialized,
        new Address(OWNER_ADDRESS).toScVal()
      )
    ).toEqual({
      type: ACCOUNT_CONTRACT_EVENT_TOPICS.initialized,
      owner: OWNER_ADDRESS,
    });
  });

  it('decodes executed event payload', () => {
    expect(
      decode(
        ACCOUNT_CONTRACT_EVENT_TOPICS.executed,
        xdr.ScVal.scvVec([
          new Address(CONTRACT_ADDRESS).toScVal(),
          symbolToScVal('transfer'),
          u64ToScVal(7),
        ])
      )
    ).toEqual({
      type: ACCOUNT_CONTRACT_EVENT_TOPICS.executed,
      to: CONTRACT_ADDRESS,
      functionName: 'transfer',
      nonce: 7,
    });
  });

  it('decodes session key lifecycle event payloads', () => {
    expect(
      decode(
        ACCOUNT_CONTRACT_EVENT_TOPICS.sessionKeyAdded,
        xdr.ScVal.scvVec([publicKeyToBytes32ScVal(SESSION_PUBLIC_KEY), u64ToScVal(101)])
      )
    ).toEqual({
      type: ACCOUNT_CONTRACT_EVENT_TOPICS.sessionKeyAdded,
      publicKey: SESSION_PUBLIC_KEY,
      expiresAt: 101,
    });

    expect(
      decode(
        ACCOUNT_CONTRACT_EVENT_TOPICS.sessionKeyRevoked,
        publicKeyToBytes32ScVal(SESSION_PUBLIC_KEY)
      )
    ).toEqual({
      type: ACCOUNT_CONTRACT_EVENT_TOPICS.sessionKeyRevoked,
      publicKey: SESSION_PUBLIC_KEY,
    });
  });

  it('decodes migrated and upgraded payloads', () => {
    expect(
      decode(
        ACCOUNT_CONTRACT_EVENT_TOPICS.migrated,
        xdr.ScVal.scvVec([xdr.ScVal.scvU32(1), xdr.ScVal.scvU32(2)])
      )
    ).toEqual({
      type: ACCOUNT_CONTRACT_EVENT_TOPICS.migrated,
      oldVersion: 1,
      newVersion: 2,
    });

    expect(
      decode(ACCOUNT_CONTRACT_EVENT_TOPICS.upgraded, xdr.ScVal.scvBytes(Buffer.from([0x0a, 0xff])))
    ).toEqual({
      type: ACCOUNT_CONTRACT_EVENT_TOPICS.upgraded,
      wasmHash: '0aff',
    });
  });

  it('throws on malformed vec payload shape', () => {
    expect(() =>
      decode(
        ACCOUNT_CONTRACT_EVENT_TOPICS.executed,
        xdr.ScVal.scvVec([new Address(CONTRACT_ADDRESS).toScVal()])
      )
    ).toThrow('executed data must be a vec of length 3');
  });

  it('supports all known contract event topics', () => {
    expect(Object.values(ACCOUNT_CONTRACT_EVENT_TOPICS)).toEqual([
      'initialized',
      'executed',
      'session_key_added',
      'session_key_revoked',
      'upgraded',
      'migrated',
      'session_key_ttl_refreshed',
    ]);
  });

  it('decodes session_key_ttl_refreshed event payload', () => {
    expect(
      decode(
        ACCOUNT_CONTRACT_EVENT_TOPICS.sessionKeyTtlRefreshed,
        xdr.ScVal.scvVec([publicKeyToBytes32ScVal(SESSION_PUBLIC_KEY), u64ToScVal(250)])
      )
    ).toEqual({
      type: ACCOUNT_CONTRACT_EVENT_TOPICS.sessionKeyTtlRefreshed,
      publicKey: SESSION_PUBLIC_KEY,
      expiresAt: 250,
    });
  });

  it('converts bytes payload to canonical lowercase hex', () => {
    expect(
      decode(ACCOUNT_CONTRACT_EVENT_TOPICS.upgraded, xdr.ScVal.scvBytes(Buffer.from([0xab, 0x05])))
    ).toEqual({
      type: ACCOUNT_CONTRACT_EVENT_TOPICS.upgraded,
      wasmHash: 'ab05',
    });
  });

  it('builds valid stellar public key from 32-byte payload', () => {
    const decoded = decode(
      ACCOUNT_CONTRACT_EVENT_TOPICS.sessionKeyRevoked,
      publicKeyToBytes32ScVal(SESSION_PUBLIC_KEY)
    );
    if (decoded.type !== 'session_key_revoked') {
      throw new Error('Unexpected decoded event type');
    }
    expect(StrKey.isValidEd25519PublicKey(decoded.publicKey)).toBe(true);
  });
});
