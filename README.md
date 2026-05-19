# Tic Tac Toe

A small React + Vite tic-tac-toe game.

The app lets two players play locally, alternates between `O` and `X`, detects wins, detects draws, disables the board after the game ends, and includes a reset button to start again.

## Project Structure

```text
tic-tac-toe/
├── index.html
├── package.json
├── vite.config.js
├── eslint.config.js
├── public/
│   ├── favicon.svg
│   └── icons.svg
└── src/
    ├── App.jsx
    ├── App.css
    ├── constants.js
    ├── helpers.js
    ├── index.css
    └── main.jsx
```

## How The App Works

The project is split into small pieces:

- `src/main.jsx` mounts the React app into the browser.
- `src/App.jsx` contains the game UI, board state, current player state, click handling, reset handling, and status message.
- `src/constants.js` contains shared game constants.
- `src/helpers.js` contains pure game-rule functions.
- `src/index.css` contains global styling.
- `src/App.css` contains the tic-tac-toe board and button styling.

The board is an array with 9 cells. Empty cells are stored as an empty string, and played cells contain either `"O"` or `"X"`.

On every render, the app calculates:

- `winner`: the winning player, or `null`
- `draw`: true when the board is full and nobody won
- `gameOver`: true when there is a winner or a draw

The app does not store `winner`, `draw`, or `gameOver` as separate state because those values can be derived from the board.

## Build From Scratch

### 1. Scaffold the React App

Create a new Vite React project:

```bash
npm create vite@latest tic-tac-toe -- --template react
cd tic-tac-toe
npm install
```

### 2. Keep The Main Scripts

Your `package.json` should include these scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

Use them like this:

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

### 3. Set Up `index.html`

The browser needs a root element where React can render the app.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>tic-tac-toe</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### 4. Create `src/main.jsx`

This file connects React to the `root` element from `index.html`.

```jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

### 5. Create `src/constants.js`

Keep fixed game values in one place.

```js
export const BOARD_SIZE = 9;

export const emptyBoard = () => Array(BOARD_SIZE).fill("");

export const Player = {
  O: "O",
  X: "X",
};
```

What each value does:

- `BOARD_SIZE`: the tic-tac-toe board has 9 cells.
- `emptyBoard`: creates a new empty board.
- `Player`: stores the two player symbols.

### 6. Create `src/helpers.js`

This file contains the game rules.

```js
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
      const firstCellValue = board[firstIndex];
      return (
        firstCellValue &&
        firstCellValue === board[secondIndex] &&
        firstCellValue === board[thirdIndex]
      );
    },
  );
  return winningCombination ? board[winningCombination[0]] : null;
};

export const isBoardFull = (board) => board.every(Boolean);
```

`checkWinner` checks all possible winning lines:

- 3 rows
- 3 columns
- 2 diagonals

`isBoardFull` returns true when every cell contains a value.

### 7. Create `src/App.jsx`

This is the main game component.

```jsx
import { useState } from "react";
import { emptyBoard, Player } from "./constants";
import "./App.css";
import { checkWinner, isBoardFull } from "./helpers";

const App = () => {
  const [board, setBoard] = useState(emptyBoard);
  const [currentPlayer, setCurrentPlayer] = useState(Player.O);

  const winner = checkWinner(board);
  const draw = !winner && isBoardFull(board);
  const gameOver = Boolean(winner) || draw;

  const handleCellCLick = (cellIndex) => {
    if (board[cellIndex] || gameOver) {
      return;
    }

    const newBoard = [...board];
    newBoard[cellIndex] = currentPlayer;
    setBoard(newBoard);

    const winnerAfterMove = checkWinner(newBoard);

    if (winnerAfterMove || isBoardFull(newBoard)) {
      return;
    }

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
```

Important parts:

- `useState(emptyBoard)` creates the initial board.
- `useState(Player.O)` starts the game with player `O`.
- `handleCellCLick` ignores clicks on filled cells and after game over.
- `handleCellCLick` copies the board before updating it.
- `setCurrentPlayer` switches turns between `O` and `X`.
- `handleReset` clears the board and starts again with player `O`.
- The `Reset` button calls `handleReset`.
- Each cell button is disabled when it is already filled or when the game is over.

### 8. Create `src/index.css`

Add global page styles.

```css
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  background: #f7f7fb;
}

button {
  font-family: inherit;
}
```

### 9. Create `src/App.css`

Add the app, grid, cell, and reset button styles.

```css
.app {
  min-height: 100vh;
  padding: 48px 20px;
  text-align: center;
  color: #1f2937;
  background: #f7f7fb;
  box-sizing: border-box;
}

.app h1 {
  margin: 0;
  font-size: 2.25rem;
}

.status {
  min-height: 1.5rem;
  margin: 16px 0 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 72px);
  grid-template-rows: repeat(3, 72px);
  gap: 8px;
  justify-content: center;
  margin: 24px auto;
}

.cell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border: 2px solid #273449;
  border-radius: 8px;
  color: #111827;
  background: #ffffff;
  font-size: 2rem;
  font-weight: 700;
  cursor: pointer;
}

.cell:hover:not(:disabled),
.cell:focus-visible {
  background: #edf2ff;
  outline: 3px solid #8fb3ff;
  outline-offset: 2px;
}

.cell:disabled {
  cursor: default;
}

.reset-button {
  border: 0;
  border-radius: 8px;
  padding: 10px 18px;
  color: #ffffff;
  background: #273449;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.reset-button:hover,
.reset-button:focus-visible {
  background: #111827;
  outline: 3px solid #8fb3ff;
  outline-offset: 2px;
}
```

### 10. Run The App

Start the development server:

```bash
npm run dev
```

Then open the local URL shown in the terminal.

## Manual Test Checklist

Check these flows in the browser:

- The first status message says `Player O's turn`.
- Clicking an empty cell places `O`.
- The next valid click places `X`.
- Clicking a filled cell does nothing.
- Three matching symbols in a row, column, or diagonal shows the winner message.
- After a win, the board cells are disabled.
- If all cells are filled without a winner, the status says `Match draw`.
- Clicking `Reset` clears the board.
- After reset, the status returns to `Player O's turn`.

## Notes

- `handleCellCLick` works, but the name has a small typo. `handleCellClick` would be cleaner.
- The app currently has no automated tests.
- The assets in `src/assets` are not required by the current tic-tac-toe UI.
