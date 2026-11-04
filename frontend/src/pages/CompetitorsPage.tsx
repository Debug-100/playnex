import React, { useState, useEffect, useCallback } from 'react';
import { fetchGames, compareGames, fetchFilterOptions } from '../services/api';
import PageHeader from '../components/PageHeader';
import ErrorState from '../components/ErrorState';
import { SkeletonTable } from '../components/Skeleton';
import { Search, ChevronLeft, ChevronRight, Plus, X, BarChart2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';

interface Game {
  Name: string; Platform: string; Genre: string; Publisher: string; Year: number;
  Global_Sales: number; NA_Sales?: number; EU_Sales?: number; JP_Sales?: number; Other_Sales?: number;
  Critic_Score?: number; User_Score?: number;
}

export default function CompetitorsPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ q: '', genre: '', platform: '', sort_by: 'Global_Sales', sort_dir: 'desc' });
  const [filterOptions, setFilterOptions] = useState({ genres: [], platforms: [] });
  const [selected, setSelected] = useState<Game[]>([]);
  const [compareData, setCompareData] = useState<Game[] | null>(null);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    fetchFilterOptions().then(r => setFilterOptions(r.data)).catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    const params: Record<string, string | number> = { page };
    if (filters.q) params.q = filters.q;
    if (filters.genre) params.genre = filters.genre;
    if (filters.platform) params.platform = filters.platform;
    params.sort_by = filters.sort_by;
    params.sort_dir = filters.sort_dir;

    fetchGames(params)
      .then(r => {
        setGames(r.data.games);
        setTotal(r.data.total);
        setTotalPages(r.data.total_pages);
      })
      .catch(err => setError(err?.response?.data?.error || 'Failed to load games'))
      .finally(() => setLoading(false));
  }, [filters, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [filters]);

  const toggleSelect = (game: Game) => {
    setSelected(prev => {
      if (prev.find(g => g.Name === game.Name && g.Platform === game.Platform)) {
        return prev.filter(g => !(g.Name === game.Name && g.Platform === game.Platform));
      }
      if (prev.length >= 5) return prev;
      return [...prev, game];
    });
    setCompareData(null);
  };

  const runCompare = async () => {
    setComparing(true);
    try {
      const res = await compareGames(selected.map(g => g.Name));
      setCompareData(res.data);
    } catch {
      setCompareData(selected); // fallback to already-loaded data
    } finally {
      setComparing(false);
    }
  };

  const comparisonChartData = compareData?.map(g => ({
    name: g.Name.length > 20 ? g.Name.slice(0, 18) + '…' : g.Name,
    NA: g.NA_Sales || 0,
    EU: g.EU_Sales || 0,
    JP: g.JP_Sales || 0,
    Other: g.Other_Sales || 0,
    Global: g.Global_Sales || 0,
  })) || [];

  return (
    <div>
      <PageHeader
        title="Competitor Analysis"
        subtitle="Research historical game titles, compare sales performance and critical reception."
      />

      {/* Search & Filters */}
      <div className="card p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by title…"
            value={filters.q}
            onChange={e => setFilters(f => ({ ...f, q: e.target.value }))}
            className="input-field pl-9"
          />
        </div>
        <select value={filters.genre} onChange={e => setFilters(f => ({ ...f, genre: e.target.value }))} className="select-field w-32">
          <option value="">All Genres</option>
          {(filterOptions.genres as string[]).map(g => <option key={g}>{g}</option>)}
        </select>
        <select value={filters.platform} onChange={e => setFilters(f => ({ ...f, platform: e.target.value }))} className="select-field w-32">
          <option value="">All Platforms</option>
          {(filterOptions.platforms as string[]).map(p => <option key={p}>{p}</option>)}
        </select>
        <select value={filters.sort_by} onChange={e => setFilters(f => ({ ...f, sort_by: e.target.value }))} className="select-field w-36">
          <option value="Global_Sales">Sort: Global Sales</option>
          <option value="NA_Sales">Sort: NA Sales</option>
          <option value="Critic_Score">Sort: Critic Score</option>
          <option value="Year">Sort: Year</option>
        </select>
      </div>

      {error && <div className="mb-4"><ErrorState error={error} /></div>}

      {/* Selection bar */}
      {selected.length > 0 && (
        <div className="card p-3 mb-4 flex items-center gap-3 border-zinc-700">
          <span className="text-sm text-zinc-400">{selected.length} selected:</span>
          <div className="flex flex-wrap gap-2 flex-1">
            {selected.map(g => (
              <span key={g.Name + g.Platform} className="badge-default flex items-center gap-1">
                {g.Name.slice(0, 20)} ({g.Platform})
                <button onClick={() => toggleSelect(g)}><X size={10} /></button>
              </span>
            ))}
          </div>
          <button onClick={runCompare} disabled={comparing || selected.length < 2} className="btn-primary text-xs py-1.5 px-3">
            <BarChart2 size={13} /> Compare
          </button>
          <button onClick={() => { setSelected([]); setCompareData(null); }} className="btn-ghost text-xs py-1.5">Clear</button>
        </div>
      )}

      {/* Comparison panel */}
      {compareData && compareData.length > 0 && (
        <div className="card p-5 mb-6">
          <h3 className="section-header mb-4">Side-by-Side Comparison</h3>
          <div className="overflow-x-auto mb-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  {['Metric', ...compareData.map(g => g.Name.slice(0, 18))].map(h => (
                    <th key={h} className="table-header pb-2 px-3 first:text-left text-right first:text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { key: 'Platform', label: 'Platform' },
                  { key: 'Genre', label: 'Genre' },
                  { key: 'Year', label: 'Year' },
                  { key: 'Global_Sales', label: 'Global Sales (M)' },
                  { key: 'NA_Sales', label: 'NA Sales (M)' },
                  { key: 'EU_Sales', label: 'EU Sales (M)' },
                  { key: 'JP_Sales', label: 'JP Sales (M)' },
                  { key: 'Critic_Score', label: 'Critic Score' },
                  { key: 'User_Score', label: 'User Score' },
                ].map(({ key, label }) => (
                  <tr key={key} className="table-row">
                    <td className="table-cell text-zinc-400 text-xs font-medium">{label}</td>
                    {compareData.map((g: any) => (
                      <td key={g.Name + g.Platform} className="table-cell text-right">
                        {g[key] !== null && g[key] !== undefined ? (
                          typeof g[key] === 'number' ? g[key].toFixed(key.includes('Sales') ? 2 : 1) : g[key]
                        ) : '–'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h4 className="text-sm font-medium text-zinc-300 mb-3">Regional Sales Breakdown</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={comparisonChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 10 }} />
              <YAxis tick={{ fill: '#71717a', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, color: '#fff' }} />
              <Bar dataKey="NA" fill="#ffffff" radius={[2, 2, 0, 0]} />
              <Bar dataKey="EU" fill="#d4d4d8" radius={[2, 2, 0, 0]} />
              <Bar dataKey="JP" fill="#a1a1aa" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Other" fill="#71717a" radius={[2, 2, 0, 0]} />
              <Legend wrapperStyle={{ color: '#71717a', fontSize: 12 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Games table */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
          <span className="text-sm text-zinc-400">{total.toLocaleString()} games</span>
          <span className="text-xs text-zinc-500">Select up to 5 to compare</span>
        </div>
        {loading ? <SkeletonTable rows={8} /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="table-header px-4 pb-3 pt-2 w-6"></th>
                  {['Title', 'Platform', 'Genre', 'Publisher', 'Year', 'Global Sales', 'Critic Score'].map(h => (
                    <th key={h} className="table-header px-3 pb-3 pt-2 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {games.map((g, i) => {
                  const isSelected = selected.some(s => s.Name === g.Name && s.Platform === g.Platform);
                  return (
                    <tr key={i} className={`table-row cursor-pointer ${isSelected ? 'bg-zinc-800/50' : ''}`} onClick={() => toggleSelect(g)}>
                      <td className="table-cell">
                        <div className={`w-4 h-4 rounded border ${isSelected ? 'bg-white border-white text-zinc-950' : 'border-zinc-700'} flex items-center justify-center`}>
                          {isSelected && <div className="w-2 h-2 bg-zinc-950 rounded-sm" />}
                        </div>
                      </td>
                      <td className="table-cell font-medium max-w-48 truncate">{g.Name}</td>
                      <td className="table-cell"><span className="badge-default">{g.Platform}</span></td>
                      <td className="table-cell text-zinc-400">{g.Genre}</td>
                      <td className="table-cell text-zinc-500 text-xs truncate max-w-32">{g.Publisher}</td>
                      <td className="table-cell text-zinc-400">{g.Year}</td>
                      <td className="table-cell font-mono">{g.Global_Sales?.toFixed(2)}M</td>
                      <td className="table-cell">{g.Critic_Score ? (
                        <span className="badge-default font-mono">{g.Critic_Score}</span>
                      ) : '–'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {/* Pagination */}
        <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost py-1 px-2 disabled:opacity-30">
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-ghost py-1 px-2 disabled:opacity-30">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

