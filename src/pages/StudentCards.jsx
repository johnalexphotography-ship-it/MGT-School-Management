import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  CreditCard, Plus, Trash2, X, Search, Printer, Users, Check,
  AlertCircle, CheckCircle, Shield, ShieldCheck, ShieldX,
  Calendar, Palette, Ban, Eye, Download, FileSpreadsheet
} from 'lucide-react';
import API from '../api/axios';

const TEMPLATES = {
  classic: {
    name: 'Classic Blue',
    gradient: 'from-blue-700 via-blue-800 to-indigo-900',
    accent: 'bg-blue-500',
    text: 'text-white',
    chip: 'from-yellow-200 to-yellow-400',
  },
  modern: {
    name: 'Modern Gradient',
    gradient: 'from-cyan-500 via-blue-600 to-purple-700',
    accent: 'bg-cyan-500',
    text: 'text-white',
    chip: 'from-yellow-200 to-yellow-400',
  },
  gold: {
    name: 'Elegant Gold',
    gradient: 'from-yellow-700 via-amber-800 to-orange-900',
    accent: 'bg-yellow-500',
    text: 'text-yellow-50',
    chip: 'from-yellow-300 to-yellow-500',
  },
  minimal: {
    name: 'Minimal White',
    gradient: 'from-white via-gray-50 to-gray-100',
    accent: 'bg-slate-700',
    text: 'text-gray-800',
    chip: 'from-gray-300 to-gray-400',
  },
};

