import { StrKey, scValToNative, xdr, type rpc } from '@stellar/stellar-sdk';
import { bytes32ScValToPublicKey, scValToAddress, scValToU64 } from './xdr-utils';

export const ACCOUNT_CONTRACT_EVENT_TOPICS = {
  initialized: 'initialized',
  executed: 'executed',
  sessionKeyAdded: 'session_key_added',
  sessionKeyRevoked: 'session_key_revoked',
  upgraded: 'upgraded',
  migrated: 'migrated',
  sessionKeyTtlRefreshed: 'session_key_ttl_refreshed',
} as const;

export type AccountContractEventTopic =
  (typeof ACCOUNT_CONTRACT_EVENT_TOPICS)[keyof typeof ACCOUNT_CONTRACT_EVENT_TOPICS];

export interface AccountContractInitializedEvent {
  type: 'initialized';
  owner: string;
}

export interface AccountContractExecutedEvent {
  type: 'executed';
  to: string;
  functionName: string;
  nonce: number;
}

export interface AccountContractSessionKeyAddedEvent {
  type: 'session_key_added';
  publicKey: string;
  expiresAt: number;
}

export interface AccountContractSessionKeyRevokedEvent {
  type: 'session_key_revoked';
  publicKey: string;
}

export interface AccountContractUpgradedEvent {
  type: 'upgraded';
  wasmHash: string;
}

export interface AccountContractMigratedEvent {
  type: 'migrated';
  oldVersion: number;
  newVersion: number;
}

export interface AccountContractSessionKeyTtlRefreshedEvent {
  type: 'session_key_ttl_refreshed';
  publicKey: string;
  expiresAt: number;
}

export type AccountContractEvent =
  | AccountContractInitializedEvent
  | AccountContractExecutedEvent
  | AccountContractSessionKeyAddedEvent
  | AccountContractSessionKeyRevokedEvent
  | AccountContractUpgradedEvent
  | AccountContractMigratedEvent
  | AccountContractSessionKeyTtlRefreshedEvent;

function scValToSymbol(scVal: xdr.ScVal): string {
  const native = scValToNative(scVal);
  if (typeof native !== 'string') {
    throw new TypeError('Expected symbol string from ScVal');
  }
  return native;
}

function decodeVecTuple(scVal: xdr.ScVal, expectedLength: number, eventName: string): xdr.ScVal[] {
  const vec = scVal.vec();
  if (!vec || vec.length !== expectedLength) {
    throw new TypeError(`${eventName} data must be a vec of length ${expectedLength}`);
  }
  return vec;
}

function bytesToHex(scVal: xdr.ScVal): string {
  const native = scValToNative(scVal);
  if (!(native instanceof Uint8Array)) {
    throw new TypeError('Expected bytes from ScVal');
  }
  return Array.from(native)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function decodeAccountContractEventData(
  topic: AccountContractEventTopic,
  data: xdr.ScVal
): AccountContractEvent {
  switch (topic) {
    case ACCOUNT_CONTRACT_EVENT_TOPICS.initialized:
      return {
        type: ACCOUNT_CONTRACT_EVENT_TOPICS.initialized,
        owner: scValToAddress(data),
      };
    case ACCOUNT_CONTRACT_EVENT_TOPICS.executed: {
      const [toScVal, functionScVal, nonceScVal] = decodeVecTuple(data, 3, topic);
      return {
        type: ACCOUNT_CONTRACT_EVENT_TOPICS.executed,
        to: scValToAddress(toScVal),
        functionName: scValToSymbol(functionScVal),
        nonce: scValToU64(nonceScVal),
      };
    }
    case ACCOUNT_CONTRACT_EVENT_TOPICS.sessionKeyAdded: {
      const [publicKeyScVal, expiresAtScVal] = decodeVecTuple(data, 2, topic);
      return {
        type: ACCOUNT_CONTRACT_EVENT_TOPICS.sessionKeyAdded,
        publicKey: bytes32ScValToPublicKey(publicKeyScVal),
        expiresAt: scValToU64(expiresAtScVal),
      };
    }
    case ACCOUNT_CONTRACT_EVENT_TOPICS.sessionKeyRevoked:
      return {
        type: ACCOUNT_CONTRACT_EVENT_TOPICS.sessionKeyRevoked,
        publicKey: bytes32ScValToPublicKey(data),
      };
    case ACCOUNT_CONTRACT_EVENT_TOPICS.upgraded:
      return {
        type: ACCOUNT_CONTRACT_EVENT_TOPICS.upgraded,
        wasmHash: bytesToHex(data),
      };
    case ACCOUNT_CONTRACT_EVENT_TOPICS.migrated: {
      const [oldVersionScVal, newVersionScVal] = decodeVecTuple(data, 2, topic);
      return {
        type: ACCOUNT_CONTRACT_EVENT_TOPICS.migrated,
        oldVersion: Number(scValToNative(oldVersionScVal)),
        newVersion: Number(scValToNative(newVersionScVal)),
      };
    }
    case ACCOUNT_CONTRACT_EVENT_TOPICS.sessionKeyTtlRefreshed: {
      const [publicKeyScVal, expiresAtScVal] = decodeVecTuple(data, 2, topic);
      return {
        type: ACCOUNT_CONTRACT_EVENT_TOPICS.sessionKeyTtlRefreshed,
        publicKey: bytes32ScValToPublicKey(publicKeyScVal),
        expiresAt: scValToU64(expiresAtScVal),
      };
    }
  }
}

function decodeTopic(topicScVal: xdr.ScVal): AccountContractEventTopic | null {
  const topic = scValToNative(topicScVal);
  if (typeof topic !== 'string') {
    return null;
  }
  if (Object.values(ACCOUNT_CONTRACT_EVENT_TOPICS).includes(topic as AccountContractEventTopic)) {
    return topic as AccountContractEventTopic;
  }
  return null;
}

export interface DecodedAccountContractEventEnvelope {
  contractId: string;
  event: AccountContractEvent;
}

export function decodeAccountContractRpcEvent(
  event: rpc.Api.EventResponse
): DecodedAccountContractEventEnvelope | null {
  if (event.type !== 'contract' || !event.contractId || event.topic.length === 0) {
    return null;
  }

  const topic = decodeTopic(event.topic[0]);
  if (!topic) {
    return null;
  }

  return {
    contractId: event.contractId.toString(),
    event: decodeAccountContractEventData(topic, event.value),
  };
}

export function decodeAccountContractEvent(
  contractEvent: xdr.ContractEvent
): DecodedAccountContractEventEnvelope | null {
  if (contractEvent.type() !== xdr.ContractEventType.contract) {
    return null;
  }

  const body = contractEvent.body().v0();
  const topicScVal = body.topics()[0];
  if (!topicScVal) {
    return null;
  }

  const topic = decodeTopic(topicScVal);
  if (!topic) {
    return null;
  }

  const contractId = contractEvent.contractId();
  if (!contractId) {
    return null;
  }

  return {
    contractId: StrKey.encodeContract(contractId.value()),
    event: decodeAccountContractEventData(topic, body.data()),
  };
}
