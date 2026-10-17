import { useEffect, useMemo, useState } from 'react'
import {
  Activity, ArrowDownRight, ArrowUpRight, BriefcaseBusiness, CalendarDays,
  Check, CheckCircle2, ChevronDown, CircleHelp, Clapperboard, Clock3,
  Compass, DollarSign, GraduationCap, LayoutDashboard, LogOut, Menu,
  Plus, Search, Settings2, Sparkles, Target, Trash2, TrendingUp, X,
  Pencil, Wallet, BookOpen, Building2
} from 'lucide-react'
import { supabase } from './lib/supabase.js'

const modules = [
  { id: 'tasks', label: 'Task Manager', short: 'Tasks', icon: CheckCircle2, color: 'violet', description: 'Keep the important things moving.' },
  { id: 'career', label: 'Career Growth', short: 'Career', icon: GraduationCap, color: 'blue', description: 'Chemical engineering, skills and opportunities.' },
  { id: 'business', label: 'Business Growth', short: 'Business', icon: Building2, color: 'orange', description: 'Capture ideas and move them forward.' },
  { id: 'review', label: 'Review Time', short: 'Reviews', icon: Clock3, color: 'green', description: 'Reflect on your day and where your time went.' },
  { id: 'entertainment', label: 'Entertainment Review', short: 'Leisure', icon: Clapperboard, color: 'pink', description: 'Keep a thoughtful record of what you enjoy.' },
  { id: 'spend', label: 'Spend Manager', short: 'Spending', icon: Wallet, color: 'teal', description: 'Understand where your money goes.' },
]
const statusLabels = { active: 'To do', in_progress: 'In progress', completed: 'Completed', archived: 'Archived' }
const todayISO = () => new Date().toLocaleDateString('en-CA')
const emptyForm = (module) => ({ module, title: '', details: '', category: '', status: 'active', due_date: '', amount: '', duration_minutes: '', rating: '', task_horizon: 'today', task_area: 'personal' })
const taskHorizon = (entry) => entry.task_horizon || (entry.due_date && entry.due_date > todayISO() ? 'long_term' : 'today')
const taskArea = (entry) => entry.task_area || 'personal'
const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value || 0))
const niceDate = (value) => value ? new Date(value + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No date'

function AuthScreen() {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const submit = async (event) => {
    event.preventDefault()
    setBusy(true); setNotice('')
    try {
      const result = mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + window.location.pathname } })
      if (result.error) throw result.error
      if (mode === 'signup' && !result.data.session) setNotice('Account created. Check your email to confirm your address, then sign in.')
    } catch (error) { setNotice(error.message || 'Could not complete authentication.') }
    finally { setBusy(false) }
  }
  return <main className="auth-shell">
    <div className="auth-art">
      <div className="brand brand-light"><div className="brand-mark"><Compass size={22} /></div><span>ReConstruct</span></div>
      <div className="auth-art-copy">
        <span className="eyebrow">YOUR PERSONAL OPERATING SYSTEM</span>
        <h1>Make room for<br /><em>what matters.</em></h1>
        <p>One thoughtful space for your work, growth, money and the life outside your to-do list.</p>
        <div className="orbit-card"><Sparkles size={18} /><span>Small steps. Clear progress.</span><span className="orbit-dot" /></div>
      </div>
      <div className="art-footer">Built for progress, not pressure.</div>
    </div>
    <section className="auth-panel">
      <div className="auth-mobile-brand"><div className="brand-mark"><Compass size={22} /></div><strong>ReConstruct</strong></div>
      <div className="auth-card">
        <span className="eyebrow muted">{mode === 'signin' ? 'WELCOME BACK' : 'START FRESH'}</span>
        <h2>{mode === 'signin' ? 'Good to have you back.' : 'Create your space.'}</h2>
        <p className="muted">Sign in to keep your personal hub in sync.</p>
        <form onSubmit={submit} className="auth-form">
          <label>Email address<input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required /></label>
          <label>Password<input type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} minLength="6" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" required /></label>
          {notice && <div className="notice">{notice}</div>}
          <button className="primary-btn full" disabled={busy}>{busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'} <span>→</span></button>
        </form>
        <p className="auth-switch">{mode === 'signin' ? 'New to ReConstruct?' : 'Already have an account?'} <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setNotice('') }}>{mode === 'signin' ? 'Create an account' : 'Sign in'}</button></p>
        <div className="secure-note"><Check size={14} /> Your records are private to your account.</div>
      </div>
    </section>
  </main>
}

