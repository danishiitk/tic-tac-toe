import { useState } from "react";
import { isOWinner, isXWinner } from "./helpers";
import "./App.css";
import { initialGrid, Player } from "./constanst";
function App() {
  const [grid, setGrid] = useState(initialGrid);
  const [player, setPlayer] = useState(Player.O);
  const reset = () => {
    setGrid(initialGrid);
    setPlayer(Player.O);
  };
  const handleCellClick = (index) => {
    if (grid[index]) {
      return;
    }
    const newGrid = [...grid];
    newGrid[index] = player;
    if (player === Player.O) {
      const hasOWon = isOWinner(newGrid);
      if (hasOWon) {
        alert("Player O wins!");
        reset();
        return;
      }
    } else {
      const hasXWon = isXWinner(newGrid);
      if (hasXWon) {
        alert("Player X wins!");
        reset();
        return;
      }
    }
    setGrid(newGrid);
    setPlayer(player === Player.O ? Player.X : Player.O);
  };
  return (
    <div className="app">
      <h1>Tic Tac Toe</h1>
      <div className="grid">
        {grid.map((cellItem, cellIndex) => (
          <div
            key={cellIndex}
            className="cell"
            onClick={() => handleCellClick(cellIndex)}
          >
            {cellItem}
          </div>
        ))}
      </div>
      <p>Player {player === Player.O ? Player.O : Player.X}'s Turn</p>
      <button onClick={reset}>Reset</button>
    </div>
  );
}

export default App;
