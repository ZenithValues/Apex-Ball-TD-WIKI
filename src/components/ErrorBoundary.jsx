import { Component } from 'react';

/**
 * Top-level crash guard: if any page throws during render, visitors get a
 * friendly recovery screen (with a way back home / reload) instead of a
 * blank white page. Kept intentionally dependency-free so it can never
 * itself fail.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Surface crashes in the console for bug reports; keep rendering.
    console.error('[APEX] Uncaught render error:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    this.setState({ error: null });
    window.location.assign(import.meta.env.BASE_URL || '/');
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main
        className="page-shell"
        style={{ display: 'grid', placeItems: 'center', minHeight: '70vh', textAlign: 'center' }}
      >
        <div className="card" style={{ padding: '2rem', maxWidth: 420 }}>
          <h1 style={{ marginTop: 0 }}>Something went wrong</h1>
          <p style={{ opacity: 0.8 }}>
            The page hit an unexpected error. Your data is safe — try reloading, or head back to
            the home page.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" className="badge filled" onClick={this.handleReload}>
              Reload page
            </button>
            <button type="button" className="badge" onClick={this.handleHome}>
              Go home
            </button>
          </div>
        </div>
      </main>
    );
  }
}
