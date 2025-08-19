import { useEffect, useState } from 'react';

function PageTransition({ children, loading = false }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Slight delay to ensure smooth transition
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p style={{ marginTop: '1rem', color: '#E0E0E0' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`page-transition ${isVisible ? 'visible' : ''}`}>
      {children}
    </div>
  );
}

export default PageTransition;