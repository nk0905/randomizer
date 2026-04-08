'use client';

import { useEffect, useReducer, useRef, useCallback } from 'react';
import type { SSEEvent, UserRecord } from '@/lib/types';

interface State {
  users: UserRecord[];
  phase: 'idle' | 'assigned';
  myUserId: string | null;
  isConnected: boolean;
  isPending: boolean;
}

type Action =
  | { type: 'connected' }
  | { type: 'disconnected' }
  | { type: 'init'; userId: string }
  | { type: 'state'; users: UserRecord[]; phase: 'idle' | 'assigned' }
  | { type: 'user_joined'; userId: string }
  | { type: 'user_left'; userId: string }
  | { type: 'assigned'; assignments: Record<string, string> }
  | { type: 'pending'; value: boolean };

const initialState: State = {
  users: [],
  phase: 'idle',
  myUserId: null,
  isConnected: false,
  isPending: false,
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'connected':
      return { ...state, isConnected: true };
    case 'disconnected':
      return { ...state, isConnected: false };
    case 'init':
      return { ...state, myUserId: action.userId };
    case 'state':
      return { ...state, users: action.users, phase: action.phase };
    case 'user_joined':
      if (state.users.some((u) => u.userId === action.userId)) return state;
      return { ...state, users: [...state.users, { userId: action.userId, assignment: null }] };
    case 'user_left':
      return { ...state, users: state.users.filter((u) => u.userId !== action.userId) };
    case 'assigned': {
      const updated = state.users.map((u) => ({
        ...u,
        assignment: action.assignments[u.userId] ?? u.assignment,
      }));
      return { ...state, users: updated, phase: 'assigned' };
    }
    case 'pending':
      return { ...state, isPending: action.value };
    default:
      return state;
  }
}

export const useRandomizer = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource('/api/events');
    esRef.current = es;

    es.addEventListener('open', () => {
      dispatch({ type: 'connected' });
    });

    es.addEventListener('message', (event) => {
      try {
        const parsed = JSON.parse(event.data) as SSEEvent;
        switch (parsed.type) {
          case 'init':
            dispatch({ type: 'init', userId: parsed.userId });
            break;
          case 'state':
            dispatch({ type: 'state', users: parsed.state.users, phase: parsed.state.phase });
            break;
          case 'user_joined':
            dispatch({ type: 'user_joined', userId: parsed.userId });
            break;
          case 'user_left':
            dispatch({ type: 'user_left', userId: parsed.userId });
            break;
          case 'assigned':
            dispatch({ type: 'assigned', assignments: parsed.assignments });
            break;
        }
      } catch {
        // ignore malformed events
      }
    });

    es.addEventListener('error', () => {
      dispatch({ type: 'disconnected' });
    });

    return () => {
      es.close();
      esRef.current = null;
    };
  }, []);

  const start = useCallback(async (choices: string[]) => {
    dispatch({ type: 'pending', value: true });
    try {
      await fetch('/api/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choices }),
      });
    } finally {
      dispatch({ type: 'pending', value: false });
    }
  }, []);

  return { ...state, start };
}
