
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="py-6 px-4 border-b border-zinc-800 bg-black/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <div className="w-4 h-4 bg-black rounded-sm rotate-45"></div>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            SNOWPEAK <span className="text-zinc-500 font-light italic">FLASH</span>
          </h1>
        </div>
        <div className="hidden md:flex gap-6 text-sm font-medium text-zinc-400">
          <span className="hover:text-white cursor-pointer transition-colors">Explorer</span>
          <span className="hover:text-white cursor-pointer transition-colors">Presets</span>
          <span className="hover:text-white cursor-pointer transition-colors">Gallery</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
