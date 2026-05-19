const WINNING_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export const checkWinner = (board) => {
  const winningCombination = WINNING_COMBINATIONS.find(
    ([firstIndex, secondIndex, thirdIndex]) => {
      const firstCell = board[firstIndex];

      return (
        firstCell &&
        firstCell === board[secondIndex] &&
        firstCell === board[thirdIndex]
      );
    },
  );

  return winningCombination ? board[winningCombination[0]] : null;
};

export const isBoardFull = (board) => board.every(Boolean);
