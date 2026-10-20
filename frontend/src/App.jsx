
import { useEffect, useMemo, useState } from 'react'
import AuthPage from './AuthPage'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import './App.css'

const API_URL = 'http://localhost:8080/api/projects'
const TASK_API_URL = 'http://localhost:8080/api/tasks'
const AUTH_API_URL = 'http://localhost:8080/api/auth'

const COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ec4899']

const STATUS_COLORS = {
  'To Do': '#f59e0b',
  'In Progress': '#8b5cf6',
  Done: '#10b981',
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const message = await response.text().catch(() => '')
    throw new Error(
      message || `Request failed with status ${response.status}`
    )
  }

  if (response.status === 204) return null

  const text = await response.text()
  return text ? JSON.parse(text) : null
}

function formatProject(project, index) {
  return {
    ...project,
    team: project.team || 'Unassigned team',
    description: project.description || '',
    deadline: project.deadline || '',
    progress: project.progress ?? 0,
    color: project.color || COLORS[index % COLORS.length],
  }
}

function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('') || 'U'
}

function App() {
  // Authentication state
  const [authUser, setAuthUser] = useState(null)
  const [authChecking, setAuthChecking] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const [authError, setAuthError] = useState('')

  // Projects and tasks
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])

  const [loading, setLoading] = useState(true)
  const [tasksLoading, setTasksLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  const [taskError, setTaskError] = useState('')
  const [saving, setSaving] = useState(false)
  const [taskSaving, setTaskSaving] = useState(false)

  // Task filters
  const [taskSearch, setTaskSearch] = useState('')
  const [taskStatusFilter, setTaskStatusFilter] = useState('All')
  const [taskPriorityFilter, setTaskPriorityFilter] = useState('All')
  const [taskProjectFilter, setTaskProjectFilter] = useState('All')

  // Project form
  const [openProjectMenu, setOpenProjectMenu] = useState(null)
  const [editingProject, setEditingProject] = useState(null)
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectTeam, setProjectTeam] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [projectDeadline, setProjectDeadline] = useState('')
  const [formError, setFormError] = useState('')

  // Task form
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskProjectId, setTaskProjectId] = useState('')
  const [taskStatus, setTaskStatus] = useState('To Do')
  const [taskPriority, setTaskPriority] = useState('Medium')
  const [taskDueDate, setTaskDueDate] = useState('')

  // Check whether a valid login session exists.
  useEffect(() => {
    let active = true

    async function checkSession() {
      try {
        const user = await apiRequest(`${AUTH_API_URL}/me`)

        if (active) {
          setAuthUser(user)
          setAuthError('')
        }
      } catch {
        if (active) {
          setAuthUser(null)
        }
      } finally {
        if (active) {
          setAuthChecking(false)
        }
      }
    }

    checkSession()

    return () => {
      active = false
    }
  }, [])

  // Load projects and tasks after authentication.
  useEffect(() => {
    if (!authUser) {
      setProjects([])
      setTasks([])
      setLoading(false)
      setTasksLoading(false)
      return
    }

    let active = true

    async function loadProjects() {
      setLoading(true)
      setApiError('')

      try {
        const data = await apiRequest(API_URL)

        if (active) {
          const list = Array.isArray(data) ? data : []
          setProjects(list.map(formatProject))
        }
      } catch (error) {
        if (active) {
          setApiError(
            error.message || 'Unable to load projects from the backend.'
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    async function loadTasks() {
      setTasksLoading(true)
      setTaskError('')

      try {
        const data = await apiRequest(TASK_API_URL)

        if (active) {
          setTasks(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        if (active) {
          setTaskError(
            error.message || 'Unable to load tasks from the backend.'
          )
        }
      } finally {
        if (active) setTasksLoading(false)
      }
    }

    loadProjects()
    loadTasks()

    return () => {
      active = false
    }
  }, [authUser])

  // Logout
  async function handleLogout() {
    if (loggingOut) return

    setLoggingOut(true)
    setAuthError('')

    try {
      await apiRequest(`${AUTH_API_URL}/logout`, {
        method: 'POST',
      })
    } catch (error) {
      setAuthError(
        'The logout request failed. Please try again. ' +
        (error.message || '')
      )
      setLoggingOut(false)
      return
    }

    setAuthUser(null)
    setProjects([])
    setTasks([])
    setLoggingOut(false)
  }

  // Project form helpers
  function resetProjectForm() {
    setShowProjectForm(false)
    setEditingProject(null)
    setProjectName('')
    setProjectTeam('')
    setProjectDescription('')
    setProjectDeadline('')
    setFormError('')
    setOpenProjectMenu(null)
  }

  function openCreateForm() {
    setEditingProject(null)
    setProjectName('')
    setProjectTeam('')
    setProjectDescription('')
    setProjectDeadline('')
    setFormError('')
    setOpenProjectMenu(null)
    setShowProjectForm(true)
  }

  function openEditForm(project) {
    setEditingProject(project)
    setProjectName(project.name || '')
    setProjectTeam(
      project.team === 'Unassigned team' ? '' : project.team || ''
    )
    setProjectDescription(project.description || '')
    setProjectDeadline(project.deadline || '')
    setFormError('')
    setOpenProjectMenu(null)
    setShowProjectForm(true)
  }

  // Create or update a project
  async function saveProject(event) {
    event.preventDefault()
    setFormError('')

    if (!projectName.trim() || !projectTeam.trim()) {
      setFormError('Please enter both a project name and team.')
      return
    }

    setSaving(true)

    try {
      const isEditing = Boolean(editingProject)

      const savedProject = await apiRequest(
        isEditing
          ? `${API_URL}/${editingProject.id}`
          : API_URL,
        {
          method: isEditing ? 'PUT' : 'POST',
          body: JSON.stringify({
            name: projectName.trim(),
            description: projectDescription.trim(),
            status: editingProject?.status || 'In Progress',
          }),
        }
      )

      const projectForUi = formatProject(
        {
          ...savedProject,
          team: projectTeam.trim(),
          deadline: projectDeadline,
          progress: editingProject?.progress ?? 0,
          color:
            editingProject?.color ||
            COLORS[projects.length % COLORS.length],
        },
        projects.length
      )

      if (isEditing) {
        setProjects(current =>
          current.map(project =>
            project.id === projectForUi.id
              ? projectForUi
              : project
          )
        )
      } else {
        setProjects(current => [...current, projectForUi])
      }

      setApiError('')
      resetProjectForm()
    } catch (error) {
      setFormError(
        error.message || 'Unable to save the project.'
      )
    } finally {
      setSaving(false)
    }
  }

  // Delete project
  async function deleteProject(project) {
    const confirmed = window.confirm(
      `Delete "${project.name}"? This cannot be undone.`
    )

    if (!confirmed) {
      setOpenProjectMenu(null)
      return
    }

    setSaving(true)

    try {
      await apiRequest(`${API_URL}/${project.id}`, {
        method: 'DELETE',
      })

      setProjects(current =>
        current.filter(item => item.id !== project.id)
      )

      setOpenProjectMenu(null)
      setApiError('')
    } catch (error) {
      setApiError(
        error.message || 'Could not delete the project.'
      )
    } finally {
      setSaving(false)
    }
  }

  // Task form helpers
  function resetTaskForm() {
    setShowTaskForm(false)
    setEditingTask(null)
    setTaskTitle('')
    setTaskDescription('')
    setTaskProjectId('')
    setTaskStatus('To Do')
    setTaskPriority('Medium')
    setTaskDueDate('')
    setTaskError('')
  }

  function openCreateTaskForm() {
    setEditingTask(null)
    setTaskTitle('')
    setTaskDescription('')
    setTaskProjectId(
      projects[0]?.id != null ? String(projects[0].id) : ''
    )
    setTaskStatus('To Do')
    setTaskPriority('Medium')
    setTaskDueDate('')
    setTaskError('')
    setShowTaskForm(true)
  }

  function openEditTaskForm(task) {
    setEditingTask(task)
    setTaskTitle(task.title || '')
    setTaskDescription(task.description || '')
    setTaskProjectId(
      task.projectId != null ? String(task.projectId) : ''
    )
    setTaskStatus(task.status || 'To Do')
    setTaskPriority(task.priority || 'Medium')
    setTaskDueDate(task.dueDate || '')
    setTaskError('')
    setShowTaskForm(true)
  }

  // Create or update a task
  async function saveTask(event) {
    event.preventDefault()
    setTaskError('')

    if (!taskTitle.trim()) {
      setTaskError('Please enter a task title.')
      return
    }

    setTaskSaving(true)

    try {
      const isEditing = Boolean(editingTask)

      const savedTask = await apiRequest(
        isEditing
          ? `${TASK_API_URL}/${editingTask.id}`
          : TASK_API_URL,
        {
          method: isEditing ? 'PUT' : 'POST',
          body: JSON.stringify({
            title: taskTitle.trim(),
            description: taskDescription.trim(),
            status: taskStatus,
            priority: taskPriority,
            dueDate: taskDueDate || null,
            projectId: taskProjectId
              ? Number(taskProjectId)
              : null,
          }),
        }
      )

      if (isEditing) {
        setTasks(current =>
          current.map(task =>
            task.id === savedTask.id ? savedTask : task
          )
        )
      } else {
        setTasks(current => [...current, savedTask])
      }

      resetTaskForm()
    } catch (error) {
      setTaskError(
        error.message || 'Unable to save the task.'
      )
    } finally {
      setTaskSaving(false)
    }
  }

  // Delete task
  async function deleteTask(task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return

    setTaskError('')

    try {
      await apiRequest(`${TASK_API_URL}/${task.id}`, {
        method: 'DELETE',
      })

      setTasks(current =>
        current.filter(item => item.id !== task.id)
      )
    } catch (error) {
      setTaskError(
        error.message || 'Could not delete the task.'
      )
    }
  }

  // Derived dashboard statistics
  const completedTasks = tasks.filter(
    task => task.status === 'Done'
  ).length

  const totalTasks = tasks.length

  const completionRate = totalTasks
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const weekEnd = new Date(today)
  weekEnd.setDate(today.getDate() + 7)

  const dueThisWeek = tasks.filter(task => {
    if (!task.dueDate || task.status === 'Done') return false

    const date = new Date(`${task.dueDate}T00:00:00`)
    return date >= today && date <= weekEnd
  }).length

  const overdueTasks = tasks.filter(task => {
    if (!task.dueDate || task.status === 'Done') return false

    return new Date(`${task.dueDate}T00:00:00`) < today
  }).length

  // Search and filters
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const searchText = taskSearch.trim().toLowerCase()

      const matchesSearch =
        String(task.title || '').toLowerCase().includes(searchText) ||
        String(task.description || '').toLowerCase().includes(searchText)

      const matchesStatus =
        taskStatusFilter === 'All' ||
        String(task.status || 'To Do').toLowerCase() ===
          taskStatusFilter.toLowerCase()

      const matchesPriority =
        taskPriorityFilter === 'All' ||
        String(task.priority || 'Medium').toLowerCase() ===
          taskPriorityFilter.toLowerCase()

      const matchesProject =
        taskProjectFilter === 'All' ||
        String(task.projectId ?? '') === taskProjectFilter

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesProject
      )
    })
  }, [
    tasks,
    taskSearch,
    taskStatusFilter,
    taskPriorityFilter,
    taskProjectFilter,
  ])

  // Analytics data
  const taskStatusData = [
    {
      name: 'To Do',
      value: tasks.filter(task => task.status === 'To Do').length,
      color: STATUS_COLORS['To Do'],
    },
    {
      name: 'In Progress',
      value: tasks.filter(task => task.status === 'In Progress').length,
      color: STATUS_COLORS['In Progress'],
    },
    {
      name: 'Done',
      value: completedTasks,
      color: STATUS_COLORS.Done,
    },
  ]

  const projectProgressData = projects.map(project => {
    const projectTasks = tasks.filter(
      task => String(task.projectId) === String(project.id)
    )

    const completed = projectTasks.filter(
      task => task.status === 'Done'
    ).length

    return {
      name:
        (project.name || 'Project').length > 20
          ? `${project.name.slice(0, 20)}...`
          : project.name || 'Project',
      completed,
      remaining: projectTasks.length - completed,
    }
  })

  // Session loading state
  if (authChecking) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#0b0d14',
          color: '#f5f5fa',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h2>FlowForge</h2>
          <p>Checking your session...</p>
        </div>
      </main>
    )
  }

  // Login and registration
  if (!authUser) {
    return (
      <>
        {authError && (
          <div className="project-form-error" role="alert">
            {authError}
          </div>
        )}
        <AuthPage onAuthenticated={user => {
          setAuthUser(user)
          setAuthError('')
        }} />
      </>
    )
  }

  // Main dashboard
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview">
          <span className="brand-icon">F</span>
          <span>
            flowforge<span className="brand-dot">.</span>
          </span>
        </a>

        <div className="workspace-label">WORKSPACE</div>

        <button type="button" className="workspace-switch">
          <span className="workspace-avatar">
            {initials(authUser.name)}
          </span>
          <span className="workspace-name">
            {authUser.name || 'My workspace'}
          </span>
          <span>⌄</span>
        </button>

        <div className="nav-label">MENU</div>

        <nav className="navigation">
          <a className="nav-item active" href="#overview">
            <span>▦</span> Overview
          </a>
          <a className="nav-item" href="#projects">
            <span>◫</span> My projects
          </a>
          <a className="nav-item" href="#tasks">
            <span>☷</span> My tasks
            <span className="nav-count">{tasks.length}</span>
          </a>
          <a className="nav-item" href="#analytics">
            <span>◈</span> Flow Insights
          </a>
          <a className="nav-item" href="#team">
            <span>♧</span> Team members
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-icon">✦</div>
            <strong>Make work flow.</strong>
            <p>
              Bring your team's projects together in one place.
            </p>
            <button
              type="button"
              onClick={() =>
                alert('Workspace settings will be available soon.')
              }
            >
              Explore workspace ↗
            </button>
          </div>

          <a className="nav-item" href="#settings">
            <span>⚙</span> Settings
          </a>

          <div className="profile">
            <div className="profile-avatar">
              {initials(authUser.name)}
            </div>
            <div className="profile-info">
              <strong>{authUser.name}</strong>
              <span>{authUser.email}</span>
            </div>
            <button
              type="button"
              className="text-button"
              onClick={handleLogout}
              disabled={loggingOut}
              title="Log out"
            >
              {loggingOut ? '...' : '↗'}
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content" id="overview">
        <header className="topbar">
          <div className="breadcrumbs">
            Workspace <span>/</span> <strong>Overview</strong>
          </div>

          <div className="topbar-actions">
            <span className="date-label">
              Your workspace at a glance
            </span>

            <div className="top-avatar">
              {initials(authUser.name)}
            </div>

            <button
              type="button"
              className="text-button"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? 'Logging out...' : 'Log out'}
            </button>
          </div>
        </header>

        {authError && (
          <div className="project-form-error" role="alert">
            {authError}
          </div>
        )}

        <section className="welcome-row">
          <div>
            <div className="eyebrow">
              <span className="live-dot" /> YOUR WORKSPACE
            </div>
            <h1>
              Good things are <span>in motion.</span>
            </h1>
            <p className="welcome-description">
              Here's what's happening across your projects today.
            </p>
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={openCreateForm}
          >
            ＋ Create project
          </button>
        </section>

        {apiError && (
          <div className="project-form-error" role="alert">
            {apiError}
          </div>
        )}

        {/* Project form */}
        {showProjectForm && (
          <div
            className="project-modal-backdrop"
            onClick={() => !saving && resetProjectForm()}
          >
            <section
              className="project-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="project-form-title"
              onClick={event => event.stopPropagation()}
            >
              <div className="project-modal-heading">
                <div>
                  <span className="eyebrow">WORKSPACE</span>
                  <h2 id="project-form-title">
                    {editingProject ? 'Edit project' : 'Create a project'}
                  </h2>
                  <p>
                    {editingProject
                      ? 'Update your project details.'
                      : 'Give your next big idea a place to grow.'}
                  </p>
                </div>

                <button
                  type="button"
                  className="modal-close"
                  disabled={saving}
                  onClick={resetProjectForm}
                >
                  ×
                </button>
              </div>

              <form onSubmit={saveProject} className="project-form">
                <label htmlFor="project-name">Project name *</label>
                <input
                  id="project-name"
                  value={projectName}
                  onChange={event => setProjectName(event.target.value)}
                  maxLength={80}
                  required
                  disabled={saving}
                  placeholder="e.g. Customer Portal"
                />

                <label htmlFor="project-team">Team or owner *</label>
                <input
                  id="project-team"
                  value={projectTeam}
                  onChange={event => setProjectTeam(event.target.value)}
                  maxLength={60}
                  required
                  disabled={saving}
                  placeholder="e.g. Engineering team"
                />

                <label htmlFor="project-description">Description</label>
                <textarea
                  id="project-description"
                  value={projectDescription}
                  onChange={event =>
                    setProjectDescription(event.target.value)
                  }
                  rows={3}
                  maxLength={300}
                  disabled={saving}
                  placeholder="What is this project about?"
                />

                <label htmlFor="project-deadline">Target deadline</label>
                <input
                  id="project-deadline"
                  type="date"
                  value={projectDeadline}
                  onChange={event => setProjectDeadline(event.target.value)}
                  disabled={saving}
                />

                {formError && (
                  <p className="project-form-error" role="alert">
                    {formError}
                  </p>
                )}

                <div className="project-form-actions">
                  <button
                    type="button"
                    className="cancel-button"
                    disabled={saving}
                    onClick={resetProjectForm}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={saving}
                  >
                    {saving
                      ? 'Saving...'
                      : editingProject
                        ? 'Save changes'
                        : 'Create project'}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {/* Task form */}
        {showTaskForm && (
          <div
            className="project-modal-backdrop"
            onClick={() => !taskSaving && resetTaskForm()}
          >
            <section
              className="project-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="task-form-title"
              onClick={event => event.stopPropagation()}
            >
              <div className="project-modal-heading">
                <div>
                  <span className="eyebrow">TASK MANAGEMENT</span>
                  <h2 id="task-form-title">
                    {editingTask ? 'Edit task' : 'Create a task'}
                  </h2>
                  <p>Organize work and keep your project moving.</p>
                </div>

                <button
                  type="button"
                  className="modal-close"
                  disabled={taskSaving}
                  onClick={resetTaskForm}
                >
                  ×
                </button>
              </div>

              <form onSubmit={saveTask} className="project-form">
                <label htmlFor="task-title">Task title *</label>
                <input
                  id="task-title"
                  value={taskTitle}
                  onChange={event => setTaskTitle(event.target.value)}
                  required
                  maxLength={150}
                  disabled={taskSaving}
                  placeholder="e.g. Design dashboard"
                />

                <label htmlFor="task-description">Description</label>
                <textarea
                  id="task-description"
                  value={taskDescription}
                  onChange={event =>
                    setTaskDescription(event.target.value)
                  }
                  rows={3}
                  disabled={taskSaving}
                  placeholder="Describe the task..."
                />

                <label htmlFor="task-project">Project</label>
                <select
                  id="task-project"
                  value={taskProjectId}
                  onChange={event => setTaskProjectId(event.target.value)}
                  disabled={taskSaving}
                >
                  <option value="">Unassigned</option>
                  {projects.map(project => (
                    <option key={project.id} value={String(project.id)}>
                      {project.name}
                    </option>
                  ))}
                </select>

                <label htmlFor="task-status">Status</label>
                <select
                  id="task-status"
                  value={taskStatus}
                  onChange={event => setTaskStatus(event.target.value)}
                  disabled={taskSaving}
                >
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>

                <label htmlFor="task-priority">Priority</label>
                <select
                  id="task-priority"
                  value={taskPriority}
                  onChange={event => setTaskPriority(event.target.value)}
                  disabled={taskSaving}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>

                <label htmlFor="task-due-date">Due date</label>
                <input
                  id="task-due-date"
                  type="date"
                  value={taskDueDate}
                  onChange={event => setTaskDueDate(event.target.value)}
                  disabled={taskSaving}
                />

                {taskError && (
                  <p className="project-form-error" role="alert">
                    {taskError}
                  </p>
                )}

                <div className="project-form-actions">
                  <button
                    type="button"
                    className="cancel-button"
                    disabled={taskSaving}
                    onClick={resetTaskForm}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={taskSaving}
                  >
                    {taskSaving
                      ? 'Saving...'
                      : editingTask
                        ? 'Save changes'
                        : 'Create task'}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {/* Statistics */}
        <section className="stats-grid">
          <article className="stat-card">
            <div className="stat-top">
              <span>Total projects</span>
              <span className="stat-icon purple">◫</span>
            </div>
            <div className="stat-number">
              {loading ? '...' : projects.length}
            </div>
            <div className="stat-foot">Projects in this workspace</div>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span>Tasks completed</span>
              <span className="stat-icon green">✓</span>
            </div>
            <div className="stat-number">
              {tasksLoading ? '...' : (
                <>
                  {completedTasks}
                  <span className="stat-muted"> / {totalTasks}</span>
                </>
              )}
            </div>
            <div className="mini-progress">
              <span style={{ width: `${completionRate}%` }} />
            </div>
            <div className="stat-foot">
              {completionRate}% completion rate · Live task data
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span>Active members</span>
              <span className="stat-icon blue">♧</span>
            </div>
            <div className="stat-number">01</div>
            <div className="stat-foot">Registered workspace user</div>
          </article>

          <article className="stat-card">
            <div className="stat-top">
              <span>Due this week</span>
              <span className="stat-icon orange">◷</span>
            </div>
            <div className="stat-number">
              {tasksLoading ? '...' : dueThisWeek.toString().padStart(2, '0')}
            </div>
            <div className="stat-foot">
              <span className="due-warning">{overdueTasks} overdue</span>
              <span> · Live task data</span>
            </div>
          </article>
        </section>

        {/* Projects */}
        <section className="section-block" id="projects">
          <div className="section-heading">
            <div>
              <h2>Projects in motion</h2>
              <p>A little progress, every day.</p>
            </div>
            <button
              type="button"
              className="text-button"
              onClick={openCreateForm}
            >
              ＋ New project
            </button>
          </div>

          {loading ? (
            <p>Loading projects from your database...</p>
          ) : (
            <div className="project-grid">
              {projects.map(project => {
                const projectTasks = tasks.filter(
                  task => String(task.projectId) === String(project.id)
                )

                const done = projectTasks.filter(
                  task => task.status === 'Done'
                ).length

                const progress = projectTasks.length
                  ? Math.round((done / projectTasks.length) * 100)
                  : project.progress

                return (
                  <article className="project-card" key={project.id}>
                    <div className="project-card-top">
                      <span
                        className="project-mark"
                        style={{ background: project.color }}
                      />

                      <div style={{ position: 'relative', zIndex: 2 }}>
                        <button
                          type="button"
                          className="project-menu"
                          aria-label={`Options for ${project.name}`}
                          aria-expanded={openProjectMenu === project.id}
                          onClick={() =>
                            setOpenProjectMenu(current =>
                              current === project.id ? null : project.id
                            )
                          }
                        >
                          •••
                        </button>

                        {openProjectMenu === project.id && (
                          <div className="project-dropdown" role="menu">
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => openEditForm(project)}
                            >
                              Edit Project
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              disabled={saving}
                              onClick={() => deleteProject(project)}
                            >
                              Delete Project
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <h3>{project.name}</h3>
                    <p className="project-team">{project.team}</p>

                    {project.description && (
                      <p className="project-description">
                        {project.description}
                      </p>
                    )}

                    <div className="project-progress-label">
                      <span>Progress</span>
                      <strong>{progress}%</strong>
                    </div>

                    <div className="project-progress">
                      <span
                        style={{
                          width: `${progress}%`,
                          background: project.color,
                        }}
                      />
                    </div>

                    <div className="project-footer">
                      <span>{projectTasks.length} tasks</span>
                      <span className="team-pills">
                        <i>{initials(authUser.name)}</i>
                      </span>
                    </div>

                    {project.deadline && (
                      <p className="project-deadline">
                        Target date: {project.deadline}
                      </p>
                    )}
                  </article>
                )
              })}
            </div>
          )}

          {!loading && projects.length === 0 && (
            <p>No projects yet. Create your first project to get started.</p>
          )}
        </section>

        {/* Tasks and filters */}
        <section className="section-block" id="tasks">
          <div className="section-heading">
            <div>
              <h2>On your radar</h2>
              <p>Your tasks saved in the FlowForge database.</p>
            </div>
            <button
              type="button"
              className="primary-button"
              onClick={openCreateTaskForm}
            >
              ＋ Create task
            </button>
          </div>

          {taskError && (
            <div className="project-form-error" role="alert">
              {taskError}
            </div>
          )}

          {tasksLoading ? (
            <p>Loading tasks from your database...</p>
          ) : (
            <>
              <div
                className="task-filters"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <input
                  type="search"
                  value={taskSearch}
                  onChange={event => setTaskSearch(event.target.value)}
                  placeholder="Search title or description..."
                  aria-label="Search tasks"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '12px 13px',
                    border: '1px solid #36394b',
                    borderRadius: 10,
                    background: '#10121c',
                    color: '#f5f5fa',
                    font: 'inherit',
                  }}
                />

                <select
                  value={taskStatusFilter}
                  onChange={event => setTaskStatusFilter(event.target.value)}
                  aria-label="Filter by status"
                >
                  <option value="All">All statuses</option>
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>

                <select
                  value={taskPriorityFilter}
                  onChange={event => setTaskPriorityFilter(event.target.value)}
                  aria-label="Filter by priority"
                >
                  <option value="All">All priorities</option>
                  <option value="Low">Low priority</option>
                  <option value="Medium">Medium priority</option>
                  <option value="High">High priority</option>
                </select>

                <select
                  value={taskProjectFilter}
                  onChange={event => setTaskProjectFilter(event.target.value)}
                  aria-label="Filter by project"
                >
                  <option value="All">All projects</option>
                  {projects.map(project => (
                    <option key={project.id} value={String(project.id)}>
                      {project.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    setTaskSearch('')
                    setTaskStatusFilter('All')
                    setTaskPriorityFilter('All')
                    setTaskProjectFilter('All')
                  }}
                >
                  Reset filters
                </button>
              </div>

              <p style={{ margin: '0 0 12px', color: '#a1a1b5', fontSize: 13 }}>
                Showing {filteredTasks.length} of {tasks.length} tasks
              </p>

              <div className="task-table">
                <div className="task-table-head">
                  <span>Task</span>
                  <span>Project</span>
                  <span>Priority</span>
                  <span>Status</span>
                </div>

                {filteredTasks.map(task => {
                  const project = projects.find(
                    item => String(item.id) === String(task.projectId)
                  )

                  const statusClass = String(task.status || 'To Do')
                    .toLowerCase()
                    .replace(/\s+/g, '-')

                  const priorityClass = String(task.priority || 'Medium')
                    .toLowerCase()

                  return (
                    <div className="task-row" key={task.id}>
                      <div className="task-title">
                        <span
                          className={`task-check ${
                            task.status === 'Done' ? 'checked' : ''
                          }`}
                        >
                          {task.status === 'Done' ? '✓' : ''}
                        </span>
                        <span>{task.title}</span>
                      </div>

                      <span className="task-project">
                        {project?.name ||
                          (task.projectId
                            ? `Project ${task.projectId}`
                            : 'Unassigned')}
                      </span>

                      <span>
                        <span className={`priority ${priorityClass}`}>
                          {task.priority || 'Medium'}
                        </span>
                      </span>

                      <span>
                        <span className={`status ${statusClass}`}>
                          {task.status || 'To Do'}
                        </span>

                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 6,
                            marginTop: 8,
                          }}
                        >
                          <button
                            type="button"
                            className="text-button"
                            onClick={() => openEditTaskForm(task)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="cancel-button"
                            onClick={() => deleteTask(task)}
                          >
                            Delete
                          </button>
                        </div>
                      </span>
                    </div>
                  )
                })}

                {tasks.length === 0 && (
                  <p style={{ padding: 18 }}>
                    No tasks yet. Create your first task.
                  </p>
                )}

                {tasks.length > 0 && filteredTasks.length === 0 && (
                  <p style={{ padding: 18 }}>
                    No tasks match your filters. Try resetting them.
                  </p>
                )}
              </div>
            </>
          )}
        </section>

        {/* Analytics */}
        <section
          className="section-block"
          id="analytics"
          style={{ marginTop: 32 }}
        >
          <div className="section-heading">
            <div>
              <h2>FlowForge Analytics</h2>
              <p>Understand your team's progress at a glance.</p>
            </div>
            <span className="status in-progress">Live task data</span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
              gap: 20,
            }}
          >
            <article
              className="project-card"
              style={{ minWidth: 0, padding: 20 }}
            >
              <h3 style={{ marginTop: 0 }}>Task status distribution</h3>
              <p className="project-team">
                Breakdown of all tasks by status.
              </p>

              {tasks.length === 0 ? (
                <div
                  style={{
                    height: 260,
                    display: 'grid',
                    placeItems: 'center',
                    color: '#a1a1b5',
                  }}
                >
                  Create tasks to see analytics.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={taskStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      outerRadius={85}
                      innerRadius={48}
                      paddingAngle={3}
                    >
                      {taskStatusData.map(item => (
                        <Cell key={item.name} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: '#171923',
                        border: '1px solid #36394b',
                        borderRadius: 8,
                        color: '#fff',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  gap: 10,
                  flexWrap: 'wrap',
                }}
              >
                {taskStatusData.map(item => (
                  <div key={item.name}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: item.color,
                        marginRight: 6,
                      }}
                    />
                    <span style={{ color: '#a1a1b5', fontSize: 12 }}>
                      {item.name}
                    </span>
                    <strong style={{ marginLeft: 6 }}>{item.value}</strong>
                  </div>
                ))}
              </div>
            </article>

            <article
              className="project-card"
              style={{ minWidth: 0, padding: 20 }}
            >
              <h3 style={{ marginTop: 0 }}>Project task completion</h3>
              <p className="project-team">
                Completed versus remaining tasks per project.
              </p>

              {projectProgressData.length === 0 ? (
                <div
                  style={{
                    height: 260,
                    display: 'grid',
                    placeItems: 'center',
                    color: '#a1a1b5',
                  }}
                >
                  Create a project to see progress.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={projectProgressData}
                    margin={{
                      top: 15,
                      right: 8,
                      left: -18,
                      bottom: 35,
                    }}
                  >
                    <CartesianGrid stroke="#303241" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#a1a1b5', fontSize: 10 }}
                      angle={-20}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: '#a1a1b5', fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#171923',
                        border: '1px solid #36394b',
                        borderRadius: 8,
                        color: '#fff',
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="completed"
                      name="Completed"
                      stackId="tasks"
                      fill="#10b981"
                    />
                    <Bar
                      dataKey="remaining"
                      name="Remaining"
                      stackId="tasks"
                      fill="#8b5cf6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </article>
          </div>

          <div className="stats-grid" style={{ marginTop: 20 }}>
            <article className="stat-card">
              <div className="stat-top">
                <span>All tasks</span>
                <span className="stat-icon purple">☷</span>
              </div>
              <div className="stat-number">{tasks.length}</div>
              <div className="stat-foot">
                Total tasks across your workspace
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span>Completion rate</span>
                <span className="stat-icon green">✓</span>
              </div>
              <div className="stat-number">{completionRate}%</div>
              <div className="stat-foot">
                {completedTasks} of {totalTasks} tasks completed
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span>Upcoming this week</span>
                <span className="stat-icon orange">◷</span>
              </div>
              <div className="stat-number">{dueThisWeek}</div>
              <div className="stat-foot">
                Tasks due in the next seven days
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span>Overdue tasks</span>
                <span className="stat-icon orange">!</span>
              </div>
              <div className="stat-number">{overdueTasks}</div>
              <div className="stat-foot">
                Uncompleted tasks past their due date
              </div>
            </article>
          </div>
        </section>

        {/* Insights */}
        <section className="insights-banner" id="insights">
          <div className="insights-symbol">✳</div>
          <div>
            <span className="insights-label">
              FLOW INSIGHTS · PREVIEW
            </span>
            <h2>Keep the momentum going.</h2>
            <p>
              Your task completion and deadline statistics use live task
              data. More insights can be added as the workspace grows.
            </p>
          </div>
          <span className="insights-arrow">↗</span>
        </section>

        <footer className="footer">
          <span>© 2026 FlowForge</span>
          <span>Thoughtfully built for teams that move forward.</span>
          <span>Made to make work flow <b>✦</b></span>
        </footer>
      </main>
    </div>
  )
}

export default App
