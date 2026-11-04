import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import CustomCursor from './components/CustomCursor';
import OverviewPage from './pages/OverviewPage';
import MarketPage from './pages/MarketPage';
import CompetitorsPage from './pages/CompetitorsPage';
import SimulatorPage from './pages/SimulatorPage';
import RecommendationsPage from './pages/RecommendationsPage';
import ModelPage from './pages/ModelPage';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {[
          { path: '/', el: <OverviewPage /> },
          { path: '/market', el: <MarketPage /> },
          { path: '/competitors', el: <CompetitorsPage /> },
          { path: '/simulator', el: <SimulatorPage /> },
          { path: '/recommendations', el: <RecommendationsPage /> },
          { path: '/model', el: <ModelPage /> },
        ].map(({ path, el }) => (
          <Route
            key={path}
            path={path}
            element={
              <motion.div
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.35 }}
              >
                {el}
              </motion.div>
            }
          />
        ))}
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <CustomCursor />
      <div className="flex h-screen overflow-hidden" style={{ cursor: 'none' }}>
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {/* Subtle top gradient line */}
          <div
            className="h-px w-full sticky top-0 z-10"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.4), transparent)' }}
          />
          <div className="max-w-6xl mx-auto px-6 py-8">
            <AnimatedRoutes />
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}
