import { useEffect, useState } from 'react';
import { fetchOverview } from '../services/api';
import MetricCard from '../components/MetricCard';
import { SkeletonCard } from '../components/Skeleton';
import ErrorState from '../components/ErrorState';
import Disclaimer from '../components/Disclaimer';
import { Globe, Gamepad2, TrendingUp, Monitor, Tag, Building2, Rocket, ArrowRight, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface OverviewData {
  stats: {
    total_games: number;
    total_global_sales: number;
    avg_sales: number;
    num_platforms: number;
    num_genres: number;
    num_publishers: number;
    year_range: [number, number];
    has_ratings: boolean;
  };
  top_genres: { Genre: string; total_sales: number }[];
  top_platforms: { Platform: string; total_sales: number }[];
}

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.07 } } },
  item: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  },
};

export default function OverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ msg: string; dataMissing?: boolean } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOverview()
      .then(res => setData(res.data))
      .catch(err => {
        const e = err?.response?.data;
        setError({ msg: e?.error || 'Failed to load data', dataMissing: e?.data_missing });
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="relative">
      {/* Hero glow + grid */}
      <div className="absolute inset-0 hero-glow grid-bg pointer-events-none" style={{ height: '400px' }} />

      {/* ─── HERO ─── */}
      <div className="relative mb-12 pt-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 mb-5"
        >
          <span className="font-mono-data text-[11px] tracking-[0.25em] uppercase px-3 py-1 rounded-full"
            style={{ color: '#8b5cf6', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
            v1.0 · Random Forest Engine
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="font-black leading-none tracking-tighter mb-4"
          style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)' }}
        >
          <span className="text-white">Build smarter.</span>
          <br />
          <span className="gradient-text">Launch strategically.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-sm leading-relaxed max-w-lg mb-7"
          style={{ color: '#475569' }}
        >
          Historical game market intelligence powered by Random Forest analysis of{' '}
          <span style={{ color: '#94a3b8' }}>
            {data ? `${data.stats.total_games.toLocaleString()} titles` : 'thousands of titles'}
          </span>{' '}
          spanning{' '}
          <span style={{ color: '#94a3b8' }}>
            {data ? `${data.stats.year_range[0]}–${data.stats.year_range[1]}` : 'four decades'}.
          </span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="flex items-center gap-3"
        >
          <button onClick={() => navigate('/simulator')} className="btn-primary">
            <Rocket size={15} />
            Launch Simulator
          </button>
          <button onClick={() => navigate('/market')} className="btn-secondary">
            <Globe size={15} />
            Explore Market
          </button>
        </motion.div>
      </div>

      {/* ─── Error ─── */}
      {error && (
        <div className="mb-6">
          <ErrorState error={error.msg} dataMissing={error.dataMissing} />
        </div>
      )}

      {/* ─── Metric Strip ─── */}
      <section className="mb-10">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-[10px] uppercase tracking-widest font-medium mb-4"
          style={{ color: '#1e293b' }}
        >
          Dataset Overview
        </motion.p>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} rows={2} />)}
          </div>
        ) : data ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <MetricCard label="Games Analysed" value={data.stats.total_games.toLocaleString()} icon={<Gamepad2 size={13} />} accent delay={0} />
            <MetricCard label="Global Sales" value={`${(data.stats.total_global_sales / 1000).toFixed(1)}B`} sub="units" icon={<TrendingUp size={13} />} delay={0.05} />
            <MetricCard label="Avg per Game" value={`${data.stats.avg_sales.toFixed(2)}M`} icon={<Globe size={13} />} delay={0.1} />
            <MetricCard label="Platforms" value={data.stats.num_platforms} icon={<Monitor size={13} />} delay={0.15} />
            <MetricCard label="Genres" value={data.stats.num_genres} icon={<Tag size={13} />} delay={0.2} />
            <MetricCard label="Publishers" value={data.stats.num_publishers.toLocaleString()} icon={<Building2 size={13} />} delay={0.25} />
          </div>
        ) : null}
      </section>

      {/* ─── Top Genres + Platforms ─── */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          {/* Genres */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.45 }}
            className="card p-5"
          >
            <p className="text-[10px] uppercase tracking-widest font-medium mb-4" style={{ color: '#334155' }}>Top Genres</p>
            <div className="space-y-3.5">
              {data.top_genres.map((g, i) => {
                const max = data.top_genres[0].total_sales;
                const pct = (g.total_sales / max) * 100;
                return (
                  <div key={g.Genre}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span style={{ color: '#94a3b8' }}>{g.Genre}</span>
                      <span className="font-mono-data text-xs" style={{ color: '#475569' }}>{g.total_sales.toFixed(0)}M</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, delay: 0.4 + i * 0.06, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg, #7c3aed, #6366f1)' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Platforms */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.45 }}
            className="card p-5"
          >
            <p className="text-[10px] uppercase tracking-widest font-medium mb-4" style={{ color: '#334155' }}>Top Platforms</p>
            <div className="space-y-3.5">
              {data.top_platforms.map((p, i) => {
                const max = data.top_platforms[0].total_sales;
                const pct = (p.total_sales / max) * 100;
                return (
                  <div key={p.Platform}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span style={{ color: '#94a3b8' }}>{p.Platform}</span>
                      <span className="font-mono-data text-xs" style={{ color: '#475569' }}>{p.total_sales.toFixed(0)}M</span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, delay: 0.45 + i * 0.06, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg, #4f46e5, #2563eb)' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}

      {/* ─── Module Cards ─── */}
      <section className="mb-10">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-[10px] uppercase tracking-widest font-medium mb-4"
          style={{ color: '#1e293b' }}
        >
          Platform Modules
        </motion.p>
        <motion.div
          variants={stagger.container}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {[
            {
              label: 'Market Research', desc: 'Explore historical market conditions, genre trends, platform performance, and regional distributions.',
              to: '/market', icon: '01',
            },
            {
              label: 'Competitor Analysis', desc: 'Search, filter, and compare historical titles. Study their commercial performance side-by-side.',
              to: '/competitors', icon: '02',
            },
            {
              label: 'Launch Simulator', desc: 'Configure a hypothetical game and get a Random Forest–based historical sales estimate.',
              to: '/simulator', icon: '03', highlight: true,
            },
            {
              label: 'Recommendations', desc: 'Data-backed insights on genre-platform combinations, region demand, and comparable titles.',
              to: '/recommendations', icon: '04',
            },
          ].map(({ label, desc, to, icon, highlight }) => (
            <motion.button
              key={to}
              variants={stagger.item}
              onClick={() => navigate(to)}
              className="card p-5 text-left group relative overflow-hidden"
              style={highlight ? {
                background: 'rgba(139,92,246,0.06)',
                borderColor: 'rgba(139,92,246,0.2)',
              } : {}}
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              {/* Hover glow sweep */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: 'radial-gradient(circle at 20% 50%, rgba(139,92,246,0.06), transparent 60%)' }}
              />
              <div className="relative flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2.5">
                    <span className="font-mono-data text-xs" style={{ color: '#1e293b' }}>{icon}</span>
                    {highlight && <span className="badge-violet text-[10px]"><Zap size={9} /> Core</span>}
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-1.5">{label}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: '#334155' }}>{desc}</p>
                </div>
                <ArrowRight
                  size={15}
                  className="shrink-0 ml-4 mt-0.5 transition-all duration-200 group-hover:translate-x-1"
                  style={{ color: '#1e293b' }}
                />
              </div>
            </motion.button>
          ))}
        </motion.div>
      </section>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <Disclaimer>
          PLAYNEX uses historical video game sales data (primarily 1980–2016). All predictions reflect past market conditions and are not commercial guarantees.
        </Disclaimer>
      </motion.div>
    </div>
  );
}
