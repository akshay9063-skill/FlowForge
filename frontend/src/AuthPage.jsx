
import { useState } from 'react'
import './AuthPage.css'

const AUTH_URL = 'http://localhost:8080/api/auth'

function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (mode === 'register' && !name.trim()) {
      setError('Please enter your name.')
      return
    }

    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }

    if (mode === 'register' && password.length < 8) {
      setError('Password must contain at least 8 characters.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        `${AUTH_URL}/${mode === 'login' ? 'login' : 'register'}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...(mode === 'register' ? { name: name.trim() } : {}),
            email: email.trim(),
            password,
          }),
        }
      )

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          data.message || 'Authentication failed. Please try again.'
        )
      }

      onAuthenticated(data)
    } catch (err) {
      setError(
        err.message ||
        'Could not connect to the backend. Check that Spring Boot is running.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <a className="auth-brand" href="/">
          <span className="auth-logo">F</span>
          <span>flowforge<span className="auth-dot">.</span></span>
        </a>

        <div className="auth-heading">
          <span className="auth-eyebrow">YOUR WORKSPACE, REIMAGINED</span>
          <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
          <p>
            {mode === 'login'
              ? 'Sign in to continue managing your projects.'
              : 'Get started with your projects and tasks in one place.'}
          </p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === 'login' ? 'selected' : ''}
            onClick={() => {
              setMode('login')
              setError('')
            }}
          >
            Sign in
          </button>

          <button
            type="button"
            className={mode === 'register' ? 'selected' : ''}
            onClick={() => {
              setMode('register')
              setError('')
            }}
          >
            Create account
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <label>
              Full name
              <input
                type="text"
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder="Enter your full name"
                maxLength={100}
                autoComplete="name"
                required
              />
            </label>
          )}

          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              placeholder={
                mode === 'register'
                  ? 'At least 8 characters'
                  : 'Enter your password'
              }
              minLength={mode === 'register' ? 8 : undefined}
              autoComplete={
                mode === 'login' ? 'current-password' : 'new-password'
              }
              required
            />
          </label>

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          <button
            className="auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? 'Please wait...'
              : mode === 'login'
                ? 'Sign in to FlowForge →'
                : 'Create account →'}
          </button>
        </form>

        <p className="auth-footer">
          Organize your work. Track your progress. Move forward.
        </p>
      </section>
    </main>
  )
}

export default AuthPage
