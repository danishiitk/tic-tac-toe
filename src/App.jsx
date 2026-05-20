import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { emptyBoard, Player, RoomStatus } from "./constants";
import { auth, hasFirebaseConfig } from "./firebase";
import {
  createRoom,
  leaveRoom,
  joinRoom,
  listenToRoom,
  playMove,
  startNewRound,
  updatePlayerPresence,
} from "./rooms";
import "./App.css";

const HEARTBEAT_INTERVAL_MS = 10000;
const STALE_PLAYER_MS = 30000;

const getInitialRoomId = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("room") ?? "";
};

const getSavedPlayerName = () =>
  window.localStorage.getItem("ticTacToePlayerName") ?? "";

const updateRoomUrl = (roomId) => {
  const url = new URL(window.location.href);
  url.searchParams.set("room", roomId);
  window.history.replaceState({}, "", url);
};

const clearRoomUrl = () => {
  const url = new URL(window.location.href);
  url.searchParams.delete("room");
  window.history.replaceState({}, "", url);
};

const getPlayerLabel = (room, player) => {
  const name = room?.players?.[player]?.name;
  return name ? `${name} (${player})` : `Player ${player}`;
};

const getOtherPlayer = (player) => (player === Player.O ? Player.X : Player.O);

const getLastSeenMillis = (player) => {
  if (!player?.lastSeen) {
    return player?.connected ? Date.now() : 0;
  }

  if (typeof player.lastSeen.toMillis === "function") {
    return player.lastSeen.toMillis();
  }

  if (typeof player.lastSeen.seconds === "number") {
    return player.lastSeen.seconds * 1000;
  }

  return Date.now();
};

const isPlayerAway = (player, now) =>
  Boolean(player) &&
  (!player.connected || now - getLastSeenMillis(player) > STALE_PLAYER_MS);

