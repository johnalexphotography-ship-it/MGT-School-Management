import { useState, useEffect, useRef } from 'react';
import {
  DollarSign, Plus, Edit, Trash2, X, Save, AlertCircle, CheckCircle, Check,
  FileText, Printer, Calendar, Users, Search, Receipt, FileSpreadsheet,
  Download, AlertTriangle, Filter, Clock
} from 'lucide-react';
import API from '../api/axios';

// ===== Currency Config =====
const CURRENCIES = {
  MMK: { symbol: 'K',  name: 'ကျပ်',     color: 'text-yellow-700', bg: 'bg-yellow-100' },
  THB: { symbol: '฿',  name: 'ဘတ်',      color: 'text-blue-700',   bg: 'bg-blue-100' },
  USD: { symbol: '$',  name: 'ဒေါ်လာ',   color: 'text-green-700',  bg: 'bg-green-100' },
  GBP: { symbol: '£',  name: 'ပေါင်',    color: 'text-purple-700', bg: 'bg-purple-100' },
  EUR: { symbol: '€',  name: 'ယူရို',    color: 'text-indigo-700', bg: 'bg-indigo-100' },
  SGD: { symbol: 'S$', name: 'စင်္ကာပူ', color: 'text-red-700',    bg: 'bg-red-100' },
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function Fees() {
  const [activeTab, setActiveTab] = useState('list');
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [stats, setStats] = useState(null);
  const [overdueList, setOverdueList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCurrency, setFilterCurrency] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [message, setMessage] = useState(null);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [editingFee, setEditingFee] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [slipData, setSlipData] = useState(null);

  const [formData, setFormData] = useState({
    student_id: '', fee_type: 'Monthly Fee', amount: '', currency: 'MMK',
    month: '', year: new Date().getFullYear().toString(), due_date: '',
    paid_date: '', status: 'Pending', payment_method: 'Cash', remarks: ''
  });

  const [invoiceForm, setInvoiceForm] = useState({
    class_id: '', fee_type: 'Monthly Fee', amount: '', currency: 'MMK',
    month: '', year: new Date().getFullYear().toString(), due_date: ''
  });

  const [slipForm, setSlipForm] = useState({
    student_id: '', year: new Date().getFullYear().toString()
  });

  const printRef = useRef();

  // ===== Load Data =====
  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterStatus) params.append('status', filterStatus);
      if (filterCurrency) params.append('currency', filterCurrency);

      const [fRes, sRes, cRes, stRes] = await Promise.all([
        API.get(`/fees?${params.toString()}`),
        API.get('/students?status=Active'),
        API.get('/classes'),
        API.get('/fees/stats')
      ]);
      setFees(fRes.data);
      setStudents(sRes.data);
      setClasses(cRes.data);
      setStats(stRes.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [search, filterStatus, filterCurrency]);

  useEffect(() => {
    if (activeTab === 'overdue') {
      API.get('/fees/overdue').then(r => setOverdueList(r.data)).catch(console.error);
    }
  }, [activeTab]);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // ===== Add / Edit =====
  const handleAdd = () => {
    setEditingFee(null);
    setFormData({
      student_id: '', fee_type: 'Monthly Fee', amount: '', currency: 'MMK',
      month: '', year: new Date().getFullYear().toString(),
      due_date: new Date().toISOString().split('T')[0],
      paid_date: '', status: 'Pending', payment_method: 'Cash', remarks: ''
    });
    setShowModal(true);
  };

  const handleEdit = (f) => {
    setEditingFee(f);
    setFormData({
      student_id: f.student_id || '', fee_type: f.fee_type || 'Monthly Fee',
      amount: f.amount || '', currency: f.currency || 'MMK',
      month: f.month || '', year: f.year || '2026',
      due_date: f.due_date || '', paid_date: f.paid_date || '',
      status: f.status || 'Pending', payment_method: f.payment_method || 'Cash',
      remarks: f.remarks || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFee) {
        await API.put(`/fees/${editingFee.id}`, formData);
        showMsg('success', 'ပြင်ပြီးပါပြီ');
      } else {
        await API.post('/fees', formData);
        showMsg('success', 'ကျောင်းလခ မှတ်ပြီးပါပြီ');
      }
      setShowModal(false);
      load();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('ဖျက်မှာ သေချာလား?')) return;
    try {
      await API.delete(`/fees/${id}`);
      showMsg('success', 'ဖျက်ပြီးပါပြီ');
      load();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  const markPaid = async (id) => {
    try {
      await API.post(`/fees/${id}/pay`, { payment_method: 'Cash' });
      showMsg('success', 'ပေးချေပြီးအဖြစ် မှတ်ပြီးပါပြီ');
      load();
      // Receipt ပြရန်
      const r = await API.get(`/fees/${id}/receipt`);
      setReceiptData(r.data);
      setShowReceiptModal(true);
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  // ===== Bulk Pay =====
  const handleBulkPay = async () => {
    if (selectedIds.length === 0) return showMsg('error', 'ရွေးပါ ဦးစွာ');
    if (!confirm(`ရွေးထားတဲ့ ${selectedIds.length} ခုကို ပေးချေပြီးအဖြစ် မှတ်မှာလား?`)) return;
    try {
      await API.post('/fees/bulk-pay', { ids: selectedIds, payment_method: 'Cash' });
      showMsg('success', `${selectedIds.length} ခု မှတ်ပြီးပါပြီ`);
      setSelectedIds([]);
      load();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleSelectAll = () => {
    if (selectedIds.length === fees.length) setSelectedIds([]);
    else setSelectedIds(fees.map(f => f.id));
  };

  // ===== Generate Invoice =====
  const handleGenerateInvoice = async () => {
    if (!invoiceForm.class_id || !invoiceForm.amount || !invoiceForm.month || !invoiceForm.year) {
      return showMsg('error', 'လိုအပ်တဲ့ Field ဖြည့်ပါ');
    }
    try {
      const res = await API.post('/fees/generate-invoice', invoiceForm);
      showMsg('success', `${res.data.summary.class_name}: ${res.data.summary.created} ခု ဖန်တီး၊ ${res.data.summary.skipped} ခု ကျော်`);
      setShowInvoiceModal(false);
      setActiveTab('list');
      load();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  // ===== Show Receipt =====
  const showReceipt = async (id) => {
    try {
      const r = await API.get(`/fees/${id}/receipt`);
      setReceiptData(r.data);
      setShowReceiptModal(true);
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  // ===== Show Monthly Slip =====
  const showMonthlySlip = async () => {
    if (!slipForm.student_id || !slipForm.year) {
      return showMsg('error', 'ကျောင်းသားနဲ့ နှစ် ရွေးပါ');
    }
    try {
      const r = await API.get(`/fees/slip/${slipForm.student_id}/${slipForm.year}`);
      setSlipData(r.data);
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  const fmt = (n) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n || 0);
  const getCurrencyInfo = (code) => CURRENCIES[code] || CURRENCIES.MMK;

  const tabs = [
    { key: 'list', label: '📋 စာရင်း', icon: FileText },
    { key: 'invoice', label: '🧾 Invoice Generate', icon: FileSpreadsheet },
    { key: 'slip', label: '📋 Monthly Slip', icon: Receipt },
    { key: 'overdue', label: '⚠️ နောက်ကျ', icon: AlertTriangle },
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
        <div className="flex overflow-x-auto border-b">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                  activeTab === t.key
                    ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}>
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== TAB 1: List ===== */}
      {activeTab === 'list' && (
        <div className="space-y-6">
          {/* Stats */}
          {stats && stats.byCurrency && stats.byCurrency.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.byCurrency.map(s => {
                const cur = getCurrencyInfo(s.currency);
                return (
                  <div key={s.currency} className={`${cur.bg} rounded-xl shadow-sm p-5 border-l-4 border-current ${cur.color}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs font-bold">{s.currency} ({cur.name})</p>
                        <p className="text-2xl font-bold">{cur.symbol} {fmt(s.total)}</p>
                      </div>
                      <div className={`w-10 h-10 ${cur.color} bg-white rounded-lg flex items-center justify-center font-bold text-lg`}>
                        {cur.symbol}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-white/60 rounded p-2">
                        <p className="opacity-75">ပေးပြီး</p>
                        <p className="font-bold">{fmt(s.paid)}</p>
                      </div>
                      <div className="bg-white/60 rounded p-2">
                        <p className="opacity-75">ကျန်ရှိ</p>
                        <p className="font-bold">{fmt(s.pending)}</p>
                      </div>
                      <div className="bg-white/60 rounded p-2">
                        <p className="opacity-75">နောက်ကျ</p>
                        <p className="font-bold">{fmt(s.overdue)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-center">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ကျောင်းသား ရှာရန်..."
              className="flex-1 max-w-xs px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border rounded-lg outline-none">
              <option value="">အခြေအနေ အားလုံး</option>
              <option value="Paid">ပေးချေပြီး</option>
              <option value="Pending">ကျန်ရှိ</option>
              <option value="Overdue">နောက်ကျ</option>
            </select>
            <select value={filterCurrency} onChange={e => setFilterCurrency(e.target.value)}
              className="px-4 py-2.5 border rounded-lg outline-none">
              <option value="">ငွေကြေး အားလုံး</option>
              {Object.entries(CURRENCIES).map(([code, c]) => (
                <option key={code} value={code}>{c.symbol} {code}</option>
              ))}
            </select>

            {selectedIds.length > 0 && (
              <button onClick={handleBulkPay}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg">
                <Check className="w-4 h-4" /> {selectedIds.length} ခု ပေးချေ
              </button>
            )}

            <div className="flex-1" />
            <button onClick={handleAdd}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg">
              <Plus className="w-5 h-5" /> ကျောင်းလခ အသစ်
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-500">Loading...</div>
            ) : fees.length === 0 ? (
              <div className="p-12 text-center">
                <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">ကျောင်းလခ မှတ်တမ်း မရှိပါ</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input type="checkbox"
                          checked={selectedIds.length === fees.length && fees.length > 0}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 cursor-pointer" />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">ကျောင်းသား</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">အမျိုးအစား</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold">ပမာဏ</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">ကာလ</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">Due Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">အခြေအနေ</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold">လုပ်ဆောင်ချက်</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {fees.map(f => {
                      const cur = getCurrencyInfo(f.currency);
                      const isOverdue = f.status !== 'Paid' && f.due_date && f.due_date < new Date().toISOString().split('T')[0];
                      return (
                        <tr key={f.id} className={`hover:bg-gray-50 ${isOverdue ? 'bg-red-50/30' : ''}`}>
                          <td className="px-4 py-3">
                            <input type="checkbox"
                              checked={selectedIds.includes(f.id)}
                              onChange={() => toggleSelect(f.id)}
                              className="w-4 h-4 cursor-pointer" />
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium">{f.student_name}</p>
                            <p className="text-xs font-mono text-gray-500">{f.student_code} · {f.grade} {f.section}</p>
                          </td>
                          <td className="px-4 py-3 text-sm">{f.fee_type}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`px-2 py-1 rounded font-bold text-sm ${cur.bg} ${cur.color}`}>
                              {cur.symbol} {fmt(f.amount)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">{f.month} {f.year}</td>
                          <td className="px-4 py-3 text-sm">
                            {f.due_date ? (
                              <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
                                {f.due_date}
                                {isOverdue && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              f.status === 'Paid' ? 'bg-green-100 text-green-700'
                                : isOverdue ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>{isOverdue && f.status !== 'Paid' ? 'Overdue' : f.status}</span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            {f.status !== 'Paid' && (
                              <button onClick={() => markPaid(f.id)}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs mr-1"
                                title="ပေးချေ">
                                <Check className="w-3 h-3 inline" /> ပေးချေ
                              </button>
                            )}
                            <button onClick={() => showReceipt(f.id)}
                              className="p-1.5 text-purple-600 hover:bg-purple-50 rounded" title="Receipt">
                              <Receipt className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleEdit(f)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="ပြင်">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(f.id)}
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

      {/* ===== TAB 2: Invoice Generate ===== */}
      {activeTab === 'invoice' && (
        <div className="bg-white rounded-xl shadow-sm p-6 max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">အတန်းလိုက် Invoice Generate</h2>
              <p className="text-xs text-gray-500">တစ်တန်းလုံးရဲ့ ကျောင်းသားများအတွက် တစ်ခါတည်း ကျောင်းလခ ဖန်တီးပါ</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg mb-6 text-sm">
            💡 <strong>သတိပြုရန်:</strong> ဒီလုပ်ဆောင်ချက်က ရွေးထားတဲ့ အတန်းမှ ကျောင်းသား <strong>အားလုံး</strong>အတွက် 
            ကျောင်းလခ ဖန်တီးပေးပါမယ်။ ရှိပြီးသား မှတ်တမ်းတွေကို မထိပါဘူး။
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">အတန်း *</label>
              <select value={invoiceForm.class_id}
                onChange={e => setInvoiceForm({ ...invoiceForm, class_id: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">-- အတန်း ရွေးပါ --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">အမျိုးအစား *</label>
              <select value={invoiceForm.fee_type}
                onChange={e => setInvoiceForm({ ...invoiceForm, fee_type: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="Monthly Fee">Monthly Fee</option>
                <option value="Exam Fee">Exam Fee</option>
                <option value="Transport Fee">Transport Fee</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ငွေကြေး *</label>
              <select value={invoiceForm.currency}
                onChange={e => setInvoiceForm({ ...invoiceForm, currency: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                {Object.entries(CURRENCIES).map(([code, c]) => (
                  <option key={code} value={code}>{c.symbol} {code} - {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ပမာဏ ({getCurrencyInfo(invoiceForm.currency).symbol}) *
              </label>
              <input type="number" value={invoiceForm.amount}
                onChange={e => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                placeholder="50000"
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">လ *</label>
              <select value={invoiceForm.month}
                onChange={e => setInvoiceForm({ ...invoiceForm, month: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">-- ရွေးပါ --</option>
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">နှစ် *</label>
              <input type="text" value={invoiceForm.year}
                onChange={e => setInvoiceForm({ ...invoiceForm, year: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input type="date" value={invoiceForm.due_date}
                onChange={e => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>

          <button onClick={handleGenerateInvoice}
            className="mt-6 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium">
            <FileSpreadsheet className="w-5 h-5" /> Invoice ဖန်တီးရန်
          </button>
        </div>
      )}

      {/* ===== TAB 3: Monthly Slip ===== */}
      {activeTab === 'slip' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Receipt className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Monthly Slip</h2>
                <p className="text-xs text-gray-500">ကျောင်းသားတစ်ယောက်ရဲ့ တစ်နှစ်လုံး လစဉ်ပေးသွင်းမှု စာရင်း</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ကျောင်းသား *</label>
                <select value={slipForm.student_id}
                  onChange={e => setSlipForm({ ...slipForm, student_id: e.target.value })}
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">-- ရွေးပါ --</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.student_id})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">နှစ် *</label>
                <input type="text" value={slipForm.year}
                  onChange={e => setSlipForm({ ...slipForm, year: e.target.value })}
                  className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            <button onClick={showMonthlySlip}
              className="mt-4 flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium">
              <Receipt className="w-5 h-5" /> စလစ် ထုတ်ယူရန်
            </button>
          </div>

          {/* Slip Display */}
          {slipData && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">📋 လစဉ် ပေးသွင်းမှု စာရင်း</h3>
                <button onClick={() => window.print()}
                  className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm">
                  <Printer className="w-4 h-4" /> Print
                </button>
              </div>
              <SlipView data={slipData} fmt={fmt} getCurrencyInfo={getCurrencyInfo} />
            </div>
          )}
        </div>
      )}

      {/* ===== TAB 4: Overdue ===== */}
      {activeTab === 'overdue' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b bg-red-50">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <div>
                <h2 className="text-lg font-bold text-red-800">နောက်ကျနေတဲ့ ကျောင်းလခ</h2>
                <p className="text-xs text-red-600">Due Date ကျော်လွန်နေပေမဲ့ မပေးရသေးတဲ့ စာရင်း</p>
              </div>
            </div>
          </div>
          {overdueList.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
              <p className="text-gray-500">နောက်ကျနေတဲ့ ကျောင်းလခ မရှိပါ 🎉</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold">ကျောင်းသား</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">အမျိုးအစား</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">ပမာဏ</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">Due Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">နောက်ကျ (ရက်)</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">လုပ်ဆောင်ချက်</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {overdueList.map(f => {
                    const cur = getCurrencyInfo(f.currency);
                    const today = new Date();
                    const due = new Date(f.due_date);
                    const daysLate = Math.floor((today - due) / (1000 * 60 * 60 * 24));
                    return (
                      <tr key={f.id} className="hover:bg-red-50">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium">{f.student_name}</p>
                          <p className="text-xs font-mono text-gray-500">{f.student_code} · {f.student_phone || '-'}</p>
                        </td>
                        <td className="px-4 py-3 text-sm">{f.fee_type}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`px-2 py-1 rounded font-bold text-sm ${cur.bg} ${cur.color}`}>
                            {cur.symbol} {fmt(f.amount)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-red-600">{f.due_date}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                            {daysLate} ရက်
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => markPaid(f.id)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs">
                            <Check className="w-3 h-3 inline" /> ပေးချေ
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
      )}

      {/* ===== Add/Edit Modal ===== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">{editingFee ? 'ပြင်ရန်' : 'ကျောင်းလခ အသစ်'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ကျောင်းသား *</label>
                <select value={formData.student_id} required
                  onChange={e => setFormData({ ...formData, student_id: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none">
                  <option value="">-- ရွေးပါ --</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.student_id})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">အမျိုးအစား *</label>
                <select value={formData.fee_type}
                  onChange={e => setFormData({ ...formData, fee_type: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none">
                  <option value="Monthly Fee">Monthly Fee</option>
                  <option value="Admission Fee">Admission Fee</option>
                  <option value="Exam Fee">Exam Fee</option>
                  <option value="Transport Fee">Transport Fee</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ငွေကြေး *</label>
                <select value={formData.currency}
                  onChange={e => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none">
                  {Object.entries(CURRENCIES).map(([code, c]) => (
                    <option key={code} value={code}>{c.symbol} {code} - {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ပမာဏ ({getCurrencyInfo(formData.currency).symbol}) *
                </label>
                <input type="number" step="0.01" value={formData.amount} required
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">လ</label>
                <select value={formData.month}
                  onChange={e => setFormData({ ...formData, month: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none">
                  <option value="">--</option>
                  {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">နှစ်</label>
                <input type="text" value={formData.year}
                  onChange={e => setFormData({ ...formData, year: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input type="date" value={formData.due_date}
                  onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">အခြေအနေ</label>
                <select value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none">
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">မှတ်ချက်</label>
                <textarea value={formData.remarks} rows="2"
                  onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none" />
              </div>
              <div className="md:col-span-2 flex gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border rounded-lg hover:bg-gray-50">ပယ်ဖျက်</button>
                <button type="submit"
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg">
                  <Save className="w-4 h-4" /> {editingFee ? 'ပြင်ရန်' : 'ထည့်ရန်'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Receipt Modal ===== */}
      {showReceiptModal && receiptData && (
        <ReceiptModal data={receiptData} onClose={() => setShowReceiptModal(false)}
          fmt={fmt} getCurrencyInfo={getCurrencyInfo} />
      )}
    </div>
  );
}

// ===== Receipt Modal (Small Receipt) =====
function ReceiptModal({ data, onClose, fmt, getCurrencyInfo }) {
  const cur = getCurrencyInfo(data.currency);
  const printRef = useRef();

  const handlePrint = () => {
    const win = window.open('', '', 'height=600,width=400');
    win.document.write(`
      <html><head><title>Receipt - ${data.student_code}</title>
      <style>
        @page { size: A5; margin: 10mm; }
        body { font-family: 'Pyidaungsu', 'Myanmar Text', sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 2px dashed #333; padding-bottom: 10px; margin-bottom: 15px; }
        .header h2 { margin: 5px 0; font-size: 18px; }
        .header p { margin: 2px 0; font-size: 11px; color: #666; }
        .receipt-no { text-align: right; font-size: 12px; color: #666; margin-bottom: 10px; }
        .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; border-bottom: 1px dotted #ccc; }
        .row strong { color: #333; }
        .amount { text-align: center; font-size: 24px; font-weight: bold; color: #16a34a; margin: 15px 0; padding: 12px; background: #f0fdf4; border-radius: 8px; border: 2px solid #16a34a; }
        .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 11px; }
        .footer .sig { border-top: 1px solid #333; padding-top: 5px; min-width: 120px; text-align: center; }
        .status { text-align: center; padding: 8px; border-radius: 8px; font-weight: bold; font-size: 14px; margin: 10px 0; }
        .paid { background: #dcfce7; color: #16a34a; }
        .pending { background: #fef3c7; color: #d97706; }
      </style></head><body>
      <div class="header">
        <h2>${window.__MGT_SCHOOL_NAME__ || 'Maw Goon Thit School'}</h2>
        <p>${window.__MGT_SCHOOL_ADDRESS__ || ''}</p>
        <p>☎ ${window.__MGT_SCHOOL_PHONE__ || ''}</p>
      </div>
      <div class="receipt-no">Receipt #${String(data.id).padStart(6, '0')}</div>
      <div class="status ${data.status === 'Paid' ? 'paid' : 'pending'}">
        ${data.status === 'Paid' ? '✅ ပေးချေပြီး' : '⏳ ကျန်ရှိ'}
      </div>
      <div class="row"><strong>ကျောင်းသား:</strong><span>${data.student_name}</span></div>
      <div class="row"><strong>ID:</strong><span>${data.student_code}</span></div>
      <div class="row"><strong>အတန်း:</strong><span>${data.grade} ${data.section || ''}</span></div>
      <div class="row"><strong>အမျိုးအစား:</strong><span>${data.fee_type}</span></div>
      <div class="row"><strong>ကာလ:</strong><span>${data.month || ''} ${data.year || ''}</span></div>
      <div class="amount">${cur.symbol} ${new Intl.NumberFormat().format(data.amount)}</div>
      ${data.paid_date ? `<div class="row"><strong>ပေးချေရက်:</strong><span>${data.paid_date}</span></div>` : ''}
      ${data.payment_method ? `<div class="row"><strong>ပေးချေနည်း:</strong><span>${data.payment_method}</span></div>` : ''}
      <div class="footer">
        <div class="sig">ကျောင်းသား လက်မှတ်</div>
        <div class="sig">ငွေကိုင် လက်မှတ်</div>
      </div>
      <p style="text-align:center; font-size:10px; color:#999; margin-top:20px;">
        ဤဖြတ်ပိုင်းကို သိမ်းထားပါ · ${new Date().toLocaleString()}
      </p>
      </body></html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center p-5 border-b">
          <h3 className="font-bold text-lg">🧾 ငွေလက်ခံ ဖြတ်ပိုင်း</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-dashed border-blue-300 rounded-xl p-5 mb-4">
            <div className="text-center border-b-2 border-dashed border-gray-300 pb-3 mb-3">
              <h4 className="font-bold text-gray-800">MGT School</h4>
              <p className="text-xs text-gray-500">Receipt #{String(data.id).padStart(6, '0')}</p>
            </div>

            <div className={`text-center py-2 rounded-lg mb-4 font-bold text-sm ${
              data.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {data.status === 'Paid' ? '✅ ပေးချေပြီး' : '⏳ ကျန်ရှိ'}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">ကျောင်းသား:</span><strong>{data.student_name}</strong></div>
              <div className="flex justify-between"><span className="text-gray-500">ID:</span><strong className="font-mono">{data.student_code}</strong></div>
              <div className="flex justify-between"><span className="text-gray-500">အတန်း:</span><strong>{data.grade} {data.section || ''}</strong></div>
              <div className="flex justify-between"><span className="text-gray-500">အမျိုးအစား:</span><strong>{data.fee_type}</strong></div>
              <div className="flex justify-between"><span className="text-gray-500">ကာလ:</span><strong>{data.month} {data.year}</strong></div>
              {data.paid_date && <div className="flex justify-between"><span className="text-gray-500">ပေးရက်:</span><strong>{data.paid_date}</strong></div>}
            </div>

            <div className={`mt-4 text-center py-3 rounded-lg font-bold text-2xl ${cur.bg} ${cur.color}`}>
              {cur.symbol} {fmt(data.amount)}
            </div>
          </div>

          <button onClick={handlePrint}
            className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-4 py-3 rounded-lg font-medium">
            <Printer className="w-5 h-5" /> Print ထုတ်ရန်
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== Slip View =====
function SlipView({ data, fmt, getCurrencyInfo }) {
  const { student, year, fees } = data;
  const totalByCurrency = {};
  fees.forEach(f => {
    const c = f.currency || 'MMK';
    if (!totalByCurrency[c]) totalByCurrency[c] = { total: 0, paid: 0, pending: 0 };
    totalByCurrency[c].total += f.amount || 0;
    if (f.status === 'Paid') totalByCurrency[c].paid += f.amount || 0;
    else totalByCurrency[c].pending += f.amount || 0;
  });

  return (
    <div>
      {/* Header */}
      <div className="border-b-2 border-gray-300 pb-4 mb-4 text-center">
        <h2 className="text-xl font-bold">MGT School</h2>
        <h3 className="text-lg font-bold mt-2">လစဉ် ပေးသွင်းမှု စာရင်း</h3>
        <p className="text-sm text-gray-600">ပညာသင်နှစ်: {year}</p>
      </div>

      {/* Student Info */}
      <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
        <div><span className="text-gray-500">ကျောင်းသား:</span> <strong>{student.name}</strong></div>
        <div><span className="text-gray-500">ID:</span> <strong className="font-mono">{student.student_id}</strong></div>
        <div><span className="text-gray-500">အတန်း:</span> <strong>{student.grade} {student.section || ''}</strong></div>
        <div><span className="text-gray-500">ဖုန်း:</span> <strong>{student.phone || '-'}</strong></div>
      </div>

      {/* Monthly Table */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-3 py-2 text-left">လ</th>
              <th className="border px-3 py-2 text-left">အမျိုးအစား</th>
              <th className="border px-3 py-2 text-right">ပမာဏ</th>
              <th className="border px-3 py-2 text-center">အခြေအနေ</th>
              <th className="border px-3 py-2 text-left">ပေးရက်</th>
            </tr>
          </thead>
          <tbody>
            {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => {
              const monthFees = fees.filter(f => f.month === m);
              if (monthFees.length === 0) {
                return (
                  <tr key={m}>
                    <td className="border px-3 py-2 font-medium">{m}</td>
                    <td className="border px-3 py-2 text-gray-400">-</td>
                    <td className="border px-3 py-2 text-right text-gray-400">-</td>
                    <td className="border px-3 py-2 text-center text-gray-400 text-xs">မရှိ</td>
                    <td className="border px-3 py-2 text-gray-400">-</td>
                  </tr>
                );
              }
              return monthFees.map((f, i) => {
                const cur = getCurrencyInfo(f.currency);
                return (
                  <tr key={`${m}-${i}`}>
                    {i === 0 && (
                      <td rowSpan={monthFees.length} className="border px-3 py-2 font-medium bg-gray-50">{m}</td>
                    )}
                    <td className="border px-3 py-2">{f.fee_type}</td>
                    <td className="border px-3 py-2 text-right font-medium">
                      {cur.symbol} {fmt(f.amount)}
                    </td>
                    <td className="border px-3 py-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        f.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>{f.status}</span>
                    </td>
                    <td className="border px-3 py-2 text-xs">{f.paid_date || '-'}</td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>

      {/* Summary by Currency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(totalByCurrency).map(([code, s]) => {
          const cur = getCurrencyInfo(code);
          return (
            <div key={code} className={`${cur.bg} rounded-lg p-4 border-l-4 ${cur.color}`}>
              <p className="text-xs font-bold mb-2">{code} ({cur.name})</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="opacity-75">စုစုပေါင်း</p>
                  <p className="font-bold text-base">{cur.symbol} {fmt(s.total)}</p>
                </div>
                <div>
                  <p className="opacity-75">ပေးပြီး</p>
                  <p className="font-bold text-base text-green-700">{cur.symbol} {fmt(s.paid)}</p>
                </div>
                <div>
                  <p className="opacity-75">ကျန်ရှိ</p>
                  <p className="font-bold text-base text-red-700">{cur.symbol} {fmt(s.pending)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}