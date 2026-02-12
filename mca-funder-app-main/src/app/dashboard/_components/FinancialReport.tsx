'use client';

import React, { useState, useMemo, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import ApiClient from '@/lib/api/client';
import { env } from '@/config/env';

const DEFAULT_CATEGORIES = [
  { key: 'DISBURSEMENT', label: 'Funded', defaultColor: '#f43f5e' },         // Red
  { key: 'PAYBACK', label: 'Payback', defaultColor: '#4ade80' },            // Green
  { key: 'SYNDICATION', label: 'Syndication', defaultColor: '#6366f1' },    // Indigo
  { key: 'PAYOUT', label: 'Payout', defaultColor: '#f59e42' },              // Orange
  { key: 'COMMISSION', label: 'Commission', defaultColor: '#a21caf' },      // Purple
  { key: 'EXPENSE', label: 'Other Expenses', defaultColor: '#14b8a6' },     // Teal
  { key: 'CREDIT', label: 'Credit Back', defaultColor: '#facc15' },         // Yellow
  { key: 'FUNDER_DEPOSIT', label: 'Funder Deposit', defaultColor: '#0ea5e9' }, // Sky Blue
  { key: 'FUNDER_WITHDRAW', label: 'Funder Withdrawal', defaultColor: '#eab308' }, // Amber
  { key: 'SYNDICATOR_DEPOSIT', label: 'Syndicator Deposit', defaultColor: '#8b5cf6' }, // Violet
  { key: 'SYNDICATOR_WITHDRAW', label: 'Syndicator Withdrawal', defaultColor: '#ef4444' }, // Rose
];

function getLast12MonthsMockData() {
  const now = new Date();
  const data = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const period = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
    data.push({
      period,
      DISBURSEMENT: -Math.round(Math.random() * 20000 + 5000),
      PAYBACK: Math.round(Math.random() * 40000 + 10000),
      SYNDICATION: Math.round(Math.random() * 5000 + 1000),
      PAYOUT: -Math.round(Math.random() * 5000 + 1000),
      COMMISSION: -Math.round(Math.random() * 15000 + 3000),
      EXPENSE: -Math.round(Math.random() * 2000 + 200),
      CREDIT: -Math.round(Math.random() * 2000 + 200),
      FUNDER_DEPOSIT: Math.round(Math.random() * 2000 + 200),
      FUNDER_WITHDRAW: -Math.round(Math.random() * 2000 + 200),
      SYNDICATOR_DEPOSIT: Math.round(Math.random() * 2000 + 200),
      SYNDICATOR_WITHDRAW: -Math.round(Math.random() * 2000 + 200),
    });
  }
  return data;
}

const COLOR_KEY = 'financialReportCategoryColors';

function getStoredColors() {
  try { return JSON.parse(localStorage.getItem(COLOR_KEY) || '{}'); } catch { return {}; }
}

const PREDEFINED_RANGES = [
  { label: 'Last 7 days', value: 'last7' },
  { label: 'Last 4 weeks', value: 'last4w' },
  { label: 'Last 3 months', value: 'last3m' },
  { label: 'Last 12 months', value: 'last12m' },
  { label: 'Month to date', value: 'mtd' },
  { label: 'Quarter to date', value: 'qtd' },
  { label: 'Year to date', value: 'ytd' },
  { label: 'Custom', value: 'custom' },
];

const AGGREGATIONS = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
];

function getTodayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function FinancialReport() {
  // Toolbar state
  const [range, setRange] = useState('last12m');
  const [aggregation, setAggregation] = useState('month');
  const [customStart, setCustomStart] = useState('2024-01-01');
  const [customEnd, setCustomEnd] = useState(getTodayISO());
  const [showLabels, setShowLabels] = useState(true);

  // Chart state
  const [categories, setCategories] = useState(() =>
    DEFAULT_CATEGORIES.map(cat => ({
      ...cat,
      color: getStoredColors()[cat.key] || cat.defaultColor,
      visible: [
        'DISBURSEMENT',
        'PAYBACK',
        'SYNDICATION',
        'PAYOUT',
        'COMMISSION',
        'EXPENSE',
      ].includes(cat.key),
    }))
  );
  const [data, setData] = useState(getLast12MonthsMockData() as Array<{
    period: string;
    DISBURSEMENT: number;
    PAYBACK: number;
    SYNDICATION: number;
    PAYOUT: number;
    COMMISSION: number;
    EXPENSE: number;
    CREDIT: number;
    FUNDER_DEPOSIT: number;
    FUNDER_WITHDRAW: number;
    SYNDICATOR_DEPOSIT: number;
    SYNDICATOR_WITHDRAW: number;  
    [key: string]: string | number;
  }>);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const query = new URLSearchParams();
        query.set('startDate', customStart);
        query.set('endDate', customEnd);
        query.set('aggregation', aggregation);
        if (categories.filter(c => c.visible).length > 0) {
          categories.filter(c => c.visible).forEach(cat => query.append('categories', cat.key));
        }
        const endpoint = `${env.api.endpoints.dashboard.financialReport}?${query.toString()}`;
        const json = await ApiClient.get<{data: typeof data}>(endpoint);
        setData(json.data);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Unknown error');
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [customStart, customEnd, aggregation, categories]);

  // Calculate start and end date based on range
  useEffect(() => {    
    const today = new Date();
    const todayISO = today.toISOString().slice(0, 10);
    
    if (range !== 'custom') {
        switch (range) {
        case 'last7':
            const last7Days = new Date(today);
            last7Days.setDate(today.getDate() - 7);
            setCustomStart(last7Days.toISOString().slice(0, 10));
            setCustomEnd(todayISO);
            break;
            
        case 'last4w':
            const last4Weeks = new Date(today);
            last4Weeks.setDate(today.getDate() - 28);
            setCustomStart(last4Weeks.toISOString().slice(0, 10));
            setCustomEnd(todayISO);
            break;
            
        case 'last3m':
            const last3Months = new Date(today);
            last3Months.setMonth(today.getMonth() - 3);
            setCustomStart(last3Months.toISOString().slice(0, 10));
            setCustomEnd(todayISO);
            break;
            
        case 'last12m':
            const last12Months = new Date(today);
            last12Months.setMonth(today.getMonth() - 12);
            setCustomStart(last12Months.toISOString().slice(0, 10));
            setCustomEnd(todayISO);
            break;
            
        case 'mtd':
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            setCustomStart(monthStart.toISOString().slice(0, 10));
            setCustomEnd(todayISO);
            break;
            
        case 'qtd':
            const quarter = Math.floor(today.getMonth() / 3);
            const quarterStart = new Date(today.getFullYear(), quarter * 3, 1);
            setCustomStart(quarterStart.toISOString().slice(0, 10));
            setCustomEnd(todayISO);
            break;
            
        case 'ytd':
            const yearStart = new Date(today.getFullYear(), 0, 1);
            setCustomStart(yearStart.toISOString().slice(0, 10));
            setCustomEnd(todayISO);
            break;
            
        default:
            break;
        }
    }
  }, [range]);

  // Handle legend toggle (from ECharts)
  const handleLegendSelectChanged = (params: { selected: Record<string, boolean> }) => {
    const selected = params.selected;
    setCategories(categories =>
      categories.map(cat => ({
        ...cat,
        visible: selected[cat.label] !== false,
      }))
    );
  };

  // --- ECharts Option ---
  const chartOption = useMemo(() => {
    // Always use all categories for the legend and series, but only show data for visible ones
    const series = categories.map(cat => ({
      name: cat.label,
      type: 'bar',
      stack: 'total',
      emphasis: { focus: 'series' },
      itemStyle: { color: cat.color },
      data: data.map((d: { [key: string]: string | number }) => d[cat.key] ?? 0),
      label: {
        show: showLabels,
        position: 'inside',
        formatter: (params: unknown) => {
          if (params && typeof (params as { value?: unknown }).value === 'number' && (params as { value: number }).value !== 0) {
            return (params as { value: number }).value.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
          }
          return '';
        },
      },
      // Hide series if not visible
      visible: cat.visible,
      // ECharts uses 'selected' in legend, not in series, so we control visibility via legend.selected
    }));

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        valueFormatter: (value: number) =>
          value.toLocaleString(undefined, { style: 'currency', currency: 'USD' }),
      },
      legend: {
        data: categories.map(c => c.label), // Always all categories
        bottom: 0,
        selected: Object.fromEntries(categories.map(c => [c.label, c.visible])),
      },
      grid: { left: 40, right: 20, top: 40, bottom: 60 },
      xAxis: {
        type: 'category',
        data: data.map(d => d.period),
        axisLabel: { rotate: 0 },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) =>
            value.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
        },
      },
      series, // Always show all series, ECharts will handle visibility
    };
  }, [categories, data, showLabels]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Financial Report</h2>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <div>
          <select
            className="border rounded px-2 py-1"
            value={range}
            onChange={e => setRange(e.target.value)}
          >
            {PREDEFINED_RANGES.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        {range === 'custom' && (
          <>
            <div>
              <input
                type="date"
                className="border rounded px-2 py-1"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                max={customEnd}
              />
            </div>
            <div>
              <input
                type="date"
                className="border rounded px-2 py-1"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                min={customStart}
                max={getTodayISO()}
              />
            </div>
          </>
        )}
        <div>
          <select
            className="border rounded px-2 py-1"
            value={aggregation}
            onChange={e => setAggregation(e.target.value)}
          >
            {AGGREGATIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300 ${showLabels ? 'bg-blue-600' : 'bg-gray-200'}`}
            onClick={() => setShowLabels(v => !v)}
            aria-pressed={showLabels}
            aria-label="Toggle labels"
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${showLabels ? 'translate-x-3.5' : 'translate-x-0.5'}`}
            />
          </button>
          <label className="block text-xs font-medium text-gray-600 mb-0">Labels</label>
        </div>
      </div>
      {/* Chart */}
      <div style={{ width: '100%', height: 400 }}>
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-500">Loading...</div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-red-500">{error}</div>
        ) : (
          <ReactECharts
            option={chartOption}
            style={{ width: '100%', height: 400 }}
            onEvents={{
              legendselectchanged: handleLegendSelectChanged,
            }}
          />
        )}
      </div>
    </div>
  );
} 