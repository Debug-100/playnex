import { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import { fetchGenres, fetchPlatforms, fetchRegions, fetchTrends, fetchInsights, fetchFilterOptions } from '../services/api';
import PageHeader from '../components/PageHeader';
import ErrorState from '../components/ErrorState';
import { SkeletonChart } from '../components/Skeleton';
import { Filter, X } from 'lucide-react';
import { motion } from 'framer-motion';

const COLORS = ['#ffffff', '#a1a1aa', '#71717a', '#52525b', '#3f3f46', '#27272a', '#18181b', '#09090b'];

const TT_STYLE = {
  contentStyle: {
    background: '#18181b',
    border: '1px solid #27272a',
    borderRadius: '8px',
    color: '#e4e4e7',
    fontSize: '12px',
  },
  cursor: { fill: 'rgba(255,255,255,0.03)' },
};

function FilterBar({ filters, onChange, options }: {
  filters: Record<string, string>;
  onChange: (key: string, val: string) => void;
  options: { genres: string[]; platforms: string[]; publishers: string[]; years: number[] };
}) {
  const hasFilters = Object.values(filters).some(Boolean);
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="card p-4 mb-6 flex flex-wrap gap-3 items-center"
    >
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider" style={{ color: '#334155' }}>
        <Filter size={11} />
        <span>Filter</span>
      </div>
      {[
        { key: 'genre', label: 'Genre', items: options.genres },
        { key: 'platform', label: 'Platform', items: options.platforms },
      ].map(({ key, label, items }) => (
        <select
          key={key}
          value={filters[key] || ''}
          onChange={e => onChange(key, e.target.value)}
          className="select-field w-36 text-xs"
        >
          <option value="">All {label}s</option>
          {items.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      ))}
      <input
        type="number" placeholder="From" min={1980} max={2020}
        value={filters.year_from || ''}
        onChange={e => onChange('year_from', e.target.value)}
        className="input-field w-24 text-xs"
      />
      <input
        type="number" placeholder="To" min={1980} max={2020}
        value={filters.year_to || ''}
        onChange={e => onChange('year_to', e.target.value)}
        className="input-field w-24 text-xs"
      />
      {hasFilters && (
        <button
          onClick={() => { onChange('genre', ''); onChange('platform', ''); onChange('year_from', ''); onChange('year_to', ''); }}
          className="btn-ghost text-xs flex items-center gap-1 py-1.5"
        >
          <X size={11} /> Clear
        </button>
      )}
    </motion.div>
  );
}

export default function MarketPage() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [filterOptions, setFilterOptions] = useState({ genres: [], platforms: [], publishers: [], years: [] });
  const [genres, setGenres] = useState<any[]>([]);
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [regions, setRegions] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFilterOptions().then(r => setFilterOptions(r.data)).catch(() => {});
  }, []);

  const load = useCallback(() => {
    const params: Record<string, string> = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });

    setLoading(true);
    Promise.all([
      fetchGenres(params),
      fetchPlatforms(params),
      fetchRegions(params),
      fetchTrends(params),
      fetchInsights(params),
    ])
      .then(([g, p, r, t, i]) => {
        setGenres(g.data.slice(0, 12));
        setPlatforms(p.data.slice(0, 12));
        setRegions(r.data);
        setTrends(t.data);
        setInsights(i.data);
      })
      .catch(err => setError(err?.response?.data?.error || 'Failed to load market data'))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { load(); }, [load]);
  const handleFilter = (key: string, val: string) => setFilters(prev => ({ ...prev, [key]: val }));

  const regionData = regions ? [
    { name: 'North America', value: regions.region_sales?.NA || 0 },
    { name: 'Europe', value: regions.region_sales?.EU || 0 },
    { name: 'Japan', value: regions.region_sales?.JP || 0 },
    { name: 'Other', value: regions.region_sales?.Other || 0 },
  ] : [];

  const axisStyle = { fill: '#3f3f46', fontSize: 10 };

  return (
    <div>
      <PageHeader title="Market Research" subtitle="Explore historical gaming market conditions and performance trends." />
      <FilterBar filters={filters} onChange={handleFilter} options={filterOptions} />

      {error && <div className="mb-6"><ErrorState error={error} /></div>}

      {/* Insights strip */}
      {!loading && insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {insights.map((ins: any, i: number) => (
            <motion.div
              key={ins.type}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="card-sm p-4"
              style={{ borderLeft: '2px solid #52525b' }}
            >
              <div className="text-[10px] uppercase tracking-widest font-medium mb-1" style={{ color: '#334155' }}>{ins.title}</div>
              <div className="font-semibold text-white text-sm">{ins.value}</div>
              <div className="text-xs mt-0.5" style={{ color: '#334155' }}>{ins.detail}</div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Genre sales */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-5">
          <p className="text-[10px] uppercase tracking-widest font-medium mb-4" style={{ color: '#334155' }}>Global Sales by Genre</p>
          {loading ? <SkeletonChart /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={genres} margin={{ top: 0, right: 0, left: -20, bottom: 44 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="Genre" tick={{ ...axisStyle }} angle={-35} textAnchor="end" />
                <YAxis tick={{ ...axisStyle }} />
                <Tooltip {...TT_STYLE} formatter={(v: any) => [`${Number(v).toFixed(1)}M`, 'Sales']} />
                <Bar dataKey="total_sales" radius={[4, 4, 0, 0]}>
                  {genres.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#fafafa' : `rgba(250,250,250,${Math.max(0.2, 0.85 - i * 0.06)})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Regional distribution */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-5">
          <p className="text-[10px] uppercase tracking-widest font-medium mb-4" style={{ color: '#334155' }}>Regional Sales Distribution</p>
          {loading ? <SkeletonChart /> : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="55%" height={220}>
                <PieChart>
                  <Pie data={regionData} dataKey="value" cx="50%" cy="50%" outerRadius={85} innerRadius={40} paddingAngle={3}>
                    {regionData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip {...TT_STYLE} formatter={(v: any) => [`${Number(v).toFixed(1)}M`]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2.5 flex-1">
                {regionData.map((r, i) => (
                  <div key={r.name} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i] }} />
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>{r.name}</span>
                    <span className="ml-auto font-mono-data text-xs" style={{ color: '#475569' }}>{r.value.toFixed(1)}M</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Trend line */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-5 mb-5">
        <p className="text-[10px] uppercase tracking-widest font-medium mb-4" style={{ color: '#334155' }}>Historical Sales Trend</p>
        {loading ? <SkeletonChart /> : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trends} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey="Year" tick={{ ...axisStyle }} />
              <YAxis tick={{ ...axisStyle }} />
              <Tooltip {...TT_STYLE} formatter={(v: any) => [`${Number(v).toFixed(1)}M`]} />
              <Line type="monotone" dataKey="total_sales" stroke="#fafafa" strokeWidth={2} dot={false} name="Total Sales (M)" />
              <Line type="monotone" dataKey="game_count" stroke="#71717a" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="Games Released" />
              <Legend wrapperStyle={{ color: '#71717a', fontSize: 11 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* Platform sales */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card p-5">
        <p className="text-[10px] uppercase tracking-widest font-medium mb-4" style={{ color: '#334155' }}>Platform-Wise Comparison</p>
        {loading ? <SkeletonChart /> : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={platforms} margin={{ top: 0, right: 0, left: -20, bottom: 44 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey="Platform" tick={{ ...axisStyle }} angle={-35} textAnchor="end" />
              <YAxis tick={{ ...axisStyle }} />
              <Tooltip {...TT_STYLE} formatter={(v: any) => [`${Number(v).toFixed(1)}M`]} />
              <Bar dataKey="total_sales" radius={[4, 4, 0, 0]}>
                {platforms.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? '#e4e4e7' : `rgba(228,228,231,${Math.max(0.15, 0.75 - i * 0.05)})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </motion.div>
    </div>
  );
}
