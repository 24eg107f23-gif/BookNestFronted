import { useCallback, useEffect, useState } from 'react'
import {
  ArrowDownToLine, ArrowRight, BookOpen, BookPlus, Check, ChevronDown, Clock3,
  GraduationCap, LayoutDashboard, Library, LoaderCircle, LogOut, Search,
  ShieldCheck, Sparkles, Users, X,
} from 'lucide-react'
import api, { messageFromError } from './api'

const date = (value) => value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('booknest-user')) } catch { return null }
  })
  const [page, setPage] = useState(() => user?.role === 'LIBRARIAN' ? 'Overview' : 'Discover')
  const [toast, setToast] = useState(null)
  const [busy, setBusy] = useState(false)
  const [search, setSearch] = useState({ title: '', author: '', category: '' })
  const [books, setBooks] = useState([])
  const [requests, setRequests] = useState([])
  const [loans, setLoans] = useState([])
  const [students, setStudents] = useState([])
  const [stats, setStats] = useState(null)
  const [dialog, setDialog] = useState(null)
  const isLibrarian = user?.role === 'LIBRARIAN'

  const notify = useCallback((kind, message) => {
    setToast({ kind, message })
    window.setTimeout(() => setToast(null), 3600)
  }, [])

  useEffect(() => {
    const handleExpiredSession = () => {
      setUser(null)
      setPage('Discover')
      notify('error', 'Your session expired. Please sign in again.')
    }
    window.addEventListener('booknest:session-expired', handleExpiredSession)
    return () => window.removeEventListener('booknest:session-expired', handleExpiredSession)
  }, [notify])

  const loadBooks = useCallback(async () => {
    const { data } = await api.get('/books', { params: search })
    setBooks(data)
  }, [search])

  const loadData = useCallback(async () => {
    if (!user) return
    setBusy(true)
    try {
      const [bookResult, requestResult, loanResult] = await Promise.all([
        api.get('/books'),
        api.get('/requests', { params: isLibrarian ? { all: true } : {} }),
        api.get('/transactions'),
      ])
      setBooks(bookResult.data)
      setRequests(requestResult.data)
      setLoans(loanResult.data)
      if (isLibrarian) {
        const [dashboard, studentList] = await Promise.all([api.get('/dashboard'), api.get('/students')])
        setStats(dashboard.data)
        setStudents(studentList.data)
      }
    } catch (error) {
      notify('error', messageFromError(error))
    } finally {
      setBusy(false)
    }
  }, [user, isLibrarian, notify])

  useEffect(() => {
    if (user) loadData()
  }, [user, loadData])

  useEffect(() => {
    if (!user || (page !== 'Discover' && page !== 'Catalogue')) return
    const timer = window.setTimeout(() => {
      loadBooks().catch((error) => notify('error', messageFromError(error)))
    }, 220)
    return () => window.clearTimeout(timer)
  }, [user, page, loadBooks, notify])

  const visibleBooks = books

  async function authenticate(path, values) {
    setBusy(true)
    try {
      const { data } = await api.post(`/auth/${path}`, values)
      localStorage.setItem('booknest-token', data.token)
      localStorage.setItem('booknest-user', JSON.stringify(data.user))
      setUser(data.user)
      setPage(data.user.role === 'LIBRARIAN' ? 'Overview' : 'Discover')
      notify('success', `Welcome${data.user.fullName ? `, ${data.user.fullName.split(' ')[0]}` : ''}!`)
    } catch (error) {
      notify('error', messageFromError(error))
    } finally {
      setBusy(false)
    }
  }

  function signOut() {
    localStorage.removeItem('booknest-token')
    localStorage.removeItem('booknest-user')
    setUser(null)
    setPage('Overview')
  }

  async function refresh() {
    await loadData()
    if (page === 'Discover') await loadBooks()
  }

  async function requestBook(book) {
    setBusy(true)
    try {
      await api.post('/requests', null, { params: { bookId: book.id } })
      notify('success', `Request placed for “${book.title}”.`)
      await refresh()
    } catch (error) {
      notify('error', messageFromError(error))
    } finally {
      setBusy(false)
    }
  }

  async function handleRequest(request, action) {
    try {
      await api.post(`/requests/${request.id}/${action}`)
      notify('success', action === 'approve' ? 'Request approved and book issued.' : 'Request declined.')
      await loadData()
    } catch (error) {
      notify('error', messageFromError(error))
    }
  }

  async function handleReturn(loan) {
    try {
      await api.post(`/transactions/${loan.id}/return`)
      notify('success', `${loan.book.title} has been checked in.`)
      await loadData()
    } catch (error) {
      notify('error', messageFromError(error))
    }
  }

  async function saveBook(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const input = Object.fromEntries(form.entries())
    input.totalCopies = Number(input.totalCopies)
    try {
      if (dialog.book) await api.put(`/books/${dialog.book.id}`, input)
      else await api.post('/books', input)
      setDialog(null)
      notify('success', dialog.book ? 'Book details updated.' : 'Book added to the catalogue.')
      await loadData()
    } catch (error) {
      notify('error', messageFromError(error))
    }
  }

  async function deleteBook(book) {
    if (!window.confirm(`Remove “${book.title}” from the catalogue?`)) return
    try {
      await api.delete(`/books/${book.id}`)
      notify('success', 'Book removed from the catalogue.')
      await loadData()
    } catch (error) {
      notify('error', messageFromError(error))
    }
  }

  async function setEnabled(student) {
    try {
      await api.patch(`/students/${student.id}/enabled`, { enabled: !student.enabled })
      notify('success', `Student account ${student.enabled ? 'paused' : 'enabled'}.`)
      await loadData()
    } catch (error) {
      notify('error', messageFromError(error))
    }
  }

  if (!user) return <AuthScreen busy={busy} onAuthenticate={authenticate} toast={toast} />

  const nav = isLibrarian
    ? [{ name: 'Overview', icon: LayoutDashboard }, { name: 'Catalogue', icon: Library }, { name: 'Requests', icon: Clock3 }, { name: 'Circulation', icon: ArrowDownToLine }, { name: 'Students', icon: Users }]
    : [{ name: 'Discover', icon: Search }, { name: 'My loans', icon: BookOpen }, { name: 'My requests', icon: Clock3 }]

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); setPage(nav[0].name) }}>
          <span className="brand-mark"><BookOpen size={20} strokeWidth={2.2} /></span>
          <span>booknest<span className="brand-period">.</span><small>THE NEIGHBORHOOD LIBRARY</small></span>
        </a>
        <div className="side-caption">WORKSPACE</div>
        <nav className="side-nav">{nav.map(({ name, icon: Icon }) => <button key={name} className={page === name ? 'nav-link active' : 'nav-link'} onClick={() => setPage(name)}><Icon size={18} /><span>{name}</span>{name === 'Requests' && isLibrarian && requests.filter((request) => request.status === 'PENDING').length > 0 && <i className="nav-count">{requests.filter((request) => request.status === 'PENDING').length}</i>}</button>)}</nav>
        <div className="sidebar-bottom">
          <div className="help-card"><Sparkles size={17} /><strong>A little help, a lot of stories.</strong><span>Your next favorite book is waiting to be found.</span></div>
          <div className="account-card"><div className="avatar">{user.fullName?.charAt(0)?.toUpperCase() || 'B'}</div><div className="account-copy"><strong>{user.fullName}</strong><span>{isLibrarian ? 'Librarian' : 'Student'}</span></div><button aria-label="Sign out" className="icon-button signout" onClick={signOut}><LogOut size={17} /></button></div>
        </div>
      </aside>
      <main className="main-panel">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark"><BookOpen size={18} /></span> booknest<span className="brand-period">.</span></div>
          <div className="breadcrumb">Library <span>/</span> <strong>{page}</strong></div>
          <div className="topbar-right"><span className="today-label">{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })}</span><button className="user-pill" onClick={signOut}><span className="avatar mini">{user.fullName?.charAt(0)?.toUpperCase()}</span><span>{user.fullName?.split(' ')[0]}</span><ChevronDown size={14} /></button></div>
        </header>
        <div className="content">
          {busy && <div className="loading-line"><LoaderCircle size={15} className="spin" /> Syncing your library</div>}
          {page === 'Overview' && isLibrarian && <Dashboard stats={stats} books={books} loans={loans} requests={requests} setPage={setPage} />}
          {(page === 'Discover' || page === 'Catalogue') && <Catalogue books={visibleBooks} search={search} setSearch={setSearch} librarian={isLibrarian} onRequest={requestBook} onView={(book) => setDialog({ details: book })} onEdit={(book) => setDialog({ book })} onDelete={deleteBook} onAdd={() => setDialog({ book: null })} />}
          {page === 'Requests' && <Requests requests={requests} librarian onAction={handleRequest} />}
          {page === 'My requests' && <Requests requests={requests} />}
          {(page === 'My loans' || page === 'Circulation') && <Circulation loans={loans} librarian={isLibrarian} onReturn={handleReturn} students={students} books={books} onIssue={() => setDialog({ issue: true })} />}
          {page === 'Students' && <Students students={students} onToggle={setEnabled} />}
        </div>
      </main>
      {dialog?.details && <BookDetailsDialog book={dialog.details} onClose={() => setDialog(null)} librarian={isLibrarian} onRequest={requestBook} />}
      {dialog?.book !== undefined && <BookDialog book={dialog.book} onClose={() => setDialog(null)} onSave={saveBook} />}
      {dialog?.issue && <IssueDialog students={students} books={books} onClose={() => setDialog(null)} onSave={async (input) => {
        try {
          await api.post('/transactions', input)
          setDialog(null)
          notify('success', 'Book issued and due date recorded.')
          await loadData()
        } catch (error) { notify('error', messageFromError(error)) }
      }} />}
      {toast && <div className={`toast ${toast.kind}`} role="status"><span>{toast.kind === 'success' ? <Check size={17} /> : <X size={17} />}</span>{toast.message}</div>}
    </div>
  )
}

