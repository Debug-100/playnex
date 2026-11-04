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
    <div>
      {/* ── Hero ── */}
      <div className="mb-10">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="font-black tracking-tighter text-white mb-3"
          style={{ fontSize: 'clamp(2rem, 4.5vw, 3.25rem)', lineHeight: 1.05, letterSpacing: '-0.03em' }}
        >
          Build smarter.<br />
          <span className="gradient-text">Launch strategically.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          style={{ color: '#71717a', fontSize: '14px', lineHeight: 1.6, maxWidth: '480px', marginBottom: '24px' }}
        >
          Historical game market intelligence powered by Random Forest analysis of{' '}
          <span style={{ color: '#a1a1aa' }}>
            {data ? `${data.stats.total_games.toLocaleString()} titles` : 'thousands of titles'}
          </span>{' '}
          across{' '}
          <span style={{ color: '#a1a1aa' }}>
            {data ? `${data.stats.year_range[0]}–${data.stats.year_range[1]}` : 'four decades'}.
          </span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.18 }}
          className="flex items-center gap-3"
        >
          <button onClick={() => navigate('/simulator')} className="btn-primary">
            <Rocket size={14} strokeWidth={1.75} />
            Launch Simulator
          </button>
          <button onClick={() => navigate('/market')} className="btn-secondary">
            <Globe size={14} strokeWidth={1.75} />
            Explore Market
          </button>
        </motion.div>
      </div>

      {/* ── Error ── */}
      {error && <div className="mb-6"><ErrorState error={error.msg} dataMissing={error.dataMissing} /></div>}

      {/* ── Stats grid ── */}
      <section className="mb-8">
        <p style={{ fontSize: '11px', color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, marginBottom: '12px' }}>
          Dataset
        </p>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} rows={2} />)}
          </div>
        ) : data ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Games', value: data.stats.total_games.toLocaleString(), icon: <Gamepad2 size={13} strokeWidth={1.5} />, delay: 0 },
              { label: 'Global Sales', value: `${(data.stats.total_global_sales / 1000).toFixed(1)}B`, icon: <TrendingUp size={13} strokeWidth={1.5} />, delay: 0.04 },
              { label: 'Avg / Game', value: `${data.stats.avg_sales.toFixed(2)}M`, icon: <Globe size={13} strokeWidth={1.5} />, delay: 0.08 },
              { label: 'Platforms', value: data.stats.num_platforms, icon: <Monitor size={13} strokeWidth={1.5} />, delay: 0.12 },
              { label: 'Genres', value: data.stats.num_genres, icon: <Tag size={13} strokeWidth={1.5} />, delay: 0.16 },
              { label: 'Publishers', value: data.stats.num_publishers.toLocaleString(), icon: <Building2 size={13} strokeWidth={1.5} />, delay: 0.2 },
            ].map(({ label, value, icon, delay }) => (
              <MetricCard key={label} label={label} value={value} icon={icon} delay={delay} />
            ))}
          </div>
        ) : null}
      </section>

      {/* ── Top genres + platforms ── */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }} className="card p-5"
          >
            <p style={{ fontSize: '11px', color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, marginBottom: '14px' }}>
              Top Genres
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.top_genres.map((g, i) => {
                const pct = (g.total_sales / data.top_genres[0].total_sales) * 100;
                return (
                  <div key={g.Genre}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                      <span style={{ color: '#e4e4e7' }}>{g.Genre}</span>
                      <span style={{ color: '#52525b', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}>{g.total_sales.toFixed(0)}M</span>
                    </div>
                    <div style={{ height: '2px', background: '#18181b', borderRadius: '99px', overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: 0.3 + i * 0.05 }}
                        style={{ height: '100%', background: '#ffffff', borderRadius: '99px' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.33 }} className="card p-5"
          >
            <p style={{ fontSize: '11px', color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, marginBottom: '14px' }}>
              Top Platforms
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.top_platforms.map((p, i) => {
                const pct = (p.total_sales / data.top_platforms[0].total_sales) * 100;
                return (
                  <div key={p.Platform}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                      <span style={{ color: '#e4e4e7' }}>{p.Platform}</span>
                      <span style={{ color: '#52525b', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}>{p.total_sales.toFixed(0)}M</span>
                    </div>
                    <div style={{ height: '2px', background: '#18181b', borderRadius: '99px', overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: 0.35 + i * 0.05 }}
                        style={{ height: '100%', background: '#71717a', borderRadius: '99px' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Module cards ── */}
      <section className="mb-8">
        <p style={{ fontSize: '11px', color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, marginBottom: '12px' }}>
          Modules
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { n: '01', label: 'Market Research', desc: 'Historical genre, platform and regional sales trends with interactive filtering.', to: '/market' },
            { n: '02', label: 'Competitor Analysis', desc: 'Search and compare historical titles side-by-side across sales and scores.', to: '/competitors' },
            { n: '03', label: 'Launch Simulator', desc: 'Configure a hypothetical game and get a Random Forest–based sales estimate.', to: '/simulator', core: true },
            { n: '04', label: 'Recommendations', desc: 'Evidence-based insights on genre-platform fit, regional demand, and competitors.', to: '/recommendations' },
          ].map(({ n, label, desc, to, core }, i) => (
            <motion.button
              key={to}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38 + i * 0.06 }}
              onClick={() => navigate(to)}
              className="card p-5 text-left group"
              style={{ position: 'relative', overflow: 'hidden' }}
              whileHover={{ y: -1 }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#3f3f46' }}>{n}</span>
                    {core && (
                      <span className="badge-default" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Zap size={9} strokeWidth={1.5} /> core
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fafafa', marginBottom: '4px' }}>{label}</h3>
                  <p style={{ fontSize: '12px', color: '#52525b', lineHeight: 1.5 }}>{desc}</p>
                </div>
                <ArrowRight size={14} strokeWidth={1.5} style={{ color: '#27272a', marginLeft: '12px', marginTop: '2px', flexShrink: 0, transition: 'color 0.15s, transform 0.15s' }}
                  className="group-hover:text-zinc-400 group-hover:translate-x-0.5"
                />
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
        <Disclaimer>
          PLAYNEX analyses historical video game sales (1980–2016). All estimates reflect past market patterns and are not commercial guarantees.
        </Disclaimer>
      </motion.div>
    </div>
  );
}
