import { motion } from 'framer-motion';

interface Props {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, actions, children }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-start justify-between mb-8"
    >
      <div>
        <h1 className="page-header text-fluid-lg">{title}</h1>
        {subtitle && <p className="text-sm mt-1" style={{ color: '#475569' }}>{subtitle}</p>}
        {children}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </motion.div>
  );
}
