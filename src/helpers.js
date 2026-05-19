export const isOWinner = (grid) => {
  // Check rows
  for (let i = 0; i < 3; i++) {
    if (
      grid[i * 3] === "o" &&
      grid[i * 3 + 1] === "o" &&
      grid[i * 3 + 2] === "o"
    ) {
      return true;
    }
  }

  // Check columns
  for (let i = 0; i < 3; i++) {
    if (grid[i] === "o" && grid[i + 3] === "o" && grid[i + 6] === "o") {
      return true;
    }
  }

  // Check diagonals
  if (grid[0] === "o" && grid[4] === "o" && grid[8] === "o") {
    return true;
  }
  if (grid[2] === "o" && grid[4] === "o" && grid[6] === "o") {
    return true;
  }

  return false;
};

export const isXWinner = (grid) => {
  // Check rows
  for (let i = 0; i < 3; i++) {
    if (
      grid[i * 3] === "x" &&
      grid[i * 3 + 1] === "x" &&
      grid[i * 3 + 2] === "x"
    ) {
      return true;
    }
  }

  // Check columns
  for (let i = 0; i < 3; i++) {
    if (grid[i] === "x" && grid[i + 3] === "x" && grid[i + 6] === "x") {
      return true;
    }
  }

  // Check diagonals
  if (grid[0] === "x" && grid[4] === "x" && grid[8] === "x") {
    return true;
  }
  if (grid[2] === "x" && grid[4] === "x" && grid[6] === "x") {
    return true;
  }

  return false;
};
