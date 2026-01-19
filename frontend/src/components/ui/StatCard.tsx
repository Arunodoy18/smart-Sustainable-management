'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  value: string;
  label: string;
  icon?: LucideIcon;
  gradient?: string;
  change?: string;
  index?: number;
  className?: string;
}

export default function StatCard({ 
  value, 
  label, 
  icon: Icon,
  gradient,
  change,
  index = 0,
  className = ''
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className={`h-full text-center p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm flex flex-col items-center justify-center gap-2 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300 ${className}`}
    >
      {Icon && gradient && (
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mx-auto mb-4`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      )}
      <div className="text-4xl md:text-5xl font-bold text-white mb-2">
        {value}
      </div>
      <div className="text-sm text-gray-400">
        {label}
      </div>
      {change && (
        <span className="inline-block mt-2 text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2 py-1 rounded-lg">
          {change}
        </span>
      )}
    </motion.div>
  );
}
