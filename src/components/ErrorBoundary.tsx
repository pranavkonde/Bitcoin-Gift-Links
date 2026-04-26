import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

type Props = {
  children: ReactNode
}

type State = {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="container">
          <section className="card">
            <h2>Something went wrong</h2>
            <p className="muted-text">
              Please refresh the page and try again. If the issue continues, regenerate a new
              gift link.
            </p>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
