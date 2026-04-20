'use client';

import { useState } from 'react';
import { useRandomizer } from '@/hooks/useRandomizer';

const Home = () => {
  const { users, myUserId, myUsername, isConnected, isPending, choices, choicesConfirmed, isHost, localChoices, setUsername, updateChoices, confirmChoices, start } = useRandomizer();
  const [usernameInput, setUsernameInput] = useState('');

  const addChoice = () => {
    updateChoices([...localChoices, '']);
  };

  const removeChoice = (index: number) => {
    updateChoices(localChoices.filter((_, i) => i !== index));
  };

  const updateChoice = (index: number, value: string) => {
    updateChoices(localChoices.map((c, i) => (i === index ? value : c)));
  };

  const handleUsernameSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const name = usernameInput.trim();
    if (!name) return;
    setUsername(name);
  };

  if (!myUsername) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 p-6">
        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm p-8 w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Randomizer</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">ユーザ名を入力してください</p>
          </div>
          <form onSubmit={handleUsernameSubmit} className="space-y-3">
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="ユーザ名"
              autoFocus
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-700 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!myUserId || !usernameInput.trim()}
              className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {myUserId ? '始める' : '接続中...'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const validLocalChoices = localChoices.filter((c) => c.trim() !== '');
  const canConfirm = isHost && isConnected && !isPending && validLocalChoices.length > 0;
  const canStart = isConnected && !isPending && choicesConfirmed;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-6">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Randomizer</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {isConnected ? (
              <span className="text-green-600 dark:text-green-400">
                ● 接続中 ({myUsername}{isHost ? ' · ホスト' : ''})
              </span>
            ) : (
              <span className="text-red-500">● 接続待機中...</span>
            )}
          </p>
        </div>

        {/* Choice Editor */}
        <section className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              選択肢
            </h2>
            {choicesConfirmed && (
              <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 rounded-full px-2 py-0.5">
                確定済み
              </span>
            )}
          </div>

          {isHost ? (
            <>
              <ul className="space-y-2">
                {localChoices.map((choice, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={choice}
                      onChange={(e) => updateChoice(i, e.target.value)}
                      placeholder={`選択肢 ${i + 1}`}
                      className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-700 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={() => removeChoice(i)}
                      disabled={localChoices.length <= 1}
                      className="text-zinc-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg leading-none px-1"
                      aria-label="削除"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={addChoice}
                  className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                >
                  <span className="text-lg leading-none">+</span> 選択肢を追加
                </button>
                <button
                  onClick={() => confirmChoices(localChoices)}
                  disabled={!canConfirm}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  選択肢を確定する
                </button>
              </div>
            </>
          ) : (
            <ul className="space-y-2">
              {(choicesConfirmed ? choices : []).length === 0 ? (
                <p className="text-sm text-zinc-400 dark:text-zinc-500">
                  ホストが選択肢を確定するまでお待ちください
                </p>
              ) : (
                (choicesConfirmed ? choices : []).map((choice, i) => (
                  <li key={i} className="rounded-lg border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-700 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100">
                    {choice}
                  </li>
                ))
              )}
            </ul>
          )}
        </section>

        {/* Start Button */}
        <div className="flex justify-center">
          <button
            onClick={() => start()}
            disabled={!canStart}
            className="w-full max-w-xs rounded-2xl bg-indigo-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                処理中...
              </span>
            ) : choicesConfirmed ? (
              'ランダムに決定！'
            ) : (
              '選択肢を確定してください'
            )}
          </button>
        </div>

        {/* User Grid */}
        {users.length > 0 && (
          <section className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm p-6">
            <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-4">
              参加者 ({users.length}人)
            </h2>
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
              {users.map((user) => {
                const isMe = user.userId === myUserId;
                return (
                  <div
                    key={user.userId}
                    className={[
                      'rounded-xl border-2 p-4 text-center transition-all',
                      isMe
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
                        : 'border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-700',
                    ].join(' ')}
                  >
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 font-mono mb-2">
                      {user.username ?? user.userId.slice(0, 8)}
                      {isMe && ' (自分)'}
                    </p>
                    <p
                      className={[
                        'text-base font-bold wrap-break-word',
                        user.assignment
                          ? 'text-zinc-900 dark:text-zinc-50'
                          : 'text-zinc-300 dark:text-zinc-600',
                      ].join(' ')}
                    >
                      {user.assignment ?? '—'}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {users.length === 0 && isConnected && (
          <p className="text-center text-sm text-zinc-400">
            接続中のユーザーがいません
          </p>
        )}
      </div>
    </div>
  );
};

export default Home;
