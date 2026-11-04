import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3, Globe, Swords, Rocket, Lightbulb, Cpu, Activity
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Overview', icon: Globe, exact: true },
  { to: '/market', label: 'Market Research', icon: BarChart3 },
  { to: '/competitors', label: 'Competitor Analysis', icon: Swords },
  { to: '/simulator', label: 'Launch Simulator', icon: Rocket },
  { to: '/recommendations', label: 'Recommendations', icon: Lightbulb },
  { to: '/model', label: 'Model Performance', icon: Cpu },
];

export default function Sidebar() {
  return (
    <aside
      className="w-56 flex flex-col shrink-0 h-screen sticky top-0"
      style={{
        background: 'rgba(6,6,15,0.9)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="px-5 py-6"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center glow-pulse"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              boxShadow: '0 0 16px rgba(124,58,237,0.5)',
            }}
          >
            <Rocket size={15} className="text-white" />
          </div>
          <div>
            <div
              className="font-black text-base tracking-widest uppercase gradient-text-violet"
            >
              PLAYNEX
            </div>
            <div className="text-[9px] tracking-[0.2em] uppercase mt-0.5" style={{ color: '#1e293b' }}>
              Strategy Advisor
            </div>
          </div>
        </div>
      </motion.div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 flex flex-col gap-0.5">
        {navItems.map(({ to, label, icon: Icon, exact }, i) => (
          <motion.div
            key={to}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.08 * i, ease: 'easeOut' }}
          >
            <NavLink
              to={to}
              end={exact}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={15} />
              <span className="text-[13px]">{label}</span>
            </NavLink>
          </motion.div>
        ))}
      </nav>

      {/* Status indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="px-5 py-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Activity size={10} style={{ color: '#10b981' }} />
          <span className="text-[10px]" style={{ color: '#10b981' }}>Random Forest Active</span>
        </div>
        <p className="text-[10px] tracking-wide" style={{ color: '#1e293b' }}>Historical · 1980–2016</p>
      </motion.div>
    </aside>
  );
}
