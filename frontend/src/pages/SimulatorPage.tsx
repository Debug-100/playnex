import React, { useState, useEffect } from 'react';
import { fetchSimulatorOptions, predictSales, compareScenarios } from '../services/api';
import PageHeader from '../components/PageHeader';
import ErrorState from '../components/ErrorState';
import Disclaimer from '../components/Disclaimer';
import { Rocket, Plus, Trash2, Zap, ChevronDown } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#ffffff', '#d4d4d8', '#a1a1aa', '#71717a', '#52525b'];

interface SimOptions { genres: string[]; platforms: string[]; publishers: string[]; years: number[] }
interface Prediction {
  input: { genre: string; platform: string; publisher: string; year: number };
  predictions: Record<string, number | string | null | undefined>;
  disclaimer: string;
}
interface Scenario {
  label: string; genre: string; platform: string; publisher: string; year: number;
}
interface ScenarioResult extends Scenario {
  predictions: Record<string, number> | null; error?: string[];
}

function PredictionReport({ result }: { result: Prediction }) {
  const p = result.predictions;
  const regionData = [
    { name: 'North America', value: (p.NA_Sales as number) || 0 },
    { name: 'Europe', value: (p.EU_Sales as number) || 0 },
    { name: 'Japan', value: (p.JP_Sales as number) || 0 },
    { name: 'Other', value: (p.Other_Sales as number) || 0 },
  ];

  return (
    <div className="card p-6 border-zinc-700">
      <div className="flex items-center gap-2 mb-5">
        <Zap size={16} className="text-zinc-400" />
        <h3 className="font-semibold text-white">Historical Sales Estimate</h3>
        <span className="ml-auto badge-default">Random Forest</span>
      </div>

      {/* Config summary */}
      <div className="flex flex-wrap gap-2 mb-5">
        {Object.entries(result.input).map(([k, v]) => (
          <div key={k} className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5">
            <div className="text-xs text-zinc-500 capitalize">{k}</div>
            <div className="text-sm font-medium text-white">{v}</div>
          </div>
        ))}
      </div>

      {/* Global headline */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-5 text-center">
        <div className="text-xs text-zinc-400 mb-1 uppercase tracking-wider">Estimated Global Sales</div>
        <div className="text-4xl font-bold text-white">{((p.Global_Sales as number) || 0).toFixed(2)}M</div>
        <div className="text-xs text-zinc-500 mt-1">units (millions, historical estimate)</div>
      </div>

      {/* Regional grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {regionData.map(r => (
          <div key={r.name} className="card-sm p-3 text-center">
            <div className="text-xs text-zinc-400 mb-1">{r.name}</div>
            <div className="text-lg font-bold text-white">{r.value.toFixed(2)}M</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <h4 className="text-sm text-zinc-400 mb-2">Regional Breakdown</h4>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={regionData} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 10 }} />
              <YAxis tick={{ fill: '#71717a', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, color: '#fff' }} formatter={(v: any) => [`${v.toFixed(2)}M`]} />
              <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                {regionData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <h4 className="text-sm text-zinc-400 mb-2">Distribution</h4>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={regionData} dataKey="value" cx="50%" cy="50%" outerRadius={65} paddingAngle={2}>
                {regionData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, color: '#fff' }} formatter={(v: any) => [`${v.toFixed(2)}M`]} />
              <Legend iconSize={8} wrapperStyle={{ color: '#71717a', fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {p._discrepancy_note && (
        <div className="info-box mb-3">{p._discrepancy_note}</div>
      )}
      <Disclaimer>{result.disclaimer}</Disclaimer>
    </div>
  );
}

export default function SimulatorPage() {
  const [options, setOptions] = useState<SimOptions | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [form, setForm] = useState({ genre: '', platform: '', publisher: '', year: '' });
  const [predicting, setPredicting] = useState(false);
  const [result, setResult] = useState<Prediction | null>(null);
  const [predError, setPredError] = useState<string | null>(null);

  // Scenarios
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [comparing, setComparing] = useState(false);
  const [compResults, setCompResults] = useState<{ scenarios: ScenarioResult[]; best_scenario: string; disclaimer: string } | null>(null);
  const [compError, setCompError] = useState<string | null>(null);

  useEffect(() => {
    fetchSimulatorOptions()
      .then(r => {
        setOptions(r.data);
        // Set defaults
        setForm(f => ({
          ...f,
          genre: r.data.genres[0] || '',
          platform: r.data.platforms[0] || '',
          publisher: r.data.publishers[0] || '',
          year: String(r.data.years[r.data.years.length - 1] || 2010),
        }));
      })
      .catch(err => setOptionsError(err?.response?.data?.error || 'Model not trained yet. Run: python ml/train.py'));
  }, []);

  const handlePredict = async () => {
    if (!form.genre || !form.platform || !form.year) return;
    setPredicting(true); setPredError(null); setResult(null);
    try {
      const res = await predictSales({ ...form, year: Number(form.year) });
      setResult(res.data);
    } catch (err: any) {
      setPredError(err?.response?.data?.error || 'Prediction failed');
    } finally {
      setPredicting(false);
    }
  };

  const addScenario = () => {
    if (!form.genre || !form.platform) return;
    const label = String.fromCharCode(65 + scenarios.length);
    setScenarios(s => [...s, { ...form, year: Number(form.year), label: `Strategy ${label}` }]);
    setCompResults(null);
  };

  const removeScenario = (i: number) => setScenarios(s => s.filter((_, idx) => idx !== i));

  const handleCompare = async () => {
    if (scenarios.length < 2) return;
    setComparing(true); setCompError(null);
    try {
      const res = await compareScenarios(scenarios.map(s => ({ ...s, year: Number(s.year) })));
      setCompResults(res.data);
    } catch (err: any) {
      setCompError(err?.response?.data?.error || 'Comparison failed');
    } finally { setComparing(false); }
  };

  const compChart = compResults?.scenarios
    .filter(s => s.predictions)
    .map(s => ({
      name: s.label,
      Global: s.predictions?.Global_Sales || 0,
      NA: s.predictions?.NA_Sales || 0,
      EU: s.predictions?.EU_Sales || 0,
      JP: s.predictions?.JP_Sales || 0,
    })) || [];

  return (
    <div>
      <PageHeader
        title="Launch Simulator"
        subtitle="Configure a hypothetical game and get a Random Forest–based historical sales estimate."
      />

      {optionsError && <div className="mb-6"><ErrorState error={optionsError} dataMissing /></div>}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Config form */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <h3 className="section-header mb-4">Game Configuration</h3>

            {[
              { key: 'genre', label: 'Genre', items: options?.genres || [], desc: 'Primary game genre.' },
              { key: 'platform', label: 'Platform', items: options?.platforms || [], desc: 'Target release platform.' },
              { key: 'publisher', label: 'Publisher', items: options?.publishers || [], desc: 'Publishing company (affects model weighting).' },
            ].map(({ key, label, items, desc }) => (
              <div key={key} className="mb-4">
                <label className="text-xs text-slate-400 font-medium block mb-1">{label}</label>
                <p className="text-xs text-slate-600 mb-1.5">{desc}</p>
                <select
                  value={(form as any)[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="select-field"
                  disabled={!options}
                >
                  {items.map((v: string) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            ))}

            <div className="mb-5">
              <label className="text-xs text-slate-400 font-medium block mb-1">Release Year Reference</label>
              <p className="text-xs text-slate-600 mb-1.5">Historical year context for the market conditions model.</p>
              <select
                value={form.year}
                onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                className="select-field"
                disabled={!options}
              >
                {(options?.years || []).map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div className="flex gap-2">
              <button onClick={handlePredict} disabled={predicting || !options} className="btn-primary flex-1">
                <Rocket size={14} />
                {predicting ? 'Estimating…' : 'Estimate Sales'}
              </button>
              <button onClick={addScenario} disabled={!options || scenarios.length >= 8} className="btn-secondary" title="Add to comparison">
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Scenarios list */}
          {scenarios.length > 0 && (
            <div className="card p-5">
              <h3 className="section-header mb-3">Comparison Scenarios</h3>
              <div className="space-y-2 mb-4">
                {scenarios.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">
                    <span className="text-xs font-mono text-zinc-300 w-16">{s.label}</span>
                    <span className="text-xs text-zinc-300 flex-1">{s.genre} · {s.platform}</span>
                    <span className="text-xs text-zinc-500">{s.year}</span>
                    <button onClick={() => removeScenario(i)} className="text-zinc-500 hover:text-red-400 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={handleCompare} disabled={comparing || scenarios.length < 2} className="btn-primary w-full">
                <Zap size={14} />
                {comparing ? 'Comparing…' : 'Compare Scenarios'}
              </button>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-5">
          {predError && <ErrorState error={predError} />}

          {result && <PredictionReport result={result} />}

          {!result && !predError && !predicting && (
            <div className="card p-10 text-center">
              <Rocket size={32} className="text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">Configure your game and click <strong className="text-zinc-300">Estimate Sales</strong> to get a prediction.</p>
            </div>
          )}

          {/* Comparison results */}
          {compError && <ErrorState error={compError} />}
          {compResults && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="section-header">Strategy Comparison</h3>
                {compResults.best_scenario && (
                  <span className="badge-default">Best: {compResults.best_scenario}</span>
                )}
              </div>
              <div className="overflow-x-auto mb-5">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      {['Strategy', 'Genre', 'Platform', 'Year', 'Global (M)', 'NA (M)', 'EU (M)', 'JP (M)'].map(h => (
                        <th key={h} className="table-header pb-2 px-2 text-left text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {compResults.scenarios.map((s, i) => {
                      const isBest = s.label === compResults.best_scenario;
                      return (
                        <tr key={i} className={`table-row ${isBest ? 'bg-zinc-800/40' : ''}`}>
                          <td className="table-cell">
                            <span className={`font-medium ${isBest ? 'text-white' : 'text-zinc-400'}`}>{s.label}</span>
                          </td>
                          <td className="table-cell text-xs">{s.genre}</td>
                          <td className="table-cell text-xs">{s.platform}</td>
                          <td className="table-cell text-xs">{s.year}</td>
                          {s.predictions ? (
                            <>
                              <td className="table-cell font-mono text-xs">{(s.predictions.Global_Sales||0).toFixed(2)}</td>
                              <td className="table-cell font-mono text-xs">{(s.predictions.NA_Sales||0).toFixed(2)}</td>
                              <td className="table-cell font-mono text-xs">{(s.predictions.EU_Sales||0).toFixed(2)}</td>
                              <td className="table-cell font-mono text-xs">{(s.predictions.JP_Sales||0).toFixed(2)}</td>
                            </>
                          ) : (
                            <td colSpan={4} className="table-cell text-red-400 text-xs">{(s.error || []).join(', ')}</td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {compChart.length > 0 && (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={compChart} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#71717a', fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, color: '#fff' }} formatter={(v: any) => [`${v.toFixed(2)}M`]} />
                    <Bar dataKey="Global" fill="#ffffff" radius={[3, 3, 0, 0]} name="Global" />
                    <Bar dataKey="NA" fill="#d4d4d8" radius={[3, 3, 0, 0]} name="NA" />
                    <Bar dataKey="EU" fill="#a1a1aa" radius={[3, 3, 0, 0]} name="EU" />
                    <Bar dataKey="JP" fill="#71717a" radius={[3, 3, 0, 0]} name="JP" />
                    <Legend wrapperStyle={{ color: '#71717a', fontSize: 11 }} />
                  </BarChart>
                </ResponsiveContainer>
              )}
              <div className="mt-4"><Disclaimer>{compResults.disclaimer}</Disclaimer></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
