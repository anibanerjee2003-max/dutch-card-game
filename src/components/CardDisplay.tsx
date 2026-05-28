import type { Card } from '../types';
import { getSuitSymbol, getSuitColor } from '../utils/deck';

interface Props {
  card: Card | null | 'back'; // null = empty slot, 'back' = face down, Card = face up
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  dimmed?: boolean;
  onClick?: () => void;
  label?: string; // small text beneath
}

export function CardDisplay({ card, size = 'md', selected, dimmed, onClick, label }: Props) {
  const sizeClass = `card-${size}`;
  const base = `card ${sizeClass}${selected ? ' card-selected' : ''}${dimmed ? ' card-dimmed' : ''}${onClick ? ' card-clickable' : ''}`;

  if (card === null) {
    return (
      <div className={`${base} card-empty`} onClick={onClick}>
        {label && <span className="card-label">{label}</span>}
      </div>
    );
  }

  if (card === 'back') {
    return (
      <div className={`${base} card-back`} onClick={onClick}>
        <div className="card-back-pattern" />
        {label && <span className="card-label">{label}</span>}
      </div>
    );
  }

  const color = getSuitColor(card.suit);
  const sym = getSuitSymbol(card.suit);

  return (
    <div className={`${base} card-face card-${color}`} onClick={onClick}>
      <div className="card-corner card-corner-tl">
        <span className="card-rank">{card.rank}</span>
        <span className="card-suit-sm">{sym}</span>
      </div>
      <div className="card-center-suit">{sym}</div>
      <div className="card-corner card-corner-br">
        <span className="card-rank">{card.rank}</span>
        <span className="card-suit-sm">{sym}</span>
      </div>
      <div className="card-pts">{card.points > 0 ? `+${card.points}` : card.points}</div>
      {label && <span className="card-label">{label}</span>}
    </div>
  );
}
