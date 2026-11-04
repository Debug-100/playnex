import { motion } from 'framer-motion';

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
  icon?: React.ReactNode;
  delay?: number;
}

export default function MetricCard({ label, value, sub, icon, delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="metric-card group"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
        <span className="metric-label">{label}</span>
        {icon && <span style={{ color: '#3f3f46' }}>{icon}</span>}
      </div>
      <span className="metric-value">{value}</span>
      {sub && <span style={{ fontSize: '11px', color: '#3f3f46' }}>{sub}</span>}
    </motion.div>
  );
}
