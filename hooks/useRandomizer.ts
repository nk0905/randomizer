'use client';

import { useEffect, useReducer, useRef, useState, useCallback } from 'react';
import type { SSEEvent, UserRecord } from '@/lib/types';

interface State {
  users: UserRecord[];
  phase: 'idle' | 'assigned';
  choices: string[];
  hostId: string | null;
  choicesConfirmed: boolean;
  myUserId: string | null;
  isConnected: boolean;
  isPending: boolean;
}

type Action =
  | { type: 'connected' }
  | { type: 'disconnected' }
  | { type: 'init'; userId: string }
  | { type: 'state'; users: UserRecord[]; phase: 'idle' | 'assigned'; choices: string[]; hostId: string | null; choicesConfirmed: boolean }
  | { type: 'user_joined'; userId: string; username: string | null }
  | { type: 'user_left'; userId: string }
  | { type: 'assigned'; assignments: Record<string, string> }
  | { type: 'choices_confirmed'; choices: string[] }
  | { type: 'username_set'; userId: string; username: string }
  | { type: 'host_changed'; hostId: string | null }
  | { type: 'pending'; value: boolean };

const initialState: State = {
  users: [],
  phase: 'idle',
  choices: [],
  hostId: null,
  choicesConfirmed: false,
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
      return { ...state, users: action.users, phase: action.phase, choices: action.choices, hostId: action.hostId, choicesConfirmed: action.choicesConfirmed };
    case 'user_joined':
      if (state.users.some((u) => u.userId === action.userId)) return state;
      return { ...state, users: [...state.users, { userId: action.userId, username: action.username, assignment: null }] };
    case 'user_left':
      return { ...state, users: state.users.filter((u) => u.userId !== action.userId) };
    case 'assigned': {
      const updated = state.users.map((u) => ({
        ...u,
        assignment: action.assignments[u.userId] ?? u.assignment,
      }));
      return { ...state, users: updated, phase: 'assigned' };
    }
    case 'choices_confirmed':
      return { ...state, choices: action.choices, choicesConfirmed: true };
    case 'username_set': {
      const users = state.users.map((u) =>
        u.userId === action.userId ? { ...u, username: action.username } : u,
      );
      return { ...state, users };
    }
    case 'host_changed':
      return { ...state, hostId: action.hostId };
    case 'pending':
      return { ...state, isPending: action.value };
    default:
      return state;
  }
};

export const useRandomizer = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [localChoices, setLocalChoices] = useState<string[]>(['', '', '']);
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
          case 'init': {
            dispatch({ type: 'init', userId: parsed.userId });
            dispatch({ type: 'connected' });
            const savedUsername = localStorage.getItem('randomizer_username');
            if (savedUsername) {
              fetch('/api/username', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: savedUsername }),
              });
            }
            break;
          }
          case 'state':
            dispatch({ type: 'state', users: parsed.state.users, phase: parsed.state.phase, choices: parsed.state.choices, hostId: parsed.state.hostId, choicesConfirmed: parsed.state.choicesConfirmed });
            setLocalChoices(parsed.state.choices.length > 0 ? parsed.state.choices : ['', '', '']);
            break;
          case 'user_joined':
            dispatch({ type: 'user_joined', userId: parsed.userId, username: parsed.username });
            break;
          case 'user_left':
            dispatch({ type: 'user_left', userId: parsed.userId });
            break;
          case 'assigned':
            dispatch({ type: 'assigned', assignments: parsed.assignments });
            break;
          case 'choices_confirmed':
            dispatch({ type: 'choices_confirmed', choices: parsed.choices });
            setLocalChoices(parsed.choices);
            break;
          case 'username_set':
            dispatch({ type: 'username_set', userId: parsed.userId, username: parsed.username });
            break;
          case 'host_changed':
            dispatch({ type: 'host_changed', hostId: parsed.hostId });
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

  const setUsername = useCallback(async (username: string) => {
    localStorage.setItem('randomizer_username', username);
    await fetch('/api/username', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
  }, []);

  const updateChoices = useCallback((newChoices: string[]) => {
    setLocalChoices(newChoices);
  }, []);

  const confirmChoices = useCallback(async (choices: string[]) => {
    dispatch({ type: 'pending', value: true });
    try {
      await fetch('/api/choices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choices }),
      });
    } finally {
      dispatch({ type: 'pending', value: false });
    }
  }, []);

  const start = useCallback(async () => {
    dispatch({ type: 'pending', value: true });
    try {
      await fetch('/api/start', { method: 'POST' });
    } finally {
      dispatch({ type: 'pending', value: false });
    }
  }, []);

  const myUsername = state.users.find((u) => u.userId === state.myUserId)?.username ?? null;
  const isHost = state.myUserId !== null && state.myUserId === state.hostId;

  return { ...state, myUsername, isHost, localChoices, setUsername, updateChoices, confirmChoices, start };
};
