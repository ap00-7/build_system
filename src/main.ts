import './style.css'
import { jobs, type Job } from './jobs.ts'

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

type FilterState = {
  keyword: string
  location: string
  mode: string
  experience: string
  source: string
  sort: 'latest' | 'match' | 'salary'
  showOnlyMatches: boolean
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const SAVED_JOBS_KEY = 'kn-saved-jobs'
const PREFERENCES_KEY = 'jobTrackerPreferences'
const DIGEST_PREFIX = 'jobTrackerDigest_'

type DigestEntry = { id: string; matchScore: number }

function getTodayDateKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function getDigestKey(dateKey: string): string {
  return `${DIGEST_PREFIX}${dateKey}`
}

function readDigest(dateKey: string): DigestEntry[] | null {
  try {
    const raw = window.localStorage.getItem(getDigestKey(dateKey))
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return null
    return parsed.filter(
      (x): x is DigestEntry =>
        x && typeof x === 'object' && typeof (x as DigestEntry).id === 'string' && typeof (x as DigestEntry).matchScore === 'number',
    )
  } catch {
    return null
  }
}

function writeDigest(dateKey: string, entries: DigestEntry[]): void {
  try {
    window.localStorage.setItem(getDigestKey(dateKey), JSON.stringify(entries))
  } catch {
    /* ignore */
  }
}

function generateDigestJobs(prefs: JobTrackerPreferences): DigestEntry[] {
  const scored = jobs.map((job) => ({
    ...job,
    matchScore: computeMatchScore(job, prefs),
  }))
  const sorted = scored.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore
    return a.postedDaysAgo - b.postedDaysAgo
  })
  return sorted.slice(0, 10).map((j) => ({ id: j.id, matchScore: j.matchScore }))
}

function formatDigestDate(dateKey: string): string {
  const d = new Date(dateKey)
  return d.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function digestToPlainText(entries: DigestEntry[]): string {
  const lines: string[] = [
    'Top 10 Jobs For You — 9AM Digest',
    formatDigestDate(getTodayDateKey()),
    '',
  ]
  entries.forEach((e, i) => {
    const job = findJobById(e.id)
    if (!job) return
    lines.push(`${i + 1}. ${job.title} | ${job.company}`)
    lines.push(`   ${job.location} · ${formatExperience(job.experience)} · ${e.matchScore}% match`)
    lines.push(`   ${job.applyUrl}`)
    lines.push('')
  })
  lines.push('This digest was generated based on your preferences.')
  return lines.join('\n')
}

type JobTrackerPreferences = {
  roleKeywords: string
  preferredLocations: string[]
  preferredMode: ('Remote' | 'Hybrid' | 'Onsite')[]
  experienceLevel: string
  skills: string
  minMatchScore: number
}

const DEFAULT_PREFERENCES: JobTrackerPreferences = {
  roleKeywords: '',
  preferredLocations: [],
  preferredMode: [],
  experienceLevel: '',
  skills: '',
  minMatchScore: 40,
}

function readPreferences(): JobTrackerPreferences {
  try {
    const raw = window.localStorage.getItem(PREFERENCES_KEY)
    if (!raw) return { ...DEFAULT_PREFERENCES }
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_PREFERENCES }
    const p = parsed as Record<string, unknown>
    return {
      roleKeywords: typeof p.roleKeywords === 'string' ? p.roleKeywords : '',
      preferredLocations: Array.isArray(p.preferredLocations)
        ? p.preferredLocations.filter((x): x is string => typeof x === 'string')
        : [],
      preferredMode: Array.isArray(p.preferredMode)
        ? p.preferredMode.filter(
            (x): x is 'Remote' | 'Hybrid' | 'Onsite' =>
              x === 'Remote' || x === 'Hybrid' || x === 'Onsite',
          )
        : [],
      experienceLevel: typeof p.experienceLevel === 'string' ? p.experienceLevel : '',
      skills: typeof p.skills === 'string' ? p.skills : '',
      minMatchScore:
        typeof p.minMatchScore === 'number' && p.minMatchScore >= 0 && p.minMatchScore <= 100
          ? p.minMatchScore
          : 40,
    }
  } catch {
    return { ...DEFAULT_PREFERENCES }
  }
}

