import { describe, test, expect } from 'vitest';
import { getClient } from './helpers/setup';

const client = getClient();

describe('Roles', () => {
  test('list guest roles returns array with expected shape', async () => {
    const roles = await client.roles.list({ type: 'guest' });
    expect(Array.isArray(roles)).toBe(true);
    expect(roles.length).toBeGreaterThan(0);

    const role = roles[0];
    expect(role.id).toBeDefined();
    expect(typeof role.name).toBe('string');
    expect(typeof role.description).toBe('string');
    expect(typeof role.billable).toBe('boolean');
    expect(role.type).toBe('guest');
  });
});
