import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  error: string;
  dataMissing?: boolean;
}

export default function ErrorState({ error, dataMissing }: Props) {
  return (
    <div className="error-box flex items-start gap-3">
      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
      <div>
        <p className="font-medium mb-1">{dataMissing ? 'Dataset Not Available' : 'Error'}</p>
        <p className="text-xs opacity-80">{error}</p>
        {dataMissing && (
          <div className="mt-2 text-xs opacity-70">
            <p>To use PLAYNEX, download the dataset from Kaggle and place it in <code className="font-mono bg-red-900/40 px-1 rounded">data/raw/</code>.</p>
            <p className="mt-1">Then run: <code className="font-mono bg-red-900/40 px-1 rounded">python ml/preprocessing.py && python ml/train.py</code></p>
          </div>
        )}
      </div>
    </div>
  );
}

