import type { Session } from '@/types';

export const CHAT_ALIASES_STORAGE_KEY = 'clawcommand.chat.aliases';
export const CHAT_SHOW_SUBAGENTS_STORAGE_KEY = 'clawcommand.chat.showSubagents';

export type ChatAliases = Record<string, string>;

export function isSubagentSession(session: Session): boolean {
  const needle = `${session.id} ${session.key} ${session.agentId} ${session.agentName}`.toLowerCase();
  return needle.includes('subagent') || needle.includes('sub-agent') || needle.includes('sub agent');
}

export function filterSessionsBySubagentVisibility(sessions: Session[], showSubagents: boolean): Session[] {
  if (showSubagents) return sessions;
  return sessions.filter((session) => !isSubagentSession(session));
}

export function resolveSessionDisplayName(session: Session, aliases: ChatAliases): string {
  const alias = aliases[session.id]?.trim() || aliases[session.key]?.trim();
  if (alias) return alias;
  if (session.groupLabel && session.groupLabel !== '#General' && session.groupLabel !== '#Drafts') return session.groupLabel;
  return session.key || session.id;
}

export function loadChatAliases(storage: Pick<Storage, 'getItem'> = localStorage): ChatAliases {
  try {
    const raw = storage.getItem(CHAT_ALIASES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return Object.entries(parsed as Record<string, unknown>).reduce<ChatAliases>((acc, [key, value]) => {
      if (typeof value === 'string' && value.trim()) acc[key] = value.trim();
      return acc;
    }, {});
  } catch {
    return {};
  }
}

export function saveChatAliases(aliases: ChatAliases, storage: Pick<Storage, 'setItem'> = localStorage): void {
  storage.setItem(CHAT_ALIASES_STORAGE_KEY, JSON.stringify(aliases));
}

export function mergeSessionLists(previous: Session[], incoming: Session[]): Session[] {
  const drafts = previous.filter((session) => session.id.startsWith('draft-'));
  const prevRemote = previous.filter((session) => !session.id.startsWith('draft-'));

  if (!incoming.length) {
    return [...drafts, ...prevRemote];
  }

  const map = new Map<string, Session>();
  for (const session of drafts) map.set(session.id, session);

  // Keep prior remote sessions as the baseline. Gateway updates can be partial
  // during runtime ticks, session switches, or transport fallback transitions.
  // Incoming records overwrite matching ids, while missing ids stay visible.
  for (const session of prevRemote) map.set(session.id, session);
  for (const session of incoming) map.set(session.id, session);

  return [...map.values()];
}

export function resolveNextActiveSessionId(currentId: string, visibleSessions: Session[]): string {
  if (!visibleSessions.length) return '';
  if (visibleSessions.some((session) => session.id === currentId)) return currentId;
  return visibleSessions[0].id;
}

export function stabilizeVisibleSessions(
  previousStable: Session[],
  nextVisible: Session[],
  allSessions: Session[],
  hasLoadedSessions: boolean,
): Session[] {
  if (nextVisible.length > 0) return nextVisible;
  if (!hasLoadedSessions || allSessions.length === 0) return [];
  return previousStable;
}

export function loadShowSubagents(storage: Pick<Storage, 'getItem'> = localStorage): boolean {
  return storage.getItem(CHAT_SHOW_SUBAGENTS_STORAGE_KEY) === 'true';
}

export function saveShowSubagents(value: boolean, storage: Pick<Storage, 'setItem'> = localStorage): void {
  storage.setItem(CHAT_SHOW_SUBAGENTS_STORAGE_KEY, value ? 'true' : 'false');
}
