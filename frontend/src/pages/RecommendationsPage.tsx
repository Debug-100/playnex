import React, { useEffect, useState } from 'react';
import { fetchRecommendations, fetchFilterOptions } from '../services/api';
import PageHeader from '../components/PageHeader';
import ErrorState from '../components/ErrorState';
import { SkeletonCard } from '../components/Skeleton';
import { Lightbulb, ChevronDown, ChevronUp, Trophy, Globe, Layers, TrendingUp } from 'lucide-react';

function RecCard({ rec }: { rec: any }) {
  const [expanded, setExpanded] = useState(false);

  const icons: Record<string, React.ReactNode> = {
    top_combos: <Trophy size={14} />,
    region_demand: <Globe size={14} />,
    comparable_titles: <Layers size={14} />,
    alt_platforms: <TrendingUp size={14} />,
  };

  return (
    <div className="card p-5">
      <button onClick={() => setExpanded(e => !e)} className="w-full text-left">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-zinc-400">{icons[rec.type] || <Lightbulb size={14} />}</span>
          <h3 className="font-semibold text-white">{rec.title}</h3>
          <span className="ml-auto text-zinc-500">{expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
        </div>
        <p className="text-xs text-zinc-500 leading-relaxed">{rec.explanation}</p>
      </button>

      {expanded && (
        <div className="mt-4 border-t border-zinc-800 pt-4">
          {rec.type === 'top_combos' && Array.isArray(rec.evidence) && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800">
                    {['Genre', 'Platform', 'Avg Sales', 'Titles', 'Median'].map(h => (
                      <th key={h} className="table-header pb-2 px-2 text-left text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rec.evidence.map((e: any, i: number) => (
                    <tr key={i} className="table-row">
                      <td className="table-cell text-xs">{e.Genre}</td>
                      <td className="table-cell"><span className="badge-default text-xs">{e.Platform}</span></td>
                      <td className="table-cell font-mono text-xs text-zinc-200">{(e.avg_sales||0).toFixed(2)}M</td>
                      <td className="table-cell text-xs text-zinc-500">{e.game_count}</td>
                      <td className="table-cell font-mono text-xs text-zinc-400">{(e.median_sales||0).toFixed(2)}M</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {rec.type === 'region_demand' && rec.evidence && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="badge-default">Strongest region: {rec.top_region}</span>
                <span className="text-xs text-zinc-500">· {rec.game_count} titles analysed</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(rec.evidence as Record<string, number>).map(([region, val]) => (
                  <div key={region} className="card-sm p-3 text-center">
                    <div className="text-xs text-zinc-500 mb-1">{region}</div>
                    <div className="text-lg font-bold text-white">{val.toFixed(1)}M</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {rec.type === 'comparable_titles' && Array.isArray(rec.evidence) && (
            <div className="space-y-2">
              {rec.evidence.map((e: any, i: number) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-zinc-800/50 last:border-0">
                  <span className="text-xs text-zinc-500 w-4">{i + 1}</span>
                  <span className="text-sm text-zinc-200 flex-1">{e.Name}</span>
                  <span className="badge-default text-xs">{e.Platform}</span>
                  <span className="text-xs text-zinc-400">{e.Year}</span>
                  <span className="font-mono text-xs text-zinc-100">{(e.Global_Sales||0).toFixed(2)}M</span>
                  {e.Critic_Score && <span className="badge-default text-xs">{e.Critic_Score}</span>}
                </div>
              ))}
            </div>
          )}

          {rec.type === 'alt_platforms' && Array.isArray(rec.evidence) && (
            <div className="space-y-3">
              {rec.evidence.map((e: any, i: number) => {
                const max = rec.evidence[0]?.avg_sales || 1;
                const pct = (e.avg_sales / max) * 100;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-zinc-200">{e.Platform}</span>
                      <span className="text-zinc-500">{(e.avg_sales||0).toFixed(2)}M avg · {e.game_count} titles</span>
                    </div>
                    <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-zinc-200 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RecommendationsPage() {
  const [recs, setRecs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [genre, setGenre] = useState('');
  const [platform, setPlatform] = useState('');
  const [filterOptions, setFilterOptions] = useState({ genres: [], platforms: [] });

  useEffect(() => {
    fetchFilterOptions().then(r => setFilterOptions(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchRecommendations({ genre: genre || undefined, platform: platform || undefined })
      .then(r => setRecs(r.data))
      .catch(err => setError(err?.response?.data?.error || 'Failed to load recommendations'))
      .finally(() => setLoading(false));
  }, [genre, platform]);

  return (
    <div>
      <PageHeader
        title="Recommendations"
        subtitle="Data-backed insights derived from historical market patterns. All findings include supporting evidence."
      />

      <div className="card p-4 mb-6 flex flex-wrap gap-3 items-center">
        <Lightbulb size={13} className="text-slate-500" />
        <span className="text-xs text-slate-500">Filter recommendations by:</span>
        <select value={genre} onChange={e => setGenre(e.target.value)} className="select-field w-36">
          <option value="">All Genres</option>
          {(filterOptions.genres as string[]).map(g => <option key={g}>{g}</option>)}
        </select>
        <select value={platform} onChange={e => setPlatform(e.target.value)} className="select-field w-36">
          <option value="">All Platforms</option>
          {(filterOptions.platforms as string[]).map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      {error && <ErrorState error={error} />}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} rows={3} height="h-5" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {recs.map((rec, i) => <RecCard key={i} rec={rec} />)}
          {recs.length === 0 && (
            <div className="card p-10 text-center">
              <p className="text-slate-500 text-sm">No recommendations available. Ensure the dataset is loaded.</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-5 info-box">
        Recommendations are derived from observed historical patterns in the dataset. They reflect correlation, not causation, and do not guarantee commercial success.
      </div>
    </div>
  );
}

