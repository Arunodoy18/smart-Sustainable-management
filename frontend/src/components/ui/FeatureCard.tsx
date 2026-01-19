'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
  index?: number;
}

export default function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  gradient,
  index = 0 
}: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group"
    >
      <div className="h-full bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-sm hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300 hover:scale-105">
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} p-3.5 mb-6 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-full h-full text-white" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-3">
          {title}
        </h3>
        <p className="text-sm text-gray-400 leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
}
