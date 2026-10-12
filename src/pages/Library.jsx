import { useState, useEffect } from 'react';
import {
  BookOpen, Plus, Edit, Trash2, X, Save, Search,
  AlertCircle, CheckCircle, BookMarked, BookCheck,
  Clock, AlertTriangle, User, Calendar, DollarSign,
  Printer, FileText, Settings as SettingsIcon, Library as LibIcon
} from 'lucide-react';
import API from '../api/axios';

const BOOK_CATEGORIES = [
  'Fiction', 'Non-Fiction', 'Science', 'Mathematics', 'History',
  'Geography', 'Language', 'Religion', 'Technology', 'Reference',
  'Children', 'Comic', 'Biography', 'Other'
];

export default function Library() {
  const [activeTab, setActiveTab] = useState('books');
  const [books, setBooks] = useState([]);
  const [borrowings, setBorrowings] = useState([]);
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [borrowStats, setBorrowStats] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [message, setMessage] = useState(null);

  // Modals
  const [showBookModal, setShowBookModal] = useState(false);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [returnData, setReturnData] = useState(null);
  const [returnForm, setReturnForm] = useState({ return_date: '', remarks: '' });

  const [bookForm, setBookForm] = useState({
    title: '', author: '', isbn: '', category: 'Fiction', publisher: '',
    publish_year: '', quantity: 1, shelf: '', description: '', cover: '', status: 'Active'
  });

  const [borrowForm, setBorrowForm] = useState({
    book_id: '', student_id: '', borrow_date: '', due_date: '', remarks: ''
  });

  const [settingsForm, setSettingsForm] = useState({
    library_fine_per_day: 500, library_loan_days: 14, library_max_books: 3
  });

  // ===== Load =====
  const load = async () => {
    setLoading(true);
    try {
      const [bRes, sRes, stRes] = await Promise.all([
        API.get('/library/books'),
        API.get('/students?status=Active'),
        API.get('/library/settings')
      ]);
      setBooks(bRes.data);
      setStudents(sRes.data);
      setSettings(stRes.data);
      setSettingsForm({
        library_fine_per_day: stRes.data.library_fine_per_day || 500,
        library_loan_days: stRes.data.library_loan_days || 14,
        library_max_books: stRes.data.library_max_books || 3,
      });
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadBorrowings = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterStatus) params.append('status', filterStatus);
      const [bRes, sRes] = await Promise.all([
        API.get(`/library/borrowings?${params}`),
        API.get('/library/borrowings/stats')
      ]);
      setBorrowings(bRes.data);
      setBorrowStats(sRes.data);
    } catch (e) { console.error(e); }
  };

  const loadStats = async () => {
    try {
      const r = await API.get('/library/books/stats');
      setStats(r.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { load(); loadStats(); }, []);
  useEffect(() => { if (activeTab === 'borrowings') loadBorrowings(); }, [activeTab, search, filterStatus]);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // ===== Book CRUD =====
  const handleAddBook = () => {
    setEditingBook(null);
    setBookForm({
      title: '', author: '', isbn: '', category: 'Fiction', publisher: '',
      publish_year: '', quantity: 1, shelf: '', description: '', cover: '', status: 'Active'
    });
    setShowBookModal(true);
  };

  const handleEditBook = (b) => {
    setEditingBook(b);
    setBookForm({
      title: b.title || '', author: b.author || '', isbn: b.isbn || '',
      category: b.category || 'Fiction', publisher: b.publisher || '',
      publish_year: b.publish_year || '', quantity: b.quantity || 1,
      shelf: b.shelf || '', description: b.description || '',
      cover: b.cover || '', status: b.status || 'Active'
    });
    setShowBookModal(true);
  };

  const handleBookChange = (e) => {
    setBookForm({ ...bookForm, [e.target.name]: e.target.value });
  };

  const handleCoverUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      alert('ပုံ 500KB အောက်သာ');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setBookForm(prev => ({ ...prev, cover: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBook) {
        await API.put(`/library/books/${editingBook.id}`, bookForm);
        showMsg('success', 'စာအုပ် ပြင်ပြီးပါပြီ');
      } else {
        const r = await API.post('/library/books', bookForm);
        showMsg('success', `စာအုပ် ထည့်ပြီးပါပြီ: ${r.data.book_id}`);
      }
      setShowBookModal(false);
      load(); loadStats();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  const handleDeleteBook = async (id, title) => {
    if (!confirm(`"${title}" ကို ဖျက်မှာ သေချာလား?`)) return;
    try {
      await API.delete(`/library/books/${id}`);
      showMsg('success', 'စာအုပ် ဖျက်ပြီးပါပြီ');
      load(); loadStats();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  // ===== Borrow =====
  const handleOpenBorrow = (book = null) => {
    const today = new Date().toISOString().split('T')[0];
    const loanDays = parseInt(settings.library_loan_days || 14);
    const due = new Date();
    due.setDate(due.getDate() + loanDays);
    setBorrowForm({
      book_id: book ? book.id : '',
      student_id: '',
      borrow_date: today,
      due_date: due.toISOString().split('T')[0],
      remarks: ''
    });
    setShowBorrowModal(true);
  };

  const handleBorrow = async (e) => {
    e.preventDefault();
    try {
      const r = await API.post('/library/borrowings', borrowForm);
      showMsg('success', `စာအုပ် ငှားပြီးပါပြီ · ပြန်အပ်ရက်: ${r.data.due_date}`);
      setShowBorrowModal(false);
      load(); loadStats();
      if (activeTab === 'borrowings') loadBorrowings();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  // ===== Return =====
  const handleOpenReturn = (b) => {
    setReturnData(b);
    setReturnForm({
      return_date: new Date().toISOString().split('T')[0],
      remarks: b.remarks || ''
    });
    setShowReturnModal(true);
  };

  const handleReturn = async () => {
    try {
      const r = await API.post(`/library/borrowings/${returnData.id}/return`, returnForm);
      if (r.data.fine > 0) {
        showMsg('success', `ပြန်အပ်ပြီး · ဒဏ်တမ်း: ${r.data.fine.toLocaleString()} ကျပ် (${r.data.days_late} ရက်နောက်ကျ)`);
      } else {
        showMsg('success', 'ပြန်အပ်ပြီးပါပြီ · ဒဏ်မရှိပါ');
      }
      setShowReturnModal(false);
      load(); loadStats(); loadBorrowings();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  const handleDeleteBorrowing = async (id) => {
    if (!confirm('မှတ်တမ်း ဖျက်မှာ သေချာလား?')) return;
    try {
      await API.delete(`/library/borrowings/${id}`);
      showMsg('success', 'ဖျက်ပြီးပါပြီ');
      loadBorrowings(); loadStats(); load();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  // ===== Settings =====
  const handleSettingsSave = async () => {
    try {
      await API.put('/library/settings', settingsForm);
      showMsg('success', 'Settings သိမ်းပြီးပါပြီ');
      setShowSettingsModal(false);
      load();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  const fmt = (n) => new Intl.NumberFormat('en-US').format(n || 0);

  const filteredBooks = books.filter(b => {
    const s = search.toLowerCase();
    const matchSearch = !search || 
      b.title?.toLowerCase().includes(s) ||
      b.author?.toLowerCase().includes(s) ||
      b.book_id?.toLowerCase().includes(s);
    const matchCat = !filterCategory || b.category === filterCategory;
    return matchSearch && matchCat;
  });

  const tabs = [
    { key: 'books', label: '📚 စာအုပ်များ', icon: BookOpen },
    { key: 'borrowings', label: '📋 ငှားရမ်းမှု', icon: BookMarked },
  ];

  return (
    <div className="p-6">
      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
        <div className="flex border-b overflow-x-auto">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                  activeTab === t.key
                    ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
          <div className="flex-1" />
          <button onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-2 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50">
            <SettingsIcon className="w-4 h-4" /> Settings
          </button>
        </div>
      </div>

      {/* ===== TAB 1: Books ===== */}
      {activeTab === 'books' && (
        <div className="space-y-6">
          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <StatBox icon={BookOpen} label="စာအုပ် အမျိုးအစား" value={stats.totalBooks} color="bg-blue-100 text-blue-700" />
              <StatBox icon={LibIcon} label="စုစုပေါင်း အုပ်ရေ" value={stats.totalCopies} color="bg-cyan-100 text-cyan-700" />
              <StatBox icon={BookCheck} label="ရနိုင်သေး" value={stats.totalAvailable} color="bg-green-100 text-green-700" />
              <StatBox icon={BookMarked} label="ငှားထားဆဲ" value={stats.borrowed} color="bg-orange-100 text-orange-700" />
              <StatBox icon={AlertTriangle} label="နောက်ကျ" value={stats.overdue} color="bg-red-100 text-red-700" />
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="စာအုပ် ရှာရန် (Title, Author, ID)..."
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              className="px-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">အမျိုးအစား အားလုံး</option>
              {BOOK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={() => handleOpenBorrow()}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg">
              <BookMarked className="w-4 h-4" /> စာအုပ် ငှားရန်
            </button>
            <button onClick={handleAddBook}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg">
              <Plus className="w-5 h-5" /> စာအုပ် အသစ်
            </button>
          </div>

          {/* Books Grid */}
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">Loading...</div>
          ) : filteredBooks.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">စာအုပ် မရှိသေးပါ</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredBooks.map(b => (
                <div key={b.id} className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition flex flex-col">
                  <div className="flex gap-3 mb-3">
                    {b.cover ? (
                      <img src={b.cover} alt={b.title}
                        className="w-16 h-24 rounded-lg object-cover border" />
                    ) : (
                      <div className="w-16 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-gray-800 line-clamp-2">{b.title}</h3>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{b.author || '-'}</p>
                      <p className="text-xs font-mono text-blue-600 mt-1">{b.book_id}</p>
                      {b.category && (
                        <span className="inline-block mt-1 text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {b.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs mb-3 pt-2 border-t">
                    <span className="text-gray-500">ရနိုင်သေး:</span>
                    <span className={`font-bold ${b.available > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {b.available} / {b.quantity}
                    </span>
                  </div>
                  <div className="flex gap-1 mt-auto">
                    <button onClick={() => handleOpenBorrow(b)}
                      disabled={b.available <= 0}
                      className="flex-1 flex items-center justify-center gap-1 bg-purple-100 hover:bg-purple-200 text-purple-700 py-1.5 rounded text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                      <BookMarked className="w-3.5 h-3.5" /> ငှား
                    </button>
                    <button onClick={() => handleEditBook(b)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="ပြင်">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteBook(b.id, b.title)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="ဖျက်">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== TAB 2: Borrowings ===== */}
      {activeTab === 'borrowings' && (
        <div className="space-y-6">
          {borrowStats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <StatBox icon={FileText} label="စုစုပေါင်း" value={borrowStats.total} color="bg-slate-100 text-slate-700" />
              <StatBox icon={BookMarked} label="ငှားထားဆဲ" value={borrowStats.borrowed} color="bg-orange-100 text-orange-700" />
              <StatBox icon={BookCheck} label="ပြန်အပ်ပြီး" value={borrowStats.returned} color="bg-green-100 text-green-700" />
              <StatBox icon={AlertTriangle} label="နောက်ကျ" value={borrowStats.overdue} color="bg-red-100 text-red-700" />
              <div className="rounded-xl p-4 bg-yellow-100 text-yellow-700">
                <p className="text-xs opacity-80">ဒဏ်တမ်း ရရှိ</p>
                <p className="text-xl font-bold mt-1">{fmt(borrowStats.fineCollected)} K</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="ကျောင်းသား / စာအုပ် ရှာရန်..."
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Status အားလုံး</option>
              <option value="Borrowed">ငှားထားဆဲ</option>
              <option value="Returned">ပြန်အပ်ပြီး</option>
            </select>
            <div className="flex-1" />
            <button onClick={() => handleOpenBorrow()}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg">
              <Plus className="w-5 h-5" /> ငှားရန်
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {borrowings.length === 0 ? (
              <div className="p-12 text-center">
                <BookMarked className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">ငှားရမ်းမှု မှတ်တမ်း မရှိပါ</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold">စာအုပ်</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">ကျောင်းသား</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">ငှားရက်</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">ပြန်အပ်ရက်</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold">ဒဏ်</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold">လုပ်ဆောင်ချက်</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {borrowings.map(br => (
                      <tr key={br.id} className={`hover:bg-gray-50 ${br.is_overdue ? 'bg-red-50/40' : ''}`}>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-800">{br.book_title}</p>
                          <p className="text-xs font-mono text-blue-600">{br.book_code}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium">{br.student_name}</p>
                          <p className="text-xs text-gray-500 font-mono">{br.student_code} · {br.grade} {br.section}</p>
                        </td>
                        <td className="px-4 py-3 text-sm">{br.borrow_date}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={br.is_overdue ? 'text-red-600 font-bold' : ''}>
                            {br.due_date}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            br.status === 'Returned' ? 'bg-green-100 text-green-700'
                              : br.is_overdue ? 'bg-red-100 text-red-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {br.status === 'Returned' ? 'ပြန်အပ်ပြီး' : br.is_overdue ? 'နောက်ကျ' : 'ငှားဆဲ'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm">
                          {(br.live_fine || br.fine) > 0 ? (
                            <span className="font-bold text-red-600">{fmt(br.live_fine || br.fine)} K</span>
                          ) : <span className="text-gray-400">-</span>}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {br.status === 'Borrowed' && (
                            <button onClick={() => handleOpenReturn(br)}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium mr-1">
                              <BookCheck className="w-3 h-3 inline mr-1" /> ပြန်အပ်
                            </button>
                          )}
                          <button onClick={() => handleDeleteBorrowing(br.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="ဖျက်">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== Book Modal ===== */}
      {showBookModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">{editingBook ? 'စာအုပ် ပြင်ရန်' : 'စာအုပ် အသစ်'}</h3>
              <button onClick={() => setShowBookModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleBookSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Cover */}
              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
                {bookForm.cover ? (
                  <img src={bookForm.cover} alt="Cover"
                    className="w-20 h-28 rounded-lg object-cover border-2 border-white shadow" />
                ) : (
                  <div className="w-20 h-28 bg-white rounded-lg flex items-center justify-center border-2 border-dashed border-blue-300">
                    <BookOpen className="w-8 h-8 text-blue-400" />
                  </div>
                )}
                <div>
                  <label className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                    📷 မျက်နှာဖုံး တင်ရန်
                    <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                  </label>
                  <p className="text-xs text-gray-500 mt-1">500KB အောက်</p>
                  {bookForm.cover && (
                    <button type="button" onClick={() => setBookForm({ ...bookForm, cover: '' })}
                      className="text-xs text-red-600 hover:underline mt-1">ဖျက်ရန်</button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Field label="စာအုပ် အမည် *">
                    <input type="text" name="title" value={bookForm.title} onChange={handleBookChange} required
                      placeholder="ဥပမာ: မြန်မာစာ သင်ရိုး"
                      className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                  </Field>
                </div>
                <Field label="စာရေးသူ">
                  <input type="text" name="author" value={bookForm.author} onChange={handleBookChange}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </Field>
                <Field label="ISBN">
                  <input type="text" name="isbn" value={bookForm.isbn} onChange={handleBookChange}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </Field>
                <Field label="အမျိုးအစား">
                  <select name="category" value={bookForm.category} onChange={handleBookChange}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                    {BOOK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="ထုတ်ဝေသူ">
                  <input type="text" name="publisher" value={bookForm.publisher} onChange={handleBookChange}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </Field>
                <Field label="ထုတ်ဝေနှစ်">
                  <input type="text" name="publish_year" value={bookForm.publish_year} onChange={handleBookChange}
                    placeholder="2020"
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </Field>
                <Field label="အုပ်ရေ">
                  <input type="number" name="quantity" value={bookForm.quantity} onChange={handleBookChange}
                    min="1"
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </Field>
                <Field label="စင်နံပါတ်">
                  <input type="text" name="shelf" value={bookForm.shelf} onChange={handleBookChange}
                    placeholder="A-3"
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </Field>
                <div className="md:col-span-2">
                  <Field label="ဖော်ပြချက်">
                    <textarea name="description" value={bookForm.description} onChange={handleBookChange} rows="3"
                      className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                  </Field>
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowBookModal(false)}
                  className="flex-1 px-4 py-2.5 border rounded-lg hover:bg-gray-50 font-medium">ပယ်ဖျက်</button>
                <button type="submit"
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium">
                  <Save className="w-4 h-4" /> {editingBook ? 'ပြင်ရန်' : 'ထည့်ရန်'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Borrow Modal ===== */}
      {showBorrowModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">📚 စာအုပ် ငှားရန်</h3>
              <button onClick={() => setShowBorrowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleBorrow} className="p-6 space-y-4">
              <Field label="စာအုပ် *">
                <select value={borrowForm.book_id} required
                  onChange={e => setBorrowForm({ ...borrowForm, book_id: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- ရွေးပါ --</option>
                  {books.filter(b => b.available > 0).map(b => (
                    <option key={b.id} value={b.id}>{b.title} ({b.book_id}) · ရနိုင်သေး: {b.available}</option>
                  ))}
                </select>
              </Field>
              <Field label="ကျောင်းသား *">
                <select value={borrowForm.student_id} required
                  onChange={e => setBorrowForm({ ...borrowForm, student_id: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- ရွေးပါ --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.student_id}) · {s.grade}{s.section ? ' - ' + s.section : ''}</option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="ငှားရက် *">
                  <input type="date" value={borrowForm.borrow_date} required
                    onChange={e => setBorrowForm({ ...borrowForm, borrow_date: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </Field>
                <Field label="ပြန်အပ်ရက် *">
                  <input type="date" value={borrowForm.due_date} required
                    onChange={e => setBorrowForm({ ...borrowForm, due_date: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </Field>
              </div>
              <Field label="မှတ်ချက်">
                <textarea value={borrowForm.remarks} rows="2"
                  onChange={e => setBorrowForm({ ...borrowForm, remarks: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </Field>
              <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-800">
                💡 ဒဏ်တမ်းနှုန်း: <strong>{settings.library_fine_per_day || 500}</strong> ကျပ်/ရက် · 
                ငှားကာလ: <strong>{settings.library_loan_days || 14}</strong> ရက်
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowBorrowModal(false)}
                  className="flex-1 px-4 py-2.5 border rounded-lg hover:bg-gray-50">ပယ်ဖျက်</button>
                <button type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg font-medium">
                  ငှားရန်
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Return Modal ===== */}
      {showReturnModal && returnData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">📚 စာအုပ် ပြန်အပ်ရန်</h3>
              <button onClick={() => setShowReturnModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <p><strong>စာအုပ်:</strong> {returnData.book_title}</p>
                <p><strong>ကျောင်းသား:</strong> {returnData.student_name}</p>
                <p><strong>ငှားရက်:</strong> {returnData.borrow_date}</p>
                <p><strong>ပြန်အပ်ရက်:</strong> {returnData.due_date}</p>
                {returnData.is_overdue && (
                  <p className="text-red-600 font-bold">⚠️ {returnData.live_fine?.toLocaleString()} K ဒဏ်တမ်း ကျသင့်ပါမယ်</p>
                )}
              </div>
              <Field label="ပြန်အပ်သည့်ရက် *">
                <input type="date" value={returnForm.return_date} required
                  onChange={e => setReturnForm({ ...returnForm, return_date: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </Field>
              <Field label="မှတ်ချက်">
                <textarea value={returnForm.remarks} rows="2"
                  onChange={e => setReturnForm({ ...returnForm, remarks: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </Field>
              <div className="flex gap-3 pt-4 border-t">
                <button onClick={() => setShowReturnModal(false)}
                  className="flex-1 px-4 py-2.5 border rounded-lg hover:bg-gray-50">ပယ်ဖျက်</button>
                <button onClick={handleReturn}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-medium">
                  ပြန်အပ်ရန်
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Settings Modal ===== */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">⚙️ Library Settings</h3>
              <button onClick={() => setShowSettingsModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <Field label="ဒဏ်တမ်းနှုန်း (ကျပ်/ရက်)">
                <input type="number" value={settingsForm.library_fine_per_day}
                  onChange={e => setSettingsForm({ ...settingsForm, library_fine_per_day: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </Field>
              <Field label="ငှားကာလ (ရက်)">
                <input type="number" value={settingsForm.library_loan_days}
                  onChange={e => setSettingsForm({ ...settingsForm, library_loan_days: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </Field>
              <Field label="ကျောင်းသားတစ်ယောက် ငှားနိုင်တဲ့ အများဆုံး အုပ်ရေ">
                <input type="number" value={settingsForm.library_max_books}
                  onChange={e => setSettingsForm({ ...settingsForm, library_max_books: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </Field>
              <div className="flex gap-3 pt-4 border-t">
                <button onClick={() => setShowSettingsModal(false)}
                  className="flex-1 px-4 py-2.5 border rounded-lg hover:bg-gray-50">ပယ်ဖျက်</button>
                <button onClick={handleSettingsSave}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium">
                  သိမ်းရန်
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Helpers =====
function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

function StatBox({ icon: Icon, label, value, color }) {
  return (
    <div className={`${color} rounded-xl p-4`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4" />
        <p className="text-xs font-medium opacity-80">{label}</p>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}