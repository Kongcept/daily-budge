import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, Plus, X, CreditCard, ArrowUpRight, ArrowDownLeft, Tag, AlignLeft, Trash2, Edit2, Droplet, Wallet, RefreshCw, PieChart as PieIcon, BarChart3, Clock, Check, ChevronRight, Zap, ChevronLeft } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import './Dashboard.css';

const Dashboard = ({ transactions, loans, plannedPayments = [], onAddTransaction, onDeleteTransaction, onUpdateTransaction, onAddLoan, onDeleteLoan, onUpdateLoan, onMarkPaidPlanned, onSwitchTab }) => {
  const [showTransModal, setShowTransModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [editingTransId, setEditingTransId] = useState(null);
  const [editingLoanId, setEditingLoanId] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null); // { planned, payAmount }
  const scrollRef = useRef(null);
  
  const getTodayDate = () => new Date().toISOString().split('T')[0];
  const today = getTodayDate();

  const commonCategories = {
    expense: ['Food', 'Fuel', 'Rent', 'Bills', 'Phone/WiFi', 'Transport', 'Shopping', 'Health', 'Other'],
    income: ['Salary', 'Freelance', 'Business', 'Gift', 'Interest', 'Other']
  };

  const [transFormData, setTransFormData] = useState({
    type: 'expense', amount: '', category: '', description: '', pricePerLiter: '', liters: '', date: today
  });

  const [loanFormData, setLoanFormData] = useState({
    name: '', principal: '', interest: '', dueDate: today, type: 'fixed'
  });

  const todayStats = transactions.reduce((acc, t) => {
    if (t.date === today) {
      if (t.type === 'income') acc.income += Number(t.amount);
      else acc.expense += Number(t.amount);
    }
    return acc;
  }, { income: 0, expense: 0 });

  const categoryData = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const existing = acc.find(item => item.name === t.category);
      if (existing) existing.value += Number(t.amount);
      else acc.push({ name: t.category, value: Number(t.amount) });
      return acc;
    }, []);

  const COLORS = ['#D4AF37', '#1E293B', '#10B981', '#EF4444', '#8B5CF6', '#334155', '#F1D279'];

  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const trendData = last7Days.map(date => {
    const income = transactions.filter(t => t.date === date && t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = transactions.filter(t => t.date === date && t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
    return { date: date.slice(5), income, expense };
  });

  const getDaysRemaining = (date) => {
    const diff = new Date(date) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const totalPlannedAmount = plannedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const sortedPlanned = [...plannedPayments].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - 300 : scrollLeft + 300;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (transFormData.category === 'Fuel' && transFormData.amount && transFormData.pricePerLiter) {
      const calculatedLiters = (Number(transFormData.amount) / Number(transFormData.pricePerLiter)).toFixed(2);
      setTransFormData(prev => ({ ...prev, liters: calculatedLiters }));
    }
  }, [transFormData.amount, transFormData.pricePerLiter, transFormData.category]);

  const balance = transactions.reduce((sum, t) => sum + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0);
  const remainingLoanBalance = loans.reduce((sum, l) => sum + (Number(l.principal) - Number(l.paid)), 0);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyFuelLiters = transactions.filter(t => t.category === 'Fuel' && t.date.startsWith(currentMonth)).reduce((sum, t) => sum + Number(t.liters || 0), 0);

  const handleTransSubmit = (e) => {
    e.preventDefault();
    if (editingTransId) onUpdateTransaction(editingTransId, transFormData);
    else onAddTransaction(transFormData);
    setShowTransModal(false);
    setEditingTransId(null);
    setTransFormData({ type: 'expense', amount: '', category: '', description: '', pricePerLiter: '', liters: '', date: today });
  };

  const handleLoanSubmit = (e) => {
    e.preventDefault();
    if (editingLoanId) onUpdateLoan(editingLoanId, loanFormData);
    else onAddLoan(loanFormData);
    setShowLoanModal(false);
    setEditingLoanId(null);
    setLoanFormData({ name: '', principal: '', interest: '', dueDate: today, type: 'fixed' });
  };

  const openEditTrans = (t) => {
    setEditingTransId(t.id);
    setTransFormData({ type: t.type, amount: t.amount, category: t.category, description: t.description || '', pricePerLiter: t.pricePerLiter || '', liters: t.liters || '', date: t.date });
    setShowTransModal(true);
  };

  const openEditLoan = (l) => {
    setEditingLoanId(l.id);
    setLoanFormData({ name: l.name, principal: l.principal, interest: l.interest, dueDate: l.dueDate, type: l.type || 'fixed' });
    setShowLoanModal(true);
  };

  const openPaymentModal = (p) => {
    setPaymentModal({ planned: p, payAmount: String(p.amount) });
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (!paymentModal) return;
    const { planned, payAmount } = paymentModal;
    const paidAmt = Number(payAmount);
    const fullAmt = Number(planned.amount);
    if (paidAmt <= 0) return;
    // Always log the expense transaction
    onAddTransaction({
      type: 'expense',
      amount: paidAmt,
      category: planned.category || 'Bills',
      description: `${paidAmt < fullAmt ? 'Partial payment' : 'Payment'}: ${planned.name}`,
      date: today
    });
    // Only mark as fully paid if full amount (or more) is paid
    if (paidAmt >= fullAmt) {
      onMarkPaidPlanned(planned, true); // pass true = skip transaction logging (already done)
    }
    setPaymentModal(null);
  };

  return (
    <div className="dashboard animate-fade-in">
      <header className="dashboard-header flex-between mb-xl">
        <div><h1 className="page-title">Daily Summary</h1><p className="text-secondary">Managing your finances in Sri Lankan Rupees (LKR).</p></div>
        <div className="header-actions flex-center gap-md">
          <button className="btn btn-ghost" onClick={() => setShowLoanModal(true)}><CreditCard size={18} /> Add Loan</button>
          <button className="btn btn-primary" onClick={() => setShowTransModal(true)}><Plus size={18} /> Add Transaction</button>
        </div>
      </header>

      <div className="glass-panel mb-xl flex-between flex-wrap" style={{ padding: '14px 24px', background: 'var(--slate-dark)', border: 'none' }}>
        <div className="flex-center gap-md">
           <div className="badge badge-gold" style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Zap size={20} fill="white" /></div>
           <div>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Daily Pulse</p>
              <h3 style={{ color: 'white', fontWeight: '800' }}>{today}</h3>
           </div>
        </div>
        <div className="flex-center gap-xl">
           <div style={{ textAlign: 'right' }}>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' }}>Income Today</p>
              <p style={{ color: '#10B981', fontWeight: '800', fontSize: '1.1rem' }}>+ Rs.{todayStats.income.toLocaleString()}</p>
           </div>
           <div style={{ textAlign: 'right' }}>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' }}>Cost Today</p>
              <p style={{ color: '#EF4444', fontWeight: '800', fontSize: '1.1rem' }}>- Rs.{todayStats.expense.toLocaleString()}</p>
           </div>
           <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.1)' }}></div>
           <div style={{ textAlign: 'right' }}>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' }}>Daily Net</p>
              <p style={{ color: 'var(--gold-primary)', fontWeight: '800', fontSize: '1.1rem' }}>Rs.{(todayStats.income - todayStats.expense).toLocaleString()}</p>
           </div>
        </div>
      </div>

      <div className="summary-grid mb-xl">
        <div className="glass-panel summary-card"><p className="card-label">Net Balance</p><h2 className="card-value">Rs.{balance.toLocaleString()}</h2><div className="card-trend success"><TrendingUp size={14} /> <span>Live Cash</span></div></div>
        <div className="glass-panel summary-card"><p className="card-label">Total Debt</p><h2 className="card-value" style={{ color: 'var(--accent-danger)' }}>Rs.{remainingLoanBalance.toLocaleString()}</h2><div className="card-trend" style={{ color: 'var(--text-tertiary)' }}><Wallet size={14} /> <span>Payable</span></div></div>
        <div className="glass-panel summary-card"><p className="card-label">Fuel (Month)</p><h2 className="card-value" style={{ color: 'var(--gold-primary)' }}>{monthlyFuelLiters.toFixed(1)} L</h2><div className="card-trend teal-text"><Droplet size={14} /> <span>Tracked</span></div></div>
      </div>

      {plannedPayments.length > 0 && (
        <div className="glass-panel mb-xl" style={{ padding: '16px 24px', borderLeft: '4px solid var(--gold-primary)', position: 'relative' }}>
          <div className="flex-between mb-md">
            <div className="flex-center gap-sm">
               <h3 className="section-title" style={{ margin: 0, fontSize: '0.9rem' }}><Clock size={16} /> Upcoming Obligations</h3>
               <span className="badge badge-gold" style={{ cursor: 'pointer' }} onClick={() => onSwitchTab('planner')}>{plannedPayments.length} Pending <ChevronRight size={12}/></span>
            </div>
            <div className="flex-center gap-lg">
               <div style={{ textAlign: 'right' }}><p className="card-label" style={{ marginBottom: 0 }}>Total Needed</p><h4 style={{ fontWeight: '800', color: 'var(--slate-dark)' }}>Rs.{totalPlannedAmount.toLocaleString()}</h4></div>
               <div className="flex-center gap-xs">
                  <button className="btn-icon-small" onClick={() => scroll('left')}><ChevronLeft size={16}/></button>
                  <button className="btn-icon-small" onClick={() => scroll('right')}><ChevronRight size={16}/></button>
               </div>
            </div>
          </div>
          <div 
            ref={scrollRef}
            className="flex-center gap-md scroll-hidden" 
            style={{ overflowX: 'auto', paddingBottom: '4px', justifyContent: 'flex-start' }}
          >
            {sortedPlanned.map(p => {
              const daysLeft = getDaysRemaining(p.dueDate);
              const isOverdue = daysLeft < 0;
              const cardCount = sortedPlanned.length;
              
              return (
                <div 
                  key={p.id} 
                  className="flex-between gap-md" 
                  style={{ 
                    padding: '10px 14px', 
                    background: 'var(--bg-primary)', 
                    borderRadius: '10px', 
                    flexShrink: 0, 
                    border: '1px solid var(--border-color)',
                    // Auto-adjust logic: 
                    // If < 5 items: grow to fill space (flex: 1)
                    // If >= 5 items: lock width to exactly 1/5th of container minus gaps
                    flex: cardCount < 5 ? '1 1 0' : '0 0 calc((100% - 64px) / 5)',
                    minWidth: cardCount < 5 ? '180px' : '0'
                  }}
                >
                  <div className="flex-center gap-md" style={{ overflow: 'hidden' }}>
                    <div className={`badge ${isOverdue ? 'badge-danger' : 'badge-gold'}`} style={{ minWidth: '38px', height: '38px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: '800' }}>
                      {isOverdue ? '!' : `${daysLeft}D`}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <p style={{ fontWeight: '700', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                      <p className="text-secondary" style={{ fontSize: '0.68rem', whiteSpace: 'nowrap' }}>Rs.{Number(p.amount).toLocaleString()}</p>
                    </div>
                  </div>
                  <button className="btn btn-success" style={{ padding: '6px', minWidth: '30px', height: '30px', borderRadius: '50%', flexShrink: 0 }} onClick={() => openPaymentModal(p)} title="Pay Obligation"><Check size={14} /></button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="analytics-grid mb-xl">
        <div className="glass-panel" style={{ padding: '20px' }}><h3 className="section-title"><PieIcon size={16} /> Spending Breakdown</h3><div style={{ height: '240px', width: '100%' }}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">{categoryData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip formatter={(value) => `Rs.${value.toLocaleString()}`} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} /></PieChart></ResponsiveContainer></div><div className="flex-center gap-md flex-wrap" style={{ marginTop: '10px' }}>{categoryData.map((entry, index) => (<div key={entry.name} className="flex-center gap-xs" style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length] }}></div>{entry.name}</div>))}</div></div>
        <div className="glass-panel" style={{ padding: '20px' }}><h3 className="section-title"><BarChart3 size={16} /> 7-Day Trend</h3><div style={{ height: '240px', width: '100%' }}><ResponsiveContainer width="100%" height="100%"><BarChart data={trendData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" /><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} /><Tooltip cursor={{ fill: 'var(--bg-tertiary)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(value) => `Rs.${value.toLocaleString()}`} /><Bar dataKey="income" fill="#10B981" radius={[3, 3, 0, 0]} barSize={12} /><Bar dataKey="expense" fill="#EF4444" radius={[3, 3, 0, 0]} barSize={12} /></BarChart></ResponsiveContainer></div></div>
      </div>

      <div className="loan-grid">
        <div className="glass-panel" style={{ padding: '20px' }}><h3 className="section-title">Recent Activity</h3><div className="activity-list scrollable-area" style={{ maxHeight: '350px' }}>{transactions.slice().reverse().map((t, idx) => { const isIncome = t.type === 'income'; const typeColor = isIncome ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)'; const borderColor = isIncome ? '#10B981' : '#EF4444'; return (<div key={t.id} className="activity-item flex-between" style={{ padding: '10px 14px', marginBottom: '6px', borderRadius: '8px', background: typeColor, borderLeft: `4px solid ${borderColor}` }}><div style={{ flex: 1 }}><p style={{ fontWeight: '700', fontSize: '0.8rem', color: 'var(--slate-dark)' }}>{t.category} {t.liters && <span className="badge badge-gold" style={{ marginLeft: '6px' }}>{t.liters}L</span>}</p><p className="text-secondary" style={{ fontSize: '0.7rem' }}>{t.date} {t.description && `• ${t.description}`}</p></div><div className="flex-center gap-md"><div style={{ fontWeight: '800', fontSize: '0.85rem', textAlign: 'right', color: isIncome ? 'var(--accent-success)' : 'var(--accent-danger)' }}>{isIncome ? '+' : '-'}Rs.{Number(t.amount).toLocaleString()}</div><div className="item-actions"><button className="btn-icon-small" onClick={() => openEditTrans(t)}><Edit2 size={11}/></button><button className="btn-icon-small danger" onClick={() => { if(window.confirm('Delete entry?')) onDeleteTransaction(t.id); }}><Trash2 size={11}/></button></div></div></div>); })}</div></div>
        <div className="glass-panel" style={{ padding: '20px' }}><h3 className="section-title">Active Loans</h3><div className="loan-summary-list scrollable-area" style={{ maxHeight: '350px' }}>{loans.map(loan => { const remaining = loan.principal - loan.paid; const progress = (loan.paid / loan.principal) * 100; const isFlexible = loan.type === 'flexible'; return (<div key={loan.id} className="activity-item mb-md" style={{ padding: '10px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}><div className="flex-between mb-xs"><div><span style={{ fontWeight: '700', fontSize: '0.8rem', display: 'block' }}>{loan.name}</span><span style={{ fontSize: '0.72rem', color: 'var(--accent-danger)', fontWeight: '600' }}>Rs.{remaining.toLocaleString()}</span></div><div className="flex-center gap-xs"><div className="item-actions"><button className="btn-icon-small" onClick={() => openEditLoan(loan)}><Edit2 size={10}/></button><button className="btn-icon-small danger" onClick={() => { if(window.confirm('Delete loan?')) onDeleteLoan(loan.id); }}><Trash2 size={10}/></button></div><span className={`badge ${isFlexible ? 'badge-gold' : 'badge-violet'}`} style={{ fontSize: '0.6rem' }}>{isFlexible ? 'Flex' : `${Math.round(progress)}%`}</span></div></div>{!isFlexible && <div className="progress-bar-bg" style={{ height: '4px' }}><div className="progress-bar teal" style={{ width: `${progress}%` }}></div></div>}</div>); })}</div></div>
      </div>

      {/* Payment Modal for Upcoming Obligations */}
      {paymentModal && (
        <div className="modal-overlay" style={{ zIndex: 3000 }}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '400px' }}>
            <div className="flex-between mb-lg">
              <div>
                <h3 style={{ marginBottom: '4px' }}>Pay Obligation</h3>
                <p className="text-secondary" style={{ fontSize: '0.8rem' }}>{paymentModal.planned.name}</p>
              </div>
              <button className="btn-ghost" style={{ padding: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer' }} onClick={() => setPaymentModal(null)}><X size={20}/></button>
            </div>

            {/* Summary Card */}
            <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '16px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
              <div className="flex-between mb-xs">
                <span className="text-secondary" style={{ fontSize: '0.75rem' }}>Category</span>
                <span className="badge badge-violet" style={{ fontSize: '0.65rem' }}>{paymentModal.planned.category}</span>
              </div>
              <div className="flex-between mb-xs">
                <span className="text-secondary" style={{ fontSize: '0.75rem' }}>Due Date</span>
                <span style={{ fontWeight: '700', fontSize: '0.8rem' }}>{paymentModal.planned.dueDate}</span>
              </div>
              <div className="flex-between">
                <span className="text-secondary" style={{ fontSize: '0.75rem' }}>Full Amount</span>
                <span style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--slate-dark)' }}>Rs.{Number(paymentModal.planned.amount).toLocaleString()}</span>
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit}>
              <div className="form-group">
                <label className="form-label">Payment Amount (Rs.)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  style={{ fontSize: '1.1rem', fontWeight: '700', textAlign: 'center' }}
                  value={paymentModal.payAmount}
                  onChange={e => setPaymentModal({ ...paymentModal, payAmount: e.target.value })}
                  min="1"
                  required
                  autoFocus
                />
                {Number(paymentModal.payAmount) < Number(paymentModal.planned.amount) && Number(paymentModal.payAmount) > 0 && (
                  <p style={{ fontSize: '0.72rem', color: 'var(--accent-danger)', marginTop: '6px', fontWeight: '600' }}>
                    ⚠ Partial payment — obligation stays in planner. Remaining: Rs.{(Number(paymentModal.planned.amount) - Number(paymentModal.payAmount)).toLocaleString()}
                  </p>
                )}
                {Number(paymentModal.payAmount) >= Number(paymentModal.planned.amount) && Number(paymentModal.payAmount) > 0 && (
                  <p style={{ fontSize: '0.72rem', color: 'var(--accent-success)', marginTop: '6px', fontWeight: '600' }}>
                    ✓ Full payment — obligation will be marked as complete.
                  </p>
                )}
              </div>
              <div className="flex-center gap-md" style={{ marginTop: '16px' }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setPaymentModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-success" style={{ flex: 2 }}>
                  <Check size={16} /> Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {showTransModal && (
        <div className="modal-overlay"><div className="modal-content animate-fade-in" style={{ maxWidth: '440px' }}><div className="flex-between mb-lg"><h3>{editingTransId ? 'Edit Entry' : 'Quick Entry'}</h3><button className="btn-ghost" onClick={() => { setShowTransModal(false); setEditingTransId(null); }}><X size={20}/></button></div>
            <form onSubmit={handleTransSubmit}><div className="form-group"><label className="form-label">Type</label><div className="type-toggle-group"><label className={`type-toggle-btn ${transFormData.type === 'expense' ? 'active expense' : ''}`}><input type="radio" checked={transFormData.type === 'expense'} onChange={() => setTransFormData({...transFormData, type: 'expense'})} /><ArrowDownLeft size={16} /> Expense</label><label className={`type-toggle-btn ${transFormData.type === 'income' ? 'active income' : ''}`}><input type="radio" checked={transFormData.type === 'income'} onChange={() => setTransFormData({...transFormData, type: 'income'})} /><ArrowUpRight size={16} /> Income</label></div></div>
              <div className="form-group"><label className="form-label"><Tag size={12} style={{ marginRight: '4px' }} /> Categories</label><div className="category-chips">{commonCategories[transFormData.type].map(cat => (<button key={cat} type="button" className={`chip ${transFormData.category === cat ? 'active' : ''}`} onClick={() => setTransFormData({...transFormData, category: cat})}>{cat}</button>))}</div><input type="text" className="form-control" placeholder="Or custom..." style={{ marginTop: '8px' }} value={transFormData.category} onChange={e => setTransFormData({...transFormData, category: e.target.value})} required /></div>
              <div className="form-group"><label className="form-label">Total Amount (Rs.)</label><input type="number" className="form-control" placeholder="0.00" value={transFormData.amount} onChange={e => setTransFormData({...transFormData, amount: e.target.value})} required /></div>
              {transFormData.category === 'Fuel' && (<div className="glass-panel" style={{ padding: '12px', marginBottom: '14px', backgroundColor: 'var(--bg-tertiary)' }}><div className="flex-between mb-xs"><label className="form-label" style={{ marginBottom: 0 }}>Price/L (Rs.)</label>{transFormData.liters && <span className="badge badge-gold">{transFormData.liters}L</span>}</div><input type="number" step="0.01" className="form-control" placeholder="e.g. 370.00" value={transFormData.pricePerLiter} onChange={e => setTransFormData({...transFormData, pricePerLiter: e.target.value})} /></div>)}
              <div className="form-group"><label className="form-label"><AlignLeft size={12} style={{ marginRight: '4px' }} /> Description</label><input type="text" className="form-control" placeholder="Note..." value={transFormData.description} onChange={e => setTransFormData({...transFormData, description: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-control" value={transFormData.date} onChange={e => setTransFormData({...transFormData, date: e.target.value})} required /></div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>{editingTransId ? 'Update' : 'Save'}</button></form></div></div>
      )}
    </div>
  );
};

export default Dashboard;