function AuthScreen({ busy, onAuthenticate, toast }) {
  const [mode, setMode] = useState('login')
  const [showPassword, setShowPassword] = useState(false)
  const submit = (event) => {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget).entries())
    onAuthenticate(mode, values)
  }
  return <div className="auth-layout">
    <section className="auth-story"><div className="story-brand"><span className="brand-mark"><BookOpen size={21} /></span> booknest<span className="brand-period">.</span></div><div className="story-main"><span className="eyebrow"><Sparkles size={14} /> A good place to get lost</span><h1>Stories make<br />a <em>community.</em></h1><p>Your neighborhood library, thoughtfully connected. Find your next read, keep your place, and let the pages take you somewhere new.</p><div className="story-stats"><div><strong>One card.</strong><span>A whole world of stories.</span></div><div><strong>Always open.</strong><span>Your library, on your time.</span></div></div></div><div className="story-footer"><span>MADE FOR CURIOUS MINDS</span><span>01 — 03</span></div><div className="decor-book"><BookOpen size={54} strokeWidth={1} /></div></section>
    <section className="auth-side"><div className="auth-form-wrap"><div className="auth-welcome"><div className="welcome-icon"><GraduationCap size={21} /></div><span>Welcome to your library</span></div><h2>{mode === 'login' ? 'Good to see you.' : 'Make yourself at home.'}</h2><p className="form-subtitle">{mode === 'login' ? 'Sign in to pick up right where you left off.' : 'Create a student account to start exploring.'}</p><form className="auth-form" onSubmit={submit}>{mode === 'register' && <label>Your name<input name="fullName" autoComplete="name" placeholder="e.g. Alex Morgan" required maxLength={120} /></label>}<label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label><label>Password<span className="password-field"><input name="password" type={showPassword ? 'text' : 'password'} minLength={mode === 'register' ? 8 : undefined} maxLength={72} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="At least 8 characters" required /><button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button></span></label><button className="primary-button auth-submit" disabled={busy}>{busy ? <LoaderCircle size={17} className="spin" /> : mode === 'login' ? 'Sign in to BookNest' : 'Create my account'}<ArrowRight size={17} /></button></form><div className="auth-switch">{mode === 'login' ? 'New around here?' : 'Already have a library card?'} <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></div><div className="secure-note"><ShieldCheck size={15} /> Your account is private and secure</div></div><div className="auth-legal">A calmer way to keep up with the stories you love.</div></section>
    {toast && <div className={`toast ${toast.kind}`} role="status">{toast.message}</div>}
  </div>
}