const App = () => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(hasFirebaseConfig);
  const [roomId, setRoomId] = useState(getInitialRoomId);
  const [room, setRoom] = useState(null);
  const [loadedRoomId, setLoadedRoomId] = useState("");
  const [playerName, setPlayerName] = useState(getSavedPlayerName);
  const [playerSymbol, setPlayerSymbol] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (!hasFirebaseConfig || !auth) {
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (nextUser) => {
        setUser(nextUser);
        setAuthLoading(false);
      },
      (authError) => {
        setError(authError.message);
        setAuthLoading(false);
      },
    );

    signInAnonymously(auth).catch((authError) => {
      setError(authError.message);
      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!hasFirebaseConfig || !roomId) {
      return undefined;
    }

    return listenToRoom(
      roomId,
      (nextRoom) => {
        setRoom(nextRoom);
        setLoadedRoomId(roomId);

        if (user && nextRoom?.players?.[Player.O]?.uid === user.uid) {
          setPlayerSymbol(Player.O);
        }

        if (user && nextRoom?.players?.[Player.X]?.uid === user.uid) {
          setPlayerSymbol(Player.X);
        }
      },
      (roomError) => {
        setError(roomError.message);
        setLoadedRoomId(roomId);
      },
    );
  }, [roomId, user]);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(Date.now());
    }, 5000);

    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    if (!roomId || !user || !playerSymbol) {
      return undefined;
    }

    const markOnline = () => {
      updatePlayerPresence({
        roomId,
        uid: user.uid,
        player: playerSymbol,
        connected: true,
      }).catch(() => {});
    };

    const markOffline = () => {
      updatePlayerPresence({
        roomId,
        uid: user.uid,
        player: playerSymbol,
        connected: false,
      }).catch(() => {});
    };

    markOnline();

    const timerId = window.setInterval(markOnline, HEARTBEAT_INTERVAL_MS);
    window.addEventListener("pagehide", markOffline);

    return () => {
      window.clearInterval(timerId);
      window.removeEventListener("pagehide", markOffline);
    };
  }, [roomId, playerSymbol, user]);

  const shareLink = useMemo(() => {
    if (!roomId) {
      return "";
    }

    const url = new URL(window.location.href);
    url.searchParams.set("room", roomId);
    return url.toString();
  }, [roomId]);

  const board = room?.board ?? emptyBoard();
  const roomLoading = Boolean(roomId && loadedRoomId !== roomId);
  const gameOver = room?.status === RoomStatus.FINISHED;
  const currentPlayer = room?.currentPlayer ?? Player.O;
  const isInRoom = Boolean(playerSymbol);
  const opponentSymbol = isInRoom ? getOtherPlayer(playerSymbol) : "";
  const opponent = opponentSymbol ? room?.players?.[opponentSymbol] : null;
  const opponentAway =
    room?.status === RoomStatus.ACTIVE && isPlayerAway(opponent, now);
  const roomAbandoned = room?.status === RoomStatus.ABANDONED;
  const isMyTurn =
    room?.status === RoomStatus.ACTIVE && currentPlayer === playerSymbol;
  const canPlay =
    isMyTurn && !gameOver && !roomAbandoned && !opponentAway && !actionPending;
  const roomIsFull =
    room?.players?.[Player.O] &&
    room?.players?.[Player.X] &&
    !isInRoom &&
    user?.uid !== room.players[Player.O].uid &&
    user?.uid !== room.players[Player.X].uid;

  const statusMessage = (() => {
    if (!roomId) {
      return "Create a room to play online with a friend.";
    }

    if (roomLoading) {
      return "Loading room...";
    }

    if (!room) {
      return "Room not found.";
    }

    if (!isInRoom) {
      return roomIsFull
        ? "This room is already full."
        : "Enter your name to join this room.";
    }

    if (room.status === RoomStatus.WAITING) {
      return "Waiting for another player to join.";
    }

    if (roomAbandoned) {
      return "A player left this room. Create a new room to play again.";
    }

    if (opponentAway) {
      return "The other player disconnected. You can wait for them or leave this room.";
    }

    if (room.status === RoomStatus.FINISHED) {
      return room.winner === "draw"
        ? "Match draw."
        : `${getPlayerLabel(room, room.winner)} has won.`;
    }

    return isMyTurn
      ? "Your turn."
      : `${getPlayerLabel(room, currentPlayer)}'s turn.`;
  })();

  const savePlayerName = () => {
    const cleanName = playerName.trim();

    if (!cleanName) {
      throw new Error("Enter your name first.");
    }

    window.localStorage.setItem("ticTacToePlayerName", cleanName);
    return cleanName;
  };

  const handleCreateRoom = async (event) => {
    event.preventDefault();
    setError("");
    setCopied(false);
    setActionPending(true);

    try {
      const cleanName = savePlayerName();
      const nextRoomId = await createRoom({ uid: user.uid, name: cleanName });
      setPlayerSymbol(Player.O);
      setRoomId(nextRoomId);
      updateRoomUrl(nextRoomId);
    } catch (createError) {
      setError(createError.message);
    } finally {
      setActionPending(false);
    }
  };

  const handleJoinRoom = async (event) => {
    event.preventDefault();
    setError("");
    setActionPending(true);

    try {
      const cleanName = savePlayerName();
      const symbol = await joinRoom(roomId, { uid: user.uid, name: cleanName });
      setPlayerSymbol(symbol);
    } catch (joinError) {
      setError(joinError.message);
    } finally {
      setActionPending(false);
    }
  };

  const handleCellClick = async (cellIndex) => {
    if (!canPlay || board[cellIndex]) {
      return;
    }

    setError("");
    setActionPending(true);

    try {
      await playMove({
        roomId,
        uid: user.uid,
        player: playerSymbol,
        cellIndex,
      });
    } catch (moveError) {
      setError(moveError.message);
    } finally {
      setActionPending(false);
    }
  };

  const handleNewRound = async () => {
    setError("");
    setActionPending(true);

    try {
      await startNewRound({ roomId, uid: user.uid });
    } catch (roundError) {
      setError(roundError.message);
    } finally {
      setActionPending(false);
    }
  };

  const exitRoomLocally = () => {
    setRoomId("");
    setRoom(null);
    setLoadedRoomId("");
    setPlayerSymbol("");
    setCopied(false);
    clearRoomUrl();
  };

  const handleLeaveRoom = async () => {
    setError("");
    setActionPending(true);

    const roomToLeave = roomId;
    const symbolToLeave = playerSymbol;
    const uid = user?.uid;

    exitRoomLocally();

    try {
      if (roomToLeave && uid && symbolToLeave) {
        await leaveRoom({
          roomId: roomToLeave,
          uid,
          player: symbolToLeave,
        });
      }
    } catch (leaveError) {
      console.warn("Could not notify room about leave:", leaveError);
    } finally {
      setActionPending(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
    } catch (copyError) {
      setError(copyError.message);
    }
  };

  if (!hasFirebaseConfig) {
    return (
      <main className="app">
        <section className="panel">
          <h1>Tic Tac Toe</h1>
          <p className="status">
            Firebase is not configured. Add your Vite Firebase environment
            variables to play online.
          </p>
        </section>
      </main>
    );
  }

  const showSetupForm = (!roomId || room) && !isInRoom && !roomIsFull && !roomLoading;
  const primaryActionLabel = roomId ? "Join Room" : "Create Room";
  const primaryAction = roomId ? handleJoinRoom : handleCreateRoom;

  return (
    <main className="app">
      <section className="panel">
        <h1>Tic Tac Toe</h1>
        <p className="status">{statusMessage}</p>

        {error && <p className="error">{error}</p>}

        {showSetupForm && (
          <form className="join-form" onSubmit={primaryAction}>
            <label htmlFor="player-name">Your name</label>
            <div className="join-row">
              <input
                id="player-name"
                maxLength="24"
                onChange={(event) => setPlayerName(event.target.value)}
                placeholder="Ada"
                type="text"
                value={playerName}
              />
              <button disabled={authLoading || actionPending || !user}>
                {authLoading || actionPending ? "Please wait..." : primaryActionLabel}
              </button>
            </div>
          </form>
        )}

        {roomId && room && (
          <div className="room-details">
            <div>
              <span className="detail-label">Room</span>
              <strong>{roomId}</strong>
            </div>
            {isInRoom && (
              <div>
                <span className="detail-label">You</span>
                <strong>{playerSymbol}</strong>
              </div>
            )}
            <button
              className="secondary-button"
              disabled={!shareLink}
              onClick={handleCopyLink}
              type="button"
            >
              {copied ? "Copied" : "Copy Link"}
            </button>
          </div>
        )}

        {room && (
          <div className="players">
            <div
              className={
                currentPlayer === Player.O && !roomAbandoned
                  ? "player active"
                  : "player"
              }
            >
              <span>O</span>
              <strong>{room.players?.[Player.O]?.name ?? "Waiting"}</strong>
              {isPlayerAway(room.players?.[Player.O], now) && (
                <em>Offline</em>
              )}
            </div>
            <div
              className={
                currentPlayer === Player.X && !roomAbandoned
                  ? "player active"
                  : "player"
              }
            >
              <span>X</span>
              <strong>{room.players?.[Player.X]?.name ?? "Waiting"}</strong>
              {isPlayerAway(room.players?.[Player.X], now) && (
                <em>Offline</em>
              )}
            </div>
          </div>
        )}

        <div className="grid" aria-label="Tic tac toe board">
          {board.map((cellValue, cellIndex) => (
            <button
              aria-label={`Cell ${cellIndex + 1}`}
              className="cell"
              disabled={Boolean(cellValue) || !canPlay}
              key={cellIndex}
              onClick={() => handleCellClick(cellIndex)}
              type="button"
            >
              {cellValue}
            </button>
          ))}
        </div>

        {isInRoom && gameOver && (
          <button
            className="reset-button"
            disabled={actionPending}
            onClick={handleNewRound}
            type="button"
          >
            New Round
          </button>
        )}

        {isInRoom && (
          <button
            className="leave-button"
            disabled={actionPending}
            onClick={handleLeaveRoom}
            type="button"
          >
            Leave Room
          </button>
        )}
      </section>
    </main>
  );
};

export default App;
