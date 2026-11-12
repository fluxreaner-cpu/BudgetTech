import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error?.message || 'Неизвестная ошибка' };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Root Error Boundary caught an exception]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#090b10',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            maxWidth: '480px',
            width: '100%',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🛡️</div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#c084fc', marginBottom: '8px' }}>
              BudgetTech Cyber Security
            </h2>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.5', marginBottom: '16px' }}>
              Произошёл перезапуск сессии безопасности интерфейса.
            </p>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              style={{
                background: 'linear-gradient(to right, #9333ea, #6366f1)',
                color: '#fff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)'
              }}
            >
              Перезагрузить страницу
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  );
}