function EntryModal({ initial, onClose, onSave, busy }) {
  const [form, setForm] = useState(initial)
  const mod = modules.find(m => m.id === form.module) || modules[0]
  const set = (key, value) => setForm(old => ({ ...old, [key]: value }))
  const submit = (e) => { e.preventDefault(); onSave({ ...form, amount: form.amount === '' ? null : Number(form.amount), duration_minutes: form.duration_minutes === '' ? null : Number(form.duration_minutes), rating: form.rating === '' ? null : Number(form.rating), due_date: form.due_date || null }) }
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <form className="entry-modal" onSubmit={submit}>
      <div className="modal-head"><div><span className="eyebrow muted">{initial.id ? 'EDIT RECORD' : 'NEW RECORD'}</span><h2>{form.module === 'tasks' ? 'Task' : initial.id ? 'Make an update' : 'Add to your hub'}</h2></div><button type="button" className="icon-btn" onClick={onClose}><X size={19} /></button></div>
      <label>Title<input autoFocus maxLength="200" value={form.title} onChange={e => set('title', e.target.value)} placeholder={form.module === 'spend' ? 'e.g. Lunch with friends' : form.module === 'career' ? 'e.g. Revise heat transfer fundamentals' : 'What would you like to record?'} required /></label>
      {form.module === 'tasks' ? <>
        {form.task_horizon === 'long_term' && <label>Due date<input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} /></label>}
      </> : <>
        <div className="form-grid">
          <label>{form.module === 'spend' ? 'Expense type' : form.module === 'career' ? 'Focus area' : form.module === 'entertainment' ? 'Format' : 'Category'}<input value={form.category} onChange={e => set('category', e.target.value)} placeholder={form.module === 'career' ? 'Mass transfer, DWSIM, internship…' : 'Optional'} /></label>
          <label>{form.module === 'spend' ? 'Amount (₹)' : form.module === 'review' ? 'Time spent (minutes)' : form.module === 'entertainment' ? 'Rating (0–5)' : 'Status'}
            {form.module === 'spend' ? <input type="number" min="0" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" /> : form.module === 'review' ? <input type="number" min="0" step="1" value={form.duration_minutes} onChange={e => set('duration_minutes', e.target.value)} placeholder="Minutes" /> : form.module === 'entertainment' ? <input type="number" min="0" max="5" step="0.5" value={form.rating} onChange={e => set('rating', e.target.value)} placeholder="e.g. 4.5" /> : <select value={form.status} onChange={e => set('status', e.target.value)}>{Object.entries(statusLabels).filter(([v]) => v !== 'archived').map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select>}
          </label>
        </div>
        <label>{form.module === 'spend' ? 'Date of spend' : form.module === 'review' ? 'Review date' : 'Due date'}<input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} /></label>
      </>}
      <label>Notes<textarea rows="3" value={form.details} onChange={e => set('details', e.target.value)} placeholder={form.module === 'tasks' ? 'Add a simple note (optional)…' : form.module === 'career' ? 'Key concept, next practice step, links or notes…' : 'Add a little context for future you…'} /></label>
      <div className="modal-actions"><button type="button" className="secondary-btn" onClick={onClose}>Cancel</button><button className="primary-btn" disabled={busy || !form.title.trim()}>{busy ? 'Saving…' : initial.id ? 'Save changes' : 'Save record'} <span>→</span></button></div>
    </form>
  </div>
}