function PageHeading({ kicker, title, description, action }) {
  return <div className="page-heading"><div><span className="eyebrow">{kicker}</span><h1>{title}</h1><p>{description}</p></div>{action}</div>
}

function Dashboard({ stats, books, loans, requests, setPage }) {
  const cards = [
    { label: 'Book titles', value: stats?.totalBooks ?? '—', hint: `${stats?.availableCopies ?? '—'} copies available`, color: 'sage', icon: Library },
    { label: 'Ready to borrow', value: stats?.availableCopies ?? '—', hint: 'Copies waiting for a reader', color: 'lavender', icon: BookOpen },
    { label: 'Currently issued', value: stats?.issuedBooks ?? '—', hint: 'Books in readers’ hands', color: 'peach', icon: ArrowDownToLine },
    { label: 'Books returned', value: stats?.returnedBooks ?? '—', hint: 'Completed loan transactions', color: 'sage', icon: Check },
    { label: 'Past their due date', value: stats?.overdueTransactions ?? '—', hint: 'Loans to check in on', color: 'rose', icon: Clock3 },
  ]
  const pending = requests.filter((request) => request.status === 'PENDING')
  const overdue = loans.filter((loan) => loan.overdue && !loan.returnedAt)
  return <><PageHeading kicker="YOUR LIBRARY AT A GLANCE" title="A good day to read." description="Here’s what’s happening around the library today." /><div className="stat-grid">{cards.map(({ label, value, hint, color, icon: Icon }) => <div className="stat-card" key={label}><div className="stat-top"><span>{label}</span><span className={`stat-icon ${color}`}><Icon size={17} /></span></div><strong>{value}</strong><small>{hint}</small></div>)}</div><div className="dashboard-grid"><section className="panel"><div className="panel-heading"><div><h3>Latest requests</h3><p>Readers waiting for their next chapter.</p></div><button className="text-button" onClick={() => setPage('Requests')}>View all <ArrowRight size={14} /></button></div>{pending.length ? pending.slice(0, 4).map((item) => <div className="request-row" key={item.id}><div className="book-thumb tiny"><BookOpen size={17} /></div><div className="row-copy"><strong>{item.book.title}</strong><span>{item.student.fullName}</span></div><span className="status-chip pending">Pending</span></div>) : <EmptyState title="All caught up" text="There are no requests awaiting a decision." />}</section><section className="panel"><div className="panel-heading"><div><h3>Needs a gentle nudge</h3><p>Overdue books still out in the world.</p></div><span className="soft-count">{overdue.length}</span></div>{overdue.length ? overdue.slice(0, 4).map((loan) => <div className="request-row" key={loan.id}><div className="avatar loan-avatar">{loan.student.fullName.charAt(0)}</div><div className="row-copy"><strong>{loan.book.title}</strong><span>{loan.student.fullName} · due {date(loan.dueDate)}</span></div><span className="status-chip overdue">Overdue</span></div>) : <EmptyState title="Nothing overdue" text="Every book is right where it should be." />}</section></div></>
}

