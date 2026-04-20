import type { SSEEvent, SerializedState } from './types';

type Subscriber = {
  controller: ReadableStreamDefaultController<Uint8Array>;
};

const encoder = new TextEncoder();

const encodeEvent = (event: SSEEvent): Uint8Array =>
  encoder.encode(`data: ${JSON.stringify(event)}\n\n`);

const fisherYatesShuffle = <T>(arr: T[]): T[] => {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const RECONNECT_GRACE_MS = 5000;

const createStore = () => {
  const users = new Map<string, { assignment: string | null; username: string | null }>();
  const subscribers = new Map<string, Subscriber>();
  const pendingRemovals = new Map<string, ReturnType<typeof setTimeout>>();
  let phase: 'idle' | 'assigned' = 'idle';
  let choices: string[] = ['', '', ''];
  let hostId: string | null = null;
  let choicesConfirmed = false;

  const broadcast = (event: SSEEvent) => {
    const encoded = encodeEvent(event);
    for (const [userId, sub] of subscribers) {
      try {
        sub.controller.enqueue(encoded);
      } catch {
        subscribers.delete(userId);
      }
    }
  };

  const broadcastExcept = (excludeId: string, event: SSEEvent) => {
    const encoded = encodeEvent(event);
    for (const [userId, sub] of subscribers) {
      if (userId === excludeId) continue;
      try {
        sub.controller.enqueue(encoded);
      } catch {
        subscribers.delete(userId);
      }
    }
  };

  const getSerializedState = (): SerializedState => ({
    users: Array.from(users.entries()).map(([userId, record]) => ({
      userId,
      username: record.username,
      assignment: record.assignment,
    })),
    phase,
    choices,
    hostId,
    choicesConfirmed,
  });

  return {
    registerUser(
      userId: string,
      controller: ReadableStreamDefaultController<Uint8Array>,
    ) {
      // 再接続の場合は削除タイマーをキャンセル
      const pending = pendingRemovals.get(userId);
      if (pending) {
        clearTimeout(pending);
        pendingRemovals.delete(userId);
      }

      const isNew = !users.has(userId);
      users.set(userId, { assignment: users.get(userId)?.assignment ?? null, username: users.get(userId)?.username ?? null });
      subscribers.set(userId, { controller });

      if (isNew && hostId === null) {
        hostId = userId;
      }

      try {
        controller.enqueue(encodeEvent({ type: 'init', userId }));
        controller.enqueue(encodeEvent({ type: 'state', state: getSerializedState() }));
      } catch {
        // Controller may have already closed
      }

      if (isNew) {
        broadcastExcept(userId, { type: 'user_joined', userId, username: null });
      }
    },

    removeUser(userId: string) {
      subscribers.delete(userId);

      // 猶予期間内に再接続した場合はユーザーデータを維持する
      const timer = setTimeout(() => {
        pendingRemovals.delete(userId);
        users.delete(userId);
        broadcast({ type: 'user_left', userId });

        if (hostId === userId) {
          hostId = users.keys().next().value ?? null;
          broadcast({ type: 'host_changed', hostId });
        }
      }, RECONNECT_GRACE_MS);

      pendingRemovals.set(userId, timer);
    },

    getSerializedState,

    setUsername(userId: string, username: string) {
      const record = users.get(userId);
      if (!record) return;
      users.set(userId, { ...record, username });
      broadcast({ type: 'username_set', userId, username });
    },

    confirmChoices(userId: string, newChoices: string[]): boolean {
      if (userId !== hostId) return false;
      choices = newChoices;
      choicesConfirmed = true;
      broadcast({ type: 'choices_confirmed', choices });
      return true;
    },

    randomizeAndBroadcast(validChoices: string[]) {
      const shuffled = fisherYatesShuffle(validChoices);
      const userIds = Array.from(users.keys());
      const assignments: Record<string, string> = {};

      userIds.forEach((userId, i) => {
        const choice = shuffled[i % shuffled.length];
        assignments[userId] = choice;
        users.set(userId, { ...users.get(userId)!, assignment: choice });
      });

      phase = 'assigned';
      broadcast({ type: 'assigned', assignments });
    },
  };
}

export const store = createStore();
