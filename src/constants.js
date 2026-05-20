export const BOARD_SIZE = 9;

export const emptyBoard = () => Array(BOARD_SIZE).fill("");

export const Player = {
  O: "O",
  X: "X",
};

export const RoomStatus = {
  WAITING: "waiting",
  ACTIVE: "active",
  FINISHED: "finished",
  ABANDONED: "abandoned",
};