function Catalogue({ books, search, setSearch, librarian, onRequest, onView, onEdit, onDelete, onAdd }) {
  return <><PageHeading kicker={librarian ? 'COLLECTION MANAGEMENT' : 'FIND YOUR NEXT FAVORITE'} title={librarian ? 'The catalogue.' : 'A world on every shelf.'} description={librarian ? 'Keep the collection current and ready for its next reader.' : 'Find something you love. Your next chapter starts right here.'} action={librarian && <button className="primary-button" onClick={onAdd}><BookPlus size={17} /> Add a book</button>} /><div className="search-panel">{[['title', 'Book title'], ['author', 'Author'], ['category', 'Category']].map(([key, label]) => <label className="search-field" key={key}><span>{label}</span><input value={search[key]} onChange={(event) => setSearch({ ...search, [key]: event.target.value })} placeholder={`Search ${label.toLowerCase()}…`} /><Search size={16} /></label>)}<button className="clear-search" onClick={() => setSearch({ title: '', author: '', category: '' })}>Clear</button></div><div className="catalogue-meta"><strong>{books.length} {books.length === 1 ? 'book' : 'books'}</strong><span>Sorted alphabetically</span></div>{books.length ? <div className="book-grid">{books.map((book, index) => <article className="book-card" key={book.id}><div className={`book-cover cover-${index % 5}`}><span className="cover-dot" /><BookOpen size={24} strokeWidth={1.3} /><span className="cover-category">{book.category}</span></div><div className="book-info"><span className="book-category">{book.category}</span><h3>{book.title}</h3><p>by {book.author}</p><div className="book-bottom"><span className={book.availableCopies ? 'availability' : 'availability unavailable'}><i />{book.availableCopies ? `${book.availableCopies} of ${book.totalCopies} available` : 'Currently checked out'}</span><div className="card-actions"><button onClick={() => onView(book)}>Details</button>{librarian ? <><button onClick={() => onEdit(book)}>Edit</button><button onClick={() => onDelete(book)}>Remove</button></> : <button disabled={!book.availableCopies} onClick={() => onRequest(book)} className="borrow-button">{book.availableCopies ? 'Request book' : 'Unavailable'}<ArrowRight size={14} /></button>}</div></div></div></article>)}</div> : <EmptyState title="No books found" text="Try another title, author, or category." />}</>
}

