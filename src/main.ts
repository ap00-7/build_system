import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="kn-app">
    <header class="kn-topbar">
      <div class="kn-topbar-left">
        <span class="kn-project-name">KodNest Premium Build System</span>
      </div>
      <div class="kn-topbar-center">
        <span class="kn-progress-text">Step 1 / 4</span>
      </div>
      <div class="kn-topbar-right">
        <span class="kn-badge kn-badge-status-in-progress">In Progress</span>
      </div>
    </header>

    <main class="kn-main">
      <section class="kn-context-header">
        <h1 class="kn-heading-1">Job Notification Tracker</h1>
        <p class="kn-body-text kn-body-muted">
          Keep a calm overview of your job updates and follow-ups.
        </p>
      </section>

      <section class="kn-workspace">
        <div class="kn-workspace-primary">
          <nav class="kn-subnav">
            <div class="kn-subnav-left">
              <span class="kn-subnav-title">Job Notification Tracker</span>
            </div>
            <button class="kn-subnav-toggle" aria-label="Toggle navigation">
              <span></span>
              <span></span>
              <span></span>
            </button>
            <div class="kn-subnav-links">
              <a href="/dashboard" data-route class="kn-subnav-link">Dashboard</a>
              <a href="/saved" data-route class="kn-subnav-link">Saved</a>
              <a href="/digest" data-route class="kn-subnav-link">Digest</a>
              <a href="/settings" data-route class="kn-subnav-link">Settings</a>
              <a href="/proof" data-route class="kn-subnav-link">Proof</a>
            </div>
          </nav>

          <section class="kn-route" id="kn-route-root"></section>
        </div>

        <aside class="kn-workspace-secondary"></aside>
      </section>
    </main>

    <footer class="kn-proof-footer">
      <div class="kn-proof-item">
        <label class="kn-proof-label">
          <input type="checkbox" class="kn-checkbox" />
          <span class="kn-proof-text">UI Built</span>
        </label>
        <input
          class="kn-input kn-proof-input"
          placeholder="Link to UI or note"
        />
      </div>

      <div class="kn-proof-item">
        <label class="kn-proof-label">
          <input type="checkbox" class="kn-checkbox" />
          <span class="kn-proof-text">Logic Working</span>
        </label>
        <input
          class="kn-input kn-proof-input"
          placeholder="Describe how logic was validated"
        />
      </div>

      <div class="kn-proof-item">
        <label class="kn-proof-label">
          <input type="checkbox" class="kn-checkbox" />
          <span class="kn-proof-text">Test Passed</span>
        </label>
        <input
          class="kn-input kn-proof-input"
          placeholder="Reference for passing test"
        />
      </div>

      <div class="kn-proof-item">
        <label class="kn-proof-label">
          <input type="checkbox" class="kn-checkbox" />
          <span class="kn-proof-text">Deployed</span>
        </label>
        <input
          class="kn-input kn-proof-input"
          placeholder="Deployment link or environment"
        />
      </div>
    </footer>
  </div>
