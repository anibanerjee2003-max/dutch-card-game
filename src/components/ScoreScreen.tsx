import type { Player } from '../types';
import { calcPlayerScore } from '../utils/deck';

interface Props {
  players: Player[];
  round: number;
  dutchBy: number | null;
  onNextRound: () => void;
}

export function ScoreScreen({ players, round, dutchBy, onNextRound }: Props) {
  const sorted = [...players].sort((a, b) => a.cumulativeScore - b.cumulativeScore);
  const dutcher = dutchBy !== null ? players.find(p => p.id === dutchBy) : null;

  // Detect if Dutch failed (dutcher doesn't have strictly lowest score)
  let dutchFailed = false;
  if (dutcher) {
    const dutcherScore = calcPlayerScore(dutcher);
    dutchFailed = !players.every(p => p.id === dutcher.id || calcPlayerScore(p) > dutcherScore);
  }

  return (
    <div className="score-screen">
      <div className="score-card">
        <h2 className="score-title">Round {round} Complete</h2>

        {dutcher && (
          <div className={`dutch-result ${dutchFailed ? 'dutch-failed' : 'dutch-success'}`}>
            {dutchFailed
              ? `❌ ${dutcher.name}'s Dutch FAILED — penalty applied!`
              : `✅ ${dutcher.name}'s Dutch SUCCEEDED!`}
          </div>
        )}

        <table className="score-table">
          <thead>
            <tr>
              <th>Player</th>
              <th>This Round</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(p => {
              const roundScore = calcPlayerScore(p);
              return (
                <tr key={p.id} className={p.id === sorted[0].id ? 'score-row-leader' : ''}>
                  <td>{p.name}</td>
                  <td className={roundScore < 0 ? 'score-negative' : ''}>{roundScore}</td>
                  <td className={`score-total ${p.cumulativeScore >= 80 ? 'score-danger' : ''}`}>
                    {p.cumulativeScore}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <p className="score-note">Game ends when any player reaches 100 pts. Lowest total wins.</p>
        <button className="btn btn-primary" onClick={onNextRound}>Start Next Round</button>
      </div>
    </div>
  );
}
