import { Component } from 'react';

/**
 * A failure in one recommendation should never take the whole app down, and it
 * should never leave the traveller staring at a blank page.
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
    console.error('[Packwise]', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="error-screen">
        <div>
          <h2 className="h1">Something went wrong.</h2>
          <p>
            Your packing plan could not be displayed. Starting again usually clears it —
            your progress on this device will be reset.
          </p>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => {
              try { localStorage.removeItem('packwise:v1'); } catch { /* ignore */ }
              window.location.reload();
            }}
          >
            Start again
          </button>
        </div>
      </div>
    );
  }
}
