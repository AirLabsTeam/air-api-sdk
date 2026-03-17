import { describe, expect, test } from 'vitest';
import { AirApi } from '../../src/api';
import { createMockFetch, createClientOptions } from '../helpers/mock-fetch';
import { makeCustomField, makePaginatedResponse } from '../helpers/fixtures';

describe('CustomFields', () => {
  test('list returns paginated custom fields', async () => {
    const cf = makeCustomField();
    const mockFetch = createMockFetch({ body: makePaginatedResponse([cf]) });
    const client = new AirApi(createClientOptions(mockFetch));

    const page = await client.customFields.list();
    expect(page.data).toEqual([cf]);
  });

  test('get returns a custom field', async () => {
    const cf = makeCustomField({ id: 'cf-123' });
    const mockFetch = createMockFetch({ body: cf });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.customFields.get('cf-123');
    expect(result).toEqual(cf);
  });

  test('create sends POST with type', async () => {
    const cf = makeCustomField({ type: 'single-select' });
    const mockFetch = createMockFetch({ status: 201, body: cf });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.customFields.create({
      name: 'Priority',
      type: 'single-select',
      values: [{ name: 'High' }, { name: 'Low' }],
    });
    expect(result).toEqual(cf);
    const body = JSON.parse(mockFetch.calls[0].init?.body as string);
    expect(body.type).toBe('single-select');
  });

  test('createValue sends POST', async () => {
    const value = { id: 'v1', name: 'Option A' };
    const mockFetch = createMockFetch({ status: 201, body: value });
    const client = new AirApi(createClientOptions(mockFetch));

    const result = await client.customFields.createValue('cf-1', { name: 'Option A' });
    expect(result).toEqual(value);
    expect(mockFetch.calls[0].url).toContain('/customfields/cf-1/values');
  });

  test('deleteValue sends DELETE', async () => {
    const mockFetch = createMockFetch({ status: 204 });
    const client = new AirApi(createClientOptions(mockFetch));

    await client.customFields.deleteValue('cf-1', 'v1');
    expect(mockFetch.calls[0].url).toContain('/customfields/cf-1/values/v1');
    expect(mockFetch.calls[0].init?.method).toBe('DELETE');
  });
});
