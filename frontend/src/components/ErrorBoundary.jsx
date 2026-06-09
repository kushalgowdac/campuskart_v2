import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#ef4444' }}>
          <h2>Something went wrong.</h2>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1.5rem',
              border: '2px solid #ef4444',
              background: 'transparent',
              color: '#ef4444',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            RETRY
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
