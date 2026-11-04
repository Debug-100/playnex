import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props { children: React.ReactNode }

export default function Disclaimer({ children }: Props) {
  return (
    <div className="disclaimer-box flex items-start gap-2">
      <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-400" />
      <span>{children}</span>
    </div>
  );
}

