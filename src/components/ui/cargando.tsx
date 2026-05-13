import React from 'react';

interface LoadingProps {
  message?: string;
}

const Loading: React.FC<LoadingProps> = ({ message = "Cargando..." }) => (
  <div className="absolute inset-0 z-50 overflow-hidden flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
    <div className="w-10 h-10 border-4 border-gray-200 border-t-[#ec131e] rounded-full animate-spin mb-3"></div>
    <p className="weglot-dynamic text-sm font-semibold text-[#334155]">{message}</p>
  </div>
);

export default Loading;