function BookDetailsDialog({ book, onClose, librarian, onRequest }) {
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="modal-card detail-card"><div className={`detail-cover book-cover cover-${book.id % 5}`}><BookOpen size={31} strokeWidth={1.2} /><span className="cover-category">{book.category}</span></div><div className="modal-heading"><div><span className="eyebrow">BOOK DETAILS</span><h2>{book.title}</h2><p className="detail-author">by {book.author}</p></div><button type="button" className="icon-button" onClick={onClose}><X size={19} /></button></div><p className="detail-description">{book.description || 'No description has been added for this title yet.'}</p><div className="detail-facts"><div><span>ISBN</span><strong>{book.isbn}</strong></div><div><span>COLLECTION</span><strong>{book.category}</strong></div><div><span>AVAILABILITY</span><strong>{book.availableCopies} of {book.totalCopies} copies</strong></div></div><div className="modal-footer"><button type="button" className="outline-button" onClick={onClose}>Close</button>{!librarian && <button disabled={!book.availableCopies} className="primary-button" onClick={() => { onClose(); onRequest(book) }}>{book.availableCopies ? 'Request this book' : 'No copies available'}</button>}</div></section></div>
}

function Requests({ requests, librarian, onAction }) {
  return <><PageHeading kicker={librarian ? 'THE CIRCULATION DESK' : 'YOUR LIBRARY CARD'} title={librarian ? 'Requests to read.' : 'Your requests.'} description={librarian ? 'A quick decision gets a good book into the right hands.' : 'Every good story begins with a little anticipation.'} /><div className="panel table-panel">{requests.length ? <div className="table-scroll"><table><thead><tr><th>BOOK</th>{librarian && <th>READER</th>}<th>REQUESTED</th><th>STATUS</th>{librarian && <th>ACTION</th>}</tr></thead><tbody>{requests.map((request) => <tr key={request.id}><td><div className="table-book"><span className="book-thumb"><BookOpen size={17} /></span><span><strong>{request.book.title}</strong><small>{request.book.author}</small></span></div></td>{librarian && <td>{request.student.fullName}</td>}<td>{date(request.requestedAt)}</td><td><span className={`status-chip ${request.status.toLowerCase()}`}>{request.status.toLowerCase()}</span></td>{librarian && <td>{request.status === 'PENDING' ? <div className="table-actions"><button className="approve" onClick={() => onAction(request, 'approve')}><Check size={14} /> Approve</button><button className="decline" onClick={() => onAction(request, 'reject')}>Decline</button></div> : <span className="muted">—</span>}</td>}</tr>)}</tbody></table></div> : <EmptyState title="No requests yet" text="When readers ask for a book, their requests will show up here." />}</div></>
}

