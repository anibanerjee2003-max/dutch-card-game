interface Props {
  playerName: string;
  action: string;         // e.g. "peek at 2 cards", "take your turn"
  onReveal: () => void;
}

export function PrivacyScreen({ playerName, action, onReveal }: Props) {
  return (
    <div className="privacy-screen" onClick={onReveal}>
      <div className="privacy-content">
        <div className="privacy-icon">🙈</div>
        <h2 className="privacy-name">{playerName}</h2>
        <p className="privacy-action">Pass the device — it's your turn to {action}.</p>
        <div className="privacy-tap">Tap anywhere to continue</div>
      </div>
    </div>
  );
}
