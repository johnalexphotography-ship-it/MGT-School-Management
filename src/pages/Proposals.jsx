import { useState, useEffect, useRef } from 'react';
import {
  FileText, Plus, Edit, Trash2, X, Save, Search, Printer,
  AlertCircle, CheckCircle, Clock, XCircle, CheckCircle2,
  DollarSign, Calendar, User, Building2, Paperclip, Upload,
  Eye, TrendingUp, Award, Ban, FileSpreadsheet, Send, Download
} from 'lucide-react';
import API from '../api/axios';

// ===== Config =====
const PROPOSAL_TYPES = [
  { value: 'Budget', label: '💰 ဘတ်ဂျက်' },
  { value: 'Project', label: '🏗️ စီမံကိန်း' },
  { value: 'Event', label: '🎉 ပွဲလမ်းသဘင်' },
  { value: 'Academic', label: '📚 ပညာရေး' },
  { value: 'Infrastructure', label: '🏛️ အဆောက်အအုံ' },
  { value: 'Equipment', label: '🛠️ ပစ္စည်း' },
  { value: 'Training', label: '🎓 သင်တန်း' },
  { value: 'Scholarship', label: '🏆 ပညာသင်ဆု' },
  { value: 'Other', label: '📄 အခြား' },
];

const PRIORITIES = [
  { value: 'Low', label: '🟢 နည်း', color: 'bg-green-100 text-green-700' },
  { value: 'Medium', label: '🟡 အလယ်', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'High', label: '🟠 မြင့်', color: 'bg-orange-100 text-orange-700' },
  { value: 'Urgent', label: '🔴 အရေးကြီး', color: 'bg-red-100 text-red-700' },
];

const STATUSES = [
  { value: 'Draft', label: '📝 မူကြမ်း', color: 'bg-gray-100 text-gray-700' },
  { value: 'Submitted', label: '📤 တင်သွင်း', color: 'bg-blue-100 text-blue-700' },
  { value: 'Under Review', label: '🔍 သုံးသပ်', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'Approved', label: '✅ အတည်ပြု', color: 'bg-green-100 text-green-700' },
  { value: 'Rejected', label: '❌ ငြင်း', color: 'bg-red-100 text-red-700' },
  { value: 'Completed', label: '🎯 ပြီးစီး', color: 'bg-purple-100 text-purple-700' },
  { value: 'Cancelled', label: '🚫 ပယ်ဖျက်', color: 'bg-gray-200 text-gray-600' },
];

const CURRENCIES = {
  MMK: { symbol: 'K', name: 'ကျပ်' },
  THB: { symbol: '฿', name: 'ဘတ်' },
  USD: { symbol: '$', name: 'ဒေါ်လာ' },
  GBP: { symbol: '£', name: 'ပေါင်' },
  EUR: { symbol: '€', name: 'ယူရို' },
  SGD: { symbol: 'S$', name: 'စင်္ကာပူ' },
};

const DEPARTMENTS = [
  'Academic', 'Administration', 'Finance', 'Library', 'Sports',
  'Hostel', 'Transport', 'Maintenance', 'IT', 'Other'
];

