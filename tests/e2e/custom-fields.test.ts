import { describe, test, expect, afterAll } from 'bun:test';
import { getClient, resourceName } from './helpers/setup';

const client = getClient();
const cleanup: (() => Promise<void>)[] = [];

afterAll(async () => {
  for (const fn of cleanup) {
    try { await fn(); } catch {}
  }
});

describe('Custom Fields', () => {
  test('list custom fields returns paginated response', async () => {
    const page = await client.customFields.list();
    expect(page.data).toBeInstanceOf(Array);
    expect(page.pagination).toBeDefined();
  });

  test('create → get → update → delete lifecycle', async () => {
    const name = resourceName('cf');
    const cf = await client.customFields.create({
      name,
      type: 'single-select',
      values: [{ name: 'Option A' }],
    });
    cleanup.push(() => client.customFields.delete(cf.id));

    expect(cf.id).toBeDefined();
    expect(cf.name).toBe(name);
    expect(cf.type).toBe('single-select');
    expect(cf.values).toBeInstanceOf(Array);
    expect(cf.values!.length).toBe(1);

    // Get
    const fetched = await client.customFields.get(cf.id);
    expect(fetched.id).toBe(cf.id);

    // Update name
    const updatedName = `${name}-updated`;
    await client.customFields.update(cf.id, { name: updatedName });
    const afterUpdate = await client.customFields.get(cf.id);
    expect(afterUpdate.name).toBe(updatedName);

    // Delete
    await client.customFields.delete(cf.id);
    cleanup.length = 0;
  });

  test('custom field value CRUD', async () => {
    const name = resourceName('cf-values');
    const cf = await client.customFields.create({
      name,
      type: 'single-select',
      values: [{ name: 'Initial' }],
    });
    cleanup.push(() => client.customFields.delete(cf.id));

    // Create value
    const newValue = await client.customFields.createValue(cf.id, { name: 'New Option' });
    expect(newValue.id).toBeDefined();
    expect(newValue.name).toBe('New Option');

    // Update value
    await client.customFields.updateValue(cf.id, newValue.id, { name: 'Renamed Option' });
    const refreshed = await client.customFields.get(cf.id);
    const updated = refreshed.values!.find((v) => v.id === newValue.id);
    expect(updated?.name).toBe('Renamed Option');

    // Delete value
    await client.customFields.deleteValue(cf.id, newValue.id);
    const afterDelete = await client.customFields.get(cf.id);
    const gone = afterDelete.values!.find((v) => v.id === newValue.id);
    expect(gone).toBeUndefined();

    // Cleanup CF
    await client.customFields.delete(cf.id);
    cleanup.length = 0;
  });
});
