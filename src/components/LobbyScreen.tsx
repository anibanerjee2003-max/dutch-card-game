import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { INITIAL_STATE } from '../game/reducer';
import type { GameState } from '../types';

interface Props {
  onRoomReady: (roomId: string, roomCode: string, state: GameState) => void;
}

function generateCode(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

export function LobbyScreen({ onRoomReady }: Props) {
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function createRoom() {
    setLoading(true);
    setError('');
    const code = generateCode();
    const { data, error: err } = await supabase
      .from('rooms')
      .insert({ code, state: INITIAL_STATE })
      .select()
      .single();

    if (err || !data) {
      setError('Failed to create room. Try again.');
      setLoading(false);
      return;
    }
    onRoomReady(data.id, data.code, data.state as GameState);
  }

  async function joinRoom() {
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase
      .from('rooms')
      .select()
      .eq('code', joinCode.toUpperCase().trim())
      .single();

    if (err || !data) {
      setError('Room not found. Check the code and try again.');
      setLoading(false);
      return;
    }
    onRoomReady(data.id, data.code, data.state as GameState);
  }

  return (
    <div className="setup-screen">
      <div className="setup-card">
        <h1 className="setup-title">Dutch</h1>
        <p className="setup-subtitle">Online multiplayer</p>

        <div className="lobby-section">
          <button className="btn btn-primary btn-lg" onClick={createRoom} disabled={loading}>
            {loading ? 'Creating...' : 'Create Room'}
          </button>
        </div>

        <div className="lobby-divider">— or join —</div>

        <div className="lobby-section">
          <input
            className="setup-input lobby-code-input"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Room code"
            maxLength={4}
          />
          <button
            className="btn btn-outline"
            onClick={joinRoom}
            disabled={loading || joinCode.trim().length < 4}
          >
            {loading ? 'Joining...' : 'Join Room'}
          </button>
        </div>

        {error && <p className="lobby-error">{error}</p>}
      </div>
    </div>
  );
}
