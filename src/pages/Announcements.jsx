import { useState, useEffect } from 'react';
import {
  Bell, Plus, Edit, Trash2, X, Save, Search, Pin, PinOff,
  AlertCircle, CheckCircle, Eye, Calendar, Users, BookOpen,
  User, Megaphone, AlertTriangle, Paperclip, Upload
} from 'lucide-react';
import API from '../api/axios';

const TYPES = [
  { value: 'General', label: '📢 အထွေထွေ', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { value: 'Exam', label: '📝 စာမေးပွဲ', color: 'bg-red-100 text-red-700 border-red-300' },
  { value: 'Event', label: '🎉 ပွဲလမ်းသဘင်', color: 'bg-purple-100 text-purple-700 border-purple-300' },
  { value: 'Holiday', label: '🏖️ ကျောင်းပိတ်ရက်', color: 'bg-green-100 text-green-700 border-green-300' },
  { value: 'Emergency', label: '🚨 အရေးပေါ်', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  { value: 'Meeting', label: '👥 အစည်းအဝေး', color: 'bg-cyan-100 text-cyan-700 border-cyan-300' },
];

const PRIORITIES = [
  { value: 'Normal', label: '🟢 Normal', color: 'bg-green-100 text-green-700' },
  { value: 'Important', label: '🟡 Important', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'Urgent', label: '🔴 Urgent', color: 'bg-red-100 text-red-700' },
];

const TARGETS = [
  { value: 'All', label: '👥 အားလုံး', icon: Users },
  { value: 'Teachers', label: '👨‍🏫 ဆရာ/ဆရာမ', icon: User },
  { value: 'Students', label: '👨‍🎓 ကျောင်းသားများ', icon: Users },
  { value: 'Parents', label: '👪 မိဘများ', icon: Users },
  { value: 'Class', label: '📚 အတန်း တစ်ခု', icon: BookOpen },
];

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [classes, setClasses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [message, setMessage] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);

  const [formData, setFormData] = useState({
    title: '', content: '', type: 'General', priority: 'Normal',
    target: 'All', target_class_id: '', start_date: '',
    end_date: '', attachment: '', pinned: false, created_by: ''
  });

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterType) params.append('type', filterType);
      if (filterPriority) params.append('priority', filterPriority);

      const [aRes, cRes, sRes] = await Promise.all([
        API.get(`/announcements?${params}`),
        API.get('/classes'),
        API.get('/announcements/stats')
      ]);
      setAnnouncements(aRes.data);
      setClasses(cRes.data);
      setStats(sRes.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [search, filterType, filterPriority]);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleAdd = () => {
    setEditing(null);
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      title: '', content: '', type: 'General', priority: 'Normal',
      target: 'All', target_class_id: '', start_date: today,
      end_date: '', attachment: '', pinned: false, created_by: ''
    });
    setShowModal(true);
  };

  const handleEdit = (a) => {
    setEditing(a);
    setFormData({
      title: a.title || '', content: a.content || '',
      type: a.type || 'General', priority: a.priority || 'Normal',
      target: a.target || 'All', target_class_id: a.target_class_id || '',
      start_date: a.start_date || '', end_date: a.end_date || '',
      attachment: a.attachment || '', pinned: !!a.pinned,
      created_by: a.created_by || ''
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleAttachment = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500 * 1024) return alert('ဖိုင် 500KB အောက်သာ');
    const reader = new FileReader();
    reader.onloadend = () => setFormData(prev => ({ ...prev, attachment: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await API.put(`/announcements/${editing.id}`, formData);
        showMsg('success', 'အသိပေးစာ ပြင်ပြီးပါပြီ');
      } else {
        await API.post('/announcements', formData);
        showMsg('success', 'အသိပေးစာ ဖန်တီးပြီးပါပြီ');
      }
      setShowModal(false);
      load();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`"${title}" ကို ဖျက်မှာ သေချာလား?`)) return;
    try {
      await API.delete(`/announcements/${id}`);
      showMsg('success', 'ဖျက်ပြီးပါပြီ');
      load();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  const handleTogglePin = async (id) => {
    try {
      await API.post(`/announcements/${id}/pin`);
      load();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  const handleView = async (a) => {
    setViewing(a);
    setShowViewModal(true);
    try { await API.post(`/announcements/${a.id}/view`); } catch (e) {}
  };

  const getTypeInfo = (t) => TYPES.find(x => x.value === t) || TYPES[0];
  const getPriorityInfo = (p) => PRIORITIES.find(x => x.value === p) || PRIORITIES[0];
  const getTargetInfo = (t) => TARGETS.find(x => x.value === t) || TARGETS[0];

  const getBorderColor = (type, priority) => {
    if (priority === 'Urgent') return 'border-l-red-500';
    if (priority === 'Important') return 'border-l-yellow-500';
    const map = {
      General: 'border-l-blue-500', Exam: 'border-l-red-500',
      Event: 'border-l-purple-500', Holiday: 'border-l-green-500',
      Emergency: 'border-l-orange-500', Meeting: 'border-l-cyan-500',
    };
    return map[type] || 'border-l-blue-500';
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

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <StatCard icon={Bell} label="စုစုပေါင်း" value={stats.total} color="bg-slate-100 text-slate-700" />
          <StatCard icon={CheckCircle} label="အသက်ဝင်" value={stats.active} color="bg-green-100 text-green-700" />
          <StatCard icon={Pin} label="Pin ထားတာ" value={stats.pinned} color="bg-blue-100 text-blue-700" />
          <StatCard icon={AlertTriangle} label="အရေးပေါ်" value={stats.urgent} color="bg-red-100 text-red-700" />
          <StatCard icon={Eye} label="ကြည့်ပြီး" value={stats.totalViews} color="bg-purple-100 text-purple-700" />
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="အသိပေးစာ ရှာရန်..."
            className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="px-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">အမျိုးအစား အားလုံး</option>
          {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          className="px-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Priority အားလုံး</option>
          {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <div className="flex-1" />
        <button onClick={handleAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg">
          <Plus className="w-5 h-5" /> အသိပေးစာ အသစ်
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">Loading...</div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">အသိပေးစာ မရှိသေးပါ</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => {
            const typeInfo = getTypeInfo(a.type);
            const priorityInfo = getPriorityInfo(a.priority);
            const targetInfo = getTargetInfo(a.target);
            return (
              <div key={a.id}
                className={`bg-white rounded-xl shadow-sm border-l-4 ${getBorderColor(a.type, a.priority)} hover:shadow-md transition`}>
                <div className="p-5">
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {a.pinned ? <Pin className="w-4 h-4 text-blue-600 fill-blue-600" /> : null}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${priorityInfo.color}`}>
                          {priorityInfo.label}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                          <targetInfo.icon className="w-3 h-3" />
                          {a.target === 'Class' && a.target_class_name ? a.target_class_name : targetInfo.label}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 truncate">{a.title}</h3>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => handleTogglePin(a.id)}
                        className={`p-2 rounded-lg ${a.pinned ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:bg-gray-50'}`}>
                        {a.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                      </button>
                      <button onClick={() => handleEdit(a)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(a.id, a.title)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2 mb-3 whitespace-pre-wrap">
                    {a.content}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    {(a.start_date || a.end_date) && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {a.start_date || '...'} → {a.end_date || '...'}
                      </span>
                    )}
                    {a.created_by && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" /> {a.created_by}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {a.views || 0} ကြည့်
                    </span>
                    {a.attachment && (
                      <span className="flex items-center gap-1 text-blue-600">
                        <Paperclip className="w-3 h-3" /> ဖိုင်ပါ
                      </span>
                    )}
                    <button onClick={() => handleView(a)}
                      className="ml-auto text-blue-600 hover:underline font-medium">
                      အပြည့်အစုံ ဖတ်ရန် →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-blue-600" />
                {editing ? 'အသိပေးစာ ပြင်ရန်' : 'အသိပေးစာ အသစ်'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <Field label="ခေါင်းစဉ် *">
                <input type="text" name="title" value={formData.title} onChange={handleChange} required
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="အမျိုးအစား">
                  <select name="type" value={formData.type} onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                    {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </Field>
                <Field label="Priority">
                  <select name="priority" value={formData.priority} onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                    {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </Field>
                <Field label="ပို့မည့်သူ">
                  <select name="target" value={formData.target} onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                    {TARGETS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </Field>
              </div>

              {formData.target === 'Class' && (
                <Field label="အတန်း ရွေးပါ">
                  <select name="target_class_id" value={formData.target_class_id} onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">-- ရွေးပါ --</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                  </select>
                </Field>
              )}

              <Field label="အကြောင်းအရာ *">
                <textarea name="content" value={formData.content} onChange={handleChange} required
                  rows="6"
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="စတင်ရက်">
                  <input type="date" name="start_date" value={formData.start_date} onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </Field>
                <Field label="ပြီးဆုံးရက်">
                  <input type="date" name="end_date" value={formData.end_date} onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </Field>
              </div>

              <Field label="📎 ဖိုင်တွဲ (500KB အောက်)">
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm">
                    <Upload className="w-4 h-4" /> ဖိုင် တင်ရန်
                    <input type="file" accept="image/*,.pdf,.doc,.docx" onChange={handleAttachment} className="hidden" />
                  </label>
                  {formData.attachment && (
                    <div className="flex items-center gap-2 flex-1 bg-blue-50 rounded-lg px-3 py-2 text-sm">
                      <Paperclip className="w-4 h-4 text-blue-600" />
                      <span className="truncate">ဖိုင် တင်ထားပြီး</span>
                      <button type="button" onClick={() => setFormData({ ...formData, attachment: '' })}
                        className="text-red-600 ml-auto">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </Field>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="pinned" checked={formData.pinned} onChange={handleChange}
                  className="w-4 h-4" />
                <Pin className="w-4 h-4 text-blue-600" />
                <span className="text-sm">Dashboard မှာ Pin ထားရန်</span>
              </label>

              <div className="flex gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border rounded-lg hover:bg-gray-50">ပယ်ဖျက်</button>
                <button type="submit"
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium">
                  <Save className="w-4 h-4" /> {editing ? 'ပြင်ရန်' : 'ဖန်တီးရန်'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && viewing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-bold">အသိပေးစာ အပြည့်အစုံ</h3>
              <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {viewing.pinned ? <Pin className="w-4 h-4 text-blue-600 fill-blue-600" /> : null}
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getTypeInfo(viewing.type).color}`}>
                  {getTypeInfo(viewing.type).label}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityInfo(viewing.priority).color}`}>
                  {getPriorityInfo(viewing.priority).label}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">{viewing.title}</h2>
              <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-6 pb-4 border-b">
                {(viewing.start_date || viewing.end_date) && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {viewing.start_date || '...'} → {viewing.end_date || '...'}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" /> {viewing.views} ကြည့်
                </span>
                {viewing.created_by && <span>By: {viewing.created_by}</span>}
              </div>
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {viewing.content}
              </div>
              {viewing.attachment && (
                <div className="mt-6 pt-4 border-t">
                  <a href={viewing.attachment} download
                    className="inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm">
                    <Paperclip className="w-4 h-4" /> ဖိုင် ကြည့်/ဒေါင်းလုပ်
                  </a>
                </div>
              )}
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button onClick={() => setShowViewModal(false)}
                className="px-5 py-2.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-medium">
                ပိတ်
              </button>
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