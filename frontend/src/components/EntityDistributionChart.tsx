import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';

interface EntityDistributionChartProps {
  distribution: Record<string, number>;
}

const COLORS: Record<string, string> = {
  'ORGANIZATION': '#3B82F6',
  'ORG': '#3B82F6',
  'PERSON': '#10B981',
  'LOCATION (GPE)': '#8B5CF6',
  'LOCATION': '#8B5CF6',
  'GPE': '#8B5CF6',
  'MONEY': '#F59E0B',
  'PERCENT': '#F59E0B',
  'PRODUCT': '#EC4899',
  'EVENT': '#6366F1',
  'DATE': '#14B8A6',
  'TIME': '#06B6D4',
  'DEFAULT': '#64748B'
};

export const EntityDistributionChart: React.FC<EntityDistributionChartProps> = ({ distribution }) => {
  const data = Object.entries(distribution).map(([label, count]) => ({
    name: label,
    count: count
  })).sort((a, b) => b.count - a.count);

  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-500 text-xs">
        No named entities identified.
      </div>
    );
  }

  return (
    <div className="w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
          <XAxis type="number" stroke="#64748b" fontSize={11} />
          <YAxis 
            dataKey="name" 
            type="category" 
            stroke="#94a3b8" 
            fontSize={11} 
            width={110}
            tickFormatter={(val) => val.length > 15 ? val.substring(0, 15) + '...' : val}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
            itemStyle={{ color: '#38bdf8' }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name] || COLORS.DEFAULT} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
