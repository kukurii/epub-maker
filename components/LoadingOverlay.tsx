import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message = 'Loading...' }) => (
  <div className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
      <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 flex flex-col items-center max-w-sm w-full mx-4">
          <div className="relative mb-6">
              <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
              <div className="relative bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-4 rounded-2xl shadow-lg">
                  <Loader2 size={32} className="animate-spin" />
              </div>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2 tracking-tight">请稍候</h3>
          <p className="text-sm text-gray-500 text-center font-medium">{message}</p>
      </div>
  </div>
);

export default LoadingOverlay;