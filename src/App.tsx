import { useState, useEffect } from 'react';
import { gameReducer } from './game/reducer';
import { supabase } from './lib/supabase';
import type { GameState } from './types';
import type { Action } from './game/reducer';
import { LobbyScreen } from './components/LobbyScreen';
import { WaitingRoomScreen } from './components/WaitingRoomScreen';
import { GameBoard } from './components/GameBoard';
import { ScoreScreen } from './components/ScoreScreen';
import { GameOver } from './components/GameOver';
import './App.css';

export default function App() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [myName, setMyName] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [lobbyPlayers, setLobbyPlayers] = useState<string[]>([]);

  // Subscribe to real-time updates when in a room
  useEffect(() => {
    if (!roomId) return;

    const subscription = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${roomId}`,
      }, (payload) => {
        const row = payload.new as { state: GameState; lobby_players: string[] };
        setState(row.state);
        setLobbyPlayers(row.lobby_players ?? []);
      })
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, [roomId]);

  // dispatch: run action through reducer, write new state to Supabase
  async function dispatch(action: Action) {
    if (!state || !roomId) return;
    const newState = gameReducer(state, action);
    setState(newState);
    await supabase.from('rooms').update({ state: newState }).eq('id', roomId);
  }

  // Not in a room yet — show lobby
  if (!roomId || !state) {
    return (
      <LobbyScreen
        onRoomReady={(id, code, initialState, name, host, players) => {
          setRoomId(id);
          setRoomCode(code);
          setState(initialState);
          setMyName(name);
          setIsHost(host);
          setLobbyPlayers(players);
        }}
      />
    );
  }

  // In room but game not started — show waiting room
  if (state.phase === 'setup') {
    return (
      <WaitingRoomScreen
        roomCode={roomCode!}
        lobbyPlayers={lobbyPlayers}
        myName={myName}
        isHost={isHost}
        onStart={() => dispatch({ type: 'START_GAME', playerNames: lobbyPlayers })}
      />
    );
  }

  if (state.phase === 'scoring') {
    return (
      <ScoreScreen
        players={state.players}
        round={state.round}
        dutchBy={state.dutchBy}
        onNextRound={() => dispatch({ type: 'NEXT_ROUND' })}
      />
    );
  }

  if (state.phase === 'game_over') {
    return (
      <GameOver
        players={state.players}
        onPlayAgain={() =>
          dispatch({ type: 'START_GAME', playerNames: state.players.map(p => p.name) })
        }
      />
    );
  }

  return <GameBoard state={state} dispatch={dispatch} myName={myName} />;
}
