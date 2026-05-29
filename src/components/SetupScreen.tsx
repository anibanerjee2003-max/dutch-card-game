import { useState } from 'react';

interface Props {
  onStart: (playerNames: string[]) => void;
  existingPlayers?: string[]; // for "new round" — pre-fill names
  roomCode?: string;
}

export function SetupScreen({ onStart, existingPlayers, roomCode }: Props) {
  const [names, setNames] = useState<string[]>(
    existingPlayers ?? ['', '', '', '']
  );

  function setName(i: number, val: string) {
    setNames(prev => prev.map((n, idx) => (idx === i ? val : n)));
  }

  function addPlayer() {
    if (names.length < 6) setNames(prev => [...prev, '']);
  }

  function removePlayer(i: number) {
    if (names.length > 2) setNames(prev => prev.filter((_, idx) => idx !== i));
  }

  function handleStart() {
    const filled = names.map(n => n.trim()).filter(Boolean);
    if (filled.length < 2) return;
    onStart(filled);
  }

  const valid = names.filter(n => n.trim()).length >= 2;

  return (
    <div className="setup-screen">
      <div className="setup-card">
        <h1 className="setup-title">Dutch</h1>
        {roomCode
          ? <p className="setup-subtitle">Room code: <strong>{roomCode}</strong> · share with friends</p>
          : <p className="setup-subtitle">2–6 players · shared device</p>
        }

        <div className="setup-players">
          {names.map((name, i) => (
            <div key={i} className="setup-player-row">
              <span className="setup-player-num">{i + 1}</span>
              <input
                className="setup-input"
                value={name}
                onChange={e => setName(i, e.target.value)}
                placeholder={`Player ${i + 1}`}
                maxLength={16}
                onKeyDown={e => e.key === 'Enter' && handleStart()}
              />
              {names.length > 2 && (
                <button className="btn-icon" onClick={() => removePlayer(i)} aria-label="Remove">✕</button>
              )}
            </div>
          ))}
        </div>

        {names.length < 6 && (
          <button className="btn btn-outline" onClick={addPlayer}>+ Add Player</button>
        )}

        <button
          className={`btn btn-primary ${!valid ? 'btn-disabled' : ''}`}
          onClick={handleStart}
          disabled={!valid}
        >
          Start Game
        </button>

        <div className="setup-rules">
          <h3>Quick rules</h3>
          <ul>
            <li>Lowest score wins each round</li>
            <li>Game ends when someone reaches 100 pts</li>
            <li>Black King = +20 · Red King = -1</li>
            <li>J = swap 2 cards · Q = peek 1 card · 10 = see next draw</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
