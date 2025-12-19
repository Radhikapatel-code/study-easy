import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function Header() {
  return (
    <header className="w-full">
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center space-x-4 bg-white/5 border border-white/10 backdrop-blur-sm rounded-lg px-6 py-3 w-full">
          <div className="w-12 h-12 bg-transparent rounded-full flex items-center justify-center border-2 border-cyan-500/40">
            <CheckCircle2 className="text-cyan-400" size={36} />
          </div>
          <h1 className="text-5xl md:text-6xl tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">STUDY-EASY</h1>
        </div>
      </div>
    </header>
  );
}
