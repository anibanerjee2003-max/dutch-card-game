import type { Player } from '../types';

interface Props {
  players: Player[];
  onPlayAgain: () => void;
}

export function GameOver({ players, onPlayAgain }: Props) {
  const sorted = [...players].sort((a, b) => a.cumulativeScore - b.cumulativeScore);
  const winner = sorted[0];

  return (
    <div className="score-screen">
      <div className="score-card">
        <div className="gameover-trophy">🏆</div>
        <h2 className="score-title">Game Over!</h2>
        <p className="gameover-winner">{winner.name} wins!</p>

        <table className="score-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Final Score</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => (
              <tr key={p.id} className={i === 0 ? 'score-row-leader' : ''}>
                <td>{i + 1}</td>
                <td>{p.name}</td>
                <td className={p.cumulativeScore >= 100 ? 'score-danger' : ''}>{p.cumulativeScore}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <button className="btn btn-primary" onClick={onPlayAgain}>Play Again</button>
      </div>
    </div>
  );
}