function App() {
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [entries, setEntries] = useState([])
  const [activeModule, setActiveModule] = useState('dashboard')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [mobileNav, setMobileNav] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthReady(true) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => { setSession(nextSession); setAuthReady(true) })
    return () => subscription.unsubscribe()
  }, [])

  const loadEntries = async () => {
    if (!session?.user?.id) return
    setLoading(true); setError('')
    const { data, error: queryError } = await supabase.from('entries').select('*').order('created_at', { ascending: false })
    if (queryError) setError(queryError.message)
    else setEntries(data || [])
    setLoading(false)
  }
  useEffect(() => { if (session) loadEntries(); else setEntries([]) }, [session?.user?.id])

  const visibleEntries = useMemo(() => entries.filter(item => {
    const moduleMatch = activeModule === 'dashboard' || item.module === activeModule
    const q = search.trim().toLowerCase()
    return moduleMatch && (!q || [item.title, item.details, item.category].some(v => (v || '').toLowerCase().includes(q)))
  }), [entries, activeModule, search])
  const totalSpend = entries.filter(e => e.module === 'spend' && (!e.due_date || e.due_date.slice(0,7) === todayISO().slice(0,7))).reduce((s,e) => s + Number(e.amount || 0), 0)
  const completed = entries.filter(e => e.status === 'completed').length
  const openTasks = entries.filter(e => e.module === 'tasks' && e.status !== 'completed' && e.status !== 'archived')
  const reviewMinutes = entries.filter(e => e.module === 'review' && (!e.due_date || e.due_date === todayISO())).reduce((s,e) => s + Number(e.duration_minutes || 0), 0)
  const moduleMeta = modules.find(m => m.id === activeModule)
  const heading = activeModule === 'dashboard' ? 'Your overview' : moduleMeta?.label || 'Your overview'

  const saveEntry = async (form) => {
    setBusy(true); setError('')
    const payload = { module: form.module, title: form.title.trim(), details: form.details || '', category: form.category || '', status: form.status || 'active', due_date: form.module === 'tasks' ? ((form.task_horizon || 'today') === 'long_term' ? (form.due_date || null) : null) : (form.due_date || null), amount: form.amount ?? null, duration_minutes: form.duration_minutes ?? null, rating: form.rating ?? null, task_horizon: form.module === 'tasks' ? (form.task_horizon || 'today') : null, task_area: form.module === 'tasks' ? (form.task_area || 'personal') : null, user_id: session.user.id }
    const result = form.id
      ? await supabase.from('entries').update(payload).eq('id', form.id).select().single()
      : await supabase.from('entries').insert(payload).select().single()
    if (result.error) { setError(result.error.message); setBusy(false); return }
    setEntries(old => form.id ? old.map(e => e.id === form.id ? result.data : e) : [result.data, ...old])
    setBusy(false); setShowModal(false); setEditing(null); setToast(form.id ? 'Record updated' : 'Record saved')
    window.setTimeout(() => setToast(''), 2800)
  }
  const deleteEntry = async (entry) => {
    if (!window.confirm('Delete this record? This cannot be undone.')) return
    const { error: deleteError } = await supabase.from('entries').delete().eq('id', entry.id)
    if (deleteError) setError(deleteError.message)
    else { setEntries(old => old.filter(e => e.id !== entry.id)); setToast('Record deleted'); window.setTimeout(() => setToast(''), 2800) }
  }
  const toggleComplete = async (entry) => {
    const status = entry.status === 'completed' ? 'active' : 'completed'
    const { data, error: updateError } = await supabase.from('entries').update({ status }).eq('id', entry.id).select().single()
    if (updateError) setError(updateError.message)
    else setEntries(old => old.map(e => e.id === entry.id ? data : e))
  }
  const openCreate = (module = activeModule === 'dashboard' ? 'tasks' : activeModule, taskDefaults = {}) => { setEditing({ ...emptyForm(module), ...taskDefaults }); setShowModal(true) }
  const openEdit = (entry) => { setEditing({ ...entry, task_horizon: taskHorizon(entry), task_area: taskArea(entry), amount: entry.amount ?? '', duration_minutes: entry.duration_minutes ?? '', rating: entry.rating ?? '', due_date: entry.due_date ?? '' }); setShowModal(true) }

  if (!authReady) return <div className="loading-screen"><div className="brand-mark"><Compass size={22} /></div><span>Preparing your space…</span></div>
  if (!session) return <AuthScreen />

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Compass size={22} /></div><span>ReConstruct</span><button className="mobile-close icon-btn" onClick={() => setMobileNav(false)}><X size={18} /></button></div>
      <div className="side-caption">WORKSPACE</div>
      <button className={`nav-item ${activeModule === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveModule('dashboard'); setMobileNav(false) }}><LayoutDashboard size={18} /><span>Overview</span></button>
      {modules.map(m => <button key={m.id} className={`nav-item ${activeModule === m.id ? 'active' : ''}`} onClick={() => { setActiveModule(m.id); setMobileNav(false) }}><m.icon size={18} /><span>{m.label}</span>{m.id === 'tasks' && openTasks.length > 0 && <span className="nav-count">{openTasks.length}</span>}</button>)}
      <div className="sidebar-bottom">
        <div className="side-tip"><div className="tip-icon"><Sparkles size={16} /></div><strong>A little progress adds up.</strong><p>Keep showing up for the person you're becoming.</p></div>
        <div className="user-row"><div className="avatar">{(session.user.email || 'R').slice(0,1).toUpperCase()}</div><div className="user-meta"><strong>{session.user.email?.split('@')[0]}</strong><span>Personal workspace</span></div><button className="icon-btn logout-btn" title="Sign out" onClick={() => supabase.auth.signOut()}><LogOut size={17} /></button></div>
      </div>
    </aside>
    {mobileNav && <button aria-label="Close navigation" className="mobile-scrim" onClick={() => setMobileNav(false)} />}
    <main className="main-area">
      <header className="topbar"><div className="topbar-left"><button className="mobile-menu icon-btn" onClick={() => setMobileNav(true)}><Menu size={20} /></button><div className="breadcrumb">Workspace <span>/</span> <strong>{heading}</strong></div></div><div className="topbar-right">{activeModule !== 'tasks' && <><div className="today-pill"><CalendarDays size={15} /> {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</div><button className="top-add" onClick={() => openCreate()}><Plus size={17} /> <span>New record</span></button></>}</div></header>
      <div className="page-content">
        <section className="page-heading"><div><div className="eyebrow muted">{activeModule === 'dashboard' ? 'A CLEARER VIEW OF YOUR DAY' : 'YOUR PERSONAL WORKSPACE'}</div><h1>{heading}<span className="heading-period">.</span></h1><p>{activeModule === 'dashboard' ? 'A little structure for everything you’re building.' : moduleMeta?.description}</p></div>{activeModule !== 'dashboard' && activeModule !== 'tasks' && <button className="primary-btn" onClick={() => openCreate()}><Plus size={17} /> Add new</button>}</section>
        {error && <div className="error-banner"><CircleHelp size={17} /><span>{error}</span><button onClick={() => setError('')}><X size={16} /></button></div>}
        {activeModule === 'dashboard' ? <>
          <section className="welcome-banner"><div className="welcome-copy"><span className="welcome-tag"><Sparkles size={14} /> YOUR SPACE, YOUR PACE</span><h2>Build a life that feels<br />like <em>your own.</em></h2><p>Make progress in the things that matter, one day at a time.</p><button onClick={() => openCreate('tasks')} className="welcome-btn">Capture a task <span>↗</span></button></div><div className="welcome-graphic"><div className="graphic-ring ring-one" /><div className="graphic-ring ring-two" /><div className="graphic-core"><Compass size={42} strokeWidth={1.3} /></div><div className="float-note note-one"><CheckCircle2 size={15} /> One thing at a time</div><div className="float-note note-two"><TrendingUp size={15} /> Keep growing</div></div></section>
          <section className="stat-grid">
            <StatCard icon={Target} label="Open tasks" value={openTasks.length} note="Ready for your attention" color="violet" />
            <StatCard icon={CheckCircle2} label="Completed" value={completed} note="All-time wins recorded" color="green" />
            <StatCard icon={Clock3} label="Review time" value={reviewMinutes >= 60 ? `${Math.floor(reviewMinutes/60)}h ${reviewMinutes%60}m` : `${reviewMinutes}m`} note="Logged today" color="blue" />
            <StatCard icon={Wallet} label="Spending this month" value={money(totalSpend)} note="Based on dated entries" color="orange" />
          </section>
          <div className="section-row"><div><h2>Your spaces</h2><p>Six parts of your life, one place to keep them moving.</p></div><span className="subtle-count">06 SECTIONS</span></div>
          <section className="module-grid">{modules.map((m, i) => {
            const count = entries.filter(e => e.module === m.id).length
            return <button className="module-card" key={m.id} onClick={() => setActiveModule(m.id)}><div className={`module-icon ${m.color}`}><m.icon size={20} /></div><div className="module-card-copy"><h3>{m.label}</h3><p>{m.description}</p><span className="module-count">{count} {count === 1 ? 'record' : 'records'}</span></div><span className="module-arrow">↗</span></button>
          })}</section>
          <div className="section-row recent-heading"><div><h2>Recently added</h2><p>Your latest notes and next steps.</p></div><button className="text-btn" onClick={() => { setActiveModule('dashboard'); document.getElementById('records-area')?.scrollIntoView({ behavior: 'smooth' }) }}>View all <span>→</span></button></div>
        </> : activeModule === 'tasks' ? <section className="task-progress-summary">
          {['personal','professional'].map(area => {
            const todayTasks = entries.filter(e => e.module === 'tasks' && taskHorizon(e) === 'today' && taskArea(e) === area && e.status !== 'archived')
            const done = todayTasks.filter(e => e.status === 'completed').length
            return <div className={`task-progress-card ${area}`} key={area}><div className="task-progress-label"><span className={`task-area-icon ${area}`}>{area === 'personal' ? '✦' : '↗'}</span><strong>{area === 'personal' ? 'Personal tasks' : 'Professional tasks'}</strong></div><div className="task-progress-numbers"><strong>{done}</strong><span>completed</span><i>/</i><strong>{todayTasks.length}</strong><span>entered</span></div><div className="task-progress-track"><i style={{width: `${todayTasks.length ? done / todayTasks.length * 100 : 0}%`}} /></div></div>
          })}
        </section> : <section className="module-summary"><div className={`module-icon large ${moduleMeta?.color}`}>{moduleMeta && <moduleMeta.icon size={25} />}</div><div><strong>{entries.filter(e => e.module === activeModule).length} records</strong><p>{activeModule === 'career' ? 'Capture concepts from chemical engineering, simulation practice, technical skills, applications and interview preparation.' : activeModule === 'business' ? 'Save business ideas, experiments, decisions and next actions.' : activeModule === 'review' ? 'Log reflection notes and time spent. Small reviews help make your next day more intentional.' : activeModule === 'entertainment' ? 'Track films, books, music, games or experiences, with notes and ratings.' : activeModule === 'spend' ? 'Record expenses with an amount and date to build a clearer picture of your spending.' : 'Capture tasks, deadlines and small actions you want to complete.'}</p></div><div className="summary-progress"><span>{entries.filter(e => e.module === activeModule && e.status === 'completed').length} completed</span><div className="progress-track"><i style={{ width: `${entries.filter(e => e.module === activeModule).length ? entries.filter(e => e.module === activeModule && e.status === 'completed').length / entries.filter(e => e.module === activeModule).length * 100 : 0}%` }} /></div></div></section>}
        {activeModule === 'entertainment' && <YouTubeUsagePanel session={session} />}
        {activeModule === 'tasks' ? <TaskBoard tasks={visibleEntries.filter(e => e.module === 'tasks')} loading={loading} search={search} onSearch={setSearch} onAdd={(horizon, area) => openCreate('tasks', { task_horizon: horizon, task_area: area })} onEdit={openEdit} onDelete={deleteEntry} onToggle={toggleComplete} /> : <section id="records-area" className="records-panel">
          <div className="records-header"><div><h2>{activeModule === 'dashboard' ? 'Your records' : 'Your ' + (moduleMeta?.short.toLowerCase() || 'records')}</h2><p>{visibleEntries.length} {visibleEntries.length === 1 ? 'entry' : 'entries'} saved in your space</p></div><div className="records-tools"><div className="search-box"><Search size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search records…" /></div>{activeModule === 'dashboard' && <button className="secondary-btn compact" onClick={() => openCreate('tasks')}><Plus size={16} /> Add</button>}</div></div>
          {loading ? <div className="empty-state"><div className="loading-spinner" /><p>Loading your records…</p></div> : visibleEntries.length === 0 ? <div className="empty-state"><div className="empty-icon"><BookOpen size={23} /></div><h3>{search ? 'No matching records' : 'A fresh page'}</h3><p>{search ? 'Try another search term.' : 'Your next step doesn’t have to be big. Add a record to get started.'}</p><button className="primary-btn" onClick={() => openCreate()}><Plus size={17} /> Add your first record</button></div> :
            <div className="entry-list">{visibleEntries.slice(0, activeModule === 'dashboard' ? 8 : 100).map(entry => <EntryRow key={entry.id} entry={entry} onEdit={openEdit} onDelete={deleteEntry} onToggle={toggleComplete} />)}</div>}
          {activeModule === 'dashboard' && visibleEntries.length > 8 && <button className="show-more" onClick={() => setActiveModule('tasks')}>Open Task Manager to see more <span>→</span></button>}
        </section>}
        <footer className="page-footer"><span>ReConstruct <i>·</i> Your progress, in your hands.</span><span><span className="privacy-dot" /> Private workspace</span></footer>
      </div>
    </main>
    {showModal && editing && <EntryModal initial={editing} onClose={() => { setShowModal(false); setEditing(null) }} onSave={saveEntry} busy={busy} />}
    {toast && <div className="toast"><CheckCircle2 size={17} /> {toast}</div>}
  </div>
}

function TaskBoard({ tasks, loading, search, onSearch, onAdd, onEdit, onDelete, onToggle }) {
  const groups = [
    { horizon: 'today', area: 'personal', title: 'Personal', description: 'Your personal tasks for today' },
    { horizon: 'today', area: 'professional', title: 'Professional', description: 'Work and study tasks for today' },
    { horizon: 'long_term', area: 'personal', title: 'Personal', description: 'Long-term personal goals' },
    { horizon: 'long_term', area: 'professional', title: 'Professional', description: 'Long-term work and study goals' },
  ]
  return <div className="task-board">
    <div className="task-board-toolbar"><div className="search-box"><Search size={16}/><input value={search} onChange={e => onSearch(e.target.value)} placeholder="Search tasks…"/></div><span>Tasks stay private to your account</span></div>
    {['today', 'long_term'].map(horizon => <section className={`task-horizon ${horizon}`} key={horizon}>
      <div className="task-horizon-heading"><div><span className="eyebrow muted">{horizon === 'today' ? 'FOCUS NOW' : 'PLAN AHEAD'}</span><h2>{horizon === 'today' ? 'To do for today' : 'Long-term tasks'}</h2></div><span className="task-horizon-total">{tasks.filter(t => taskHorizon(t) === horizon && t.status !== 'completed' && t.status !== 'archived').length} open</span></div>
      <div className="task-area-grid">{groups.filter(g => g.horizon === horizon).map(area => {
        const items = tasks.filter(task => taskHorizon(task) === horizon && taskArea(task) === area.area && task.status !== 'archived').sort((a,b) => {
          if (horizon === 'long_term' && a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
          if (horizon === 'long_term' && a.due_date) return -1
          if (horizon === 'long_term' && b.due_date) return 1
          return (b.created_at || '').localeCompare(a.created_at || '')
        })
        return <section className="task-area-card" key={area.area}>
          <header className="task-area-heading"><div className={`task-area-icon ${area.area}`}>{area.area === 'personal' ? '✦' : '↗'}</div><div><h3>{area.title}</h3><p>{area.description}</p></div><span className="task-area-count">{items.filter(t => t.status !== 'completed').length}</span><button type="button" className="task-section-add" aria-label={`Add ${area.title} task`} title={`Add ${area.title} task`} onClick={() => onAdd(horizon, area.area)}><Plus size={18}/></button></header>
          <div className="task-simple-list">
            {loading ? <div className="task-empty">Loading tasks…</div> : items.length ? items.map(task => <EntryRow key={task.id} entry={task} onEdit={onEdit} onDelete={onDelete} onToggle={onToggle} search={search} />) : <div className="task-empty"><span>{horizon === 'today' ? 'Nothing here yet.' : 'No long-term tasks yet.'}</span></div>}
          </div>
        </section>
      })}</div>
    </section>)}
  </div>
}

function YouTubeUsagePanel({ session }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  useEffect(() => {
    let alive = true
    const load = async () => {
      setLoading(true); setLoadError('')
      const { data, error } = await supabase.from('youtube_daily_usage').select('usage_date,youtube_minutes,shorts_minutes,shorts_count,regular_minutes,source,synced_at').eq('user_id', session.user.id).order('usage_date', { ascending: true }).limit(90)
      if (!alive) return
      if (error) setLoadError(error.message)
      else setRows(data || [])
      setLoading(false)
    }
    load()
    return () => { alive = false }
  }, [session.user.id])
  const today = new Date().toLocaleDateString('en-CA')
  const todayRow = rows.find(row => row.usage_date === today)
  const recent = rows.slice(-14)
  const maxMinutes = Math.max(1, ...recent.map(row => Number(row.shorts_minutes || 0)))
  const totalYoutube = rows.reduce((sum, row) => sum + Number(row.youtube_minutes || 0), 0)
  const totalShorts = rows.reduce((sum, row) => sum + Number(row.shorts_minutes || 0), 0)
  const totalCount = rows.reduce((sum, row) => sum + Number(row.shorts_count || 0), 0)
  const fmt = (mins) => {
    const n = Number(mins || 0)
    return n >= 60 ? `${Math.floor(n / 60)}h ${n % 60}m` : `${n}m`
  }
  return <section className="youtube-usage-panel">
    <div className="youtube-panel-head">
      <div><span className="eyebrow muted">ANDROID COMPANION</span><h2>YouTube usage</h2><p>Daily app time and your manually tracked Shorts sessions.</p></div>
      <span className={todayRow ? 'youtube-sync-pill synced' : 'youtube-sync-pill'}>{todayRow ? 'Today synced' : 'Waiting for phone sync'}</span>
    </div>
    <div className="youtube-metrics">
      <div className="youtube-metric"><span>Total YouTube today</span><strong>{todayRow ? fmt(todayRow.youtube_minutes) : '—'}</strong></div>
      <div className="youtube-metric shorts"><span>Shorts time today</span><strong>{todayRow ? fmt(todayRow.shorts_minutes) : '—'}</strong></div>
      <div className="youtube-metric"><span>Shorts watched today</span><strong>{todayRow ? Number(todayRow.shorts_count || 0).toLocaleString('en-IN') : '—'}</strong></div>
    </div>
    <div className="youtube-chart-wrap">
      <div className="youtube-chart-title"><div><h3>Daily Shorts time</h3><p>Last 14 recorded days · minutes per day</p></div><strong>{fmt(totalShorts)} <small>tracked total</small></strong></div>
      {loading ? <div className="youtube-chart-empty">Loading usage history…</div> : loadError ? <div className="youtube-chart-empty">Could not load usage: {loadError}</div> : recent.length === 0 ? <div className="youtube-chart-empty">No phone data yet. Install the Android companion, grant Usage access, then sign in and sync.</div> : <div className="youtube-bars" role="img" aria-label="Bar chart of daily Shorts time for the last 14 recorded days">
        {recent.map(row => <div className="youtube-bar-column" key={row.usage_date} title={`${row.usage_date}: ${row.shorts_minutes} Shorts minutes, ${row.shorts_count} Shorts`}>
          <div className="youtube-bar-value">{row.shorts_minutes}m</div><div className="youtube-bar-track"><i style={{height: `${Math.max(4, Number(row.shorts_minutes || 0) / maxMinutes * 100)}%`}} /></div><span>{new Date(row.usage_date + 'T00:00:00').toLocaleDateString('en-IN', {day:'numeric',month:'short'})}</span>
        </div>)}
      </div>}
    </div>
    <div className="youtube-history-footer"><span>{rows.length} days stored · {fmt(totalYoutube)} total YouTube · {totalCount.toLocaleString('en-IN')} Shorts logged</span><a href="https://github.com/yyokash16-ui/Re-Construct/tree/main/android-youtube-tracker" target="_blank" rel="noreferrer">Android setup ↗</a></div>
  </section>
}

function StatCard({ icon: Icon, label, value, note, color }) {
  return <div className="stat-card"><div className={`stat-icon ${color}`}><Icon size={19} /></div><span className="stat-label">{label}</span><strong className="stat-value">{value}</strong><span className="stat-note">{note}</span><span className="stat-trend"><ArrowUpRight size={14} /></span></div>
}
function EntryRow({ entry, onEdit, onDelete, onToggle, search = '' }) {
  const mod = modules.find(m => m.id === entry.module) || modules[0]
  const Icon = mod.icon
  const query = search.trim().toLowerCase()
  const isSearchMatch = entry.module === 'tasks' && query && [entry.title, entry.details, entry.category].some(value => (value || '').toLowerCase().includes(query))
  return <article className={`entry-row ${entry.status === 'completed' ? 'is-complete' : ''} ${isSearchMatch ? 'search-match' : ''}`}>
    {entry.module === 'tasks' ? <button className={`task-check ${entry.status === 'completed' ? 'checked' : ''}`} title="Toggle completed" onClick={() => onToggle(entry)}>{entry.status === 'completed' && <Check size={13} />}</button> : <div className={`entry-symbol ${mod.color}`}><Icon size={17} /></div>}
    <div className="entry-main"><div className="entry-title-line"><h3>{entry.title}</h3>{entry.category && <span className="category-chip">{entry.category}</span>}</div>{entry.details && <p>{entry.details}</p>}<div className="entry-meta">{(entry.module !== 'tasks' || (taskHorizon(entry) === 'long_term' && entry.due_date)) && <span><CalendarDays size={13} /> {niceDate(entry.due_date || entry.created_at?.slice(0,10))}</span>}{entry.module === 'review' && entry.duration_minutes != null && <span><Clock3 size={13} /> {entry.duration_minutes} min</span>}{entry.module === 'spend' && entry.amount != null && <strong className="amount-chip">{money(entry.amount)}</strong>}{entry.module === 'entertainment' && entry.rating != null && <span className="rating-chip">★ {Number(entry.rating).toFixed(1)}/5</span>}</div></div>
    <div className="entry-right">{entry.module !== 'spend' && entry.module !== 'review' && entry.module !== 'entertainment' && <span className={`status-chip status-${entry.status}`}>{statusLabels[entry.status] || entry.status}</span>}<div className="entry-actions"><button title="Edit record" onClick={() => onEdit(entry)}><Pencil size={15} /></button><button title="Delete record" onClick={() => onDelete(entry)}><Trash2 size={15} /></button></div></div>
  </article>
}

export default App