`

type RoutePath = '/' | '/dashboard' | '/saved' | '/digest' | '/settings' | '/proof'

type RouteKey = RoutePath | 'not-found'

function normalizePath(pathname: string): RouteKey {
  const cleaned = (pathname || '/').toLowerCase()
  if (cleaned === '/') return '/'
  if (cleaned === '/dashboard') return '/dashboard'
  if (cleaned === '/saved') return '/saved'
  if (cleaned === '/digest') return '/digest'
  if (cleaned === '/settings') return '/settings'
  if (cleaned === '/proof') return '/proof'
  return 'not-found'
}

function renderRoute(pathname: RouteKey) {
  const container = document.getElementById('kn-route-root')
  if (!container) return

  if (pathname === 'not-found') {
    container.innerHTML = `
      <div class="kn-empty-state">
        <h2 class="kn-heading-2">Page Not Found</h2>
        <p class="kn-body-text kn-body-muted">
          The page you are looking for does not exist.
        </p>
      </div>
    `
    return
  }

  if (pathname === '/') {
    container.innerHTML = `
      <div class="kn-hero">
        <h2 class="kn-heading-1">Stop Missing The Right Jobs.</h2>
        <p class="kn-body-text kn-body-muted">
          Precision-matched job discovery delivered daily at 9AM.
        </p>
        <div class="kn-hero-actions">
          <button type="button" class="kn-button kn-button-primary" id="kn-cta-start">
            Start Tracking
          </button>
        </div>
      </div>
    `

    const cta = document.getElementById('kn-cta-start')
    cta?.addEventListener('click', () => {
      const target: RoutePath = '/settings'
      window.history.pushState({ path: target }, '', target)
      renderRoute(target)
      setActiveLink(target)
    })
    return
  }

  if (pathname === '/dashboard') {
    container.innerHTML = `
      <div class="kn-card kn-dashboard-card">
        <h2 class="kn-heading-2">Dashboard</h2>
        <p class="kn-body-text kn-body-muted">
          No jobs yet. In the next step, you will load a realistic dataset.
        </p>
      </div>
    `
    return
  }

  if (pathname === '/settings') {
    container.innerHTML = `
      <div class="kn-card kn-settings-card">
        <div class="kn-settings-header">
          <h2 class="kn-heading-2">Settings</h2>
          <p class="kn-body-text kn-body-muted">
            This section will be built in the next step.
          </p>
        </div>
        <div class="kn-settings-grid">
          <div class="kn-field-group">
            <label class="kn-label" for="role-keywords">Role keywords</label>
            <input id="role-keywords" class="kn-input" placeholder="Example: Frontend Engineer, Product Designer" />
          </div>
          <div class="kn-field-group">
            <label class="kn-label" for="preferred-locations">Preferred locations</label>
            <input id="preferred-locations" class="kn-input" placeholder="Cities, regions, or time zones" />
          </div>
          <div class="kn-field-group">
            <label class="kn-label" for="mode">Mode</label>
            <select id="mode" class="kn-input kn-select">
              <option>Remote</option>
              <option>Hybrid</option>
              <option>Onsite</option>
            </select>
          </div>
          <div class="kn-field-group">
            <label class="kn-label" for="experience-level">Experience level</label>
            <input id="experience-level" class="kn-input" placeholder="Example: Junior, Mid, Senior" />
          </div>
        </div>
      </div>
    `
    return
  }

  if (pathname === '/saved') {
    container.innerHTML = `
      <div class="kn-card kn-empty-card">
        <h2 class="kn-heading-2">Saved</h2>
        <p class="kn-body-text kn-body-muted">
          When you mark roles that matter, they will appear here for calm review.
        </p>
      </div>
    `
    return
  }

  if (pathname === '/digest') {
    container.innerHTML = `
      <div class="kn-card kn-empty-card">
        <h2 class="kn-heading-2">Digest</h2>
        <p class="kn-body-text kn-body-muted">
          Your daily 9AM job digest will be designed here in the next step.
        </p>
      </div>
    `
    return
  }

  if (pathname === '/proof') {
    container.innerHTML = `
      <div class="kn-card kn-empty-card">
        <h2 class="kn-heading-2">Proof</h2>
        <p class="kn-body-text kn-body-muted">
          Placeholders for screenshots, links, and artifacts will live here once collection is added.
        </p>
      </div>
    `
    return
  }
}

function setActiveLink(pathname: RouteKey) {
  const links = document.querySelectorAll<HTMLAnchorElement>('.kn-subnav-link')
  links.forEach((link) => {
    const href = link.getAttribute('href') || '/'
    const normalized = normalizePath(href)
    if (pathname !== 'not-found' && pathname !== '/' && normalized === pathname) {
      link.classList.add('kn-subnav-link-active')
    } else {
      link.classList.remove('kn-subnav-link-active')
    }
  })
}

function setupNavigation() {
  const subnav = document.querySelector<HTMLElement>('.kn-subnav')
  const toggle = document.querySelector<HTMLButtonElement>('.kn-subnav-toggle')

  toggle?.addEventListener('click', () => {
    if (!subnav) return
    const isOpen = subnav.classList.contains('kn-subnav-open')
    subnav.classList.toggle('kn-subnav-open', !isOpen)
  })

  const links = document.querySelectorAll<HTMLAnchorElement>('[data-route]')
  links.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault()
      const href = link.getAttribute('href') || '/'
      const normalized = normalizePath(href) as RoutePath
      window.history.pushState({ path: normalized }, '', normalized)
      renderRoute(normalized)
      setActiveLink(normalized)
      if (subnav) {
        subnav.classList.remove('kn-subnav-open')
      }
    })
  })

  window.addEventListener('popstate', (event) => {
    const state = event.state as { path?: RouteKey } | null
    const pathname = (state && state.path) || window.location.pathname
    const normalized = normalizePath(pathname)
    renderRoute(normalized)
    setActiveLink(normalized)
  })
}

const initialPath = normalizePath(window.location.pathname)
renderRoute(initialPath)
setActiveLink(initialPath)
setupNavigation()
