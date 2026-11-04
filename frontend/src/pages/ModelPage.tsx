import React, { useEffect, useState } from 'react';
import { fetchModelMetrics, fetchFeatureImportance } from '../services/api';
import PageHeader from '../components/PageHeader';
import ErrorState from '../components/ErrorState';
import { SkeletonCard } from '../components/Skeleton';
import Disclaimer from '../components/Disclaimer';
import { Cpu, TrendingUp, TrendingDown } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts';

const REGION_COLORS: Record<string, string> = {
  Global_Sales: '#ffffff', NA_Sales: '#e4e4e7', EU_Sales: '#d4d4d8',
  JP_Sales: '#a1a1aa', Other_Sales: '#71717a',
};

function MetricRow({ label, rf, baseline, better }: { label: string; rf: number; baseline: number; better: 'higher' | 'lower' }) {
  const isImproved = better === 'higher' ? rf > baseline : rf < baseline;
  return (
    <tr className="table-row">
      <td className="table-cell text-xs text-zinc-400 w-32">{label}</td>
      <td className="table-cell font-mono text-sm text-zinc-100">{rf?.toFixed(4)}</td>
      <td className="table-cell font-mono text-sm text-zinc-500">{baseline?.toFixed(4)}</td>
      <td className="table-cell">
        {isImproved
          ? <span className="badge-default flex items-center gap-1 w-fit"><TrendingUp size={10} /> Better</span>
          : <span className="text-xs text-zinc-500 flex items-center gap-1"><TrendingDown size={10} /> Worse</span>}
      </td>
    </tr>
  );
}

export default function ModelPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [featureImportance, setFeatureImportance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchModelMetrics(), fetchFeatureImportance()])
      .then(([m, f]) => { setMetrics(m.data); setFeatureImportance(f.data); })
      .catch(err => setError(err?.response?.data?.error || 'Model not trained yet. Run: python ml/train.py'))
      .finally(() => setLoading(false));
  }, []);

  const featureData = featureImportance
    ? Object.entries(featureImportance.feature_importances as Record<string, number>).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
    : [];

  return (
    <div>
      <PageHeader
        title="Model Performance"
        subtitle="Evaluation metrics for the Random Forest Regression model trained on historical game sales data."
      />

      {error && <div className="mb-6"><ErrorState error={error} dataMissing /></div>}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} rows={4} />)}
        </div>
      ) : metrics && (
        <>
          {/* Training split */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Training Samples', value: metrics.split?.train_samples?.toLocaleString() },
              { label: 'Test Samples', value: metrics.split?.test_samples?.toLocaleString() },
              { label: 'Total Samples', value: metrics.split?.total_samples?.toLocaleString() },
              { label: 'Estimators', value: metrics.model_params?.n_estimators },
            ].map(({ label, value }) => (
              <div key={label} className="card-sm p-4">
                <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider">{label}</div>
                <div className="text-xl font-bold text-white">{value}</div>
              </div>
            ))}
          </div>

          {/* Per-target metrics */}
          {Object.entries(metrics.random_forest as Record<string, { r2: number; mae: number; rmse: number }>).map(([target, m]) => {
            const baseline = metrics.baseline?.[target] || {};
            return (
              <div key={target} className="card p-5 mb-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full" style={{ background: REGION_COLORS[target] || '#ffffff' }} />
                  <h3 className="font-semibold text-white">{target.replace('_', ' ')}</h3>
                  <span className="ml-auto badge-default">R² {m.r2.toFixed(4)}</span>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      {['Metric', 'Random Forest', 'Baseline (Mean)', 'Result'].map(h => (
                        <th key={h} className="table-header pb-2 px-3 text-left text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <MetricRow label="R² Score" rf={m.r2} baseline={baseline.r2} better="higher" />
                    <MetricRow label="MAE (M units)" rf={m.mae} baseline={baseline.mae} better="lower" />
                    <MetricRow label="RMSE (M units)" rf={m.rmse} baseline={baseline.rmse} better="lower" />
                  </tbody>
                </table>
              </div>
            );
          })}

          {/* Feature importance */}
          {featureData.length > 0 && (
            <div className="card p-5 mb-5">
              <h3 className="section-header mb-4">Feature Importances</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={featureData} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, color: '#fff' }}
                    formatter={(v: any) => [v.toFixed(4), 'Importance']}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {featureData.map((_, i) => <Cell key={i} fill={['#ffffff', '#e4e4e7', '#a1a1aa', '#71717a'][i % 4]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-zinc-500 mt-3">Feature importance is computed as the mean decrease in impurity across all trees in the forest.</p>
            </div>
          )}

          <Disclaimer>
            Model trained on historical data (primarily 1980–2016). Metrics reflect performance on a held-out 20% test set.
            The Random Forest model is compared against a mean-prediction baseline — not another ML algorithm.
          </Disclaimer>
        </>
      )}
    </div>
  );
}
