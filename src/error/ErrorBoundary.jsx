// Imports
import React from 'react';
import * as Sentry from '@sentry/react';
import ErrorFragment from './ErrorFragment';

// Class-Based Error Boundary with Sentry Reporting
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  // Error State Derivation
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  // Error Logging and Sentry Capture
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    Sentry.captureException(error, { extra: errorInfo });
    this.setState({ error, errorInfo });
  }

  // Render Fallback or Children
  render() {
    if (this.state.hasError) {
      return <ErrorFragment error={this.state.error} errorInfo={this.state.errorInfo} />;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;