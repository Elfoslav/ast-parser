import React, { useState } from "react";

const Counter: React.FC = () => {
  const [count, setCount] = useState(0);
  const increaseCounter = () => {
    setCount(() => count + 1);
  };
  return (
    <div>
      <div>{count}</div>
      <button onClick={increaseCounter}>Increase count</button>
    </div>
  );
};

export default Counter;
