import React from 'react'
import { Link } from 'react-router-dom'

const DashboardPage = () => {
  return (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center', 
      fontFamily: 'sans-serif',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>
        n8n Clone - Workflow Builder
      </h1>
      <p style={{ color: '#666', marginBottom: '30px', fontSize: '18px' }}>
        Build powerful workflows with drag-and-drop automation
      </p>
      <Link 
        to="/editor" 
        style={{
          display: 'inline-block',
          padding: '15px 30px',
          backgroundColor: '#007bff',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '5px',
          fontSize: '16px',
          fontWeight: 'bold'
        }}
      >
        Open Workflow Editor
      </Link>
    </div>
  )
}

export default DashboardPage