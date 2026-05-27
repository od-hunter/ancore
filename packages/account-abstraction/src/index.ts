/**
 * @ancore/account-abstraction
 * Account abstraction layer for Stellar smart contracts.
 * Provides AccountContract for invoking the Ancore account contract.
 */

export const AA_VERSION = '0.1.0';

export { AccountContract } from './account-contract';
export type { AccountContractReadOptions, InvocationArgs } from './account-contract';

export { getOwner, getNonce } from './get-owner-nonce';

export {
  AccountContractError,
  AlreadyInitializedError,
  NotInitializedError,
  InvalidNonceError,
  UnauthorizedError,
  SessionKeyNotFoundError,
  SessionKeyExpiredError,
  InsufficientPermissionError,
  ContractInvocationError,
  mapContractError,
  CONTRACT_ERROR_MESSAGES,
  CONTRACT_ERROR_CODES,
} from './errors';
export { toCanonicalError as toCanonicalAccountError } from './errors';

export {
  addressToScVal,
  decodeAddSessionKeyArgs,
  decodeExecuteArgs,
  decodeExecuteResult,
  decodeGetSessionKeyArgs,
  decodeInitializeArgs,
  decodeNonceResult,
  decodeOwnerResult,
  decodeRevokeSessionKeyArgs,
  decodeSessionKeyResult,
  decodeVoidResult,
  publicKeyToBytes32ScVal,
  u64ToScVal,
  permissionsToScVal,
  symbolToScVal,
  encodeAddSessionKeyArgs,
  encodeExecuteArgs,
  encodeGetSessionKeyArgs,
  encodeInitializeArgs,
  encodeRevokeSessionKeyArgs,
  scValToAddress,
  scValToU64,
  bytes32ScValToPublicKey,
  scValToSessionKey,
  scValToOptionalSessionKey,
  sessionKeyToScVal,
} from './xdr-utils';

export {
  formatPermissionLabel,
  formatPermissionLabels,
  formatPermissions,
} from './permission-formatter';

export {
  ACCOUNT_CONTRACT_EVENT_TOPICS,
  decodeAccountContractEvent,
  decodeAccountContractEventData,
  decodeAccountContractRpcEvent,
  type AccountContractEvent,
  type AccountContractEventTopic,
  type AccountContractInitializedEvent,
  type AccountContractExecutedEvent,
  type AccountContractSessionKeyAddedEvent,
  type AccountContractSessionKeyRevokedEvent,
  type AccountContractUpgradedEvent,
  type AccountContractMigratedEvent,
  type AccountContractSessionKeyTtlRefreshedEvent,
  type DecodedAccountContractEventEnvelope,
} from './event-decoders';
