import * as React from 'react';
import { createRoot } from 'react-dom/client';
import './globals.css';
import { ReceiveScreen } from './screens/ReceiveScreen';

function App() {
  const [network, setNetwork] = React.useState<'mainnet' | 'testnet' | 'futurenet'>('testnet');

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 gap-4">
      {/* Demo picker */}
      <div className="flex gap-2">
        {(['mainnet', 'testnet', 'futurenet'] as const).map((n) => (
          <button
            key={n}
            onClick={() => setNetwork(n)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              network === n
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
            }`}
          >
            {n.charAt(0).toUpperCase() + n.slice(1)}
          </button>
        ))}
      </div>

      <ReceiveScreen
        account={{
          publicKey: 'GD6SZQJNKL3ZYXPWLUVFXZNXUVXJTQPWMQHZMDMQHLS5VNLQBQNPFLM',
          name: 'My Stellar Wallet',
        }}
        network={network}
        onBack={() => alert('← Back clicked')}
      />
    </div>
  );
}

const container = document.getElementById('root')!;
createRoot(container).render(<App />);
