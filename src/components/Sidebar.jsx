import React from 'react';
import { 
  LayoutDashboard, 
  History, 
  PieChart, 
  Settings, 
  LogOut, 
  Wallet, 
  CalendarClock,
  ChevronLeft,
  Menu
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, isCollapsed, setIsCollapsed }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'accounts', label: 'Bank Accounts', icon: Wallet },
    { id: 'insights', label: 'Analysis & Compare', icon: PieChart },
    { id: 'planner', label: 'Future Planner', icon: CalendarClock },
    { id: 'transactions', label: 'Cash Flow', icon: History },
    { id: 'loans', label: 'Loan Tracker', icon: Wallet },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header flex-between">
        {!isCollapsed && (
          <div className="logo flex-center gap-sm animate-fade-in">
            <div className="logo-icon">
              <Wallet size={20} fill="var(--gold-primary)" />
            </div>
            <span className="logo-text">FinTrack</span>
          </div>
        )}
        <button 
          className="collapse-toggle-btn" 
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
            title={isCollapsed ? item.label : ""}
          >
            <item.icon size={20} className="nav-icon" />
            {!isCollapsed && <span className="nav-label">{item.label}</span>}
            {activeTab === item.id && !isCollapsed && <div className="active-indicator"></div>}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile flex-center gap-sm">
          <div className="user-avatar">AD</div>
          {!isCollapsed && (
            <div className="user-info animate-fade-in">
              <p className="user-name">Admin User</p>
              <p className="user-role">Premium</p>
            </div>
          )}
        </div>
        <button className="nav-item logout" title={isCollapsed ? "Logout" : ""}>
          <LogOut size={20} className="nav-icon" />
          {!isCollapsed && <span className="nav-label">Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
