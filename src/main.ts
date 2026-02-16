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

          <section class="kn-route">
            <h2 id="kn-route-title" class="kn-heading-2"></h2>
            <p id="kn-route-subtext" class="kn-body-text kn-body-muted">
              This section will be built in the next step.
            </p>
          </section>
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

type RouteConfig = {
  title: string
}

const routes: Record<RoutePath, RouteConfig> = {
  '/': { title: 'Dashboard' },
  '/dashboard': { title: 'Dashboard' },
  '/saved': { title: 'Saved' },
  '/digest': { title: 'Digest' },
  '/settings': { title: 'Settings' },
  '/proof': { title: 'Proof' },
}

function normalizePath(pathname: string): RouteKey {
  const cleaned = (pathname || '/').toLowerCase()
  if (cleaned === '/' || cleaned === '/dashboard') return '/dashboard'
  if (cleaned === '/saved') return '/saved'
  if (cleaned === '/digest') return '/digest'
  if (cleaned === '/settings') return '/settings'
  if (cleaned === '/proof') return '/proof'
  return 'not-found'
}

function renderRoute(pathname: RouteKey) {
  const titleEl = document.getElementById('kn-route-title')
  const subtextEl = document.getElementById('kn-route-subtext')

  if (pathname === 'not-found') {
    if (titleEl) {
      titleEl.textContent = 'Page Not Found'
    }
    if (subtextEl) {
      subtextEl.textContent = 'The page you are looking for does not exist.'
    }
  } else {
    const config = routes[pathname] ?? routes['/dashboard']
    if (titleEl) {
      titleEl.textContent = config.title
    }
    if (subtextEl) {
      subtextEl.textContent = 'This section will be built in the next step.'
    }
  }
}

function setActiveLink(pathname: RouteKey) {
  const links = document.querySelectorAll<HTMLAnchorElement>('.kn-subnav-link')
  links.forEach((link) => {
    const href = link.getAttribute('href') || '/'
    const normalized = normalizePath(href)
    if (pathname !== 'not-found' && normalized === pathname) {
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
