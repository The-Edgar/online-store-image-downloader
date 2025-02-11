import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

console.log('Starting application initialization...');

try {
  console.log('Looking for root element...');
  const rootElement = document.getElementById('root');
  console.log('Root element found:', rootElement);

  if (!rootElement) {
    throw new Error('Failed to find the root element');
  }

  console.log('Creating React root...');
  const root = ReactDOM.createRoot(rootElement);
  console.log('React root created successfully');

  console.log('Starting render process...');
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('Render process initiated');
} catch (error) {
  console.error('Error during initialization:', error);
}
