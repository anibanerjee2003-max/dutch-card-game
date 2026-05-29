import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { INITIAL_STATE } from '../game/reducer';
import type { GameState } from '../types';

interface Props {
  onRoomReady: (roomId: string, roomCode: string, state: GameState, myName: string, isHost: boolean, lobbyPlayers: string[]) => void;
}

function generateCode(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

export function LobbyScreen({ onRoomReady }: Props) {
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const nameValid = name.trim().length >= 1;

  async function createRoom() {
    if (!nameValid) return;
    setLoading(true);
    setError('');
    const code = generateCode();
    const lobbyPlayers = [name.trim()];
    const { data, error: err } = await supabase
      .from('rooms')
      .insert({ code, state: INITIAL_STATE, lobby_players: lobbyPlayers })
      .select()
      .single();

    if (err || !data) {
      setError('Failed to create room. Try again.');
      setLoading(false);
      return;
    }
    onRoomReady(data.id, data.code, data.state as GameState, name.trim(), true, lobbyPlayers);
  }

  async function joinRoom() {
    if (!nameValid) return;
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

    // Add this player's name to lobby
    const updatedPlayers = [...(data.lobby_players as string[] || []), name.trim()];
    await supabase
      .from('rooms')
      .update({ lobby_players: updatedPlayers })
      .eq('id', data.id);

    onRoomReady(data.id, data.code, data.state as GameState, name.trim(), false, updatedPlayers);
  }

  return (
    <div className="setup-screen">
      <div className="setup-card">
        <h1 className="setup-title">Dutch</h1>
        <p className="setup-subtitle">Online multiplayer</p>

        <input
          className="setup-input"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name"
          maxLength={16}
          autoFocus
        />

        <div className="lobby-section" style={{ marginTop: '12px' }}>
          <button className="btn btn-primary btn-lg" onClick={createRoom} disabled={loading || !nameValid}>
            {loading ? 'Creating...' : 'Create Room'}
          </button>
        </div>

        <div className="lobby-divider">— or join existing room —</div>

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
            disabled={loading || !nameValid || joinCode.trim().length < 4}
          >
            {loading ? 'Joining...' : 'Join Room'}
          </button>
        </div>

        {error && <p className="lobby-error">{error}</p>}
      </div>
    </div>
  );
}
