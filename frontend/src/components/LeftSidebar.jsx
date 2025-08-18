import { Link, useLocation } from 'react-router-dom';

function LeftSidebar() {
  const location = useLocation();

  const navItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: 'fas fa-home'
    },
    {
      name: 'Workflows',
      path: '/workflows',
      icon: 'fas fa-project-diagram'
    },
    {
      name: 'Builder',
      path: '/workflow',
      icon: 'fas fa-magic'
    },
    {
      name: 'Connections',
      path: '/connections',
      icon: 'fas fa-plug'
    },
    {
      name: 'Live Chat',
      path: '/live-chat',
      icon: 'fas fa-comments'
    },
    {
      name: 'Overview',
      path: '/overview',
      icon: 'fas fa-eye'
    },
    {
      name: 'Shop',
      path: '/shop',
      icon: 'fas fa-store'
    }
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="left-sidebar">
      <div className="sidebar-header">
        <i className="fas fa-bolt"></i>
        <span>Menu</span>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
          >
            <i className={item.icon}></i>
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

export default LeftSidebar;