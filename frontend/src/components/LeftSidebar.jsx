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
      icon: 'fas fa-th-large'
    },
    {
      name: 'Builder',
      path: 'https://workflow-lg9z.onrender.com',
      icon: 'fas fa-magic',
      external: true
    },
    {
      name: 'Connections',
      path: '/connections',
      icon: 'fas fa-user-friends'
    },
    {
      name: 'Live Chat',
      path: '/live-chat',
      icon: 'fas fa-comments'
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
    <aside className="live-chat-sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">W</div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          item.external ? (
            <a
              key={item.path}
              href={item.path}
              className="nav-item"
              title={item.name}
            >
              <i className={item.icon}></i>
            </a>
          ) : (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              title={item.name}
            >
              <i className={item.icon}></i>
            </Link>
          )
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="user-avatar">M</div>
        <Link to="#" className="nav-item">
          <i className="fas fa-question-circle"></i>
        </Link>
        <div className="status-indicator"></div>
      </div>
    </aside>
  );
}

export default LeftSidebar;