function Circulation({ loans, librarian, onReturn, students, books, onIssue }) {
  const open = loans.filter((loan) => !loan.returnedAt)
  const history = loans.filter((loan) => loan.returnedAt)
  return <><PageHeading kicker={librarian ? 'CHECKOUT DESK' : 'YOUR READING JOURNEY'} title={librarian ? 'Out in the world.' : 'Your borrowed books.'} description={librarian ? 'Keep track of every book out with a reader, and check it in when it comes home.' : 'A little overview of what you’re reading and what you’ve returned.'} action={librarian && <button className="primary-button" onClick={onIssue}><ArrowDownToLine size={17} /> Issue a book</button>} /><div className="circulation-section"><div className="section-title"><h2>Currently borrowed <span>{open.length}</span></h2><p>{librarian ? 'Books currently in circulation.' : 'Make sure to bring them back by their due date.'}</p></div>{open.length ? <div className="loan-grid">{open.map((loan, index) => <article className={`loan-card ${loan.overdue ? 'loan-overdue' : ''}`} key={loan.id}><div className={`book-cover compact cover-${index % 5}`}><BookOpen size={20} /></div><div className="loan-detail"><div className="loan-card-top"><span className={loan.overdue ? 'status-chip overdue' : 'status-chip active'}>{loan.overdue ? 'OVERDUE' : 'ON LOAN'}</span>{loan.overdue && <span className="overdue-days">Please return</span>}</div><h3>{loan.book.title}</h3><p>{loan.book.author}{librarian ? ` · ${loan.student.fullName}` : ''}</p><div className="due-line"><Clock3 size={14} /> Due {date(loan.dueDate)}</div>{librarian && <button className="return-button" onClick={() => onReturn(loan)}><Check size={15} /> Record return</button>}</div></article>)}</div> : <EmptyState title="A fresh reading list" text="There are no active loans right now." />}</div><div className="circulation-section history-section"><div className="section-title"><h2>Returned books <span>{history.length}</span></h2><p>A little look back at the stories you’ve finished.</p></div>{history.length ? <div className="panel table-panel"><div className="table-scroll"><table><thead><tr><th>BOOK</th>{librarian && <th>READER</th>}<th>ISSUED</th><th>RETURNED</th><th>DUE DATE</th></tr></thead><tbody>{history.map((loan) => <tr key={loan.id}><td><div className="table-book"><span className="book-thumb"><BookOpen size={16} /></span><span><strong>{loan.book.title}</strong><small>{loan.book.author}</small></span></div></td>{librarian && <td>{loan.student.fullName}</td>}<td>{date(loan.issuedAt)}</td><td>{date(loan.returnedAt)}</td><td>{date(loan.dueDate)}</td></tr>)}</tbody></table></div></div> : <div className="history-empty">Your returned books will find a home here.</div>}</div></>
}

