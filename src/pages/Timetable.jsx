import { useState, useEffect, useRef } from 'react';
import {
  Calendar, Plus, Edit, Trash2, X, Save, Clock, AlertCircle,
  CheckCircle, Settings as SettingsIcon, Printer, Users, BookOpen,
  User, Grid3X3, Coffee, Utensils
} from 'lucide-react';
import API from '../api/axios';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_MM = {
  Monday: 'တနင်္လာ',
  Tuesday: 'အင်္ဂါ',
  Wednesday: 'ဗုဒ္ဓဟူး',
  Thursday: 'ကြာသပတေး',
  Friday: 'သောကြာ',
  Saturday: 'စနေ',
};

const COLORS = [
  { value: 'blue', bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-800', solid: 'bg-blue-500' },
  { value: 'green', bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-800', solid: 'bg-green-500' },
  { value: 'purple', bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-800', solid: 'bg-purple-500' },
  { value: 'orange', bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-800', solid: 'bg-orange-500' },
  { value: 'pink', bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-800', solid: 'bg-pink-500' },
  { value: 'cyan', bg: 'bg-cyan-100', border: 'border-cyan-300', text: 'text-cyan-800', solid: 'bg-cyan-500' },
  { value: 'yellow', bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-800', solid: 'bg-yellow-500' },
  { value: 'red', bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-800', solid: 'bg-red-500' },
];

const COMMON_SUBJECTS = [
  'မြန်မာစာ', 'English', 'Mathematics', 'Science', 'Social Studies',
  'Physics', 'Chemistry', 'Biology', 'History', 'Geography',
  'Computer', 'Physical Education', 'Art', 'Music', 'Religion'
];

export default function Timetable() {
  const [activeTab, setActiveTab] = useState('class');
  const [periods, setPeriods] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const printRef = useRef();

  // Modals
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editingPeriod, setEditingPeriod] = useState(null);

  const [entryForm, setEntryForm] = useState({
    class_id: '', day: 'Monday', period_id: '', subject: '',
    teacher_id: '', room: '', color: 'blue', notes: ''
  });

  const [periodForm, setPeriodForm] = useState({
    start_time: '09:00', end_time: '09:45', period_type: 'Class', is_break: false
  });

  // ===== Load =====
  const load = async () => {
    setLoading(true);
    try {
      const [pRes, cRes, tRes, sRes] = await Promise.all([
        API.get('/timetable/periods'),
        API.get('/classes'),
        API.get('/teachers'),
        API.get('/timetable/stats')
      ]);
      setPeriods(pRes.data);
      setClasses(cRes.data);
      setTeachers(tRes.data);
      setStats(sRes.data);
      if (cRes.data.length > 0 && !selectedClass) {
        setSelectedClass(String(cRes.data[0].id));
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadClassEntries = async () => {
    if (!selectedClass) { setEntries([]); return; }
    try {
      const r = await API.get(`/timetable/class/${selectedClass}`);
      setEntries(r.data);
    } catch (e) { console.error(e); }
  };

  const loadTeacherEntries = async () => {
    if (!selectedTeacher) { setEntries([]); return; }
    try {
      const r = await API.get(`/timetable/teacher/${selectedTeacher}`);
      setEntries(r.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (activeTab === 'class') loadClassEntries();
    else if (activeTab === 'teacher') loadTeacherEntries();
  }, [activeTab, selectedClass, selectedTeacher]);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // ===== Entry =====
  const handleOpenEntryModal = (day, periodId, existing = null) => {
    if (!selectedClass && activeTab === 'class') {
      return showMsg('error', 'အတန်း ရွေးပါ ဦးစွာ');
    }
    if (existing) {
      setEditingEntry(existing);
      setEntryForm({
        class_id: existing.class_id,
        day: existing.day,
        period_id: existing.period_id,
        subject: existing.subject,
        teacher_id: existing.teacher_id || '',
        room: existing.room || '',
        color: existing.color || 'blue',
        notes: existing.notes || ''
      });
    } else {
      setEditingEntry(null);
      setEntryForm({
        class_id: selectedClass,
        day: day || 'Monday',
        period_id: periodId || '',
        subject: '',
        teacher_id: '',
        room: '',
        color: 'blue',
        notes: ''
      });
    }
    setShowEntryModal(true);
  };

  const handleEntrySubmit = async (e) => {
    e.preventDefault();
    try {
      const r = await API.post('/timetable/entries', entryForm);
      showMsg('success', r.data.message || 'သိမ်းပြီးပါပြီ');
      setShowEntryModal(false);
      if (activeTab === 'class') loadClassEntries();
      load();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!confirm('ဒီအချိန်တိုင် ကို ဖျက်မှာ သေချာလား?')) return;
    try {
      await API.delete(`/timetable/entries/${id}`);
      showMsg('success', 'ဖျက်ပြီးပါပြီ');
      loadClassEntries();
      load();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  const handleClearClass = async () => {
    if (!selectedClass) return;
    if (!confirm('ဒီအတန်းရဲ့ အချိန်ဇယား အားလုံး ဖျက်မှာ သေချာလား?')) return;
    try {
      const r = await API.delete(`/timetable/class/${selectedClass}/clear`);
      showMsg('success', r.data.message);
      loadClassEntries();
      load();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  // ===== Period =====
  const handleOpenPeriodModal = (period = null) => {
    if (period) {
      setEditingPeriod(period);
      setPeriodForm({
        start_time: period.start_time,
        end_time: period.end_time,
        period_type: period.period_type || 'Class',
        is_break: !!period.is_break
      });
    } else {
      setEditingPeriod(null);
      setPeriodForm({ start_time: '09:00', end_time: '09:45', period_type: 'Class', is_break: false });
    }
    setShowPeriodModal(true);
  };

  const handlePeriodSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPeriod) {
        await API.put(`/timetable/periods/${editingPeriod.id}`, periodForm);
        showMsg('success', 'Period ပြင်ပြီးပါပြီ');
      } else {
        await API.post('/timetable/periods', periodForm);
        showMsg('success', 'Period ထည့်ပြီးပါပြီ');
      }
      setShowPeriodModal(false);
      load();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  const handleDeletePeriod = async (id) => {
    if (!confirm('Period ဖျက်မှာ သေချာလား?')) return;
    try {
      await API.delete(`/timetable/periods/${id}`);
      showMsg('success', 'ဖျက်ပြီးပါပြီ');
      load();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  // ===== Helpers =====
  const getEntry = (day, periodId) => {
    if (activeTab === 'class') {
      return entries.find(e => e.day === day && e.period_id === periodId);
    }
    return entries.find(e => e.day === day && e.period_id === periodId);
  };

  const getColorInfo = (color) => COLORS.find(c => c.value === color) || COLORS[0];

  const currentClass = classes.find(c => String(c.id) === String(selectedClass));
  const currentTeacher = teachers.find(t => String(t.id) === String(selectedTeacher));

  // ===== Print =====
  const handlePrint = () => {
    const content = printRef.current?.innerHTML || '';
    const title = activeTab === 'class'
      ? `Timetable - ${currentClass?.class_name || ''}`
      : `Timetable - ${currentTeacher?.name || ''}`;

    const win = window.open('', '', 'width=1200,height=800');
    win.document.write(`
      <html><head><title>${title}</title>
      <style>
        @page { size: A4 landscape; margin: 10mm; }
        body { font-family: 'Pyidaungsu', 'Myanmar Text', sans-serif; padding: 10px; color: #111; }
        .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .header h1 { margin: 3px 0; font-size: 22px; }
        .header p { margin: 2px 0; font-size: 13px; color: #555; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #999; padding: 6px; text-align: center; font-size: 11px; vertical-align: middle; }
        th { background: #1e40af; color: white; padding: 8px; font-size: 12px; }
        .period-col { background: #f3f4f6; font-weight: bold; width: 80px; }
        .break-cell { background: #fef3c7; color: #92400e; font-style: italic; }
        .cell-content { padding: 4px; }
        .subject { font-weight: bold; font-size: 12px; }
        .teacher { font-size: 10px; color: #555; margin-top: 2px; }
        .room { font-size: 9px; color: #888; }
      </style></head><body>
      <div class="header">
        <h1>Maw Goon Thit School</h1>
        <p>အချိန်ဇယား - ${activeTab === 'class' ? currentClass?.class_name : currentTeacher?.name}</p>
      </div>
      ${content}
      <p style="text-align:center; font-size:10px; color:#999; margin-top:20px;">
        Generated on ${new Date().toLocaleString()}
      </p>
      </body></html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 300);
  };

  const tabs = [
    { key: 'class', label: '📅 အတန်းအလိုက်', icon: Grid3X3 },
    { key: 'teacher', label: '👨‍🏫 ဆရာအလိုက်', icon: User },
  ];

  // ===== Build table grid =====
  const renderGrid = () => {
    const classEntries = entries;

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white">
          <thead>
            <tr className="bg-slate-800 text-white">
              <th className="border border-slate-600 px-3 py-3 text-xs font-bold w-24">
                အချိန်
              </th>
              {DAYS.map(day => (
                <th key={day} className="border border-slate-600 px-3 py-3 text-sm font-bold">
                  <div>{DAYS_MM[day]}</div>
                  <div className="text-[10px] opacity-70">{day}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map(period => {
              if (period.is_break) {
                return (
                  <tr key={period.id} className="bg-yellow-50">
                    <td className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-gray-700">
                      <div>{period.start_time}</div>
                      <div className="text-[10px]">→ {period.end_time}</div>
                    </td>
                    <td colSpan={DAYS.length} className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-yellow-800 bg-yellow-100">
                      {period.period_type === 'Lunch' ? '🍽️ နေ့လည်စာ' : '☕ အနားယူ'}
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={period.id}>
                  <td className="border border-gray-300 px-2 py-2 text-center bg-gray-100">
                    <div className="text-xs font-bold text-gray-700">P{period.period_no}</div>
                    <div className="text-[10px] text-gray-600">{period.start_time}</div>
                    <div className="text-[10px] text-gray-600">→ {period.end_time}</div>
                  </td>
                  {DAYS.map(day => {
                    const entry = classEntries.find(e =>
                      e.day === day && e.period_id === period.id
                    );
                    if (entry) {
                      const c = getColorInfo(entry.color);
                      return (
                        <td key={day} className={`border border-gray-300 p-1 ${c.bg} cursor-pointer hover:opacity-80 transition`}
                          onClick={() => handleOpenEntryModal(day, period.id, entry)}>
                          <div className="text-center p-1">
                            <p className={`text-xs font-bold ${c.text} leading-tight`}>
                              {entry.subject}
                            </p>
                            {entry.teacher_name && (
                              <p className="text-[10px] text-gray-700 mt-1 truncate">
                                {entry.teacher_name}
                              </p>
                            )}
                            {entry.room && (
                              <p className="text-[9px] text-gray-500">📍 {entry.room}</p>
                            )}
                          </div>
                        </td>
                      );
                    }
                    return (
                      <td key={day}
                        className="border border-gray-300 p-1 hover:bg-blue-50 cursor-pointer transition"
                        onClick={() => handleOpenEntryModal(day, period.id)}>
                        <div className="flex items-center justify-center h-full py-3 text-gray-300 hover:text-blue-500">
                          <Plus className="w-4 h-4" />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

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

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-100 text-blue-700 rounded-xl p-4">
            <p className="text-xs opacity-80">အချိန်တိုင်</p>
            <p className="text-2xl font-bold">{stats.totalPeriods}</p>
          </div>
          <div className="bg-green-100 text-green-700 rounded-xl p-4">
            <p className="text-xs opacity-80">အတန်း စီစဉ်ပြီး</p>
            <p className="text-2xl font-bold">{stats.totalClasses}</p>
          </div>
          <div className="bg-purple-100 text-purple-700 rounded-xl p-4">
            <p className="text-xs opacity-80">ဆရာ ပါဝင်</p>
            <p className="text-2xl font-bold">{stats.totalTeachers}</p>
          </div>
          <div className="bg-orange-100 text-orange-700 rounded-xl p-4">
            <p className="text-xs opacity-80">စုစုပေါင်း Entry</p>
            <p className="text-2xl font-bold">{stats.totalEntries}</p>
          </div>
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
          <button onClick={() => handleOpenPeriodModal()}
            className="flex items-center gap-2 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50">
            <Clock className="w-4 h-4" /> Period စီမံ
          </button>
        </div>
      </div>

      {/* Filters + Actions */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-center no-print">
        {activeTab === 'class' && (
          <>
            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
              className="px-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]">
              <option value="">-- အတန်း ရွေးပါ --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
            </select>
            {selectedClass && (
              <button onClick={handleClearClass}
                className="px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg text-sm flex items-center gap-1">
                <Trash2 className="w-4 h-4" /> အားလုံး ရှင်း
              </button>
            )}
          </>
        )}
        {activeTab === 'teacher' && (
          <select value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)}
            className="px-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]">
            <option value="">-- ဆရာ/ဆရာမ ရွေးပါ --</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>)}
          </select>
        )}
        <div className="flex-1" />
        <button onClick={handlePrint} disabled={entries.length === 0}
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg disabled:opacity-50">
          <Printer className="w-4 h-4" /> Print
        </button>
      </div>

      {/* Grid */}
      <div ref={printRef} className="bg-white rounded-xl shadow-sm p-4">
        <div className="no-print mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
          💡 <strong>အချိန်တိုင် Cell ကို နှိပ်ပြီး</strong> ဘာသာရပ်/ဆရာ ထည့်ပါ · 
          <strong>ရှိပြီးသား Cell ကို ပြန်နှိပ်ရင်</strong> ပြင်လို့ရပါတယ်
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading...</div>
        ) : periods.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">အချိန်တိုင် မရှိသေးပါ</p>
            <button onClick={() => handleOpenPeriodModal()}
              className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
              Period ထည့်ရန်
            </button>
          </div>
        ) : activeTab === 'class' && !selectedClass ? (
          <div className="p-12 text-center">
            <Grid3X3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">အတန်း ရွေးပါ</p>
          </div>
        ) : activeTab === 'teacher' && !selectedTeacher ? (
          <div className="p-12 text-center">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">ဆရာ/ဆရာမ ရွေးပါ</p>
          </div>
        ) : (
          renderGrid()
        )}
      </div>

      {/* ===== Entry Modal ===== */}
      {showEntryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">
                {editingEntry ? '✏️ အချိန်တိုင် ပြင်ရန်' : '➕ အချိန်တိုင် ထည့်ရန်'}
              </h3>
              <button onClick={() => setShowEntryModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEntrySubmit} className="p-6 space-y-4">
              <div className="bg-blue-50 rounded-lg p-3 text-sm">
                <p><strong>ရက်:</strong> {DAYS_MM[entryForm.day]} ({entryForm.day})</p>
                <p><strong>Period:</strong> {periods.find(p => String(p.id) === String(entryForm.period_id))?.period_no} 
                  {periods.find(p => String(p.id) === String(entryForm.period_id)) && 
                   ` · ${periods.find(p => String(p.id) === String(entryForm.period_id)).start_time} - ${periods.find(p => String(p.id) === String(entryForm.period_id)).end_time}`
                  }
                </p>
              </div>

              {activeTab === 'class' && (
                <Field label="အတန်း *">
                  <select value={entryForm.class_id} required
                    onChange={e => setEntryForm({ ...entryForm, class_id: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">-- ရွေးပါ --</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                  </select>
                </Field>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Field label="ရက် *">
                  <select value={entryForm.day} required
                    onChange={e => setEntryForm({ ...entryForm, day: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                    {DAYS.map(d => <option key={d} value={d}>{DAYS_MM[d]} ({d})</option>)}
                  </select>
                </Field>
                <Field label="Period *">
                  <select value={entryForm.period_id} required
                    onChange={e => setEntryForm({ ...entryForm, period_id: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">-- ရွေးပါ --</option>
                    {periods.filter(p => !p.is_break).map(p => (
                      <option key={p.id} value={p.id}>P{p.period_no} · {p.start_time}-{p.end_time}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="ဘာသာရပ် *">
                <input type="text" value={entryForm.subject} required
                  onChange={e => setEntryForm({ ...entryForm, subject: e.target.value })}
                  placeholder="ဥပမာ: Mathematics"
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                <div className="flex flex-wrap gap-1 mt-2">
                  {COMMON_SUBJECTS.slice(0, 8).map(s => (
                    <button key={s} type="button"
                      onClick={() => setEntryForm({ ...entryForm, subject: s })}
                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-blue-100 rounded">
                      {s}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="ဆရာ/ဆရာမ">
                <select value={entryForm.teacher_id}
                  onChange={e => setEntryForm({ ...entryForm, teacher_id: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- မရွေး --</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name} {t.subject ? `(${t.subject})` : ''}</option>)}
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="အခန်း">
                  <input type="text" value={entryForm.room}
                    onChange={e => setEntryForm({ ...entryForm, room: e.target.value })}
                    placeholder="Room 101"
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </Field>
                <Field label="အရောင်">
                  <div className="flex flex-wrap gap-1 pt-1">
                    {COLORS.map(c => (
                      <button key={c.value} type="button"
                        onClick={() => setEntryForm({ ...entryForm, color: c.value })}
                        className={`w-7 h-7 rounded-full ${c.solid} ${
                          entryForm.color === c.value ? 'ring-2 ring-offset-2 ring-gray-800' : ''
                        }`} />
                    ))}
                  </div>
                </Field>
              </div>

              <Field label="မှတ်ချက်">
                <input type="text" value={entryForm.notes}
                  onChange={e => setEntryForm({ ...entryForm, notes: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </Field>

              <div className="flex gap-3 pt-4 border-t">
                {editingEntry && (
                  <button type="button" onClick={() => { setShowEntryModal(false); handleDeleteEntry(editingEntry.id); }}
                    className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button type="button" onClick={() => setShowEntryModal(false)}
                  className="flex-1 px-4 py-2.5 border rounded-lg hover:bg-gray-50">ပယ်ဖျက်</button>
                <button type="submit"
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium">
                  <Save className="w-4 h-4" /> {editingEntry ? 'ပြင်ရန်' : 'ထည့်ရန်'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Period Modal ===== */}
      {showPeriodModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">⏰ အချိန်တိုင် စီမံခန့်ခွဲမှု</h3>
              <button onClick={() => setShowPeriodModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Form */}
              <form onSubmit={handlePeriodSubmit} className="bg-blue-50 rounded-xl p-4 mb-4 space-y-3">
                <h4 className="text-sm font-bold text-blue-800">
                  {editingPeriod ? '✏️ ပြင်ရန်' : '➕ Period အသစ်'}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="စတင်ချိန်">
                    <input type="time" value={periodForm.start_time} required
                      onChange={e => setPeriodForm({ ...periodForm, start_time: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                  </Field>
                  <Field label="ပြီးဆုံးချိန်">
                    <input type="time" value={periodForm.end_time} required
                      onChange={e => setPeriodForm({ ...periodForm, end_time: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="အမျိုးအစား">
                    <select value={periodForm.period_type}
                      onChange={e => setPeriodForm({ ...periodForm, period_type: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="Class">📚 အတန်း</option>
                      <option value="Break">☕ အနားယူ</option>
                      <option value="Lunch">🍽️ နေ့လည်စာ</option>
                      <option value="Assembly">🎌 စုဝေး</option>
                    </select>
                  </Field>
                  <Field label="Break လား?">
                    <label className="flex items-center gap-2 mt-2">
                      <input type="checkbox" checked={periodForm.is_break}
                        onChange={e => setPeriodForm({ ...periodForm, is_break: e.target.checked })}
                        className="w-4 h-4" />
                      <span className="text-sm">Break အဖြစ် သတ်မှတ်</span>
                    </label>
                  </Field>
                </div>
                <div className="flex gap-2">
                  {editingPeriod && (
                    <button type="button" onClick={() => { setEditingPeriod(null); setPeriodForm({ start_time: '09:00', end_time: '09:45', period_type: 'Class', is_break: false }); }}
                      className="px-3 py-2 border rounded-lg text-sm">Cancel</button>
                  )}
                  <button type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium">
                    {editingPeriod ? 'ပြင်ရန်' : 'ထည့်ရန်'}
                  </button>
                </div>
              </form>

              {/* Period List */}
              <h4 className="text-sm font-bold text-gray-700 mb-2">Period စာရင်း ({periods.length})</h4>
              <div className="space-y-2">
                {periods.map(p => (
                  <div key={p.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                    p.is_break ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        p.is_break ? 'bg-yellow-200 text-yellow-800' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {p.is_break ? (p.period_type === 'Lunch' ? '🍽️' : '☕') : `P${p.period_no}`}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{p.start_time} - {p.end_time}</p>
                        <p className="text-xs text-gray-500">{p.period_type}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleOpenPeriodModal(p)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeletePeriod(p.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50">
              <button onClick={() => setShowPeriodModal(false)}
                className="w-full px-4 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-medium">
                ပိတ်
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}