function writePreferences(prefs: JobTrackerPreferences): void {
  try {
    window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs))
  } catch {
    /* ignore */
  }
}

function hasPreferencesSet(prefs: JobTrackerPreferences): boolean {
  return (
    prefs.roleKeywords.trim() !== '' ||
    prefs.preferredLocations.length > 0 ||
    prefs.preferredMode.length > 0 ||
    prefs.experienceLevel !== '' ||
    prefs.skills.trim() !== ''
  )
}

function computeMatchScore(job: Job, prefs: JobTrackerPreferences): number {
  let score = 0

  const roleKeywords = prefs.roleKeywords
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  const titleLower = job.title.toLowerCase()
  const descLower = job.description.toLowerCase()

  if (roleKeywords.length > 0) {
    const inTitle = roleKeywords.some((kw) => titleLower.includes(kw))
    if (inTitle) score += 25
    const inDesc = roleKeywords.some((kw) => descLower.includes(kw))
    if (inDesc) score += 15
  }

  if (prefs.preferredLocations.length > 0) {
    const match = prefs.preferredLocations.some((loc) =>
      job.location.toLowerCase().includes(loc.toLowerCase()),
    )
    if (match) score += 15
  }

  if (prefs.preferredMode.length > 0 && prefs.preferredMode.includes(job.mode)) {
    score += 10
  }

  if (prefs.experienceLevel && job.experience === prefs.experienceLevel) {
    score += 10
  }

  const userSkills = prefs.skills
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  if (userSkills.length > 0) {
    const jobSkillsLower = job.skills.map((s) => s.toLowerCase())
    const overlap = userSkills.some((us) =>
      jobSkillsLower.some((js) => js.includes(us) || us.includes(js)),
    )
    if (overlap) score += 15
  }

  if (job.postedDaysAgo <= 2) score += 5
  if (job.source === 'LinkedIn') score += 5

  return Math.min(100, score)
}

function extractSalaryNumber(salaryRange: string): number {
  const m = salaryRange.match(/(\d+)/)
  return m ? parseInt(m[1], 10) : 0
}

function getMatchBadgeClass(score: number): string {
  if (score >= 80) return 'kn-match-badge kn-match-high'
  if (score >= 60) return 'kn-match-badge kn-match-medium'
  if (score >= 40) return 'kn-match-badge kn-match-neutral'
  return 'kn-match-badge kn-match-low'
}

function readSavedJobIds(): string[] {
  try {
    const raw = window.localStorage.getItem(SAVED_JOBS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is string => typeof id === 'string')
  } catch {
    return []
  }
}

function writeSavedJobIds(ids: string[]): void {
  try {
    window.localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(ids))
  } catch {
    // ignore storage errors
  }
}

function isJobSaved(id: string): boolean {
  return readSavedJobIds().includes(id)
}

function toggleSavedJob(id: string): void {
  const current = readSavedJobIds()
  const exists = current.includes(id)
  const next = exists ? current.filter((x) => x !== id) : [...current, id]
  writeSavedJobIds(next)
}

function findJobById(id: string): Job | undefined {
  return jobs.find((job) => job.id === id)
}

function formatExperience(exp: Job['experience']): string {
  return exp === 'Fresher' ? 'Fresher' : `${exp} yrs`
}

