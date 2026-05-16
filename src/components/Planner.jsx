import React, { useState } from 'react';
import { Calendar, Plus, Check, X, Clock, AlertTriangle, Trash2, Edit2 } from 'lucide-react';

const Planner = ({ plannedPayments, onAddPlanned, onUpdatePlanned, onMarkPaid, onDeletePlanned }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const getTodayDate = () => new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState({
    name: '', amount: '', dueDate: getTodayDate(), category: 'Education', type: 'expense'
  });

  const categories = {
    expense: ['Education', 'Rent', 'Bills', 'Insurance', 'Installment', 'Other'],
    income: ['Salary', 'Freelance', 'Business', 'Gift', 'Other']
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) onUpdatePlanned(editingId, formData);
    else onAddPlanned(formData);
    closeModal();
  };

  const openEdit = (p) => {
    setEditingId(p.id);
    setFormData({ name: p.name, amount: p.amount, dueDate: p.dueDate, category: p.category, type: p.type || 'expense' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', amount: '', dueDate: getTodayDate(), category: 'Education', type: 'expense' });
  };

  const getDaysRemaining = (date) => {
    const diff = new Date(date) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const totals = plannedPayments.reduce((acc, p) => {
    if (p.type === 'income') acc.income += Number(p.amount);
    else acc.expense += Number(p.amount);
    return acc;
  }, { income: 0, expense: 0 });

  return (
    <div className="animate-fade-in">
      <header className="flex-between mb-md">
        <div>
          <h2 className="section-title">Future Planner</h2>
          <p className="section-subtitle">Plan and track your upcoming obligations and bills.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Plan New Payment
        </button>
      </header>

      <div className="summary-grid mb-lg">
        <div className="glass-panel summary-card">
          <p className="card-label">Expected Income</p>
          <h2 className="card-value" style={{ color: 'var(--accent-success)' }}>Rs.{totals.income.toLocaleString()}</h2>
          <div className="card-trend text-gold"><Clock size={14} /> <span>Planned Earnings</span></div>
        </div>
        <div className="glass-panel summary-card">
          <p className="card-label">Total Obligations</p>
          <h2 className="card-value" style={{ color: 'var(--accent-danger)' }}>Rs.{totals.expense.toLocaleString()}</h2>
          <div className="card-trend text-secondary"><Calendar size={14} /> <span>Scheduled Expenses</span></div>
        </div>
      </div>

      <div className="cashflow-table-container">
        <table className="cashflow-table">
          <thead>
            <tr>
              <th style={{ width: '18%' }}>Timeline</th>
              <th style={{ width: '12%' }}>Due Date</th>
              <th>Requirement</th>
              <th>Category</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {plannedPayments.sort((a, b) => a.dueDate.localeCompare(b.dueDate)).map(p => {
              const daysLeft = getDaysRemaining(p.dueDate);
              const isOverdue = daysLeft < 0;
              const isUrgent = daysLeft >= 0 && daysLeft <= 3;
              
              return (
                <tr key={p.id} style={{ background: p.type === 'income' ? 'rgba(16, 185, 129, 0.03)' : 'transparent' }}>
                  <td>
                    <div className={`badge ${isOverdue ? 'badge-danger' : isUrgent ? 'badge-gold' : 'badge-teal'}`} 
                         style={{ width: '100%', minWidth: '120px' }}>
                      {isOverdue ? `${Math.abs(daysLeft)}D OVERDUE` : `${daysLeft}D REMAINING`}
                    </div>
                  </td>
                  <td style={{ fontWeight: '700', color: 'var(--slate-medium)' }}>{p.dueDate}</td>
                  <td style={{ fontWeight: '700', color: 'var(--slate-dark)' }}>
                    {p.name}
                    {p.type === 'income' && <span className="badge badge-success" style={{ marginLeft: '8px', fontSize: '0.6rem', padding: '2px 6px' }}>Income</span>}
                  </td>
                  <td><span className="badge badge-violet">{p.category}</span></td>
                  <td style={{ textAlign: 'right', fontWeight: '800', color: p.type === 'income' ? 'var(--accent-success)' : 'var(--slate-dark)', fontSize: '1rem' }}>
                    {p.type === 'income' ? '+' : ''}Rs.{Number(p.amount).toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="item-actions-wrapper">
                      <button className="btn btn-success" style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px' }} onClick={() => onMarkPaid(p)}>
                        <Check size={14} /> {p.type === 'income' ? 'Received' : 'Paid'}
                      </button>
                      <div className="table-divider"></div>
                      <button className="btn-icon-small" onClick={() => openEdit(p)} title="Edit">
                        <Edit2 size={13} />
                      </button>
                      <button className="btn-icon-small danger" onClick={() => { if(window.confirm('Delete plan?')) onDeletePlanned(p.id); }} title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {plannedPayments.length === 0 && <div style={{ padding: '60px', textAlign: 'center' }} className="text-secondary">No planned payments.</div>}
      </div>

      {showModal && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal-content animate-fade-in">
            <div className="flex-between mb-lg">
              <h3>{editingId ? 'Edit Planned Payment' : 'Plan Future Payment'}</h3>
              <button className="btn-ghost" onClick={closeModal}><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Type</label>
                <div className="type-toggle-group">
                  <label className={`type-toggle-btn ${formData.type === 'expense' ? 'active expense' : ''}`}>
                    <input type="radio" checked={formData.type === 'expense'} onChange={() => setFormData({...formData, type: 'expense', category: categories.expense[0]})} /> Expense
                  </label>
                  <label className={`type-toggle-btn ${formData.type === 'income' ? 'active income' : ''}`}>
                    <input type="radio" checked={formData.type === 'income'} onChange={() => setFormData({...formData, type: 'income', category: categories.income[0]})} /> Income
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Plan Name</label>
                <input type="text" className="form-control" placeholder="e.g. Salary Expectation" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <div className="category-chips">
                  {categories[formData.type].map(cat => (
                    <button key={cat} type="button" className={`chip ${formData.category === cat ? 'active' : ''}`} onClick={() => setFormData({...formData, category: cat})}>{cat}</button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Expected Amount (Rs.)</label>
                <input type="number" className="form-control" placeholder="0" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input type="date" className="form-control" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                {editingId ? 'Update Schedule' : 'Schedule Payment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Planner;
