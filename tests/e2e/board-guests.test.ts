import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import type { Board, Role } from '@air/api-sdk';
import { BadRequestError } from '@air/api-sdk';
import { getClient, resourceName } from './helpers/setup';
import { findOrCreateBoard } from './helpers/test-data';

const client = getClient();
let board: Board;
let roles: Role[];
const cleanup: (() => Promise<void>)[] = [];

const TEST_GUEST_EMAIL = `e2e-test+${Date.now()}@example.com`;

beforeAll(async () => {
  board = await findOrCreateBoard(client, 'guests-board');
  cleanup.push(() => client.boards.delete(board.id));
  roles = await client.roles.list({ type: 'guest' });
});

afterAll(async () => {
  for (const fn of cleanup) {
    try { await fn(); } catch {}
  }
});

describe('Board Guests', () => {
  test('addGuest → listGuests → filter by email → removeGuest', async () => {
    expect(roles.length).toBeGreaterThan(0);
    const role = roles[0];

    // Add guest — skip test if workspace is at member limit
    let guest;
    try {
      guest = await client.boards.addGuest(board.id, {
        email: TEST_GUEST_EMAIL,
        roleId: role.id,
      });
    } catch (err) {
      if (err instanceof BadRequestError && String(err.message).includes('maximum number of members')) {
        console.log('Skipping board-guests test: workspace at member limit');
        return;
      }
      throw err;
    }

    expect(guest.id).toBeDefined();
    expect(guest.email).toBe(TEST_GUEST_EMAIL);
    expect(guest.roleId).toBe(role.id);

    // List all guests
    const allGuests = await client.boards.listGuests(board.id);
    expect(allGuests.length).toBeGreaterThanOrEqual(1);
    expect(allGuests.some((g) => g.id === guest.id)).toBe(true);

    // Filter by email
    const filtered = await client.boards.listGuests(board.id, { email: TEST_GUEST_EMAIL });
    expect(filtered.length).toBe(1);
    expect(filtered[0].email).toBe(TEST_GUEST_EMAIL);

    // Update guest role if multiple roles available
    if (roles.length > 1) {
      const newRole = roles[1];
      await client.boards.updateGuest(board.id, guest.id, { roleId: newRole.id });
      const updatedGuests = await client.boards.listGuests(board.id, { email: TEST_GUEST_EMAIL });
      expect(updatedGuests[0].roleId).toBe(newRole.id);
    }

    // Remove guest
    await client.boards.removeGuest(board.id, guest.id);

    // Verify removed
    const afterRemove = await client.boards.listGuests(board.id, { email: TEST_GUEST_EMAIL });
    expect(afterRemove.length).toBe(0);
  });
});