function formatPostedAgo(days: number): string {
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

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
    const prefs = readPreferences()
    const prefsSet = hasPreferencesSet(prefs)

    container.innerHTML = `
      <div class="kn-dashboard">
        ${!prefsSet ? `
        <div class="kn-banner kn-banner-info" id="kn-preferences-banner">
          <span>Set your preferences to activate intelligent matching.</span>
          <a href="/settings" data-route class="kn-banner-link">Go to Settings</a>
        </div>
        ` : ''}
        <div class="kn-filter-bar">
          <div class="kn-filter-row">
            <div class="kn-filter-field">
              <label class="kn-label" for="kn-filter-keyword">Search</label>
              <input id="kn-filter-keyword" class="kn-input" placeholder="Role or company" />
            </div>
            <div class="kn-filter-field">
              <label class="kn-label" for="kn-filter-location">Location</label>
              <select id="kn-filter-location" class="kn-input kn-select">
                <option value="all">All</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Chennai">Chennai</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Pune">Pune</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Noida">Noida</option>
                <option value="Gurugram">Gurugram</option>
                <option value="Kolkata">Kolkata</option>
                <option value="Mysuru">Mysuru</option>
              </select>
            </div>
            <div class="kn-filter-field">
              <label class="kn-label" for="kn-filter-mode">Mode</label>
              <select id="kn-filter-mode" class="kn-input kn-select">
                <option value="all">All</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Onsite">Onsite</option>
              </select>
            </div>
          </div>
          <div class="kn-filter-row">
            <div class="kn-filter-field">
              <label class="kn-label" for="kn-filter-experience">Experience</label>
              <select id="kn-filter-experience" class="kn-input kn-select">
                <option value="all">All</option>
                <option value="Fresher">Fresher</option>
                <option value="0-1">0-1</option>
                <option value="1-3">1-3</option>
                <option value="3-5">3-5</option>
              </select>
            </div>
            <div class="kn-filter-field">
              <label class="kn-label" for="kn-filter-source">Source</label>
              <select id="kn-filter-source" class="kn-input kn-select">
                <option value="all">All</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Naukri">Naukri</option>
                <option value="Indeed">Indeed</option>
              </select>
            </div>
            <div class="kn-filter-field">
              <label class="kn-label" for="kn-filter-sort">Sort</label>
              <select id="kn-filter-sort" class="kn-input kn-select">
                <option value="latest">Latest</option>
                <option value="match">Match Score</option>
                <option value="salary">Salary</option>
              </select>
            </div>
          </div>
          <div class="kn-filter-row kn-filter-toggle-row">
            <label class="kn-toggle-label">
              <input type="checkbox" id="kn-show-only-matches" class="kn-checkbox" />
              <span>Show only jobs above my threshold</span>
            </label>
          </div>
        </div>
        <div id="kn-job-list" class="kn-job-list"></div>
      </div>
    `

    const state: FilterState = {
      keyword: '',
      location: 'all',
      mode: 'all',
      experience: 'all',
      source: 'all',
      sort: 'latest',
      showOnlyMatches: false,
    }

    const keywordInput = container.querySelector<HTMLInputElement>('#kn-filter-keyword')
    const locationSelect = container.querySelector<HTMLSelectElement>('#kn-filter-location')
    const modeSelect = container.querySelector<HTMLSelectElement>('#kn-filter-mode')
    const experienceSelect = container.querySelector<HTMLSelectElement>('#kn-filter-experience')
    const sourceSelect = container.querySelector<HTMLSelectElement>('#kn-filter-source')
    const sortSelect = container.querySelector<HTMLSelectElement>('#kn-filter-sort')
    const showOnlyMatchesCheckbox = container.querySelector<HTMLInputElement>('#kn-show-only-matches')
    const listEl = container.querySelector<HTMLDivElement>('#kn-job-list')

    type JobWithScore = Job & { matchScore: number }

    function applyFilters(): JobWithScore[] {
      let next = jobs.map((job) => ({
        ...job,
        matchScore: computeMatchScore(job, prefs),
      }))

      if (state.keyword.trim()) {
        const kw = state.keyword.trim().toLowerCase()
        next = next.filter(
          (job) =>
            job.title.toLowerCase().includes(kw) ||
            job.company.toLowerCase().includes(kw),
        )
      }

      if (state.location !== 'all') {
        next = next.filter((job) => job.location.includes(state.location))
      }

      if (state.mode !== 'all') {
        next = next.filter((job) => job.mode === state.mode)
      }

      if (state.experience !== 'all') {
        next = next.filter((job) => job.experience === state.experience)
      }

      if (state.source !== 'all') {
        next = next.filter((job) => job.source === state.source)
      }

      if (state.showOnlyMatches) {
        next = next.filter((job) => job.matchScore >= prefs.minMatchScore)
      }

      if (state.sort === 'latest') {
        next.sort((a, b) => a.postedDaysAgo - b.postedDaysAgo)
      } else if (state.sort === 'match') {
        next.sort((a, b) => b.matchScore - a.matchScore)
      } else if (state.sort === 'salary') {
        next.sort(
          (a, b) => extractSalaryNumber(b.salaryRange) - extractSalaryNumber(a.salaryRange),
        )
      }

      return next
    }

    function renderJobs(list: JobWithScore[]) {
      if (!listEl) return
      if (list.length === 0) {
        listEl.innerHTML = `
          <div class="kn-empty-state kn-empty-state-premium">
            <div class="kn-empty-state-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            <h2 class="kn-heading-2">No roles match your criteria</h2>
            <p class="kn-body-text kn-body-muted kn-empty-state-desc">
              Adjust filters or lower your match threshold in Settings.
            </p>
          </div>
        `
        return
      }

      const items = list
        .map((job) => {
          const badgeClass = getMatchBadgeClass(job.matchScore)
          return `
            <article class="kn-card kn-job-card" data-job-id="${job.id}">
              <header class="kn-job-header">
                <div>
                  <h3 class="kn-heading-3">${job.title}</h3>
                  <p class="kn-body-text kn-body-muted">${job.company}</p>
                </div>
                <div class="kn-job-header-badges">
                  <span class="${badgeClass}">${job.matchScore}% match</span>
                  <span class="kn-tag kn-tag-source">${job.source}</span>
                </div>
              </header>
              <div class="kn-job-meta">
                <span>${job.location} · ${job.mode}</span>
                <span>${formatExperience(job.experience)}</span>
                <span>${job.salaryRange}</span>
                <span>${formatPostedAgo(job.postedDaysAgo)}</span>
              </div>
              <div class="kn-job-actions">
                <button type="button" class="kn-button kn-button-secondary kn-job-view" data-job-id="${job.id}">
                  View
                </button>
                <button type="button" class="kn-button kn-button-secondary kn-job-save" data-job-id="${job.id}">
                  ${isJobSaved(job.id) ? 'Saved' : 'Save'}
                </button>
                <button type="button" class="kn-button kn-button-primary kn-job-apply" data-job-id="${job.id}">
                  Apply
                </button>
              </div>
            </article>
          `
        })
        .join('')

      listEl.innerHTML = items
      attachJobCardHandlers(listEl)
    }

    function handleFilterChange() {
      const filtered = applyFilters()
      renderJobs(filtered)
    }

    keywordInput?.addEventListener('input', () => {
      state.keyword = keywordInput?.value ?? ''
      handleFilterChange()
    })

    locationSelect?.addEventListener('change', () => {
      state.location = locationSelect?.value ?? 'all'
      handleFilterChange()
    })

    modeSelect?.addEventListener('change', () => {
      state.mode = modeSelect?.value ?? 'all'
      handleFilterChange()
    })

    experienceSelect?.addEventListener('change', () => {
      state.experience = experienceSelect?.value ?? 'all'
      handleFilterChange()
    })

    sourceSelect?.addEventListener('change', () => {
      state.source = sourceSelect?.value ?? 'all'
      handleFilterChange()
    })

    sortSelect?.addEventListener('change', () => {
      const value = sortSelect?.value as 'latest' | 'match' | 'salary'
      state.sort = value
      handleFilterChange()
    })

    showOnlyMatchesCheckbox?.addEventListener('change', () => {
      state.showOnlyMatches = showOnlyMatchesCheckbox?.checked ?? false
      handleFilterChange()
    })

    handleFilterChange()
    return
  }

  if (pathname === '/settings') {
    const prefs = readPreferences()
    container.innerHTML = `
      <div class="kn-card kn-settings-card">
        <div class="kn-settings-header">
          <h2 class="kn-heading-2">Preferences</h2>
          <p class="kn-body-text kn-body-muted">
            Set your job preferences for intelligent matching on the Dashboard.
          </p>
        </div>
        <form id="kn-preferences-form" class="kn-settings-grid">
          <div class="kn-field-group">
            <label class="kn-label" for="role-keywords">Role keywords</label>
            <input id="role-keywords" class="kn-input" placeholder="e.g. React, SDE Intern, Backend Developer" value="${escapeHtml(prefs.roleKeywords)}" />
          </div>
          <div class="kn-field-group">
            <label class="kn-label" for="preferred-locations">Preferred locations</label>
            <select id="preferred-locations" class="kn-input kn-select" multiple size="4">
              <option value="Bengaluru" ${prefs.preferredLocations.includes('Bengaluru') ? 'selected' : ''}>Bengaluru</option>
              <option value="Chennai" ${prefs.preferredLocations.includes('Chennai') ? 'selected' : ''}>Chennai</option>
              <option value="Hyderabad" ${prefs.preferredLocations.includes('Hyderabad') ? 'selected' : ''}>Hyderabad</option>
              <option value="Pune" ${prefs.preferredLocations.includes('Pune') ? 'selected' : ''}>Pune</option>
              <option value="Mumbai" ${prefs.preferredLocations.includes('Mumbai') ? 'selected' : ''}>Mumbai</option>
              <option value="Noida" ${prefs.preferredLocations.includes('Noida') ? 'selected' : ''}>Noida</option>
              <option value="Gurugram" ${prefs.preferredLocations.includes('Gurugram') ? 'selected' : ''}>Gurugram</option>
              <option value="Kolkata" ${prefs.preferredLocations.includes('Kolkata') ? 'selected' : ''}>Kolkata</option>
              <option value="Mysuru" ${prefs.preferredLocations.includes('Mysuru') ? 'selected' : ''}>Mysuru</option>
            </select>
            <span class="kn-hint">Hold Ctrl/Cmd to select multiple</span>
          </div>
          <div class="kn-field-group">
            <label class="kn-label">Preferred mode</label>
            <div class="kn-checkbox-group">
              <label class="kn-checkbox-label">
                <input type="checkbox" name="preferred-mode" value="Remote" ${prefs.preferredMode.includes('Remote') ? 'checked' : ''} />
                <span>Remote</span>
              </label>
              <label class="kn-checkbox-label">
                <input type="checkbox" name="preferred-mode" value="Hybrid" ${prefs.preferredMode.includes('Hybrid') ? 'checked' : ''} />
                <span>Hybrid</span>
              </label>
              <label class="kn-checkbox-label">
                <input type="checkbox" name="preferred-mode" value="Onsite" ${prefs.preferredMode.includes('Onsite') ? 'checked' : ''} />
                <span>Onsite</span>
              </label>
            </div>
          </div>
          <div class="kn-field-group">
            <label class="kn-label" for="experience-level">Experience level</label>
            <select id="experience-level" class="kn-input kn-select">
              <option value="">Any</option>
              <option value="Fresher" ${prefs.experienceLevel === 'Fresher' ? 'selected' : ''}>Fresher</option>
              <option value="0-1" ${prefs.experienceLevel === '0-1' ? 'selected' : ''}>0-1 yrs</option>
              <option value="1-3" ${prefs.experienceLevel === '1-3' ? 'selected' : ''}>1-3 yrs</option>
              <option value="3-5" ${prefs.experienceLevel === '3-5' ? 'selected' : ''}>3-5 yrs</option>
            </select>
          </div>
          <div class="kn-field-group">
            <label class="kn-label" for="skills">Skills</label>
            <input id="skills" class="kn-input" placeholder="e.g. React, Java, Python, SQL" value="${escapeHtml(prefs.skills)}" />
          </div>
          <div class="kn-field-group">
            <label class="kn-label" for="min-match-score">Minimum match threshold (0–100)</label>
            <div class="kn-slider-row">
              <input type="range" id="min-match-score" class="kn-slider" min="0" max="100" value="${prefs.minMatchScore}" />
              <span id="min-match-score-value" class="kn-slider-value">${prefs.minMatchScore}</span>
            </div>
          </div>
          <div class="kn-field-group">
            <button type="submit" class="kn-button kn-button-primary">Save preferences</button>
          </div>
        </form>
      </div>
    `
    const form = container.querySelector<HTMLFormElement>('#kn-preferences-form')
    const slider = container.querySelector<HTMLInputElement>('#min-match-score')
    const sliderValue = container.querySelector<HTMLSpanElement>('#min-match-score-value')
    slider?.addEventListener('input', () => {
      if (sliderValue) sliderValue.textContent = slider.value
    })
    form?.addEventListener('submit', (e) => {
      e.preventDefault()
      const roleKeywords = (container.querySelector<HTMLInputElement>('#role-keywords')?.value ?? '').trim()
      const locSelect = container.querySelector<HTMLSelectElement>('#preferred-locations')
      const preferredLocations = Array.from(locSelect?.selectedOptions ?? []).map((o) => o.value)
      const modeCheckboxes = container.querySelectorAll<HTMLInputElement>('input[name="preferred-mode"]:checked')
      const preferredMode = Array.from(modeCheckboxes).map((c) => c.value as 'Remote' | 'Hybrid' | 'Onsite')
      const experienceLevel = container.querySelector<HTMLSelectElement>('#experience-level')?.value ?? ''
      const skills = (container.querySelector<HTMLInputElement>('#skills')?.value ?? '').trim()
      const minMatchScore = Math.min(100, Math.max(0, parseInt(slider?.value ?? '40', 10)))
      writePreferences({
        roleKeywords,
        preferredLocations,
        preferredMode,
        experienceLevel,
        skills,
        minMatchScore,
      })
      const target: RoutePath = '/dashboard'
      window.history.pushState({ path: target }, '', target)
      renderRoute(target)
      setActiveLink(target)
    })
    return
  }

  if (pathname === '/saved') {
    const savedIds = readSavedJobIds()
    const savedJobs = jobs.filter((job) => savedIds.includes(job.id))

    if (savedJobs.length === 0) {
      container.innerHTML = `
        <div class="kn-empty-state kn-empty-state-premium">
          <div class="kn-empty-state-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h2 class="kn-heading-2">Your saved jobs</h2>
          <p class="kn-body-text kn-body-muted kn-empty-state-desc">
            Save roles that interest you from the Dashboard. They'll appear here for focused review when you're ready to apply.
          </p>
          <a href="/dashboard" data-route class="kn-button kn-button-primary kn-empty-state-cta">
            Browse jobs
          </a>
        </div>
      `
      const cta = container.querySelector<HTMLAnchorElement>('.kn-empty-state-cta')
      cta?.addEventListener('click', (e) => {
        e.preventDefault()
        const target: RoutePath = '/dashboard'
        window.history.pushState({ path: target }, '', target)
        renderRoute(target)
        setActiveLink(target)
      })
      return
    }

    container.innerHTML = `
      <div class="kn-saved">
        <div class="kn-saved-header">
          <h2 class="kn-heading-2">Saved roles</h2>
          <p class="kn-body-text kn-body-muted">
            A focused view of roles you want to keep an eye on.
          </p>
        </div>
        <div id="kn-saved-list" class="kn-job-list"></div>
      </div>
    `

    const listEl = container.querySelector<HTMLDivElement>('#kn-saved-list')

    if (listEl) {
      const items = savedJobs
        .map((job) => {
          return `
            <article class="kn-card kn-job-card" data-job-id="${job.id}">
              <header class="kn-job-header">
                <div>
                  <h3 class="kn-heading-3">${job.title}</h3>
                  <p class="kn-body-text kn-body-muted">${job.company}</p>
                </div>
                <span class="kn-tag kn-tag-source">${job.source}</span>
              </header>
              <div class="kn-job-meta">
                <span>${job.location} · ${job.mode}</span>
                <span>${formatExperience(job.experience)}</span>
                <span>${job.salaryRange}</span>
                <span>${formatPostedAgo(job.postedDaysAgo)}</span>
              </div>
              <div class="kn-job-actions">
                <button type="button" class="kn-button kn-button-secondary kn-job-view" data-job-id="${job.id}">
                  View
                </button>
                <button type="button" class="kn-button kn-button-secondary kn-job-save" data-job-id="${job.id}">
                  Saved
                </button>
                <button type="button" class="kn-button kn-button-primary kn-job-apply" data-job-id="${job.id}">
                  Apply
                </button>
              </div>
            </article>
          `
        })
        .join('')

      listEl.innerHTML = items
      attachJobCardHandlers(listEl)
    }

    return
  }

  if (pathname === '/digest') {
    const prefs = readPreferences()
    const prefsSet = hasPreferencesSet(prefs)
    const dateKey = getTodayDateKey()
    let digestEntries = readDigest(dateKey)

    function renderDigest() {
      if (!container) return
      if (!prefsSet) {
        container.innerHTML = `
          <div class="kn-digest-blocking">
            <div class="kn-empty-state-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            <h2 class="kn-heading-2">Set preferences to generate a personalized digest.</h2>
            <p class="kn-body-text kn-body-muted kn-empty-state-desc">
              Go to Settings to configure your role keywords, locations, mode, and skills.
            </p>
            <a href="/settings" data-route class="kn-button kn-button-primary kn-empty-state-cta">Go to Settings</a>
          </div>
        `
        return
      }

      if (!digestEntries || digestEntries.length === 0) {
        const hasTried = digestEntries !== null && digestEntries.length === 0
        container.innerHTML = `
          <div class="kn-digest-container">
            ${hasTried ? `
              <p class="kn-body-text kn-body-muted kn-digest-empty">
                No matching roles today. Check again tomorrow.
              </p>
            ` : `
              <p class="kn-body-text kn-body-muted kn-digest-prompt">
                Generate your personalized 9AM digest based on your preferences.
              </p>
            `}
            <p class="kn-body-text kn-body-muted kn-digest-note">
              Demo Mode: Daily 9AM trigger simulated manually.
            </p>
            <button type="button" class="kn-button kn-button-primary" id="kn-digest-generate">
              Generate Today's 9AM Digest (Simulated)
            </button>
          </div>
        `
        attachDigestGenerate()
        return
      }

      const jobDetails = digestEntries
        .map((e) => findJobById(e.id))
        .filter((j): j is Job => j != null)

      if (jobDetails.length === 0) {
        digestEntries = []
        renderDigest()
        return
      }

      container.innerHTML = `
        <div class="kn-digest-container">
          <div class="kn-digest-card">
            <header class="kn-digest-header">
              <h2 class="kn-heading-2">Top 10 Jobs For You — 9AM Digest</h2>
              <p class="kn-body-text kn-body-muted">${formatDigestDate(dateKey)}</p>
            </header>
            <div class="kn-digest-jobs">
              ${jobDetails
                .map((job) => {
                  const entry = digestEntries!.find((e) => e.id === job.id)!
                  const badgeClass = getMatchBadgeClass(entry.matchScore)
                  return `
                    <article class="kn-digest-job">
                      <div class="kn-digest-job-main">
                        <h3 class="kn-heading-3">${job.title}</h3>
                        <p class="kn-body-text kn-body-muted">${job.company}</p>
                        <div class="kn-digest-job-meta">
                          <span>${job.location}</span>
                          <span>${formatExperience(job.experience)}</span>
                          <span class="${badgeClass}">${entry.matchScore}% match</span>
                        </div>
                      </div>
                      <a href="${job.applyUrl}" target="_blank" rel="noopener" class="kn-button kn-button-primary kn-digest-apply">Apply</a>
                    </article>
                  `
                })
                .join('')}
            </div>
            <footer class="kn-digest-footer">
              <p class="kn-body-text kn-body-muted">
                This digest was generated based on your preferences.
              </p>
            </footer>
          </div>
          <div class="kn-digest-actions">
            <button type="button" class="kn-button kn-button-secondary" id="kn-digest-copy">
              Copy Digest to Clipboard
            </button>
            <a href="#" id="kn-digest-email" class="kn-button kn-button-secondary">Create Email Draft</a>
          </div>
          <p class="kn-digest-note">Demo Mode: Daily 9AM trigger simulated manually.</p>
        </div>
      `

      const copyBtn = container.querySelector<HTMLButtonElement>('#kn-digest-copy')
      const emailLink = container.querySelector<HTMLAnchorElement>('#kn-digest-email')
      const plainText = digestToPlainText(digestEntries)

      copyBtn?.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(plainText)
          copyBtn.textContent = 'Copied!'
          setTimeout(() => {
            copyBtn.textContent = 'Copy Digest to Clipboard'
          }, 2000)
        } catch {
          /* fallback or ignore */
        }
      })

      const subject = encodeURIComponent('My 9AM Job Digest')
      const body = encodeURIComponent(plainText)
      emailLink?.setAttribute('href', `mailto:?subject=${subject}&body=${body}`)
    }

    function attachDigestGenerate() {
      if (!container) return
      const btn = container.querySelector<HTMLButtonElement>('#kn-digest-generate')
      btn?.addEventListener('click', () => {
        const existing = readDigest(dateKey)
        if (existing && existing.length > 0) {
          digestEntries = existing
          renderDigest()
          return
        }
        digestEntries = generateDigestJobs(prefs)
        if (digestEntries.length === 0) {
          writeDigest(dateKey, [])
          renderDigest()
          return
        }
        writeDigest(dateKey, digestEntries)
        renderDigest()
      })
    }

    renderDigest()
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