function Students({ students, onToggle }) {
  return <><PageHeading kicker="PEOPLE MAKE THE LIBRARY" title="Our readers." description="Manage student accounts and help every reader feel at home." /><div className="panel table-panel">{students.length ? <div className="table-scroll"><table><thead><tr><th>STUDENT</th><th>JOINED</th><th>ACCOUNT</th><th>ACTION</th></tr></thead><tbody>{students.map((student) => <tr key={student.id}><td><div className="table-book"><span className="avatar">{student.fullName.charAt(0)}</span><span><strong>{student.fullName}</strong><small>{student.email}</small></span></div></td><td>{date(student.createdAt)}</td><td><span className={`status-chip ${student.enabled ? 'active' : 'overdue'}`}>{student.enabled ? 'Enabled' : 'Paused'}</span></td><td><button className="outline-button" onClick={() => onToggle(student)}>{student.enabled ? 'Pause account' : 'Enable account'}</button></td></tr>)}</tbody></table></div> : <EmptyState title="A quiet reading room" text="Registered student accounts will appear here." />}</div></>
}

function BookDialog({ book, onClose, onSave }) {
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form className="modal-card" onSubmit={onSave}><div className="modal-heading"><div><span className="eyebrow">THE COLLECTION</span><h2>{book ? 'Edit a book' : 'Add a book'}</h2></div><button type="button" className="icon-button" onClick={onClose}><X size={19} /></button></div><div className="modal-fields"><label>Title<input name="title" defaultValue={book?.title || ''} required maxLength={180} /></label><div className="form-row"><label>Author<input name="author" defaultValue={book?.author || ''} required maxLength={140} /></label><label>Category<input name="category" defaultValue={book?.category || ''} required maxLength={100} /></label></div><div className="form-row"><label>ISBN<input name="isbn" defaultValue={book?.isbn || ''} required maxLength={20} /></label><label>Total copies<input name="totalCopies" type="number" min="0" defaultValue={book?.totalCopies ?? 1} required /></label></div><label>Description<textarea name="description" defaultValue={book?.description || ''} rows="3" maxLength={5000} /></label></div><div className="modal-footer"><button type="button" className="outline-button" onClick={onClose}>Cancel</button><button className="primary-button">{book ? 'Save changes' : 'Add to collection'}</button></div></form></div>
}

function IssueDialog({ students, books, onClose, onSave }) {
  const [values, setValues] = useState({ studentId: '', bookId: '', loanDays: 14 })
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form className="modal-card" onSubmit={(event) => { event.preventDefault(); onSave({ ...values, studentId: Number(values.studentId), bookId: Number(values.bookId), loanDays: Number(values.loanDays) }) }}><div className="modal-heading"><div><span className="eyebrow">THE CIRCULATION DESK</span><h2>Issue a book</h2></div><button type="button" className="icon-button" onClick={onClose}><X size={19} /></button></div><div className="modal-fields"><label>Student<select required value={values.studentId} onChange={(event) => setValues({ ...values, studentId: event.target.value })}><option value="">Choose a student…</option>{students.filter((student) => student.enabled).map((student) => <option value={student.id} key={student.id}>{student.fullName} — {student.email}</option>)}</select></label><label>Book<select required value={values.bookId} onChange={(event) => setValues({ ...values, bookId: event.target.value })}><option value="">Choose an available book…</option>{books.filter((book) => book.availableCopies > 0).map((book) => <option value={book.id} key={book.id}>{book.title} ({book.availableCopies} available)</option>)}</select></label><label>Loan period (days)<input type="number" min="1" max="90" value={values.loanDays} onChange={(event) => setValues({ ...values, loanDays: event.target.value })} required /></label></div><div className="modal-footer"><button type="button" className="outline-button" onClick={onClose}>Cancel</button><button className="primary-button">Confirm issue</button></div></form></div>
}

function EmptyState({ title, text }) {
  return <div className="empty-state"><span><BookOpen size={22} /></span><strong>{title}</strong><p>{text}</p></div>
}

export default App
