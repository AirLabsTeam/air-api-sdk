import { describe, test, expect } from 'bun:test';
import { NotFoundError, BadRequestError, APIError } from '@air/api-sdk';
import { getClient } from './helpers/setup';

const client = getClient();

describe('Errors', () => {
  test('NotFoundError: get asset with fake UUID', async () => {
    try {
      await client.assets.get('00000000-0000-0000-0000-000000000000');
      throw new Error('Expected NotFoundError');
    } catch (err) {
      expect(err).toBeInstanceOf(NotFoundError);
      expect(err).toBeInstanceOf(APIError);
      expect((err as NotFoundError).status).toBe(404);
    }
  });

  test('APIError: get asset with invalid ID format returns error', async () => {
    try {
      await client.assets.get('not-a-valid-uuid');
      throw new Error('Expected APIError');
    } catch (err) {
      expect(err).toBeInstanceOf(APIError);
      expect((err as APIError).status).toBeGreaterThanOrEqual(400);
    }
  });
});
