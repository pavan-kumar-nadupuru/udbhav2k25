import './App.css';
import LLMInterface from './components/LLMInterface';
import { useState } from 'react';

const pages = [
  { name: 'LLM Interface', key: 'llm' },
  { name: 'Run Mode', key: 'run' },
];

function RunModePage() {
  return (
    <div className="p-10 text-white bg-white/10 rounded-2xl shadow-xl backdrop-blur-md border border-white/20">
      <h2 className="text-3xl font-semibold mb-4 text-gray-100 tracking-tight">Run Mode</h2>
      <p className="text-gray-300 text-lg">This is a placeholder for the Run Mode page.</p>
    </div>
  );
}

function App() {
  const [activePage, setActivePage] = useState('llm');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 flex">
      {/* Sidebar - fixed */}
      <aside className="fixed top-0 left-0 h-full w-64 bg-white/10 border-r border-white/10 text-white flex flex-col py-10 px-6 shadow-2xl backdrop-blur-lg z-20">
        <div className="mb-12 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-green-400 to-blue-500 shadow-lg flex items-center justify-center">
            <span className="text-2xl font-bold text-white">💬</span>
          </div>
          <span className="text-2xl font-semibold tracking-tight text-white drop-shadow">Prompt Engineering at Scale</span>
        </div>
        <nav className="flex flex-col gap-2 mt-4">
          {pages.map(page => (
            <button
              key={page.key}
              className={`text-left px-5 py-3 rounded-xl text-lg font-medium transition-all duration-200 shadow-sm ${activePage === page.key ? 'bg-gradient-to-r from-green-400/80 to-blue-500/80 text-white shadow-lg scale-105' : 'hover:bg-white/10 text-gray-200'}`}
              onClick={() => setActivePage(page.key)}
            >
              {page.name}
            </button>
          ))}
        </nav>
      </aside>
      {/* Main Content - add left margin to account for fixed sidebar */}
      <main className="flex-1 flex justify-center items-center p-8 bg-gradient-to-br from-white/5 to-gray-900/80 min-h-screen ml-64">
        <div className="w-full max-w-2xl">
          {activePage === 'llm' && (
            <div className="animate-fadein">
              <LLMInterface />
            </div>
          )}
          {activePage === 'run' && (
            <div className="animate-fadein">
              <RunModePage />
            </div>
          )}
        </div>
      </main>
      <style>{`
        .animate-fadein {
          animation: fadein 0.7s cubic-bezier(.4,0,.2,1);
        }
        @keyframes fadein {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}

export default App;
