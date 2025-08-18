import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function Sidebar({ isOpen, onToggle }) {
  const { t } = useTranslation();
  const location = useLocation();

  const menuItems = [
    {
      icon: 'fas fa-home',
      label: 'Dashboard',
      path: '/',
      key: 'dashboard'
    },
    {
      icon: 'fas fa-project-diagram',
      label: 'Workflows',
      path: '/workflows',
      key: 'workflows'
    },
    {
      icon: 'fas fa-magic',
      label: 'Workflow Builder',
      path: '/workflow',
      key: 'builder'
    },
    {
      icon: 'fas fa-plug',
      label: 'Connections',
      path: '/connections',
      key: 'connections'
    },
    {
      icon: 'fas fa-store',
      label: 'My Shop',
      path: '/shop',
      key: 'shop',
      premium: true
    },
    {
      icon: 'fas fa-chart-line',
      label: 'Analytics',
      path: '/shop/analytics',
      key: 'analytics'
    },
    {
      icon: 'fas fa-eye',
      label: 'Overview',
      path: '/overview',
      key: 'overview'
    }
  ];

  const isActiveRoute = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="sidebar-overlay"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <i className="fas fa-bolt brand-icon"></i>
            <span className="brand-text">WorkflowPro</span>
          </div>
          <button 
            className="sidebar-toggle desktop-only"
            onClick={onToggle}
            aria-label="Toggle sidebar"
          >
            <i className={`fas ${isOpen ? 'fa-chevron-left' : 'fa-chevron-right'}`}></i>
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-list">
            {menuItems.map((item) => (
              <li key={item.key} className="nav-item">
                <Link
                  to={item.path}
                  className={`nav-link ${isActiveRoute(item.path) ? 'active' : ''} ${item.premium ? 'premium' : ''}`}
                  onClick={() => window.innerWidth <= 768 && onToggle()}
                >
                  <i className={`nav-icon ${item.icon}`}></i>
                  <span className="nav-text">{item.label}</span>
                  {item.premium && (
                    <span className="premium-badge">Pro</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar-small">
              <i className="fas fa-user"></i>
            </div>
            <div className="user-details">
              <span className="user-status">Premium User</span>
              <span className="user-plan">Pro Plan</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;