export default function StudentCards() {
  const [activeTab, setActiveTab] = useState('list');
  const [cards, setCards] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printingCard, setPrintingCard] = useState(null);
  const [message, setMessage] = useState(null);

  const [genForm, setGenForm] = useState({
    student_id: '', template: 'classic',
    issue_date: new Date().toISOString().split('T')[0],
    expiry_date: '', notes: ''
  });

  const [bulkForm, setBulkForm] = useState({
    class_id: '', template: 'classic',
    issue_date: new Date().toISOString().split('T')[0],
    expiry_date: ''
  });

  // ===== Load =====
  const load = async () => {
    setLoading(true);
    try {
      const url = search ? `/cards?search=${search}` : '/cards';
      const [cRes, sRes, clRes, stRes] = await Promise.all([
        API.get(url),
        API.get('/students?status=Active'),
        API.get('/classes'),
        API.get('/settings')
      ]);
      setCards(cRes.data);
      setStudents(sRes.data);
      setClasses(clRes.data);
      setSettings(stRes.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [search]);

  useEffect(() => {
    // Expiry Date default = +1 year
    const validity = parseInt(settings.card_validity_years || '1');
    const d = new Date();
    d.setFullYear(d.getFullYear() + validity);
    const def = d.toISOString().split('T')[0];
    setGenForm(prev => ({ ...prev, expiry_date: prev.expiry_date || def }));
    setBulkForm(prev => ({ ...prev, expiry_date: prev.expiry_date || def }));
  }, [settings]);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // ===== Generate Single =====
  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/cards', genForm);
      showMsg('success', `✅ ကဒ် ထုတ်ပြီးပါပြီ: ${res.data.card_number}`);
      setShowGenerateModal(false);
      load();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  // ===== Bulk Generate =====
  const handleBulkGenerate = async (e) => {
    e.preventDefault();
    if (!confirm('အတန်းထဲက ကျောင်းသား အားလုံးအတွက် ကဒ် ထုတ်မှာလား?')) return;
    try {
      const res = await API.post('/cards/bulk', bulkForm);
      showMsg('success', `✅ ${res.data.summary.created} ကဒ် ထုတ်ပြီး၊ ${res.data.summary.skipped} ကျော်`);
      setShowBulkModal(false);
      load();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  // ===== Revoke =====
  const handleRevoke = async (id) => {
    if (!confirm('ဒီကဒ်ကို Revoke လုပ်မှာလား? (ပြန်ပြင်၍ မရပါ)')) return;
    try {
      await API.post(`/cards/${id}/revoke`);
      showMsg('success', 'Revoke ပြီးပါပြီ');
      load();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  // ===== Delete =====
  const handleDelete = async (id) => {
    if (!confirm('ဖျက်မှာ သေချာလား?')) return;
    try {
      await API.delete(`/cards/${id}`);
      showMsg('success', 'ဖျက်ပြီးပါပြီ');
      load();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  // ===== Print =====
  const handlePrint = (card) => {
    setPrintingCard(card);
    setShowPrintModal(true);
  };

  const getCardStatus = (card) => {
    const today = new Date().toISOString().split('T')[0];
    if (card.status === 'Revoked') return 'Revoked';
    if (card.expiry_date < today) return 'Expired';
    return 'Active';
  };

  const tabs = [
    { key: 'list', label: '📋 ကဒ် စာရင်း', icon: CreditCard },
    { key: 'templates', label: '🎨 Template များ', icon: Palette },
    { key: 'verify', label: '🔍 Verify', icon: ShieldCheck },
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
                    : 'border-transparent text-gray-500 hover:text-gray-700'
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
          <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="ကဒ် နံပါတ် / ကျောင်းသား ရှာရန်..."
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex-1" />
            <button onClick={() => setShowBulkModal(true)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg">
              <Users className="w-4 h-4" /> အတန်းလိုက် ထုတ်
            </button>
            <button onClick={() => setShowGenerateModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg">
              <Plus className="w-5 h-5" /> ကဒ် အသစ်
            </button>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">Loading...</div>
          ) : cards.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">ကဒ် မရှိသေးပါ</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cards.map(c => {
                const status = getCardStatus(c);
                const statusColor = status === 'Active' ? 'bg-green-100 text-green-700'
                  : status === 'Expired' ? 'bg-orange-100 text-orange-700'
                  : 'bg-red-100 text-red-700';
                return (
                  <div key={c.id} className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        {c.photo ? (
                          <img src={c.photo} alt={c.student_name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200" />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                            {c.student_name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-gray-800 text-sm">{c.student_name}</h3>
                          <p className="text-xs font-mono text-blue-600">{c.card_number}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                        {status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1 mb-3">
                      <p>📅 ထုတ်: {c.issue_date}</p>
                      <p>⏰ ကုန်: {c.expiry_date}</p>
                      <p>🎨 {TEMPLATES[c.template]?.name || c.template}</p>
                    </div>
                    <div className="flex gap-1 pt-3 border-t">
                      <button onClick={() => handlePrint(c)}
                        className="flex-1 flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded text-xs font-medium">
                        <Printer className="w-3.5 h-3.5" /> ကြည့်/Print
                      </button>
                      {status === 'Active' && (
                        <button onClick={() => handleRevoke(c.id)}
                          className="px-3 py-2 text-orange-600 hover:bg-orange-50 rounded" title="Revoke">
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => handleDelete(c.id)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded" title="ဖျက်">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== TAB 2: Templates ===== */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm">
            💡 ကဒ် Template ၄ မျိုး ရှိပါတယ်။ ကဒ် ထုတ်တဲ့အခါ ရွေးလို့ရပါတယ်။
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(TEMPLATES).map(([key, t]) => (
              <div key={key} className="bg-white rounded-xl shadow-sm p-4">
                <h3 className="font-bold text-gray-800 mb-3">{t.name}</h3>
                <div className={`bg-gradient-to-br ${t.gradient} rounded-xl p-4 aspect-[1.58/1] text-${t.text}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`text-[10px] opacity-90 ${t.text}`}>Maw Goon Thit School</p>
                      <p className={`text-[8px] opacity-75 ${t.text}`}>Student Identity Card</p>
                    </div>
                    <div className={`w-8 h-8 rounded ${t.accent} flex items-center justify-center text-white text-[10px] font-bold`}>
                      MGT
                    </div>
                  </div>
                  <div className="flex gap-3 mt-3">
                    <div className="w-14 h-16 bg-white/20 rounded flex items-center justify-center text-white text-[10px]">
                      Photo
                    </div>
                    <div className={`space-y-0.5 text-[9px] ${t.text}`}>
                      <p className="font-bold text-xs">Student Name</p>
                      <p>ID: MGT-2026-00001</p>
                      <p>Grade 5 - A</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">Template Key: <code className="bg-gray-100 px-1 rounded">{key}</code></p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== TAB 3: Verify ===== */}
      {activeTab === 'verify' && <VerifyTab settings={settings} />}

      {/* ===== Generate Modal ===== */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">🎴 ကဒ် အသစ် ထုတ်ရန်</h3>
              <button onClick={() => setShowGenerateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleGenerate} className="p-6 space-y-4">
              <Field label="ကျောင်းသား *">
                <select value={genForm.student_id} required
                  onChange={e => setGenForm({ ...genForm, student_id: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- ရွေးပါ --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.student_id}) - {s.grade}</option>
                  ))}
                </select>
              </Field>
              <Field label="Template">
                <select value={genForm.template}
                  onChange={e => setGenForm({ ...genForm, template: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                  {Object.entries(TEMPLATES).map(([k, t]) => (
                    <option key={k} value={k}>{t.name}</option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="ထုတ်သည့်ရက် *">
                  <input type="date" value={genForm.issue_date} required
                    onChange={e => setGenForm({ ...genForm, issue_date: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </Field>
                <Field label="ကုန်ဆုံးရက် *">
                  <input type="date" value={genForm.expiry_date} required
                    onChange={e => setGenForm({ ...genForm, expiry_date: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </Field>
              </div>
              <Field label="မှတ်ချက်">
                <textarea value={genForm.notes} rows="2"
                  onChange={e => setGenForm({ ...genForm, notes: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </Field>
              <div className="flex gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowGenerateModal(false)}
                  className="flex-1 px-4 py-2.5 border rounded-lg hover:bg-gray-50">ပယ်ဖျက်</button>
                <button type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium">
                  ကဒ် ထုတ်ရန်
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Bulk Modal ===== */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">👥 အတန်းလိုက် ကဒ် ထုတ်ရန်</h3>
              <button onClick={() => setShowBulkModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleBulkGenerate} className="p-6 space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-xs">
                ⚠️ ဒီလုပ်ဆောင်ချက်က အတန်းထဲက ကျောင်းသား <strong>အားလုံး</strong>အတွက် ကဒ် ထုတ်ပေးပါမယ်။ 
                Active ကဒ် ရှိပြီးသားသူများကို ကျော်ပါမယ်။
              </div>
              <Field label="အတန်း *">
                <select value={bulkForm.class_id} required
                  onChange={e => setBulkForm({ ...bulkForm, class_id: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- ရွေးပါ --</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                </select>
              </Field>
              <Field label="Template">
                <select value={bulkForm.template}
                  onChange={e => setBulkForm({ ...bulkForm, template: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                  {Object.entries(TEMPLATES).map(([k, t]) => (
                    <option key={k} value={k}>{t.name}</option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="ထုတ်သည့်ရက် *">
                  <input type="date" value={bulkForm.issue_date} required
                    onChange={e => setBulkForm({ ...bulkForm, issue_date: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </Field>
                <Field label="ကုန်ဆုံးရက် *">
                  <input type="date" value={bulkForm.expiry_date} required
                    onChange={e => setBulkForm({ ...bulkForm, expiry_date: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </Field>
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowBulkModal(false)}
                  className="flex-1 px-4 py-2.5 border rounded-lg hover:bg-gray-50">ပယ်ဖျက်</button>
                <button type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg font-medium">
                  Bulk ထုတ်ရန်
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Print Modal ===== */}
      {showPrintModal && printingCard && (
        <PrintModal card={printingCard} settings={settings}
          onClose={() => setShowPrintModal(false)} />
      )}
    </div>
  );
}

// ===== Card Front & Back =====
function CardView({ card, settings, side }) {
  const t = TEMPLATES[card.template] || TEMPLATES.classic;
  const verifyUrl = `${window.location.origin}/verify/${card.card_number}/${card.secret_code}`;

  if (side === 'back') {
    return (
      <div className={`bg-gradient-to-br ${t.gradient} rounded-xl p-5 text-${t.text} aspect-[1.58/1] flex flex-col`}>
        <div className="flex items-center gap-2 pb-2 mb-3 border-b border-white/30">
          <div className={`w-8 h-8 rounded ${t.accent} flex items-center justify-center text-white text-xs font-bold`}>
            MGT
          </div>
          <div>
            <p className={`text-xs font-bold ${t.text}`}>စည်းမျဉ်းများ</p>
            <p className={`text-[9px] opacity-75 ${t.text}`}>Rules & Regulations</p>
          </div>
        </div>
        <div className={`flex-1 text-[9px] leading-relaxed whitespace-pre-line opacity-95 ${t.text}`}>
          {settings.card_back_rules || '1. ကဒ်ကို အမြဲဆောင်ထားရမည်။'}
        </div>
        <div className={`text-[8px] opacity-80 pt-2 border-t border-white/30 ${t.text}`}>
          <p>{settings.card_back_contact}</p>
          <p>{settings.card_back_address}</p>
          <p className="mt-1 italic">{settings.card_back_footer}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br ${t.gradient} rounded-xl p-5 text-${t.text} aspect-[1.58/1] relative overflow-hidden`}>
      {/* Hidden watermark - secret code as background pattern */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.04]">
        <div className="text-4xl font-mono font-bold tracking-wider rotate-[-25deg] whitespace-nowrap">
          {card.secret_code} · {card.secret_code} · {card.secret_code}
        </div>
      </div>

      {/* Header */}
      <div className="relative flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          {settings.card_logo || settings.school_logo ? (
            <img src={settings.card_logo || settings.school_logo} alt="Logo"
              className="w-10 h-10 rounded object-contain bg-white/90 p-0.5" />
          ) : (
            <div className={`w-10 h-10 rounded ${t.accent} flex items-center justify-center text-white text-xs font-bold`}>
              MGT
            </div>
          )}
          <div>
            <p className={`text-xs font-bold ${t.text}`}>
              {settings.card_school_title || settings.school_name || 'Maw Goon Thit School'}
            </p>
            <p className={`text-[9px] opacity-80 ${t.text}`}>
              {settings.card_school_subtitle || 'Student Identity Card'}
            </p>
          </div>
        </div>
        <div className={`w-12 h-4 rounded-full bg-gradient-to-r ${t.chip} opacity-80`} />
      </div>

      {/* Body */}
      <div className="relative flex gap-3">
        {/* Photo */}
        <div className="shrink-0">
          {card.photo ? (
            <img src={card.photo} alt={card.student_name}
              className="w-20 h-24 rounded object-cover border-2 border-white/60" />
          ) : (
            <div className="w-20 h-24 bg-white/20 rounded border-2 border-white/40 flex items-center justify-center">
              <span className={`text-[10px] ${t.text}`}>Photo</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className={`flex-1 space-y-1 text-[10px] ${t.text}`}>
          <div>
            <p className="text-[8px] opacity-75">Name</p>
            <p className="text-sm font-bold">{card.student_name}</p>
          </div>
          <div className="grid grid-cols-2 gap-1">
            <div>
              <p className="text-[8px] opacity-75">Student ID</p>
              <p className="font-mono font-medium">{card.student_code}</p>
            </div>
            <div>
              <p className="text-[8px] opacity-75">Grade</p>
              <p className="font-medium">{card.grade}{card.section ? ` - ${card.section}` : ''}</p>
            </div>
            {card.date_of_birth && (
              <div>
                <p className="text-[8px] opacity-75">D.O.B</p>
                <p>{card.date_of_birth}</p>
              </div>
            )}
            {card.blood_type && (
              <div>
                <p className="text-[8px] opacity-75">Blood</p>
                <p className="font-bold text-red-200">{card.blood_type}</p>
              </div>
            )}
          </div>
        </div>

        {/* QR Code */}
        <div className="shrink-0 bg-white rounded p-1 self-start">
          <QRCodeSVG value={verifyUrl} size={56} level="M" />
        </div>
      </div>

      {/* Footer */}
      <div className={`relative flex justify-between items-end mt-3 pt-2 border-t border-white/30 text-[8px] ${t.text}`}>
        <div>
          <p className="opacity-75">Card No.</p>
          <p className="font-mono font-bold text-[10px]">{card.card_number}</p>
        </div>
        <div className="text-right">
          <p className="opacity-75">Valid</p>
          <p className="font-medium">{card.issue_date} → {card.expiry_date}</p>
        </div>
      </div>
    </div>
  );
}

// ===== Print Modal =====
function PrintModal({ card, settings, onClose }) {
  const frontRef = useRef();
  const backRef = useRef();

  const handlePrint = () => {
    const html = `
      <html><head><title>Card - ${card.card_number}</title>
      <style>
        @page { size: A4; margin: 10mm; }
        body { font-family: 'Pyidaungsu', sans-serif; background: white; padding: 20px; }
        .card-wrapper { display: flex; flex-direction: column; align-items: center; gap: 15mm; }
        .card { width: 86mm; height: 54mm; border-radius: 3mm; overflow: hidden; page-break-inside: avoid; }
        @media print { .card { box-shadow: none; } }
      </style>
      </head><body>
      <div class="card-wrapper">
        <div class="card">${frontRef.current?.innerHTML || ''}</div>
        <div class="card">${backRef.current?.innerHTML || ''}</div>
      </div>
      </body></html>
    `;
    const win = window.open('', '', 'width=900,height=700');
    win.document.write(html);
    win.document.close();

    // Copy styles from current page
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));
    styles.forEach(s => {
      try { win.document.head.appendChild(s.cloneNode(true)); } catch (e) {}
    });

    setTimeout(() => { win.print(); /* win.close(); */ }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8">
        <div className="flex justify-between items-center p-5 border-b sticky top-0 bg-white z-10 rounded-t-2xl">
          <div>
            <h3 className="font-bold text-lg">🎴 ကဒ် Print Preview</h3>
            <p className="text-xs text-gray-500">{card.card_number} · {card.student_name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 bg-gray-100 space-y-6">
          <div className="max-w-md mx-auto">
            <p className="text-xs text-gray-500 mb-2 text-center">🔵 အရှေ့ဖက် (Front)</p>
            <div ref={frontRef}>
              <CardView card={card} settings={settings} side="front" />
            </div>
          </div>
          <div className="max-w-md mx-auto">
            <p className="text-xs text-gray-500 mb-2 text-center">🔴 အနောက်ဖက် (Back)</p>
            <div ref={backRef}>
              <CardView card={card} settings={settings} side="back" />
            </div>
          </div>
        </div>

        <div className="p-5 border-t bg-white sticky bottom-0 rounded-b-2xl flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 border rounded-lg hover:bg-gray-50">ပိတ်</button>
          <button onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium">
            <Printer className="w-4 h-4" /> Print ထုတ်ရန်
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== Verify Tab =====
function VerifyTab({ settings }) {
  const [cardNumber, setCardNumber] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await API.get(`/cards/verify/${cardNumber}/${secretCode}`);
      setResult(res.data);
    } catch (err) {
      setResult({ valid: false, error: err.response?.data?.error || 'Invalid' });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold">ကဒ် စစ်ဆေးရန်</h2>
            <p className="text-xs text-gray-500">ကဒ် နံပါတ် နဲ့ Secret Code ထည့်ပြီး စစ်ဆေးပါ</p>
          </div>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <Field label="ကဒ် နံပါတ်">
            <input type="text" value={cardNumber} required
              onChange={e => setCardNumber(e.target.value.toUpperCase())}
              placeholder="MGT-2026-00001"
              className="w-full px-4 py-2 border rounded-lg font-mono outline-none focus:ring-2 focus:ring-blue-500" />
          </Field>
          <Field label="Secret Code (ကဒ် အောက်မှာ ဝှက်ထားတယ်)">
            <input type="text" value={secretCode} required
              onChange={e => setSecretCode(e.target.value.toUpperCase())}
              placeholder="ABCD1234EF567890"
              className="w-full px-4 py-2 border rounded-lg font-mono outline-none focus:ring-2 focus:ring-blue-500" />
          </Field>
          <button type="submit" disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-medium disabled:opacity-50">
            {loading ? 'စစ်ဆေးနေသည်...' : '🔍 စစ်ဆေးရန်'}
          </button>
        </form>
      </div>

      {result && (
        <div className={`rounded-xl shadow-sm p-6 border-2 ${
          result.valid ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            {result.valid ? (
              <ShieldCheck className="w-8 h-8 text-green-600" />
            ) : (
              <ShieldX className="w-8 h-8 text-red-600" />
            )}
            <div>
              <h3 className={`text-lg font-bold ${result.valid ? 'text-green-700' : 'text-red-700'}`}>
                {result.valid ? '✅ ကဒ် အကျုံးဝင်ပါတယ်' : '❌ ကဒ် အကျုံးမဝင်ပါ'}
              </h3>
              {result.status && <p className="text-xs text-gray-600">Status: {result.status}</p>}
              {result.error && <p className="text-xs text-red-600">{result.error}</p>}
            </div>
          </div>

          {result.student && (
            <div className="bg-white rounded-lg p-4 flex items-center gap-4">
              {result.student.photo ? (
                <img src={result.student.photo} alt={result.student.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {result.student.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="text-sm space-y-1">
                <p className="text-lg font-bold text-gray-800">{result.student.name}</p>
                <p className="font-mono text-blue-600">{result.student.student_id}</p>
                <p className="text-gray-600">{result.student.grade} {result.student.section || ''}</p>
                {result.card && (
                  <p className="text-xs text-gray-500">
                    📅 {result.card.issue_date} → {result.card.expiry_date}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===== Field Helper =====
function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}