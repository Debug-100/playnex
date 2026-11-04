import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, Globe, Swords, Rocket, Lightbulb, Cpu } from 'lucide-react';

const navItems = [
  { to: '/',               label: 'Overview',           icon: Globe,     exact: true },
  { to: '/market',         label: 'Market Research',    icon: BarChart3            },
  { to: '/competitors',    label: 'Competitor Analysis', icon: Swords              },
  { to: '/simulator',      label: 'Launch Simulator',   icon: Rocket               },
  { to: '/recommendations',label: 'Recommendations',    icon: Lightbulb            },
  { to: '/model',          label: 'Model Performance',  icon: Cpu                  },
];

/* ── PLAYNEX wordmark ── */
function Logo() {
  return (
    <div className="flex items-center gap-2.5 select-none">
      {/* Geometric mark: stacked bars resembling a game chart / launch trajectory */}
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Three ascending bars */}
        <rect x="1"  y="13" width="5" height="8"  rx="1" fill="white" opacity="0.4"/>
        <rect x="8"  y="8"  width="5" height="13" rx="1" fill="white" opacity="0.7"/>
        <rect x="15" y="2"  width="5" height="19" rx="1" fill="white"/>
        {/* Diagonal line across top corners: launch trajectory */}
        <line x1="3.5" y1="12" x2="17.5" y2="1.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.35"/>
      </svg>

      <div>
        <span
          className="font-black tracking-tighter text-[15px] leading-none text-white"
          style={{ letterSpacing: '-0.03em' }}
        >
          PLAYNEX
        </span>
      </div>
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside
      style={{
        width: '220px',
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
        background: '#09090b',
        borderRight: '1px solid #27272a',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{ padding: '20px 16px 18px', borderBottom: '1px solid #27272a' }}
      >
        <Logo />
      </motion.div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {navItems.map(({ to, label, icon: Icon, exact }, i) => (
          <motion.div
            key={to}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: 0.05 * i }}
          >
            <NavLink
              to={to}
              end={exact}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={14} strokeWidth={1.75} />
              <span style={{ fontSize: '13px' }}>{label}</span>
            </NavLink>
          </motion.div>
        ))}
      </nav>

      {/* Footer hint */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #27272a' }}>
        <p style={{ fontSize: '11px', color: '#3f3f46', fontFamily: 'JetBrains Mono, monospace' }}>
          hist. data · 1980–2016
        </p>
      </div>
    </aside>
  );
}
