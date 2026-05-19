import React, { useState } from 'react';
import { Wallet, Plus, Trash2, Edit2, ArrowRightLeft, Landmark, CreditCard, DollarSign, X, Check } from 'lucide-react';

const Accounts = ({ accounts, onAdd, onUpdate, onDelete, onTransfer }) => {
  const [showModal, setShowModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '', balance: '', type: 'bank'
  });

  const [transferData, setTransferData] = useState({
    fromId: '', toId: '', amount: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...formData, balance: Number(formData.balance) };
    if (editingId) onUpdate(editingId, data);
    else onAdd(data);
    closeModal();
  };

  const handleTransfer = (e) => {
    e.preventDefault();
    if (!transferData.fromId || !transferData.toId) return alert("Please select both accounts.");
    if (transferData.fromId === transferData.toId) return alert("Source and destination cannot be the same.");
    onTransfer(transferData.fromId, transferData.toId, Number(transferData.amount));
    setShowTransferModal(false);
    setTransferData({ fromId: '', toId: '', amount: '' });
  };

  const openEdit = (a) => {
    setEditingId(a.id);
    setFormData({ name: a.name, balance: a.balance, type: a.type });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', balance: '', type: 'bank' });
  };

  const getAccountIcon = (type) => {
    switch (type) {
      case 'cash': return <DollarSign size={20} />;
      case 'bank': return <Landmark size={20} />;
      case 'card': return <CreditCard size={20} />;
      default: return <Wallet size={20} />;
    }
  };

  const totalAssets = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

  return (
    <div className="animate-fade-in">
      <header className="page-header flex-between mb-xl">
        <div>
          <h1 className="page-title">Bank Accounts</h1>
          <p className="text-secondary">Manage your cash, bank balances and transfers.</p>
        </div>
        <div className="header-actions flex-center gap-md">
          <button className="btn btn-ghost" onClick={() => setShowTransferModal(true)}>
            <ArrowRightLeft size={16} /> Transfer Money
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Add Account
          </button>
        </div>
      </header>

      <div className="summary-grid mb-xl" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <div className="glass-panel summary-card" style={{ background: 'var(--slate-dark)', border: 'none' }}>
          <p className="card-label" style={{ color: 'rgba(255,255,255,0.6)' }}>Total Net Worth</p>
          <h2 className="card-value" style={{ color: 'white' }}>Rs.{totalAssets.toLocaleString()}</h2>
          <div className="card-trend success"><Check size={14} /> <span>Across {accounts.length} accounts</span></div>
        </div>
        
        <div className="glass-panel summary-card">
          <p className="card-label">Primary Balance</p>
          <h2 className="card-value">Rs.{accounts.find(a => a.id === 'cash')?.balance.toLocaleString() || '0'}</h2>
          <div className="card-trend text-gold"><DollarSign size={14} /> <span>Physical Cash</span></div>
        </div>
      </div>

      <div className="summary-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
        {accounts.map(acc => (
          <div key={acc.id} className="glass-panel account-card" style={{ padding: '24px', position: 'relative' }}>
            <div className="flex-between mb-lg">
              <div className="flex-center gap-md">
                <div className={`badge ${acc.type === 'cash' ? 'badge-gold' : 'badge-violet'}`} style={{ width: '48px', height: '48px', borderRadius: '12px' }}>
                  {getAccountIcon(acc.type)}
                </div>
                <div>
                  <h3 style={{ fontWeight: '800', color: 'var(--slate-dark)' }}>{acc.name}</h3>
                  <span className="badge" style={{ fontSize: '0.6rem', padding: '2px 8px', marginTop: '4px' }}>{acc.type.toUpperCase()}</span>
                </div>
              </div>
              <div className="flex-center gap-xs">
                <button className="btn-icon-small" onClick={() => openEdit(acc)}><Edit2 size={14}/></button>
                {acc.id !== 'cash' && <button className="btn-icon-small danger" onClick={() => { if(window.confirm('Delete account?')) onDelete(acc.id); }}><Trash2 size={14}/></button>}
              </div>
            </div>
            
            <div style={{ marginTop: '32px' }}>
              <p className="card-label" style={{ marginBottom: '8px' }}>Available Balance</p>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--slate-dark)' }}>Rs.{Number(acc.balance).toLocaleString()}</h2>
            </div>
            
            <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
               <div className="flex-between">
                  <span className="text-secondary" style={{ fontSize: '0.75rem' }}>Status</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-success)' }}>Active</span>
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Account Modal */}
      {showModal && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '440px' }}>
            <div className="flex-between mb-lg">
              <h3>{editingId ? 'Edit Account' : 'Add New Account'}</h3>
              <button className="btn-ghost" onClick={closeModal}><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Account Name</label>
                <input type="text" className="form-control" placeholder="e.g. HNB Bank" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Account Type</label>
                <div className="type-toggle-group">
                  <label className={`type-toggle-btn ${formData.type === 'bank' ? 'active expense' : ''}`}><input type="radio" checked={formData.type === 'bank'} onChange={() => setFormData({...formData, type: 'bank'})} /> Bank</label>
                  <label className={`type-toggle-btn ${formData.type === 'card' ? 'active expense' : ''}`}><input type="radio" checked={formData.type === 'card'} onChange={() => setFormData({...formData, type: 'card'})} /> Credit Card</label>
                  <label className={`type-toggle-btn ${formData.type === 'cash' ? 'active expense' : ''}`}><input type="radio" checked={formData.type === 'cash'} onChange={() => setFormData({...formData, type: 'cash'})} /> Cash</label>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Initial Balance (Rs.)</label>
                <input type="number" className="form-control" placeholder="0" value={formData.balance} onChange={e => setFormData({...formData, balance: e.target.value})} required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>{editingId ? 'Update Account' : 'Create Account'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '440px' }}>
            <div className="flex-between mb-lg">
              <h3>Internal Transfer</h3>
              <button className="btn-ghost" onClick={() => setShowTransferModal(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleTransfer}>
              <div className="form-group">
                <label className="form-label">From Account</label>
                <div className="category-chips" style={{ gap: '6px' }}>
                  {accounts.map(a => (
                    <button
                      key={a.id}
                      type="button"
                      className={`chip ${transferData.fromId === String(a.id) ? 'active' : ''}`}
                      onClick={() => setTransferData({...transferData, fromId: String(a.id)})}
                      style={{ fontSize: '0.78rem' }}
                    >
                      {a.type === 'cash' ? <DollarSign size={12} style={{ marginRight: '3px' }} /> : <Landmark size={12} style={{ marginRight: '3px' }} />}
                      {a.name} — Rs.{Number(a.balance).toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">To Account</label>
                <div className="category-chips" style={{ gap: '6px' }}>
                  {accounts.map(a => (
                    <button
                      key={a.id}
                      type="button"
                      className={`chip ${transferData.toId === String(a.id) ? 'active' : ''}`}
                      onClick={() => setTransferData({...transferData, toId: String(a.id)})}
                      style={{ fontSize: '0.78rem' }}
                    >
                      {a.type === 'cash' ? <DollarSign size={12} style={{ marginRight: '3px' }} /> : <Landmark size={12} style={{ marginRight: '3px' }} />}
                      {a.name} — Rs.{Number(a.balance).toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Transfer Amount (Rs.)</label>
                <input type="number" className="form-control" placeholder="0" value={transferData.amount} onChange={e => setTransferData({...transferData, amount: e.target.value})} required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>Transfer Funds</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounts;
