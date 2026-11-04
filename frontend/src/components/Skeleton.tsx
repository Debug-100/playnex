import React from 'react';

interface Props {
  rows?: number;
  cols?: number;
  height?: string;
}

export function SkeletonCard({ rows = 3, height = 'h-8' }: { rows?: number; height?: string }) {
  return (
    <div className="card p-5 flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`skeleton ${height} ${i === 0 ? 'w-1/3' : i === 1 ? 'w-full' : 'w-2/3'}`} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-slate-800">
        <div className="skeleton h-5 w-32" />
      </div>
      <div className="divide-y divide-slate-800/50">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-4 py-3 flex gap-4">
            <div className="skeleton h-4 w-32" />
            <div className="skeleton h-4 w-16" />
            <div className="skeleton h-4 w-20" />
            <div className="skeleton h-4 w-12 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="card p-5">
      <div className="skeleton h-5 w-40 mb-4" />
      <div className="skeleton h-48 w-full rounded-lg" />
    </div>
  );
}

export default function LoadingSkeleton({ cols = 4 }: Props) {
  return (
    <div className={`grid grid-cols-${cols} gap-4`}>
      {Array.from({ length: cols }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

