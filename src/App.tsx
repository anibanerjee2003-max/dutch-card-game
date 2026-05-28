import { useReducer } from 'react';
import { gameReducer, INITIAL_STATE } from './game/reducer';
import { SetupScreen } from './components/SetupScreen';
import { GameBoard } from './components/GameBoard';
import { ScoreScreen } from './components/ScoreScreen';
import { GameOver } from './components/GameOver';
import './App.css';

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);

  if (state.phase === 'setup') {
    return <SetupScreen onStart={playerNames => dispatch({ type: 'START_GAME', playerNames })} />;
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

  return <GameBoard state={state} dispatch={dispatch} />;
}
