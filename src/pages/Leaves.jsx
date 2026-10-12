import { useState, useEffect } from 'react';
import {
  Calendar, Plus, Edit, Trash2, X, Save, Search, Clock,
  CheckCircle, XCircle, AlertCircle, User, Filter, Eye
} from 'lucide-react';
import API from '../api/axios';

const LEAVE_TYPES = [
  { value: 'Sick', label: '🤒 ဖျားနာ' },
  { value: 'Personal', label: '👤 ကိုယ်ရေး' },
  { value: 'Family', label: '👪 မိသားစု' },
  { value: 'Emergency', label: '🚨 အရေးပေါ်' },
  { value: 'Other', label: '📄 အခြား' },
];

const STATUSES = [
  { value: 'Pending', label: '⏳ စောင့်ဆိုင်း', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'Approved', label: '✅ အတည်ပြု', color: 'bg-green-100 text-green-700' },
  { value: 'Rejected', label: '❌ ငြင်းပယ်', color: 'bg-red-100 text-red-700' },
];

export default function Leaves() {
  const [leaves, setLeaves] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [message, setMessage] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [statusLeave, setStatusLeave] = useState(null);
  const [statusForm, setStatusForm] = useState({ status: 'Approved' });

  const [formData, setFormData] = useState({
    student_id: '', teacher_id: '', leave_type: 'Sick',
    start_date: '', end_date: '', reason: ''
  });

  // ===== Load =====
  const load = async () => {
    setLoading(true);
    try {
      const [lRes, stRes, sRes, tRes] = await Promise.all([
        API.get('/leaves'),
        API.get('/leaves/stats'),
        API.get('/students?status=Active'),
        API.get('/teachers?status=Active')
      ]);
      setLeaves(lRes.data);
      setStats(stRes.data);
      setStudents(sRes.data);
      setTeachers(tRes.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleAdd = () => {
    setEditing(null);
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      student_id: '', teacher_id: '', leave_type: 'Sick',
      start_date: today, end_date: today, reason: ''
    });
    setShowModal(true);
  };

  const handleEdit = (l) => {
    setEditing(l);
    setFormData({
      student_id: l.student_id || '', teacher_id: l.teacher_id || '',
      leave_type: l.leave_type || 'Sick',
      start_date: l.start_date || '', end_date: l.end_date || '',
      reason: l.reason || ''
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.student_id && !formData.teacher_id) {
      return showMsg('error', 'ကျောင်းသား (သို့) ဆရာ/ဆရာမ ရွေးပါ');
    }
    if (formData.end_date < formData.start_date) {
      return showMsg('error', 'ပြီးဆုံးရက် စတင်ရက်ထက် စောလို့မရပါ');
    }
    try {
      if (editing) {
        await API.put(`/leaves/${editing.id}`, formData);
        showMsg('success', 'ခွင့်ပြင်ပြီးပါပြီ');
      } else {
        await API.post('/leaves', formData);
        showMsg('success', 'ခွင့်တင်ပြီးပါပြီ');
      }
      setShowModal(false);
      load();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('ဒီခွင့်တင်ချက်ကို ဖျက်မှာ သေချာလား?')) return;
    try {
      await API.delete(`/leaves/${id}`);
      showMsg('success', 'ဖျက်ပြီးပါပြီ');
      load();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  const openStatusModal = (l) => {
    setStatusLeave(l);
    setStatusForm({ status: l.status === 'Pending' ? 'Approved' : l.status });
    setShowStatusModal(true);
  };

  const handleStatusUpdate = async () => {
    try {
      await API.post(`/leaves/${statusLeave.id}/status`, statusForm);
      showMsg('success', `Status "${statusForm.status}" သို့ ပြောင်းပြီးပါပြီ`);
      setShowStatusModal(false);
      load();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  // ===== Filters =====
  const filtered = leaves.filter(l => {
    const s = search.toLowerCase();
    const matchSearch = !search ||
      l.student_name?.toLowerCase().includes(s) ||
      l.teacher_name?.toLowerCase().includes(s) ||
      l.reason?.toLowerCase().includes(s);
    const matchStatus = !filterStatus || l.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const getStatusInfo = (s) => STATUSES.find(x => x.value === s) || STATUSES[0];
  const getTypeLabel = (t) => LEAVE_TYPES.find(x => x.value === t)?.label || t;

  const daysBetween = (start, end) => {
    if (!start || !end) return 0;
    const s = new Date(start), e = new Date(end);
    return Math.floor((e - s) / (1000 * 60 * 60 * 24)) + 1;
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
          <StatCard icon={Calendar} label="စုစုပေါင်း" value={stats.total} color="bg-slate-100 text-slate-700" />
          <StatCard icon={Clock} label="စောင့်ဆိုင်း" value={stats.pending} color="bg-yellow-100 text-yellow-700" />
          <StatCard icon={CheckCircle} label="အတည်ပြု" value={stats.approved} color="bg-green-100 text-green-700" />
          <StatCard icon={XCircle} label="ငြင်းပယ်" value={stats.rejected} color="bg-red-100 text-red-700" />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ကျောင်းသား / ဆရာ / အကြောင်းပြချက် ရှာရန်..."
            className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Status အားလုံး</option>
          {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <div className="flex-1" />
        <button onClick={handleAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg">
          <Plus className="w-5 h-5" /> ခွင့်တင်ရန်
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">ခွင့်တင်ချက် မရှိပါ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold">တင်သူ</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">အမျိုးအစား</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">ရက်စွဲ</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold">ရက်</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">အကြောင်းပြချက်</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold">လုပ်ဆောင်ချက်</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(l => {
                  const status = getStatusInfo(l.status);
                  return (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {l.student_name ? (
                          <>
                            <p className="text-sm font-medium">{l.student_name}</p>
                            <p className="text-xs font-mono text-gray-500">🎓 {l.student_code}</p>
                          </>
                        ) : l.teacher_name ? (
                          <>
                            <p className="text-sm font-medium">{l.teacher_name}</p>
                            <p className="text-xs font-mono text-gray-500">👨‍🏫 {l.teacher_code}</p>
                          </>
                        ) : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-4 py-3 text-sm">{getTypeLabel(l.leave_type)}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        <div>{l.start_date}</div>
                        <div className="text-gray-400">→ {l.end_date}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          {daysBetween(l.start_date, l.end_date)} ရက်
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-xs">
                        <p className="truncate">{l.reason}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                        {l.approved_by && (
                          <p className="text-[10px] text-gray-500 mt-1">by {l.approved_by}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {l.status === 'Pending' && (
                          <button onClick={() => openStatusModal(l)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs mr-1">
                            <CheckCircle className="w-3 h-3 inline mr-1" /> ဆုံးဖြတ်
                          </button>
                        )}
                        <button onClick={() => handleEdit(l)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="ပြင်">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(l.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="ဖျက်">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== Add/Edit Modal ===== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">
                {editing ? '✏️ ခွင့် ပြင်ရန်' : '➕ ခွင့် တင်ရန်'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="🎓 ကျောင်းသား">
                  <select name="student_id" value={formData.student_id} onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">-- မရွေး --</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.student_id}) - {s.grade}</option>
                    ))}
                  </select>
                </Field>

                <Field label="👨‍🏫 ဆရာ/ဆရာမ">
                  <select name="teacher_id" value={formData.teacher_id} onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">-- မရွေး --</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.teacher_id}) - {t.subject}</option>
                    ))}
                  </select>
                </Field>

                <Field label="အမျိုးအစား">
                  <select name="leave_type" value={formData.leave_type} onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                    {LEAVE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </Field>

                <Field label="ရက် အရေအတွက်">
                  <div className="px-4 py-2 bg-blue-50 rounded-lg text-sm font-medium text-blue-700">
                    {daysBetween(formData.start_date, formData.end_date)} ရက်
                  </div>
                </Field>

                <Field label="စတင်ရက် *">
                  <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} required
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </Field>

                <Field label="ပြီးဆုံးရက် *">
                  <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} required
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </Field>

                <div className="md:col-span-2">
                  <Field label="အကြောင်းပြချက် *">
                    <textarea name="reason" value={formData.reason} onChange={handleChange} required
                      rows="4" placeholder="ခွင့်တင်ရသည့် အကြောင်းရင်း..."
                      className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                  </Field>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border rounded-lg hover:bg-gray-50 font-medium">ပယ်ဖျက်</button>
                <button type="submit"
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium">
                  <Save className="w-4 h-4" /> {editing ? 'ပြင်ရန်' : 'တင်ရန်'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Status Modal ===== */}
      {showStatusModal && statusLeave && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">⚖️ ခွင့် ဆုံးဖြတ်ရန်</h3>
              <button onClick={() => setShowStatusModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
                <p><strong>တင်သူ:</strong> {statusLeave.student_name || statusLeave.teacher_name}</p>
                <p><strong>ရက်စွဲ:</strong> {statusLeave.start_date} → {statusLeave.end_date}</p>
                <p><strong>ရက်:</strong> {daysBetween(statusLeave.start_date, statusLeave.end_date)} ရက်</p>
                <p><strong>အကြောင်းပြချက်:</strong> {statusLeave.reason}</p>
              </div>

              <Field label="ဆုံးဖြတ်ချက်">
                <select value={statusForm.status}
                  onChange={e => setStatusForm({ ...statusForm, status: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Approved">✅ အတည်ပြု</option>
                  <option value="Rejected">❌ ငြင်းပယ်</option>
                  <option value="Pending">⏳ စောင့်ဆိုင်း</option>
                </select>
              </Field>

              <div className="flex gap-3 pt-4 border-t">
                <button onClick={() => setShowStatusModal(false)}
                  className="flex-1 px-4 py-2.5 border rounded-lg hover:bg-gray-50 font-medium">ပယ်ဖျက်</button>
                <button onClick={handleStatusUpdate}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-medium">
                  အတည်ပြု
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
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

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}