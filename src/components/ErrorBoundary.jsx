import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[APEX] Uncaught render error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    this.setState({ error: null, errorInfo: null });
    window.location.assign(import.meta.env.BASE_URL || '/');
  };

  handleReset = () => {
    this.setState({ error: null, errorInfo: null });
  };

  copyError = () => {
    const text = `${this.state.error?.toString()}\n\n${this.state.errorInfo?.componentStack || ''}`;
    navigator.clipboard?.writeText(text);
    alert('Copied error stack trace to clipboard!');
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main
        className="page-shell"
        style={{ display: 'grid', placeItems: 'center', minHeight: '60vh', textAlign: 'center', padding: '20px' }}
      >
        <div className="card" style={{ padding: '2rem', maxWidth: 560, border: '1px solid #ff4d4d', boxShadow: '0 0 24px rgba(255, 77, 77, 0.25)', borderRadius: '12px' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ff4d4d', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Render Exception Intercepted
          </span>
          <h1 style={{ marginTop: 6, marginBottom: 10, fontSize: '1.5rem', fontWeight: 900 }}>Something went wrong</h1>
          <p style={{ opacity: 0.85, fontSize: '0.88rem', marginBottom: 16, color: 'var(--text-dim)' }}>
            The page encountered an unexpected component error. Your data is completely safe.
          </p>

          <div style={{ background: 'var(--bg-elevated, #0f0f16)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'left', marginBottom: 20 }}>
            <strong style={{ color: '#ff6b6b', fontSize: '0.85rem', wordBreak: 'break-word' }}>
              {this.state.error?.toString() || 'Unknown Error'}
            </strong>
            {this.state.errorInfo?.componentStack && (
              <details style={{ marginTop: 8 }}>
                <summary style={{ cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-faint)', fontWeight: 700 }}>
                  Show Component Stack Trace
                </summary>
                <pre style={{ fontSize: '0.7rem', color: 'var(--text-dim)', overflowX: 'auto', marginTop: 8, whiteSpace: 'pre-wrap', maxHeight: '180px' }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" className="badge filled" onClick={this.handleReset} style={{ padding: '10px 18px', cursor: 'pointer', fontWeight: 800 }}>
              ⚡ Reset Component
            </button>
            <button type="button" className="badge" onClick={this.copyError} style={{ padding: '10px 18px', cursor: 'pointer', fontWeight: 800 }}>
              📋 Copy Error Details
            </button>
            <button type="button" className="badge" onClick={this.handleReload} style={{ padding: '10px 18px', cursor: 'pointer', fontWeight: 800 }}>
              🔄 Reload Page
            </button>
            <button type="button" className="badge" onClick={this.handleHome} style={{ padding: '10px 18px', cursor: 'pointer', fontWeight: 800 }}>
              🏠 Go Home
            </button>
          </div>
        </div>
      </main>
    );
  }
}
