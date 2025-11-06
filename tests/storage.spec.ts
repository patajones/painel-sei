import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getSeiSites, upsertSeiSite } from '../src/shared/storage';

declare const chrome: any;

describe('storage utils', () => {
  beforeEach(() => {
    // simple chrome.storage mock
    const store: Record<string, any> = {};
    (global as any).chrome = {
      storage: {
        local: {
          async get(key: string) {
            return { [key]: store[key] };
          },
          async set(obj: Record<string, any>) {
            Object.assign(store, obj);
          }
        }
      }
    };
  });

  it('creates a new entry when not existing', async () => {
    const res = await upsertSeiSite('https://example.com/sei');
    expect(res).toHaveLength(1);
    expect(res[0].url).toBe('https://example.com/sei');
    expect(res[0].firstDetectedAt).toBeTruthy();
    expect(res[0].lastVisitedAt).toBeTruthy();
  });

  it('updates existing entry preserving firstDetectedAt', async () => {
    const first = await upsertSeiSite('https://example.com/sei');
    const firstDetected = first[0].firstDetectedAt;
    await new Promise(r => setTimeout(r, 5));
    const updated = await upsertSeiSite('https://example.com/sei', 'Org');
    expect(updated).toHaveLength(1);
    expect(updated[0].firstDetectedAt).toBe(firstDetected);
    expect(updated[0].lastVisitedAt >= firstDetected).toBe(true);
    expect(updated[0].name).toBe('Org');
  });
});
