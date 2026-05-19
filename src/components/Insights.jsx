import React, { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownLeft, Target, Award, AlertCircle, Calendar, Plus, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';

const Insights = ({ transactions }) => {
  const getCurrentMonth = () => new Date().toISOString().slice(0, 7);
  
  // State for manual month comparison
  const [comparisonMonths, setComparisonMonths] = useState([getCurrentMonth()]);

  // 1. Group all data by month
  const allMonthlyData = useMemo(() => {
    const groups = {};
    transactions.forEach(t => {
      const month = t.date.slice(0, 7);
      if (!groups[month]) groups[month] = { month, income: 0, expense: 0, count: 0 };
      if (t.type === 'income') groups[month].income += Number(t.amount);
      else groups[month].expense += Number(t.amount);
      groups[month].count += 1;
    });
    return groups;
  }, [transactions]);

  // 2. Data for the manual comparison chart
  const comparisonData = useMemo(() => {
    return comparisonMonths.map(m => {
      return allMonthlyData[m] || { month: m, income: 0, expense: 0, count: 0 };
    }).sort((a, b) => a.month.localeCompare(b.month));
  }, [comparisonMonths, allMonthlyData]);

  const addMonth = (e) => {
    const val = e.target.value;
    if (val && !comparisonMonths.includes(val) && comparisonMonths.length < 3) {
      setComparisonMonths([...comparisonMonths, val]);
    }
  };

  const removeMonth = (month) => {
    if (comparisonMonths.length > 1) {
      setComparisonMonths(comparisonMonths.filter(m => m !== month));
    }
  };

  // 3. Category Breakdown for selected months
  const categoryComparison = useMemo(() => {
    const catData = {};
    transactions.filter(t => t.type === 'expense' && comparisonMonths.includes(t.date.slice(0, 7))).forEach(t => {
      const month = t.date.slice(0, 7);
      if (!catData[t.category]) catData[t.category] = {};
      if (!catData[t.category][month]) catData[t.category][month] = 0;
      catData[t.category][month] += Number(t.amount);
    });
    return Object.entries(catData).map(([name, months]) => ({ name, ...months }));
  }, [transactions, comparisonMonths]);

  const COLORS = ['#D4AF37', '#1E293B', '#10B981', '#EF4444', '#8B5CF6'];

  return (
    <div className="animate-fade-in">
      <header className="page-header mb-xl">
        <div>
          <h1 className="page-title">Analysis & Compare</h1>
          <p className="text-secondary">Select up to 3 months to compare your financial performance side-by-side.</p>
        </div>
      </header>

      {/* Month Selector Bar */}
      <div className="glass-panel mb-lg" style={{ padding: '16px' }}>
        <div className="flex-between flex-wrap gap-md">
          <div className="flex-center gap-sm">
            <Calendar size={18} className="text-gold" />
            <span style={{ fontWeight: '700', fontSize: '0.85rem' }}>COMPARE MONTHS:</span>
            <div className="flex-center gap-xs">
              {comparisonMonths.map(m => (
                <div key={m} className="badge badge-gold flex-center gap-xs" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
                  {m}
                  <X size={12} style={{ cursor: 'pointer' }} onClick={() => removeMonth(m)} />
                </div>
              ))}
              {comparisonMonths.length < 3 && (
                <input 
                  type="month" 
                  className="form-control" 
                  style={{ width: '130px', padding: '4px 8px', height: '28px', fontSize: '0.8rem' }} 
                  onChange={addMonth} 
                />
              )}
            </div>
          </div>
          <p className="text-secondary" style={{ fontSize: '0.75rem' }}>Tip: Compare your salary months vs high-expense months.</p>
        </div>
      </div>

      <div className="analytics-grid mb-lg">
        {/* Main Comparison Chart */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 className="section-title" style={{ fontSize: '0.9rem' }}>Side-by-Side Performance</h3>
          <div style={{ height: '300px', width: '100%', marginTop: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: '700' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <Tooltip 
                  cursor={{ fill: 'var(--bg-tertiary)' }}
                  contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value) => `Rs.${value.toLocaleString()}`}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} />
                <Bar dataKey="income" name="Income" fill="var(--accent-success)" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar dataKey="expense" name="Expense" fill="var(--accent-danger)" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Breakdown Table */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 className="section-title" style={{ fontSize: '0.9rem' }}>Category Comparison</h3>
          <div className="scrollable-area" style={{ maxHeight: '300px', marginTop: '10px' }}>
            <table className="cashflow-table" style={{ fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th>Category</th>
                  {comparisonMonths.sort().map(m => <th key={m} style={{ textAlign: 'right' }}>{m.split('-')[1]}/{m.split('-')[0].slice(2)}</th>)}
                </tr>
              </thead>
              <tbody>
                {categoryComparison.map(cat => (
                  <tr key={cat.name}>
                    <td style={{ fontWeight: '600' }}>{cat.name}</td>
                    {comparisonMonths.sort().map(m => (
                      <td key={m} style={{ textAlign: 'right' }}>
                        {cat[m] ? `Rs.${cat[m].toLocaleString()}` : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Efficiency Comparison */}
      <div className="summary-grid mb-lg">
        {comparisonData.map(d => {
          const savings = d.income > 0 ? Math.round((1 - d.expense / d.income) * 100) : 0;
          return (
            <div key={d.month} className="glass-panel summary-card" style={{ padding: '16px' }}>
               <p className="card-label">{d.month} Efficiency</p>
               <h4 style={{ fontSize: '1.25rem', fontWeight: '800' }}>{savings}% <span style={{ fontSize: '0.75rem', fontWeight: '400', color: 'var(--text-secondary)' }}>Saved</span></h4>
               <div className="progress-bar-bg" style={{ marginTop: '8px' }}>
                  <div className="progress-bar" style={{ width: `${Math.max(0, savings)}%`, backgroundColor: savings > 20 ? 'var(--accent-success)' : 'var(--gold-primary)' }}></div>
               </div>
            </div>
          );
        })}
      </div>

      <div className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid var(--gold-primary)' }}>
        <div className="flex-center gap-sm" style={{ justifyContent: 'flex-start' }}>
          <AlertCircle size={16} className="text-gold" />
          <h4 style={{ fontSize: '0.85rem', fontWeight: '700' }}>Comparison Insight</h4>
        </div>
        <p className="text-secondary mt-sm" style={{ fontSize: '0.85rem' }}>
          Comparing these periods helps identify seasonal trends. If your <strong>Efficiency</strong> fluctuates significantly, check the <strong>Category Comparison</strong> table above to see which specific cost (like Fuel or Rent) changed between those months.
        </p>
      </div>
    </div>
  );
};

export default Insights;
