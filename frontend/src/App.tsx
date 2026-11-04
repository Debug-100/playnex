import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import OverviewPage from './pages/OverviewPage';
import MarketPage from './pages/MarketPage';
import CompetitorsPage from './pages/CompetitorsPage';
import SimulatorPage from './pages/SimulatorPage';
import RecommendationsPage from './pages/RecommendationsPage';
import ModelPage from './pages/ModelPage';

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -6 },
};

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {[
          { path: '/',               el: <OverviewPage /> },
          { path: '/market',         el: <MarketPage /> },
          { path: '/competitors',    el: <CompetitorsPage /> },
          { path: '/simulator',      el: <SimulatorPage /> },
          { path: '/recommendations',el: <RecommendationsPage /> },
          { path: '/model',          el: <ModelPage /> },
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
                transition={{ duration: 0.25 }}
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
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {/* Top rule */}
          <div style={{ height: '1px', background: '#27272a', position: 'sticky', top: 0, zIndex: 10 }} />
          <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '32px 24px' }}>
            <AnimatedRoutes />
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}
