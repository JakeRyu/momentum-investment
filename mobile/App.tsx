import { useState } from 'react';

import DecisionScreen from './src/screens/DecisionScreen';
import HomeScreen from './src/screens/HomeScreen';
import NotImplementedScreen from './src/screens/NotImplementedScreen';
import {
  DEFAULT_STRATEGY_ID,
  findStrategy,
  type Strategy,
  type StrategyId,
} from './src/strategies';
import { formatYmd } from './src/utils';

type Screen =
  | { kind: 'home' }
  | { kind: 'decision'; strategy: Strategy; asOf: string }
  | { kind: 'notImplemented'; strategy: Strategy };

export default function App() {
  // Selection state lives at the App level so it's preserved when the user
  // navigates Home → Decision → Back → Home.
  const [selectedStrategyId, setSelectedStrategyId] = useState<StrategyId>(DEFAULT_STRATEGY_ID);
  const [asOfDate, setAsOfDate] = useState<Date>(() => new Date());
  const [screen, setScreen] = useState<Screen>({ kind: 'home' });

  const handleConfirm = () => {
    const strategy = findStrategy(selectedStrategyId);
    const asOf = formatYmd(asOfDate);
    if (strategy.implemented) {
      setScreen({ kind: 'decision', strategy, asOf });
    } else {
      setScreen({ kind: 'notImplemented', strategy });
    }
  };

  if (screen.kind === 'home') {
    return (
      <HomeScreen
        selectedStrategyId={selectedStrategyId}
        onStrategyChange={setSelectedStrategyId}
        asOfDate={asOfDate}
        onAsOfChange={setAsOfDate}
        onConfirm={handleConfirm}
      />
    );
  }

  if (screen.kind === 'decision') {
    return (
      <DecisionScreen
        strategy={screen.strategy}
        asOf={screen.asOf}
        onBack={() => setScreen({ kind: 'home' })}
      />
    );
  }

  return (
    <NotImplementedScreen
      strategy={screen.strategy}
      onBack={() => setScreen({ kind: 'home' })}
    />
  );
}
