import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: '100vh',
            background: '#0c0c0c',
            color: '#f6efe6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Sora, sans-serif',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: 480 }}>
            <div
              style={{
                fontSize: 13,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#e35142',
                marginBottom: 16,
              }}
            >
              Application Error
            </div>
            <div style={{ fontSize: 15, color: '#c8b8a0', marginBottom: 24 }}>
              {this.state.error.message}
            </div>
            <button
              style={{
                fontSize: 12,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '8px 20px',
                background: 'transparent',
                border: '1px solid #3a3530',
                color: '#f6efe6',
                cursor: 'pointer',
              }}
              onClick={() => window.location.reload()}
            >
              Reload Console
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
