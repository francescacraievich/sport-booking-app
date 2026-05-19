import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false, message: '' };

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-page">
          <h2>Qualcosa è andato storto</h2>
          <p>{this.state.message}</p>
          <a href="/" className="btn btn-primary">Torna alla home</a>
        </div>
      );
    }
    return this.props.children;
  }
}
