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
        <h1 class="kn-heading-1">Define the build workspace</h1>
        <p class="kn-body-text kn-body-muted">
          Set the structure and expectations for this build step.
        </p>
      </section>

      <section class="kn-workspace">
        <div class="kn-workspace-primary">
          <div class="kn-card">
            <h2 class="kn-heading-2">Primary workspace example</h2>
            <p class="kn-body-text">
              This area represents the main surface where configuration and primary interactions take place.
            </p>

            <div class="kn-form">
              <div class="kn-form-field">
                <label class="kn-label" for="field-name">Name</label>
                <input
                  id="field-name"
                  class="kn-input"
                  placeholder="Internal name for this step"
                />
              </div>

              <div class="kn-form-field kn-form-field-inline">
                <div class="kn-form-field">
                  <label class="kn-label" for="field-scope">Scope</label>
                  <input
                    id="field-scope"
                    class="kn-input"
                    placeholder="Example: Checkout"
                  />
                </div>
                <div class="kn-form-field">
                  <label class="kn-label" for="field-environment">Environment</label>
                  <input
                    id="field-environment"
                    class="kn-input kn-input-error"
                    placeholder="Select environment"
                  />
                  <p class="kn-helper-text kn-helper-text-error">
                    Provide an environment to keep this step predictable.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="kn-card kn-card-empty">
            <h3 class="kn-heading-3">No items added yet</h3>
            <p class="kn-body-text kn-body-muted">
              When you add items, they will appear here in a simple, readable list.
            </p>
            <button class="kn-button kn-button-primary" type="button">
              Add first item
            </button>
          </div>
        </div>

        <aside class="kn-workspace-secondary">
          <div class="kn-card kn-side-panel">
            <h3 class="kn-heading-3">Step explanation</h3>
            <p class="kn-body-text kn-body-muted">
              Use this panel to keep a short explanation and working prompt close to the configuration.
            </p>

            <div class="kn-panel-section">
              <label class="kn-label" for="prompt">Prompt</label>
              <div class="kn-prompt-box">
                <pre id="prompt" class="kn-prompt-text">
Summarize the intent of this step in one or two calm sentences.</pre>
              </div>
            </div>

            <div class="kn-button-group">
              <button class="kn-button kn-button-secondary" type="button">Copy</button>
              <button class="kn-button kn-button-secondary" type="button">Build in Lovable</button>
              <button class="kn-button kn-button-secondary" type="button">It Worked</button>
              <button class="kn-button kn-button-secondary" type="button">Error</button>
              <button class="kn-button kn-button-secondary" type="button">Add Screenshot</button>
            </div>
          </div>
        </aside>
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
