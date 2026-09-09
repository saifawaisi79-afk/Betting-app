import { cn } from '../../lib/utils';
import { Radio, CheckCircle2, XCircle, Clock, ShieldCheck, AlertCircle } from 'lucide-react';

interface BadgeProps {
  variant?: 'live' | 'won' | 'lost' | 'pending' | 'suspended' | 'verified' | 'neutral';
  children?: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  const variantStyles = {
    live: 'bg-red-500/10 text-red-400 border-red-500/20 font-extrabold',
    won: 'bg-emerald-500/10 text-[#00e676] border-emerald-500/20 font-bold',
    lost: 'bg-rose-500/10 text-rose-400 border-rose-500/20 font-bold',
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20 font-bold',
    suspended: 'bg-amber-950/60 text-amber-400 border-amber-800 font-bold',
    verified: 'bg-[#00e676]/10 text-[#00e676] border-[#00e676]/20 font-bold',
    neutral: 'bg-white/[0.04] text-[#8899aa] border-white/[0.08] font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider border',
        variantStyles[variant],
        className
      )}
    >
      {variant === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 live-dot" />}
      {variant === 'won' && <CheckCircle2 size={11} className="text-[#00e676]" />}
      {variant === 'lost' && <XCircle size={11} className="text-rose-400" />}
      {variant === 'pending' && <Clock size={11} className="text-amber-400" />}
      {variant === 'verified' && <ShieldCheck size={11} className="text-[#00e676]" />}
      {variant === 'suspended' && <AlertCircle size={11} className="text-amber-400" />}
      {children}
    </span>
  );
}
