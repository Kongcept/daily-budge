import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Insights from './components/Insights';
import Planner from './components/Planner';
import Accounts from './components/Accounts';
import { db } from './db';
import { CheckCircle, Edit2, Trash2, X, RefreshCw, Plus, CreditCard, Calendar, Filter, Clock, Wallet, DollarSign, Landmark } from 'lucide-react';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notification, setNotification] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true); // Collapsed by default
  
  const getTodayDate = () => new Date().toISOString().split('T')[0];
  const getCurrentMonth = () => new Date().toISOString().slice(0, 7);

  const getDaysRemaining = (date) => {
    if (!date) return null;
    const diff = new Date(date) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // Core Data (Lazy initialization prevents accidental wipes during hot reloads)
  const [transactions, setTransactions] = useState(() => db.getTransactions());
  const [loans, setLoans] = useState(() => db.getLoans());
  const [plannedPayments, setPlannedPayments] = useState(() => db.getPlannedPayments());
  const [accounts, setAccounts] = useState(() => {
    let storedAccounts = db.getAccounts();
    if (!storedAccounts || storedAccounts.length === 0) {
      storedAccounts = [{ id: 'cash', name: 'Cash', balance: 0, type: 'cash' }];
      db.saveAccounts(storedAccounts);
    }
    return storedAccounts;
  });

  // Filters
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [filterType, setFilterType] = useState('month'); 

  // Loan Modal States
  const [showAddLoanModal, setShowAddLoanModal] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);
  const [loanFormData, setLoanFormData] = useState({ name: '', principal: '', interest: '', date: getTodayDate(), hasDueDate: false, dueDate: getTodayDate(), type: 'fixed', addToAccount: true, targetAccountId: '' });

  useEffect(() => db.saveTransactions(transactions), [transactions]);
  useEffect(() => db.saveLoans(loans), [loans]);
  useEffect(() => db.savePlannedPayments(plannedPayments), [plannedPayments]);
  useEffect(() => db.saveAccounts(accounts), [accounts]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if user is typing in an input or textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        if (e.key === 'Escape') {
          // Allow Escape to close modals even if focused on an input
          setShowAddLoanModal(false);
          setEditingLoan(null);
        }
        return;
      }

      // Tab Navigation (1-7)
      if (e.key === '1') setActiveTab('dashboard');
      if (e.key === '2') setActiveTab('accounts');
      if (e.key === '3') setActiveTab('insights');
      if (e.key === '4') setActiveTab('planner');
      if (e.key === '5') setActiveTab('transactions');
      if (e.key === '6') setActiveTab('loans');
      if (e.key === '7') setActiveTab('settings');

      // Quick Actions
      if (e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setActiveTab('dashboard');
        // We'll need a way to trigger the modal in Dashboard.jsx 
        // For now, just switching to the right tab is a good start
        // Or we can use a custom event
        window.dispatchEvent(new CustomEvent('open-transaction-modal'));
      }
      
      if (e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setShowAddLoanModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredTransactions = useMemo(() => {
    if (filterType === 'all') return transactions;
    if (filterType === 'year') {
      const year = selectedMonth.split('-')[0];
      return transactions.filter(t => t.date.startsWith(year));
    }
    return transactions.filter(t => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth, filterType]);

  const triggerNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };



  // Handlers
  const addTransaction = (newTrans) => {
    const transWithId = { ...newTrans, id: Date.now() };
    setTransactions([...transactions, transWithId]);
    
    // Update account balance
    if (newTrans.accountId) {
      updateAccountBalance(newTrans.accountId, newTrans.type === 'income' ? Number(newTrans.amount) : -Number(newTrans.amount));
    }
    
    triggerNotification('Transaction recorded!');
  };

  const deleteTransaction = (id) => {
    const trans = transactions.find(t => t.id === id);
    if (trans && trans.accountId) {
      // Reverse balance change
      updateAccountBalance(trans.accountId, trans.type === 'income' ? -Number(trans.amount) : Number(trans.amount));
    }
    setTransactions(transactions.filter(t => t.id !== id));
    triggerNotification('Entry deleted.');
  };

  const updateTransaction = (id, updatedTrans) => {
    const oldTrans = transactions.find(t => t.id === id);
    if (oldTrans && oldTrans.accountId) {
      // Reverse old balance
      updateAccountBalance(oldTrans.accountId, oldTrans.type === 'income' ? -Number(oldTrans.amount) : Number(oldTrans.amount));
    }
    if (updatedTrans.accountId) {
      // Apply new balance
      updateAccountBalance(updatedTrans.accountId, updatedTrans.type === 'income' ? Number(updatedTrans.amount) : -Number(updatedTrans.amount));
    }
    setTransactions(transactions.map(t => t.id === id ? { ...t, ...updatedTrans } : t));
    triggerNotification('Entry updated!');
  };

  // Account Management Functions
  const addAccount = (acc) => {
    setAccounts([...accounts, { ...acc, id: Date.now() }]);
    triggerNotification('Account added!');
  };

  const updateAccount = (id, data) => {
    setAccounts(accounts.map(a => a.id === id ? { ...a, ...data } : a));
    triggerNotification('Account updated!');
  };

  const deleteAccount = (id) => {
    if (id === 'cash') return alert("Cannot delete primary Cash account.");
    setAccounts(accounts.filter(a => a.id !== id));
    triggerNotification('Account removed.');
  };

  const updateAccountBalance = (id, delta) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, balance: Number(a.balance) + Number(delta) } : a));
  };

  const transferMoney = (fromId, toId, amount) => {
    updateAccountBalance(fromId, -amount);
    updateAccountBalance(toId, amount);
    triggerNotification('Transfer successful!');
  };

  const addPlannedPayment = (data) => {
    setPlannedPayments([...plannedPayments, { ...data, id: Date.now() }]);
    triggerNotification('Payment scheduled!');
  };

  const updatePlannedPayment = (id, updatedData) => {
    setPlannedPayments(plannedPayments.map(p => p.id === id ? { ...p, ...updatedData } : p));
    triggerNotification('Schedule updated!');
  };

  const deletePlannedPayment = (id) => {
    setPlannedPayments(plannedPayments.filter(p => p.id !== id));
    triggerNotification('Schedule removed.');
  };

  const markAsPaid = (planned, skipTransaction = false) => {
    if (!skipTransaction) {
      addTransaction({
        type: planned.type || 'expense', 
        amount: planned.amount, 
        category: planned.category,
        description: `Planned ${planned.type === 'income' ? 'income' : 'payment'}: ${planned.name}`, 
        date: getTodayDate()
      });
    }
    deletePlannedPayment(planned.id);
    triggerNotification(`${planned.type === 'income' ? 'Received' : 'Paid'}: ${planned.name}`);
  };

  const addLoan = (loan) => {
    const loanId = Date.now();
    setLoans(prev => [...prev, { ...loan, id: loanId, paid: Number(loan.paid || 0), type: loan.type || 'fixed' }]);
    // If user opted to add loan amount to an account, credit that account AND log it as a "loan" transaction
    if (loan.addToAccount && loan.targetAccountId && Number(loan.principal) > 0) {
      const acc = accounts.find(a => String(a.id) === String(loan.targetAccountId));
      // Create a "loan" type transaction — distinct from income so it won't skew income charts
      const loanTransaction = {
        id: loanId + 1,
        type: 'loan',
        amount: Number(loan.principal),
        category: 'Loan Received',
        description: `Loan received: ${loan.name}`,
        date: loan.date || getTodayDate(),
        accountId: loan.targetAccountId,
      };
      setTransactions(prev => [...prev, loanTransaction]);
      updateAccountBalance(loan.targetAccountId, Number(loan.principal));
      triggerNotification(`Loan added & Rs.${Number(loan.principal).toLocaleString()} credited to ${acc?.name || 'account'}!`);
    } else {
      triggerNotification('Loan added successfully!');
    }
    setShowAddLoanModal(false);
    resetLoanForm();
  };

  const deleteLoan = (id) => {
    setLoans(loans.filter(l => l.id !== id));
    triggerNotification('Loan deleted.');
  };

  const updateLoan = (id, updatedData) => {
    setLoans(loans.map(l => l.id === id ? { ...l, ...updatedData } : l));
    // Sync the underlying transaction so Recent Activity sorts correctly
    setTransactions(prev => prev.map(t => {
      // The transaction associated with a loan is created with id: loan.id + 1
      if (t.type === 'loan' && t.id === id + 1) {
        return {
          ...t,
          date: updatedData.date || t.date,
          amount: updatedData.principal ? Number(updatedData.principal) : t.amount,
          description: updatedData.name ? `Loan received: ${updatedData.name}` : t.description,
        };
      }
      return t;
    }));
    triggerNotification('Loan details updated!');
  };

  const resetLoanForm = () => {
    setLoanFormData({ name: '', principal: '', interest: '', date: getTodayDate(), hasDueDate: false, dueDate: getTodayDate(), type: 'fixed', addToAccount: true, targetAccountId: '' });
    setEditingLoan(null);
  };

  const recordLoanPayment = (loanId, amount, isInterestOnly = false) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;
    updateLoan(loanId, { paid: Number(loan.paid) + (isInterestOnly ? 0 : Number(amount)) });
    addTransaction({
      type: 'expense', amount: amount, category: isInterestOnly ? 'Loan Interest' : 'Loan Payment',
      description: `${isInterestOnly ? 'Interest payment' : 'Principal payment'} for ${loan.name}`, date: getTodayDate()
    });
    triggerNotification(`${isInterestOnly ? 'Interest' : 'Principal'} payment recorded!`);
  };

  const openEditLoan = (loan) => {
    setEditingLoan(loan);
    // addToAccount is not shown when editing (only on creation)
    setLoanFormData({ name: loan.name, principal: loan.principal, interest: loan.interest, date: loan.date || getTodayDate(), hasDueDate: !!loan.dueDate, dueDate: loan.dueDate || getTodayDate(), type: loan.type || 'fixed', addToAccount: false, targetAccountId: '' });
  };

  const handleLoanSubmit = (e) => {
    e.preventDefault();
    const finalData = { ...loanFormData, dueDate: loanFormData.hasDueDate ? loanFormData.dueDate : '' };
    if (editingLoan) updateLoan(editingLoan.id, finalData);
    else addLoan(finalData);
    resetLoanForm();
  };

  return (
    <div className={`app-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isCollapsed={isSidebarCollapsed} 
        setIsCollapsed={setIsSidebarCollapsed} 
      />
      <main className="main-content">
        <div className="page-container">
          
          {notification && (
            <div className={`page-notification show`}>
               <CheckCircle size={16} />
               {notification}
            </div>
          )}

          {activeTab !== 'insights' && activeTab !== 'planner' && activeTab !== 'settings' && (
            <div className="filter-bar mb-lg glass-panel">
              <div className="flex-center gap-sm flex-wrap">
                <div className="flex-center gap-sm">
                  <Calendar size={16} className="text-gold" />
                  <span style={{ fontWeight: '700', fontSize: '0.8rem', color: 'var(--slate-medium)', whiteSpace: 'nowrap' }}>FILTER:</span>
                </div>
                <div className="filter-options flex-center gap-xs">
                   <button className={`filter-btn ${filterType === 'month' ? 'active' : ''}`} onClick={() => setFilterType('month')}>Month</button>
                   <button className={`filter-btn ${filterType === 'year' ? 'active' : ''}`} onClick={() => setFilterType('year')}>Year</button>
                   <button className={`filter-btn ${filterType === 'all' ? 'active' : ''}`} onClick={() => setFilterType('all')}>All</button>
                </div>
                {filterType !== 'all' && (
                  <div className="date-input-wrapper">
                    <input 
                      type={filterType === 'month' ? "month" : "number"} 
                      className="form-control date-filter-input" 
                      value={filterType === 'month' ? selectedMonth : selectedMonth.split('-')[0]}
                      onChange={(e) => {
                        if (filterType === 'month') setSelectedMonth(e.target.value);
                        else setSelectedMonth(`${e.target.value}-01`);
                      }}
                      min="2020" max="2030" placeholder="YYYY"
                    />
                  </div>
                )}
              </div>
              <div className="text-secondary" style={{ fontSize: '0.75rem', fontWeight: '500', whiteSpace: 'nowrap' }}>
                 <span className="text-gold" style={{ fontWeight: '800' }}>{filteredTransactions.length}</span> records
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <Dashboard 
              transactions={filteredTransactions} 
              allTransactions={transactions}
              loans={loans}
              plannedPayments={plannedPayments}
              accounts={accounts}
              onAddTransaction={addTransaction} 
              onDeleteTransaction={deleteTransaction}
              onUpdateTransaction={updateTransaction}
              onAddLoan={addLoan}
              onDeleteLoan={deleteLoan}
              onUpdateLoan={updateLoan}
              onMarkPaidPlanned={markAsPaid}
              onUpdatePlanned={updatePlannedPayment}
              onSwitchTab={setActiveTab}
              viewMode={filterType}
            />
          )}

          {activeTab === 'accounts' && (
            <Accounts 
              accounts={accounts} 
              onAdd={addAccount} 
              onUpdate={updateAccount} 
              onDelete={deleteAccount} 
              onTransfer={transferMoney}
            />
          )}

          {activeTab === 'insights' && <Insights transactions={transactions} />}
          {activeTab === 'planner' && (
            <Planner 
              plannedPayments={plannedPayments} 
              accounts={accounts}
              onAddPlanned={addPlannedPayment} 
              onUpdatePlanned={updatePlannedPayment} 
              onMarkPaid={markAsPaid} 
              onDeletePlanned={deletePlannedPayment}
              onAddTransaction={addTransaction}
            />
          )}
          
          {activeTab === 'transactions' && (
            <div className="animate-fade-in">
              <h2 className="section-title">Cash Flow</h2>
              <p className="section-subtitle">Detailed history of all your income and expenses.</p>
              <div className="cashflow-table-container">
                 <table className="cashflow-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Category</th>
                        <th>Details</th>
                        <th>Type</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.slice().reverse().map(t => (
                        <tr key={t.id}>
                          <td>{t.date}</td>
                          <td style={{ fontWeight: '600' }}>{t.category}{t.liters && <span className="badge badge-gold" style={{ marginLeft: '8px' }}>{t.liters}L</span>}</td>
                          <td className="text-secondary" style={{ fontSize: '0.85rem' }}>{t.description || '-'}{t.pricePerLiter && <span style={{ display: 'block', fontSize: '0.7rem' }}>@ Rs.{t.pricePerLiter}/L</span>}</td>
                          <td><span className={`badge ${t.type === 'income' ? 'badge-success' : 'badge-danger'}`}>{t.type}</span></td>
                          <td style={{ fontWeight: '700', textAlign: 'right', color: t.type === 'income' ? 'var(--accent-success)' : 'var(--accent-danger)' }}>Rs.{Number(t.amount).toLocaleString()}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button className="btn-icon-small danger" onClick={() => { if(window.confirm('Delete this entry?')) deleteTransaction(t.id); }}><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
              </div>
            </div>
          )}
          
          {activeTab === 'loans' && (
            <div className="animate-fade-in">
              <header className="flex-between mb-xl" style={{ alignItems: 'flex-end' }}>
                <div>
                  <h2 className="section-title">Loan Tracker</h2>
                  <p className="section-subtitle" style={{ marginBottom: 0 }}>Detailed overview of all active and flexible loans.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddLoanModal(true)}><Plus size={16} /> Add New Loan</button>
              </header>

              <div className="summary-grid mb-xl" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                <div className="glass-panel summary-card" style={{ background: 'var(--slate-dark)', border: 'none' }}>
                  <p className="card-label" style={{ color: 'rgba(255,255,255,0.6)' }}>Remaining Balance</p>
                  <h2 className="card-value" style={{ color: 'white' }}>Rs.{loans.reduce((sum, l) => sum + (Number(l.principal) - Number(l.paid)), 0).toLocaleString()}</h2>
                  <div className="card-trend success">
                    <CheckCircle size={14} /> <span>{Math.round((loans.reduce((sum, l) => sum + Number(l.paid), 0) / loans.reduce((sum, l) => sum + Number(l.principal), 1)) * 100)}% Repaid</span>
                  </div>
                </div>
                
                <div className="glass-panel summary-card">
                  <p className="card-label">Total Principal</p>
                  <h2 className="card-value">Rs.{loans.reduce((sum, l) => sum + Number(l.principal), 0).toLocaleString()}</h2>
                  <div className="card-trend text-secondary"><Wallet size={14} /> <span>Across {loans.length} Loans</span></div>
                </div>
              </div>
              
              <div className="cashflow-table-container">
                <table className="cashflow-table">
                  <thead>
                    <tr>
                      <th style={{ width: '22%' }}>Loan Details</th>
                      <th style={{ width: '15%' }}>Timeline</th>
                      <th>Type</th>
                      <th style={{ textAlign: 'right' }}>Principal</th>
                      <th style={{ textAlign: 'right' }}>Remaining</th>
                      <th style={{ textAlign: 'center' }}>Progress</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.map(loan => {
                      const remaining = loan.principal - loan.paid;
                      const progress = (loan.paid / loan.principal) * 100;
                      const isFlexible = loan.type === 'flexible';
                      const daysLeft = getDaysRemaining(loan.dueDate);
                      const isOverdue = daysLeft !== null && daysLeft < 0;
                      return (
                        <tr key={loan.id}>
                          <td><div style={{ fontWeight: '700' }}>{loan.name}</div><div className="text-secondary" style={{ fontSize: '0.75rem' }}>Start/Due: {loan.dueDate || 'N/A'}</div></td>
                          <td>
                            {loan.dueDate ? (
                              <div className="flex-center gap-xs" style={{ justifyContent: 'flex-start' }}>
                                <Clock size={12} className={isOverdue ? 'text-danger' : 'text-gold'} />
                                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: isOverdue ? 'var(--accent-danger)' : 'var(--slate-dark)' }}>
                                  {isOverdue ? `${Math.abs(daysLeft)}d Overdue` : `${daysLeft}d Left`}
                                </div>
                              </div>
                            ) : '-'}
                          </td>
                          <td><span className={`badge ${isFlexible ? 'badge-gold' : 'badge-violet'}`}>{isFlexible ? 'Flexible' : 'Fixed'}</span><div style={{ fontSize: '0.7rem', marginTop: '2px', opacity: 0.8 }}>{loan.interest}% Interest</div></td>
                          <td style={{ textAlign: 'right', fontWeight: '500' }}>Rs.{loan.principal.toLocaleString()}</td>
                          <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--accent-danger)' }}>Rs.{remaining.toLocaleString()}</td>
                          <td style={{ textAlign: 'center', width: '100px' }}>
                            {!isFlexible ? (
                              <div className="flex-column gap-xs">
                                <div className="progress-bar-bg" style={{ height: '4px' }}><div className="progress-bar teal" style={{ width: `${progress}%` }}></div></div>
                                <div style={{ fontSize: '0.65rem', fontWeight: '700' }}>{Math.round(progress)}%</div>
                              </div>
                            ) : <RefreshCw size={12} style={{ color: 'var(--gold-primary)' }} />}
                          </td>
                          <td>
                            <div className="flex-center gap-xs">
                              <div className="record-payment-mini flex-center gap-xs">
                                <input type="number" className="form-control" style={{ width: '70px', padding: '4px 8px', fontSize: '0.75rem' }} placeholder="Amt..." id={`pay-${loan.id}`} />
                                <button className="btn btn-success" style={{ padding: '4px 8px', fontSize: '0.7rem' }} onClick={() => {
                                    const input = document.getElementById(`pay-${loan.id}`);
                                    const amount = Number(input.value);
                                    if(amount > 0) recordLoanPayment(loan.id, amount, false);
                                    input.value = '';
                                  }}>Pay</button>
                                {isFlexible && <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '0.7rem' }} onClick={() => {
                                      const input = document.getElementById(`pay-${loan.id}`);
                                      const amount = Number(input.value);
                                      if(amount > 0) recordLoanPayment(loan.id, amount, true);
                                      input.value = '';
                                    }}>Int</button>}
                              </div>
                              <div style={{ borderLeft: '1px solid var(--border-color)', height: '18px', margin: '0 2px' }}></div>
                              <button className="btn-icon-small" onClick={() => openEditLoan(loan)}><Edit2 size={11}/></button>
                              <button className="btn-icon-small danger" onClick={() => { if(window.confirm('Delete loan?')) deleteLoan(loan.id); }}><Trash2 size={11}/></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div className="animate-fade-in"><h2 className="section-title">Settings</h2><div className="glass-panel" style={{ padding: '24px' }}><button className="btn btn-danger" onClick={() => { if(window.confirm('Clear all data?')) db.resetDatabase(); }}>Reset Database</button></div></div>
          )}
        </div>
      </main>

      {/* Loan Modals unchanged... */}
      {(showAddLoanModal || editingLoan) && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal-content animate-fade-in">
            <div className="flex-between mb-lg"><h3>{editingLoan ? 'Edit Loan' : 'Add New Loan'}</h3><button className="btn-ghost" onClick={() => { setShowAddLoanModal(false); setEditingLoan(null); resetLoanForm(); }}><X size={20}/></button></div>
            <form onSubmit={handleLoanSubmit}>
              <div className="form-group"><label className="form-label">Loan Type</label><div className="type-toggle-group"><label className={`type-toggle-btn ${loanFormData.type === 'fixed' ? 'active income' : ''}`}><input type="radio" checked={loanFormData.type === 'fixed'} onChange={() => setLoanFormData({...loanFormData, type: 'fixed'})} /> Fixed</label><label className={`type-toggle-btn ${loanFormData.type === 'flexible' ? 'active income' : ''}`}><input type="radio" checked={loanFormData.type === 'flexible'} onChange={() => setLoanFormData({...loanFormData, type: 'flexible'})} /> Gold / Flex</label></div></div>
              <div className="form-group"><label className="form-label">Name</label><input type="text" className="form-control" placeholder="e.g. Personal Loan" value={loanFormData.name} onChange={e => setLoanFormData({...loanFormData, name: e.target.value})} required /></div>
              <div className="form-group"><label className="form-label">Principal Amount (Rs.)</label><input type="number" className="form-control" placeholder="0" value={loanFormData.principal} onChange={e => setLoanFormData({...loanFormData, principal: e.target.value})} required /></div>
              <div className="form-group"><label className="form-label">Interest Rate (%)</label><input type="number" step="0.1" className="form-control" placeholder="0.0" value={loanFormData.interest} onChange={e => setLoanFormData({...loanFormData, interest: e.target.value})} required /></div>
              <div className="form-group"><label className="form-label">Loan Date</label><input type="date" className="form-control" value={loanFormData.date} onChange={e => setLoanFormData({...loanFormData, date: e.target.value})} required /></div>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={loanFormData.hasDueDate} onChange={e => setLoanFormData({...loanFormData, hasDueDate: e.target.checked})} style={{ margin: 0, cursor: 'pointer' }} />
                  Due/Review Date
                </label>
                <input type="date" className="form-control" value={loanFormData.dueDate} onChange={e => setLoanFormData({...loanFormData, dueDate: e.target.value})} disabled={!loanFormData.hasDueDate} style={{ opacity: loanFormData.hasDueDate ? 1 : 0.5 }} />
              </div>
              {/* Add to Account Option — only shown when creating a new loan */}
              {!editingLoan && (
                <div className="form-group" style={{ background: 'var(--bg-secondary, #f7f8fa)', borderRadius: '12px', padding: '14px 16px', border: '1.5px solid var(--border-color)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
                    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '6px', border: `2px solid ${loanFormData.addToAccount ? 'var(--gold-primary, #f59e0b)' : 'var(--border-color)'}`, background: loanFormData.addToAccount ? 'var(--gold-primary, #f59e0b)' : 'transparent', transition: 'all 0.2s', flexShrink: 0 }}>
                      {loanFormData.addToAccount && <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      <input type="checkbox" checked={loanFormData.addToAccount} onChange={e => setLoanFormData({...loanFormData, addToAccount: e.target.checked, targetAccountId: e.target.checked ? loanFormData.targetAccountId : ''})} style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', margin: 0 }} />
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--slate-dark)' }}>Add loan amount to account <span style={{ fontWeight: '400', color: 'var(--text-secondary, #6b7280)', fontSize: '0.78rem' }}>(received funds)</span></span>
                  </label>
                  {loanFormData.addToAccount && (
                    <div className="category-chips" style={{ marginTop: '10px', gap: '6px' }}>
                      {accounts.map(a => (
                        <button
                          key={a.id}
                          type="button"
                          className={`chip ${loanFormData.targetAccountId === String(a.id) ? 'active' : ''}`}
                          onClick={() => setLoanFormData({...loanFormData, targetAccountId: String(a.id)})}
                          style={{ fontSize: '0.78rem' }}
                        >
                          {a.type === 'cash' ? <DollarSign size={12} style={{ marginRight: '3px' }} /> : <Landmark size={12} style={{ marginRight: '3px' }} />}
                          {a.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>{editingLoan ? 'Update Details' : 'Add Loan'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
