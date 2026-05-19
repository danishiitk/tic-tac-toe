import { useState } from "react";
import { createEmptyBoard, Player } from "./constants";
import { checkWinner, isBoardFull } from "./helpers";
import "./App.css";

function App() {
  const [board, setBoard] = useState(createEmptyBoard);
  const [currentPlayer, setCurrentPlayer] = useState(Player.O);

  const winner = checkWinner(board);
  const hasDraw = !winner && isBoardFull(board);
  const isGameOver = Boolean(winner) || hasDraw;

  const resetGame = () => {
    setBoard(createEmptyBoard());
    setCurrentPlayer(Player.O);
  };

  const handleCellClick = (cellIndex) => {
    if (board[cellIndex] || isGameOver) {
      return;
    }

    const newBoard = [...board];
    newBoard[cellIndex] = currentPlayer;
    setBoard(newBoard);

    if (checkWinner(newBoard) || isBoardFull(newBoard)) {
      return;
    }

    setCurrentPlayer(currentPlayer === Player.O ? Player.X : Player.O);
  };

  const statusMessage = winner
    ? `Player ${winner} wins!`
    : hasDraw
      ? "It's a draw!"
      : `Player ${currentPlayer}'s turn`;

  return (
    <div className="app">
      <h1>Tic Tac Toe</h1>

      <p className="status">{statusMessage}</p>

      <div className="grid" role="grid" aria-label="Tic tac toe board">
        {board.map((cellValue, cellIndex) => (
          <button
            key={cellIndex}
            className="cell"
            type="button"
            onClick={() => handleCellClick(cellIndex)}
            disabled={Boolean(cellValue) || isGameOver}
            aria-label={`Cell ${cellIndex + 1}${cellValue ? `, ${cellValue}` : ""}`}
          >
            {cellValue}
          </button>
        ))}
      </div>

      <button className="reset-button" type="button" onClick={resetGame}>
        Reset
      </button>
    </div>
  );
}

export default App;
