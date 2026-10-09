import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';

interface TopicChartProps {
  data: Array<{ topic: string; count: number }>;
}

const PALETTE = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', 
  '#06b6d4', '#6366f1', '#14b8a6', '#f43f5e', '#84cc16'
];

export const TopicChart: React.FC<TopicChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-52 flex items-center justify-center text-slate-500 text-xs">
        No topic distribution records available.
      </div>
    );
  }

  return (
    <div className="w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="topic"
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={75}
            paddingAngle={3}
          >
            {data.map((_, index) => (
              <Cell key={`topic-cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
