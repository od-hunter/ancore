import { describe, expect, it } from '@jest/globals';

import {
  decryptSecretKey,
  encryptSecretKey,
} from '../encryption';

describe('encryptSecretKey()/decryptSecretKey() round-trip', () => {
  it('decrypts encrypted payload back to original secret key', async () => {
    const secretKey = 'SBP2TKRWC3M3A3LYHDSZAF6KXMP7RSMYVY4GRM5L7HF3MPLW2JSV76J2';
    const password = 'Str0ng-P@ssword-For-Encryption!';

    const encrypted = await encryptSecretKey(secretKey, password);
    const decrypted = await decryptSecretKey(encrypted, password);

    expect(decrypted).toBe(secretKey);
    expect(encrypted.iterations).toBeGreaterThanOrEqual(100000);
    expect(encrypted.salt).toBeTruthy();
    expect(encrypted.iv).toBeTruthy();
    expect(encrypted.ciphertext).toBeTruthy();
  });

  it('fails gracefully with wrong password', async () => {
    const secretKey = 'SDMNB4PTWDEQY5L4ZVGW3K5A4VZKX7QK6GXU7ZC3Q4LPMX4SF2HFHUP3';
    const correctPassword = 'Ancore-C0rrect-P@ssword!';
    const wrongPassword = 'Ancore-Wrong-P@ssword!';

    const encrypted = await encryptSecretKey(secretKey, correctPassword);

    await expect(decryptSecretKey(encrypted, wrongPassword)).rejects.toThrow(
      'Invalid password or corrupted encrypted payload.'
    );
  });

  it('generates unique salt and IV for each encryption call', async () => {
    const secretKey = 'SD3EWRVOGZTU5SNQYF7QAXK6Q7NPW2BCHE4B2CNPP67VQ4DHGGCMXLGF';
    const password = 'Ancore-Randomness-P@ssword!';

    const first = await encryptSecretKey(secretKey, password);
    const second = await encryptSecretKey(secretKey, password);

    expect(first.salt).not.toBe(second.salt);
    expect(first.iv).not.toBe(second.iv);
  });
});
