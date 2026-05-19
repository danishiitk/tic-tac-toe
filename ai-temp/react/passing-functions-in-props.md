# React Notes: Passing Functions In Props

## The Big Idea

In React, event props like `onClick`, `onChange`, `onSubmit`, etc. need a function.

The important question is:

Do you want to give React a function to run later, or are you accidentally calling the function right now?

The difference is usually the `()`.

```jsx
onClick={handleReset}
```

This passes the function itself.

```jsx
onClick={handleReset()}
```

This calls the function immediately.

## Function Name vs Function Call

Imagine this function:

```jsx
const handleReset = () => {
  setBoard(emptyBoard);
  setCurrentPlayer(Player.O);
};
```

If you write:

```jsx
onClick={handleReset}
```

You are saying:

> React, here is the function. Please run it later when the button is clicked.

But if you write:

```jsx
onClick={handleReset()}
```

You are saying:

> JavaScript, run `handleReset` right now while rendering this JSX.

React does not wait in this case because JavaScript sees `()` and immediately executes the function.

## Simple Rule

```jsx
handleReset
```

Means: the function itself.

```jsx
handleReset()
```

Means: call the function now.

That is the key.

## Example From Your App

In your `App.jsx`, you have this:

```jsx
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
```

Here, every button needs to know which cell was clicked.

So this button needs to call:

```jsx
handleCellCLick(cellIndex)
```

But we only want that to happen when the user clicks the button.

That is why we wrap it:

```jsx
onClick={() => handleCellCLick(cellIndex)}
```

This means:

> React, here is a small function. Run this small function later. When you run it, it will call `handleCellCLick(cellIndex)`.

## Why Not This?

```jsx
onClick={handleCellCLick(cellIndex)}
```

Because this calls `handleCellCLick(cellIndex)` immediately during render.

React renders the UI first. While rendering, JavaScript sees this:

```jsx
handleCellCLick(cellIndex)
```

Because it has `()`, JavaScript runs it immediately.

That means the move would happen before the user even clicks.

## When To Pass Just The Function Name

Use just the function name when you do not need to pass custom arguments.

Example:

```jsx
const handleReset = () => {
  setBoard(emptyBoard);
  setCurrentPlayer(Player.O);
};

return (
  <button onClick={handleReset}>
    Reset Game
  </button>
);
```

This is correct because `handleReset` does not need anything from the button.

React already knows:

> When this button is clicked, run `handleReset`.

## When To Use An Arrow Function

Use an arrow function when you need to pass some extra value.

Example:

```jsx
onClick={() => handleCellCLick(cellIndex)}
```

Here, you need to pass `cellIndex`.

Another example:

```jsx
onClick={() => deleteTodo(todo.id)}
```

Here, you need to pass `todo.id`.

Another example:

```jsx
onClick={() => selectPlayer(Player.X)}
```

Here, you need to pass `Player.X`.

## Easy Mental Model

Think of React event props like giving someone instructions.

This:

```jsx
onClick={handleReset}
```

Means:

> Here is the instruction card. Use it when clicked.

This:

```jsx
onClick={handleReset()}
```

Means:

> Do the instruction right now.

This:

```jsx
onClick={() => handleCellCLick(cellIndex)}
```

Means:

> Here is a new instruction card. When clicked, use this card to call `handleCellCLick` with this exact `cellIndex`.

## Common Patterns

### Pattern 1: Function needs no argument

```jsx
<button onClick={handleReset}>
  Reset
</button>
```

Use the function name.

### Pattern 2: Function needs an argument

```jsx
<button onClick={() => handleCellCLick(cellIndex)}>
  {cellValue}
</button>
```

Use an arrow function.

### Pattern 3: Function receives the browser event

React automatically passes the event object when it calls your function.

```jsx
const handleInputChange = (event) => {
  setName(event.target.value);
};

return <input onChange={handleInputChange} />;
```

This works because React itself will pass `event` later.

You do not need to write:

```jsx
onChange={() => handleInputChange(event)}
```

because there is no `event` variable available there.

## In One Line

Pass the function name when React can call it directly later:

```jsx
onClick={handleReset}
```

Use an arrow function when you need to pass your own values:

```jsx
onClick={() => handleCellCLick(cellIndex)}
```

Avoid calling the function directly in JSX event props:

```jsx
onClick={handleCellCLick(cellIndex)}
```

because `()` means "run now".

