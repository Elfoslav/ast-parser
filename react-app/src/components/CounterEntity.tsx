import React, { useState } from "react";

const CounterEntity: React.FC = () => {
  const [countEntity, setCountEntity] = useState(0);
  const btnText = "Increase count renamed";

  const increaseCounterEntity = () => {
    setCountEntity(() => countEntity + 1);
  };

  return (
    <div>
      <div>{countEntity}</div>
      <button onClick={increaseCounterEntity}>{btnText}</button>
    </div>
  );
};
export default CounterEntity;
