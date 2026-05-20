import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { emptyBoard, Player, RoomStatus } from "./constants";
import { db } from "./firebase";
import { checkWinner, isBoardFull } from "./helpers";

const ROOMS_COLLECTION = "rooms";

const requireDb = () => {
  if (!db) {
    throw new Error("Firebase is not configured.");
  }

  return db;
};

const createPlayerRecord = ({ uid, name }) => ({
  uid,
  name: name.trim(),
  connected: true,
  lastSeen: serverTimestamp(),
});

const getNextPlayer = (player) => (player === Player.O ? Player.X : Player.O);

const isPlayerInRoom = (players, uid) =>
  players?.[Player.O]?.uid === uid || players?.[Player.X]?.uid === uid;

export const createRoom = async ({ uid, name }) => {
  const roomRef = await addDoc(collection(requireDb(), ROOMS_COLLECTION), {
    board: emptyBoard(),
    currentPlayer: Player.O,
    players: {
      [Player.O]: createPlayerRecord({ uid, name }),
      [Player.X]: null,
    },
    status: RoomStatus.WAITING,
    winner: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return roomRef.id;
};

export const listenToRoom = (roomId, onRoom, onError) =>
  onSnapshot(
    doc(requireDb(), ROOMS_COLLECTION, roomId),
    (snapshot) => {
      onRoom(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
    },
    onError,
  );

export const joinRoom = async (roomId, { uid, name }) => {
  const roomRef = doc(requireDb(), ROOMS_COLLECTION, roomId);

  return runTransaction(requireDb(), async (transaction) => {
    const snapshot = await transaction.get(roomRef);

    if (!snapshot.exists()) {
      throw new Error("Room not found.");
    }

    const room = snapshot.data();
    const players = room.players ?? {};

    if (players[Player.O]?.uid === uid) {
      return Player.O;
    }

    if (players[Player.X]?.uid === uid) {
      return Player.X;
    }

    if (players[Player.X]) {
      throw new Error("This room is already full.");
    }

    transaction.update(roomRef, {
      [`players.${Player.X}`]: createPlayerRecord({ uid, name }),
      status: RoomStatus.ACTIVE,
      updatedAt: serverTimestamp(),
    });

    return Player.X;
  });
};

export const playMove = async ({ roomId, uid, player, cellIndex }) => {
  const roomRef = doc(requireDb(), ROOMS_COLLECTION, roomId);

  await runTransaction(requireDb(), async (transaction) => {
    const snapshot = await transaction.get(roomRef);

    if (!snapshot.exists()) {
      throw new Error("Room not found.");
    }

    const room = snapshot.data();
    const board = room.board ?? emptyBoard();
    const playerRecord = room.players?.[player];

    if (
      room.status !== RoomStatus.ACTIVE ||
      room.winner ||
      room.currentPlayer !== player ||
      playerRecord?.uid !== uid ||
      board[cellIndex]
    ) {
      throw new Error("That move is not available.");
    }

    const nextBoard = [...board];
    nextBoard[cellIndex] = player;

    const winner = checkWinner(nextBoard);
    const draw = !winner && isBoardFull(nextBoard);

    transaction.update(roomRef, {
      board: nextBoard,
      currentPlayer: winner || draw ? player : getNextPlayer(player),
      status: winner || draw ? RoomStatus.FINISHED : RoomStatus.ACTIVE,
      winner: winner ?? (draw ? "draw" : null),
      updatedAt: serverTimestamp(),
    });
  });
};

export const updatePlayerPresence = async ({
  roomId,
  uid,
  player,
  connected,
}) => {
  const roomRef = doc(requireDb(), ROOMS_COLLECTION, roomId);

  await updateDoc(roomRef, {
    [`players.${player}.uid`]: uid,
    [`players.${player}.connected`]: connected,
    [`players.${player}.lastSeen`]: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const leaveRoom = async ({ roomId, uid, player }) => {
  const roomRef = doc(requireDb(), ROOMS_COLLECTION, roomId);

  await runTransaction(requireDb(), async (transaction) => {
    const snapshot = await transaction.get(roomRef);

    if (!snapshot.exists()) {
      return;
    }

    const room = snapshot.data();

    if (room.players?.[player]?.uid !== uid) {
      throw new Error("You are not part of this room.");
    }

    const nextStatus =
      room.status === RoomStatus.ACTIVE || room.status === RoomStatus.WAITING
        ? RoomStatus.ABANDONED
        : room.status;

    transaction.update(roomRef, {
      [`players.${player}.connected`]: false,
      [`players.${player}.lastSeen`]: serverTimestamp(),
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });
  });
};

export const startNewRound = async ({ roomId, uid }) => {
  const roomRef = doc(requireDb(), ROOMS_COLLECTION, roomId);

  await runTransaction(requireDb(), async (transaction) => {
    const snapshot = await transaction.get(roomRef);

    if (!snapshot.exists()) {
      throw new Error("Room not found.");
    }

    const room = snapshot.data();
    const players = room.players ?? {};

    if (room.status !== RoomStatus.FINISHED || !isPlayerInRoom(players, uid)) {
      throw new Error("A new round is not available yet.");
    }

    transaction.update(roomRef, {
      board: emptyBoard(),
      currentPlayer: Player.O,
      status: players[Player.X] ? RoomStatus.ACTIVE : RoomStatus.WAITING,
      winner: null,
      updatedAt: serverTimestamp(),
    });
  });
};
