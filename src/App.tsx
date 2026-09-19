import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import PageContainer from './components/layout/PageContainer';
import Home from './pages/Home';
import Stats from './pages/Stats';
import Settings from './pages/Settings';
import GamePage from './pages/GamePage';
import DuelLobby from './pages/DuelLobby';
import DuelWaitingRoom from './pages/DuelWaitingRoom';
import DuelArena from './pages/DuelArena';
import WelcomeAuthModal from './components/auth/WelcomeAuthModal';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col font-sans text-charcoal selection:bg-lavender selection:text-white bg-cream">
        <WelcomeAuthModal />
        <Header />
        
        <PageContainer className="flex-1 flex flex-col w-full">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/game/:gameId" element={<GamePage />} />
              <Route path="/duel" element={<DuelLobby />} />
              <Route path="/duel/room/:roomCode" element={<DuelWaitingRoom />} />
              <Route path="/duel/arena" element={<DuelArena />} />
            </Routes>
          </AnimatePresence>
        </PageContainer>
        
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;

