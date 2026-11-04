import { motion } from 'framer-motion';

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
  icon?: React.ReactNode;
  delay?: number;
}

export default function MetricCard({ label, value, sub, accent, icon, delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="metric-card group"
      style={accent ? {
        background: 'rgba(139,92,246,0.07)',
        borderColor: 'rgba(139,92,246,0.2)',
        boxShadow: '0 0 20px rgba(139,92,246,0.08)',
      } : {}}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="metric-label">{label}</span>
        {icon && <span style={{ color: '#334155' }} className="group-hover:text-violet-500 transition-colors">{icon}</span>}
      </div>
      <span
        className="metric-value"
        style={accent ? { color: '#c4b5fd' } : {}}
      >
        {value}
      </span>
      {sub && <span className="text-[11px] mt-0.5" style={{ color: '#1e293b' }}>{sub}</span>}
    </motion.div>
  );
}
