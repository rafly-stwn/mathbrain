import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export default function PageContainer({ children, className = '' }: PageContainerProps) {
  const location = useLocation();
  const isFullPageGame = location.pathname === '/duel/arena' || location.pathname.startsWith('/game/');

  return (
    <div className="relative min-h-full overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-lavender/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 z-0 pointer-events-none" />
      <div className="absolute top-[20%] right-[-5%] w-72 h-72 bg-peach/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 z-0 pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-80 h-80 bg-mint/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 z-0 pointer-events-none" />
      
      {/* Content */}
      <main className={`relative z-10 max-w-6xl mx-auto px-4 py-3 sm:py-6 ${isFullPageGame ? 'pb-4' : 'pb-24 md:pb-6'} ${className}`}>
        {children}
      </main>
    </div>
  );
}

