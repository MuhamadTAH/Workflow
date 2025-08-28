import React from 'react';

const WhatsAppReceiverTest = () => {
  console.log('WhatsApp Receiver Test component rendering...');
  
  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ color: '#25D366' }}>
        📱 WhatsApp Message Receiver Test
      </h1>
      <p>If you can see this, the component is working!</p>
      <div style={{ 
        background: '#f0f0f0', 
        padding: '20px', 
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h3>Debug Info:</h3>
        <p>React: {React.version}</p>
        <p>Window location: {window.location.href}</p>
        <p>Current time: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};

export default WhatsAppReceiverTest;