function attachJobCardHandlers(root: HTMLElement) {
  const viewButtons = root.querySelectorAll<HTMLButtonElement>('.kn-job-view')
  const saveButtons = root.querySelectorAll<HTMLButtonElement>('.kn-job-save')
  const applyButtons = root.querySelectorAll<HTMLButtonElement>('.kn-job-apply')

  viewButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.getAttribute('data-job-id')
      if (!id) return
      const job = findJobById(id)
      if (!job) return
      openJobModal(job)
    })
  })

  saveButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.getAttribute('data-job-id')
      if (!id) return
      toggleSavedJob(id)
      const saved = isJobSaved(id)
      button.textContent = saved ? 'Saved' : 'Save'
      const path = normalizePath(window.location.pathname)
      if (path === '/saved' && !saved) {
        renderRoute('/saved')
        setActiveLink('/saved')
      }
    })
  })

  applyButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.getAttribute('data-job-id')
      if (!id) return
      const job = findJobById(id)
      if (!job) return
      window.open(job.applyUrl, '_blank', 'noopener')
    })
  })
}

function openJobModal(job: Job) {
  const existing = document.querySelector<HTMLElement>('.kn-modal-overlay')
  existing?.remove()

  const overlay = document.createElement('div')
  overlay.className = 'kn-modal-overlay'
  overlay.innerHTML = `
    <div class="kn-modal">
      <header class="kn-modal-header">
        <div>
          <h2 class="kn-heading-2">${job.title}</h2>
          <p class="kn-body-text kn-body-muted">${job.company} · ${job.location} · ${job.mode}</p>
        </div>
        <button type="button" class="kn-button kn-button-secondary kn-modal-close">
          Close
        </button>
      </header>
      <section class="kn-modal-body">
        <div class="kn-modal-section">
          <h3 class="kn-heading-3">Description</h3>
          <p class="kn-body-text kn-modal-description"></p>
        </div>
        <div class="kn-modal-section">
          <h3 class="kn-heading-3">Skills</h3>
          <div class="kn-skill-chips"></div>
        </div>
      </section>
    </div>
  `

  const descriptionEl = overlay.querySelector<HTMLParagraphElement>('.kn-modal-description')
  if (descriptionEl) {
    descriptionEl.textContent = job.description
  }

  const skillsEl = overlay.querySelector<HTMLDivElement>('.kn-skill-chips')
  if (skillsEl) {
    job.skills.forEach((skill) => {
      const chip = document.createElement('span')
      chip.className = 'kn-tag kn-tag-skill'
      chip.textContent = skill
      skillsEl.appendChild(chip)
    })
  }

  const closeButton = overlay.querySelector<HTMLButtonElement>('.kn-modal-close')
  closeButton?.addEventListener('click', () => {
    overlay.remove()
  })

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      overlay.remove()
    }
  })

  document.body.appendChild(overlay)
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

  document.addEventListener('click', (event) => {
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[data-route]')
    if (!link) return
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
