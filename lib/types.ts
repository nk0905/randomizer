export interface UserRecord {
  userId: string;
  username: string | null;
  assignment: string | null;
}

export interface SerializedState {
  users: UserRecord[];
  phase: 'idle' | 'assigned';
  choices: string[];
  hostId: string | null;
  choicesConfirmed: boolean;
}

export type SSEEvent =
  | { type: 'init'; userId: string }
  | { type: 'state'; state: SerializedState }
  | { type: 'user_joined'; userId: string; username: string | null }
  | { type: 'user_left'; userId: string }
  | { type: 'assigned'; assignments: Record<string, string> }
  | { type: 'choices_confirmed'; choices: string[] }
  | { type: 'username_set'; userId: string; username: string }
  | { type: 'host_changed'; hostId: string | null };