export default function Proposals() {
  const [activeTab, setActiveTab] = useState('list');
  const [proposals, setProposals] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [message, setMessage] = useState(null);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [editingProposal, setEditingProposal] = useState(null);
  const [viewProposal, setViewProposal] = useState(null);
  const [statusProposal, setStatusProposal] = useState(null);
  const [statusForm, setStatusForm] = useState({ status: '', approval_notes: '', approved_by: '' });

  const [formData, setFormData] = useState({
    title: '', type: 'Budget', description: '', budget: '', currency: 'MMK',
    department: '', submitted_by: '', target_date: '', priority: 'Medium',
    status: 'Draft', attachments: []
  });

  // ===== Load =====
  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterType) params.append('type', filterType);
      if (filterStatus) params.append('status', filterStatus);
      if (filterPriority) params.append('priority', filterPriority);

      const [pRes, sRes] = await Promise.all([
        API.get(`/proposals?${params.toString()}`),
        API.get('/proposals/stats')
      ]);
      setProposals(pRes.data);
      setStats(sRes.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [search, filterType, filterStatus, filterPriority]);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // ===== Add / Edit =====
  const handleAdd = () => {
    setEditingProposal(null);
    // Client-side preview number
    const year = new Date().getFullYear();
    const previewNo = `PROP-${year}-(auto)`;
    setFormData({
      title: '', type: 'Budget', description: '', budget: '', currency: 'MMK',
      department: '', submitted_by: '', target_date: '', priority: 'Medium',
      status: 'Draft', attachments: [], proposal_no_preview: previewNo
    });
    setShowModal(true);
  };

  const handleEdit = (p) => {
    setEditingProposal(p);
    setFormData({
      title: p.title || '', type: p.type || 'Budget',
      description: p.description || '', budget: p.budget || '',
      currency: p.currency || 'MMK', department: p.department || '',
      submitted_by: p.submitted_by || '', target_date: p.target_date || '',
      priority: p.priority || 'Medium', status: p.status || 'Draft',
      attachments: p.attachments || []
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ===== File Upload (Attachment) =====
  const handleAttachment = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.size > 500 * 1024) {
        alert(`"${file.name}" - 500KB အောက်သာ ရွေးပါ`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          attachments: [...(prev.attachments || []), {
            name: file.name,
            type: file.type,
            size: file.size,
            data: reader.result
          }]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (idx) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== idx)
    }));
  };

  // ===== Submit =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProposal) {
        await API.put(`/proposals/${editingProposal.id}`, formData);
        showMsg('success', 'Proposal ပြင်ပြီးပါပြီ');
      } else {
        const r = await API.post('/proposals', formData);
        showMsg('success', `Proposal ${r.data.proposal_no} ဖန်တီးပြီးပါပြီ`);
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
      await API.delete(`/proposals/${id}`);
      showMsg('success', 'Proposal ဖျက်ပြီးပါပြီ');
      load();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  const openStatusModal = (p) => {
    setStatusProposal(p);
    setStatusForm({ status: p.status, approval_notes: p.approval_notes || '', approved_by: p.approved_by || '' });
    setShowStatusModal(true);
  };

  const handleStatusUpdate = async () => {
    try {
      await API.post(`/proposals/${statusProposal.id}/status`, statusForm);
      showMsg('success', `Status "${statusForm.status}" သို့ ပြောင်းပြီးပါပြီ`);
      setShowStatusModal(false);
      load();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  const fmt = (n) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n || 0);
  const getCurrencyInfo = (code) => CURRENCIES[code] || CURRENCIES.MMK;
  const getStatusInfo = (s) => STATUSES.find(x => x.value === s) || STATUSES[0];
  const getPriorityInfo = (p) => PRIORITIES.find(x => x.value === p) || PRIORITIES[1];
  const getTypeInfo = (t) => PROPOSAL_TYPES.find(x => x.value === t) || PROPOSAL_TYPES[PROPOSAL_TYPES.length - 1];

  const tabs = [
    { key: 'list', label: '📋 Proposal စာရင်း', icon: FileText },
    { key: 'stats', label: '📊 အနှစ်ချုပ်', icon: TrendingUp },
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
        </div>
      </div>

      {/* ===== TAB 1: List ===== */}
      {activeTab === 'list' && (
        <div className="space-y-6">
          {/* Quick Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              <StatCard label="စုစုပေါင်း" value={stats.total} color="bg-slate-100 text-slate-700" />
              <StatCard label="မူကြမ်း" value={stats.draft} color="bg-gray-100 text-gray-700" />
              <StatCard label="တင်သွင်း" value={stats.submitted} color="bg-blue-100 text-blue-700" />
              <StatCard label="သုံးသပ်" value={stats.review} color="bg-yellow-100 text-yellow-700" />
              <StatCard label="အတည်ပြု" value={stats.approved} color="bg-green-100 text-green-700" />
              <StatCard label="ငြင်း" value={stats.rejected} color="bg-red-100 text-red-700" />
              <StatCard label="ပြီးစီး" value={stats.completed} color="bg-purple-100 text-purple-700" />
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Proposal ရှာရန်..."
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="px-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">အမျိုးအစား အားလုံး</option>
              {PROPOSAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Status အားလုံး</option>
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
              className="px-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Priority အားလုံး</option>
              {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <div className="flex-1" />
            <button onClick={handleAdd}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg">
              <Plus className="w-5 h-5" /> Proposal အသစ်
            </button>
          </div>

          {/* List */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-500">Loading...</div>
            ) : proposals.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Proposal မရှိသေးပါ</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold">Proposal No</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">ခေါင်းစဉ်</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">အမျိုးအစား</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold">ဘတ်ဂျက်</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">Priority</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold">လုပ်ဆောင်ချက်</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {proposals.map(p => {
                      const status = getStatusInfo(p.status);
                      const priority = getPriorityInfo(p.priority);
                      const type = getTypeInfo(p.type);
                      const cur = getCurrencyInfo(p.currency);
                      return (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-xs font-mono font-bold text-blue-600">{p.proposal_no}</td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-800 max-w-md truncate">{p.title}</p>
                            {p.department && <p className="text-xs text-gray-500">{p.department}</p>}
                          </td>
                          <td className="px-4 py-3 text-sm">{type.label}</td>
                          <td className="px-4 py-3 text-right">
                            {p.budget ? (
                              <span className="text-sm font-bold text-gray-800">
                                {cur.symbol} {fmt(p.budget)}
                              </span>
                            ) : <span className="text-xs text-gray-400">-</span>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${priority.color}`}>
                              {priority.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <button onClick={() => { setViewProposal(p); setShowViewModal(true); }}
                              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded" title="ကြည့်">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => openStatusModal(p)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Status ပြောင်း">
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleEdit(p)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="ပြင်">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(p.id, p.title)}
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
        </div>
      )}

      {/* ===== TAB 2: Stats ===== */}
      {activeTab === 'stats' && stats && (
        <div className="space-y-6">
          {/* Budget by Currency */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold mb-4">💰 ဘတ်ဂျက် အနှစ်ချုပ် (ငွေကြေးအလိုက်)</h3>
            {stats.budgetByCurrency.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Data မရှိပါ</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.budgetByCurrency.map(b => {
                  const cur = getCurrencyInfo(b.currency);
                  return (
                    <div key={b.currency} className="bg-blue-50 rounded-lg p-5 border-l-4 border-blue-500">
                      <p className="text-xs font-bold text-blue-800 mb-2">{b.currency} ({cur.name})</p>
                      <p className="text-2xl font-bold text-gray-800 mb-3">{cur.symbol} {fmt(b.total)}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white/70 rounded p-2">
                          <p className="text-green-700">အတည်ပြု</p>
                          <p className="font-bold text-green-700">{cur.symbol} {fmt(b.approved)}</p>
                        </div>
                        <div className="bg-white/70 rounded p-2">
                          <p className="text-yellow-700">စောင့်ဆိုင်း</p>
                          <p className="font-bold text-yellow-700">{cur.symbol} {fmt(b.pending)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* By Type */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold mb-4">📊 အမျိုးအစားအလိုက်</h3>
            {stats.byType.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Data မရှိပါ</p>
            ) : (
              <div className="space-y-3">
                {stats.byType.map(t => {
                  const typeInfo = getTypeInfo(t.type);
                  const pct = (t.count / stats.total) * 100;
                  return (
                    <div key={t.type}>
                      <div className="flex justify-between items-center mb-1 text-sm">
                        <span>{typeInfo.label}</span>
                        <span className="font-bold">{t.count} ({Math.round(pct)}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full rounded-full transition-all"
                          style={{ width: `${Math.max(pct, 5)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== Add/Edit Modal ===== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h3 className="text-xl font-bold">
                  {editingProposal ? 'Proposal ပြင်ရန်' : 'Proposal အသစ်'}
                </h3>
                {!editingProposal && formData.proposal_no_preview && (
                  <p className="text-xs text-gray-500 mt-1">အသစ် No: <span className="font-mono font-bold text-blue-600">{formData.proposal_no_preview}</span></p>
                )}
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Field label="Proposal ခေါင်းစဉ် *">
                      <input type="text" name="title" value={formData.title}
                        onChange={handleChange} required
                        placeholder="ဥပမာ: ကွန်ပျူတာခန်း အသစ် ဆောက်လုပ်ရန်"
                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </Field>
                  </div>
                  <Field label="အမျိုးအစား *">
                    <select name="type" value={formData.type} onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                      {PROPOSAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </Field>
                  <Field label="ဌာန">
                    <select name="department" value={formData.department} onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">-- ရွေးပါ --</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </Field>
                  <Field label="ဘတ်ဂျက်">
                    <input type="number" name="budget" value={formData.budget}
                      onChange={handleChange} placeholder="500000"
                      className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                  </Field>
                  <Field label="ငွေကြေး">
                    <select name="currency" value={formData.currency} onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                      {Object.entries(CURRENCIES).map(([code, c]) => (
                        <option key={code} value={code}>{c.symbol} {code} - {c.name}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="တင်သွင်းသူ">
                    <input type="text" name="submitted_by" value={formData.submitted_by}
                      onChange={handleChange} placeholder="ဆရာမ မြင့်မြင့်"
                      className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                  </Field>
                  <Field label="ပစ်မှတ်ရက်">
                    <input type="date" name="target_date" value={formData.target_date}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                  </Field>
                  <Field label="Priority">
                    <select name="priority" value={formData.priority} onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                      {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Status">
                    <select name="status" value={formData.status} onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                      {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="အကြောင်းအရာ အပြည့်အစုံ">
                      <textarea name="description" value={formData.description}
                        onChange={handleChange} rows="6"
                        placeholder="Proposal ရဲ့ အသေးစိတ်၊ ရည်ရွယ်ချက်၊ အကျိုးကျေးဇူး..."
                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </Field>
                  </div>

                  {/* Attachments */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📎 ဖိုင်တွဲများ (PDF, Image · 500KB အောက်)
                    </label>
                    <label className="cursor-pointer inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm">
                      <Upload className="w-4 h-4" /> ဖိုင် တင်ရန်
                      <input type="file" multiple accept="image/*,.pdf,.doc,.docx"
                        onChange={handleAttachment} className="hidden" />
                    </label>
                    {formData.attachments?.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {formData.attachments.map((att, i) => (
                          <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2 text-sm truncate">
                              <Paperclip className="w-4 h-4 text-gray-500 shrink-0" />
                              <span className="truncate">{att.name}</span>
                              <span className="text-xs text-gray-400 shrink-0">
                                ({(att.size / 1024).toFixed(0)}KB)
                              </span>
                            </div>
                            <button type="button" onClick={() => removeAttachment(i)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded shrink-0">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 p-6 border-t bg-gray-50">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border rounded-lg hover:bg-gray-100 font-medium">
                  ပယ်ဖျက်
                </button>
                <button type="submit"
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium">
                  <Save className="w-4 h-4" /> {editingProposal ? 'ပြင်ရန်' : 'ဖန်တီးရန်'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== View Modal ===== */}
      {showViewModal && viewProposal && (
        <ProposalView proposal={viewProposal}
          onClose={() => setShowViewModal(false)}
          fmt={fmt} getCurrencyInfo={getCurrencyInfo}
          getStatusInfo={getStatusInfo} getPriorityInfo={getPriorityInfo}
          getTypeInfo={getTypeInfo} />
      )}

      {/* ===== Status Modal ===== */}
      {showStatusModal && statusProposal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">Status ပြောင်းရန်</h3>
              <button onClick={() => setShowStatusModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 rounded-lg p-3 text-sm">
                <p className="font-bold text-blue-800">{statusProposal.proposal_no}</p>
                <p className="text-blue-700">{statusProposal.title}</p>
              </div>
              <Field label="Status အသစ်">
                <select value={statusForm.status}
                  onChange={e => setStatusForm({ ...statusForm, status: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                  {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </Field>
              <Field label="မှတ်ချက် / အကြောင်းပြချက်">
                <textarea value={statusForm.approval_notes} rows="3"
                  onChange={e => setStatusForm({ ...statusForm, approval_notes: e.target.value })}
                  placeholder="အတည်ပြုခြင်း/ငြင်းပယ်ခြင်း အကြောင်းပြချက်..."
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </Field>
              <Field label="အတည်ပြုသူ">
                <input type="text" value={statusForm.approved_by}
                  onChange={e => setStatusForm({ ...statusForm, approved_by: e.target.value })}
                  placeholder="ကျောင်းအုပ် ဦးကျော်မြင့်"
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </Field>
              <div className="flex gap-3 pt-4 border-t">
                <button onClick={() => setShowStatusModal(false)}
                  className="flex-1 px-4 py-2.5 border rounded-lg hover:bg-gray-50">ပယ်ဖျက်</button>
                <button onClick={handleStatusUpdate}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-medium">
                  Status ပြောင်းရန်
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Helper Components =====
function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className={`${color} rounded-xl p-4`}>
      <p className="text-xs font-medium opacity-80">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

// ===== Proposal View (Print Ready) =====
function ProposalView({ proposal, onClose, fmt, getCurrencyInfo, getStatusInfo, getPriorityInfo, getTypeInfo }) {
  const printRef = useRef();
  const cur = getCurrencyInfo(proposal.currency);
  const status = getStatusInfo(proposal.status);
  const priority = getPriorityInfo(proposal.priority);
  const type = getTypeInfo(proposal.type);

  const handlePrint = () => {
    const content = printRef.current?.innerHTML || '';
    const win = window.open('', '', 'width=900,height=700');
    win.document.write(`
      <html><head><title>${proposal.proposal_no}</title>
      <style>
        @page { size: A4; margin: 15mm; }
        body { font-family: 'Pyidaungsu', 'Myanmar Text', sans-serif; padding: 20px; color: #111; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 12px; margin-bottom: 20px; }
        .header h1 { margin: 5px 0; font-size: 20px; }
        .header p { margin: 2px 0; font-size: 12px; color: #555; }
        .proposal-no { text-align: right; font-family: monospace; font-size: 13px; font-weight: bold; color: #1e40af; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        td { padding: 8px 10px; border: 1px solid #ddd; font-size: 13px; vertical-align: top; }
        td:first-child { background: #f9fafb; font-weight: 600; width: 30%; }
        .section { margin: 20px 0; }
        .section h3 { font-size: 15px; border-bottom: 2px solid #333; padding-bottom: 5px; margin-bottom: 10px; }
        .description { background: #f9fafb; padding: 15px; border-radius: 8px; font-size: 13px; line-height: 1.6; white-space: pre-wrap; }
        .budget-box { text-align: center; padding: 20px; background: #eff6ff; border: 2px solid #3b82f6; border-radius: 8px; margin: 15px 0; }
        .budget-box p { margin: 3px 0; }
        .budget-box .amount { font-size: 26px; font-weight: bold; color: #1e40af; }
        .status-box { display: inline-block; padding: 6px 15px; border-radius: 20px; font-size: 13px; font-weight: 600; }
        .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px; }
        .footer .sig { border-top: 1px solid #333; padding-top: 5px; min-width: 180px; text-align: center; }
        .approval-notes { background: #fef9c3; padding: 12px; border-left: 4px solid #eab308; margin: 15px 0; font-size: 13px; }
      </style></head><body>
      <div class="header">
        <h1>Maw Goon Thit School</h1>
        <p>School Proposal / အဆိုပြုချက်</p>
      </div>
      <div class="proposal-no">${proposal.proposal_no}</div>
      ${content}
      <div class="footer">
        <div class="sig">တင်သွင်းသူ<br>${proposal.submitted_by || '................'}</div>
        <div class="sig">အတည်ပြုသူ<br>${proposal.approved_by || '................'}</div>
      </div>
      <p style="text-align:center; font-size:10px; color:#999; margin-top:30px;">
        Generated by MGT School Management · ${new Date().toLocaleString()}
      </p>
      </body></html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); }, 300);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-5 border-b">
          <div>
            <h3 className="font-bold text-lg">Proposal အသေးစိတ်</h3>
            <p className="text-xs text-gray-500 font-mono">{proposal.proposal_no}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePrint}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div ref={printRef}>
            {/* Header Info */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <InfoItem label="Proposal No" value={proposal.proposal_no} mono />
              <InfoItem label="Status">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                  {status.label}
                </span>
              </InfoItem>
              <InfoItem label="ခေါင်းစဉ်" value={proposal.title} full />
              <InfoItem label="အမျိုးအစား" value={type.label} />
              <InfoItem label="ဌာန" value={proposal.department || '-'} />
              <InfoItem label="တင်သွင်းသူ" value={proposal.submitted_by || '-'} />
              <InfoItem label="ပစ်မှတ်ရက်" value={proposal.target_date || '-'} />
              <InfoItem label="Priority">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${priority.color}`}>
                  {priority.label}
                </span>
              </InfoItem>
            </div>

            {/* Budget */}
            {proposal.budget ? (
              <div className="budget-box bg-blue-50 border-2 border-blue-300 rounded-lg p-5 text-center mb-6">
                <p className="text-xs text-gray-600 mb-1">ဘတ်ဂျက်</p>
                <p className="text-3xl font-bold text-blue-700">
                  {cur.symbol} {fmt(proposal.budget)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{proposal.currency} ({cur.name})</p>
              </div>
            ) : null}

            {/* Description */}
            {proposal.description && (
              <div className="mb-6">
                <h4 className="font-bold text-sm mb-2 border-b pb-1">📝 အကြောင်းအရာ အပြည့်အစုံ</h4>
                <div className="bg-gray-50 rounded-lg p-4 text-sm whitespace-pre-wrap leading-relaxed">
                  {proposal.description}
                </div>
              </div>
            )}

            {/* Approval Notes */}
            {proposal.approval_notes && (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mb-6">
                <h4 className="font-bold text-sm text-yellow-800 mb-1">📌 အတည်ပြု မှတ်ချက်</h4>
                <p className="text-sm text-yellow-900 whitespace-pre-wrap">{proposal.approval_notes}</p>
                {proposal.approved_by && (
                  <p className="text-xs text-yellow-700 mt-2">— {proposal.approved_by} ({proposal.approval_date})</p>
                )}
              </div>
            )}

            {/* Attachments */}
            {proposal.attachments?.length > 0 && (
              <div className="mb-6">
                <h4 className="font-bold text-sm mb-2 border-b pb-1">📎 ဖိုင်တွဲများ</h4>
                <div className="space-y-2">
                  {proposal.attachments.map((a, i) => (
                    <a key={i} href={a.data} download={a.name}
                      className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm">
                      <Paperclip className="w-4 h-4 text-gray-500" />
                      <span className="flex-1 truncate">{a.name}</span>
                      <Download className="w-4 h-4 text-blue-600" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, mono, full, children }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      {children || (
        <p className={`text-sm font-medium text-gray-800 ${mono ? 'font-mono' : ''}`}>
          {value}
        </p>
      )}
    </div>
  );
}