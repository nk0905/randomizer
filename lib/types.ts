export interface UserRecord {
  userId: string;
  assignment: string | null;
}

export interface SerializedState {
  users: UserRecord[];
  phase: 'idle' | 'assigned';
}

export type SSEEvent =
  | { type: 'init'; userId: string }
  | { type: 'state'; state: SerializedState }
  | { type: 'user_joined'; userId: string }
  | { type: 'user_left'; userId: string }
  | { type: 'assigned'; assignments: Record<string, string> };
