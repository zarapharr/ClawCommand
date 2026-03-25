import { beforeEach, describe, expect, it } from 'vitest';
import { mapSession, resetTelegramTopicNameCacheForTests, resolveSessionGroupLabel } from '@/lib/openclaw-contract';

describe('openclaw contract session grouping', () => {
  beforeEach(() => {
    localStorage.clear();
    resetTelegramTopicNameCacheForTests();
  });

  it('uses telegram topic name when available', () => {
    const raw = {
      key: 'agent:ops-builder:telegram:group:-1003707583017:topic:69',
      sessionId: 's-1',
      topicName: 'Sprint Planning',
    };

    expect(resolveSessionGroupLabel(raw)).toBe('Sprint Planning');
    expect(mapSession(raw).groupLabel).toBe('Sprint Planning');
  });

  it('falls back to #Topic-<id> for telegram group topic without name', () => {
    const raw = {
      key: 'agent:ops-builder:telegram:group:-1003707583017:topic:69',
      sessionId: 's-2',
    };

    expect(resolveSessionGroupLabel(raw)).toBe('#Topic-69');
    expect(mapSession(raw).groupLabel).toBe('#Topic-69');
  });

  it('reads telegram topic/thread names from nested origin payloads', () => {
    const raw = {
      key: 'agent:ops-builder:telegram:group:-1003707583017:thread:91',
      sessionId: 's-3',
      origin: {
        thread: {
          id: 91,
          name: 'Ops Board',
        },
      },
    };

    expect(resolveSessionGroupLabel(raw)).toBe('Ops Board');
    expect(mapSession(raw).groupLabel).toBe('Ops Board');
  });

  it('falls back to nested thread/topic id when key does not include topic id', () => {
    const raw = {
      key: 'agent:ops-builder:telegram:group:-1003707583017',
      sessionId: 's-4',
      origin: {
        threadId: 42,
      },
    };

    expect(resolveSessionGroupLabel(raw)).toBe('#Topic-42');
    expect(mapSession(raw).groupLabel).toBe('#Topic-42');
  });

  it('prefers nested metadata topic/thread name over id fallback', () => {
    const raw = {
      key: 'agent:ops-builder:telegram:group:-1003707583017:thread:99',
      sessionId: 's-6',
      origin: {
        metadata: {
          threadName: 'Release Train',
          threadId: 99,
        },
      },
    };

    expect(resolveSessionGroupLabel(raw)).toBe('Release Train');
    expect(mapSession(raw).groupLabel).toBe('Release Train');
  });

  it('prefers key as stable session id when both key and sessionId exist', () => {
    const raw = {
      key: 'agent:ops-builder:telegram:group:-1003707583017:topic:69',
      sessionId: 'volatile-session-id',
    };

    expect(mapSession(raw).id).toBe(raw.key);
  });

  it('reads topic names from broader origin metadata fields', () => {
    const raw = {
      key: 'agent:ops-builder:telegram:group:-1003707583017:topic:77',
      sessionId: 's-7',
      origin: {
        chat: {
          topic: {
            id: 77,
            name: 'Leadership Sync',
          },
        },
      },
    };

    expect(resolveSessionGroupLabel(raw)).toBe('Leadership Sync');
  });

  it('upgrades #Topic labels from cache when a name is learned later', () => {
    const unnamed = {
      key: 'agent:ops-builder:telegram:group:-1003707583017:topic:123',
      sessionId: 's-8',
    };

    expect(resolveSessionGroupLabel(unnamed)).toBe('#Topic-123');

    const named = {
      key: 'agent:ops-builder:telegram:group:-1003707583017:thread:123',
      sessionId: 's-9',
      origin: {
        metadata: {
          threadName: 'Backlog Grooming',
          threadId: 123,
        },
      },
    };

    expect(resolveSessionGroupLabel(named)).toBe('Backlog Grooming');
    expect(resolveSessionGroupLabel(unnamed)).toBe('Backlog Grooming');
  });

  it('does not bleed cached names across different telegram groups', () => {
    const namedInFirstGroup = {
      key: 'agent:ops-builder:telegram:group:-1001:topic:200',
      sessionId: 's-10',
      topicName: 'Finance',
    };
    const unnamedInSecondGroup = {
      key: 'agent:ops-builder:telegram:group:-1002:topic:200',
      sessionId: 's-11',
    };

    expect(resolveSessionGroupLabel(namedInFirstGroup)).toBe('Finance');
    expect(resolveSessionGroupLabel(unnamedInSecondGroup)).toBe('#Topic-200');
  });

  it('uses #General for non-telegram or non-topic sessions', () => {
    expect(resolveSessionGroupLabel({ key: 'agent:ops-builder:openclaw:main' })).toBe('#General');
    expect(resolveSessionGroupLabel({ key: 'agent:ops-builder:telegram:dm:123' })).toBe('#General');
    expect(mapSession({ key: 'agent:ops-builder:openclaw:main', sessionId: 's-5' }).groupLabel).toBe('#General');
  });
});
