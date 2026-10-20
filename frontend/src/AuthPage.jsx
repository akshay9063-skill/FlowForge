
import { useState } from 'react'
import './AuthPage.css'

const AUTH_URL = 'https://flowforge-qeav.onrender.com/api/auth'

async function requestCsrfToken() {
  const response = await fetch(`${AUTH_URL}/csrf`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(
      `Could not obtain the security token (HTTP ${response.status}).`
    )
  }

  const data = await response.json()

  if (!data.token) {
    throw new Error(
      'The backend did not return a security token. Please try again.'
    )
  }

  return data.token
}

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
      const csrfToken = await requestCsrfToken()

      const endpoint =
        mode === 'login' ? 'login' : 'register'

      const response = await fetch(`${AUTH_URL}/${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': csrfToken,
        },
        body: JSON.stringify({
          ...(mode === 'register'
            ? { name: name.trim() }
            : {}),
          email: email.trim(),
          password,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Request failed with HTTP ${response.status}.`
        )
      }

      onAuthenticated(data)
    } catch (err) {
      setError(
        err.message ||
          'Could not connect to the backend. Please try again.'
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
          <span>
            flowforge<span className="auth-dot">.</span>
          </span>
        </a>

        <div className="auth-heading">
          <span className="auth-eyebrow">
            YOUR WORKSPACE, REIMAGINED
          </span>

          <h1>
            {mode === 'login'
              ? 'Welcome back'
              : 'Create your account'}
          </h1>

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
                mode === 'login'
                  ? 'current-password'
                  : 'new-password'
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
