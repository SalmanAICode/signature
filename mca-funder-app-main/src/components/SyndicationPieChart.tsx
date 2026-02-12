import React from 'react';

interface SyndicationData {
  _id: string;
  name: string;
  percentage: number;
  amount: number;
  color?: string;
}

interface SyndicationPieChartProps {
  data: SyndicationData[];
  totalAmount: number;
  className?: string;
}

const generateColors = (count: number): string[] => {
  const colors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#84CC16', // Lime
    '#EC4899', // Pink
    '#6366F1', // Indigo
  ];
  
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length]);
  }
  return result;
};

export default function SyndicationPieChart({ data, totalAmount, className = '' }: SyndicationPieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 ${className}`}>
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="mt-2 text-sm text-gray-500">No syndication data available</p>
        </div>
      </div>
    );
  }

  const colors = generateColors(data.length);
  const radius = 80;
  const centerX = 100;
  const centerY = 100;
  let currentAngle = -90; // Start from top

  const createPieSlice = (percentage: number, color: string, index: number) => {
    const angle = (percentage / 100) * 360;
    const endAngle = currentAngle + angle;
    
    const x1 = centerX + radius * Math.cos((currentAngle * Math.PI) / 180);
    const y1 = centerY + radius * Math.sin((currentAngle * Math.PI) / 180);
    const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
    const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180);
    
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');
    
    currentAngle = endAngle;
    
    return (
      <path
        key={index}
        d={pathData}
        fill={color}
        stroke="#fff"
        strokeWidth="2"
        className="transition-all duration-300 hover:opacity-80"
      />
    );
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Active Syndications</h3>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total Amount</p>
          <p className="text-lg font-semibold text-gray-800">
            ${(totalAmount / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>
      
      <div className="flex items-center justify-center mb-6">
        <svg width="200" height="200" viewBox="0 0 200 200" className="drop-shadow-lg">
          {data.map((item, index) => 
            createPieSlice(item.percentage, colors[index], index)
          )}
          {/* Center circle for better visual */}
          <circle
            cx={centerX}
            cy={centerY}
            r="20"
            fill="white"
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        </svg>
      </div>
      
      {/* Legend */}
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={item._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: colors[index] }}
              />
              <div>
                <p className="text-sm font-medium text-gray-800">{item.name}</p>
                <p className="text-xs text-gray-500">
                  ${(item.amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800">{item.percentage.toFixed(1)}%</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500">Total Syndications</p>
            <p className="text-lg font-semibold text-gray-800">{data.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Average Share</p>
            <p className="text-lg font-semibold text-gray-800">
              {(data.reduce((sum, item) => sum + item.percentage, 0) / data.length).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 