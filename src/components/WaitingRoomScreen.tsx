interface Props {
  roomCode: string;
  lobbyPlayers: string[];
  myName: string;
  isHost: boolean;
  onStart: () => void;
}

export function WaitingRoomScreen({ roomCode, lobbyPlayers, myName, isHost, onStart }: Props) {
  const canStart = lobbyPlayers.length >= 2;

  return (
    <div className="setup-screen">
      <div className="setup-card">
        <h1 className="setup-title">Dutch</h1>

        <div className="waiting-room-code">
          <p className="waiting-label">Room code — share with friends</p>
          <div className="waiting-code">{roomCode}</div>
        </div>

        <div className="waiting-players">
          <p className="waiting-label">Players joined ({lobbyPlayers.length})</p>
          {lobbyPlayers.map((p, i) => (
            <div key={i} className={`waiting-player-row${p === myName ? ' waiting-player-you' : ''}`}>
              <span>{p}</span>
              {p === myName && <span className="waiting-you-tag">you</span>}
              {i === 0 && <span className="waiting-host-tag">host</span>}
            </div>
          ))}
        </div>

        {isHost ? (
          <button
            className={`btn btn-primary btn-lg${!canStart ? ' btn-disabled' : ''}`}
            onClick={onStart}
            disabled={!canStart}
          >
            {canStart ? 'Start Game' : 'Waiting for players...'}
          </button>
        ) : (
          <p className="waiting-hint">Waiting for {lobbyPlayers[0]} to start the game...</p>
        )}
      </div>
    </div>
  );
}
