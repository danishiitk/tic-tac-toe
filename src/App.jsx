import { useState } from "react";
import { emptyBoard, Player } from "./constants";
import "./App.css";
import { checkWinner, isBoardFull } from "./helpers";
const App = () => {
  const [board, setBoard] = useState(emptyBoard);
  const [currentPlayer, setCurrentPlayer] = useState(Player.O);
  // The game will have 2 states,
  // there is a winner or the game is draw
  // The game would be over if any of these 2 states becomes true
  const winner = checkWinner(board);
  const draw = !winner && isBoardFull(board);
  const gameOver = Boolean(winner) || draw;
  const handleCellCLick = (cellIndex) => {
    //cell is already filled or game already over, then do nothing on click
    if (board[cellIndex] || gameOver) {
      return;
    }
    const newBoard = [...board];
    newBoard[cellIndex] = currentPlayer;
    setBoard(newBoard);
    const winnerAfterMove = checkWinner(newBoard);
    //If we get some winner after click or the board becomes full, do nothing, the board state and the current player state changes would re render the UI with some winner or draw
    if (winnerAfterMove || isBoardFull(newBoard)) {
      return;
    }
    //If the cell was not already filled and the game was not already over
    //and there is no new winner and the board is still not full then change the player turn so that the game continues
    setCurrentPlayer(currentPlayer === Player.O ? Player.X : Player.O);
  };

  const handleReset = () => {
    setBoard(emptyBoard);
    setCurrentPlayer(Player.O);
  };

  const statusMessage = winner
    ? `Player ${winner} has won`
    : draw
      ? `Match draw`
      : `Player ${currentPlayer}'s turn`;
  return (
    <div className="app">
      <h1>Tic Tac Toe</h1>
      <p className="status">{statusMessage}</p>
      <div className="grid">
        {board.map((cellValue, cellIndex) => (
          <button
            className="cell"
            key={cellIndex}
            onClick={() => handleCellCLick(cellIndex)}
            disabled={Boolean(cellValue) || gameOver}
          >
            {cellValue}
          </button>
        ))}
      </div>
      <button className="reset-button" onClick={handleReset}>
        Reset
      </button>
    </div>
  );
};
export default App;
