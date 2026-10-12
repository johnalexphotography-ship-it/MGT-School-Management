import { useState, useEffect } from 'react';
import {
  School, Building2, FileText, Lock, Download,
  Save, AlertCircle, CheckCircle, Upload, X,
  User, Landmark, History, Image as ImageIcon, PenTool
} from 'lucide-react';
import API from '../api/axios';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('school');
  const [settings, setSettings] = useState({});
  const [passwords, setPasswords] = useState({ old_password: '', new_password: '', confirm: '' });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    API.get('/settings')
      .then(r => setSettings(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const update = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await API.put('/settings', settings);
      showMsg('success', 'ဆက်တင် သိမ်းပြီးပါပြီ');
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwords.new_password !== passwords.confirm) {
      return showMsg('error', 'Password အသစ် ၂ ခု မတူပါ');
    }
    try {
      await API.post('/settings/change-password', {
        old_password: passwords.old_password,
        new_password: passwords.new_password,
      });
      showMsg('success', 'Password ပြောင်းပြီးပါပြီ');
      setPasswords({ old_password: '', new_password: '', confirm: '' });
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  const backup = async () => {
    try {
      const r = await API.get('/settings/backup');
      const blob = new Blob([Uint8Array.from(atob(r.data.data), c => c.charCodeAt(0))]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = r.data.filename; a.click();
      URL.revokeObjectURL(url);
      showMsg('success', 'Backup ရယူပြီးပါပြီ');
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  // ===== Image Upload (Base64) =====
  const handleImageUpload = (e, key, maxKB = 500) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > maxKB * 1024) {
      alert(`ပုံအရွယ်အစား ${maxKB}KB အောက်သာ ရွေးပါ`);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => update(key, reader.result);
    reader.readAsDataURL(file);
  };

  if (loading) return <div className="p-12 text-center text-gray-500">Loading...</div>;

  const tabs = [
    { key: 'school', label: '🏫 ကျောင်း အချက်အလက်', icon: School },
    { key: 'principal', label: '👤 ကျောင်းအုပ် / တည်ထောင်သူ', icon: User },
    { key: 'history', label: '📜 ကျောင်းသမိုင်း', icon: History },
    { key: 'bank', label: '🏦 ဘဏ် အချက်အလက်', icon: Landmark },
    { key: 'security', label: '🔐 လုံခြုံရေး', icon: Lock },
    { key: 'backup', label: '💾 Backup', icon: Download },
    { key: 'about', label: 'ℹ️ အကြောင်း', icon: FileText },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      {/* ===== Tabs ===== */}
      <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
        <div className="flex overflow-x-auto border-b">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== TAB 1: School Info ===== */}
      {activeTab === 'school' && (
        <div className="space-y-6">
          {/* Logo */}
          <Card title="🖼️ ကျောင်း လိုဂို" subtitle="PNG, JPG · 500KB အောက်">
            <div className="flex items-center gap-6">
              <div className="relative">
                {settings.school_logo ? (
                  <img src={settings.school_logo} alt="Logo"
                    className="w-32 h-32 rounded-xl object-contain border-4 border-blue-100 bg-white shadow-md" />
                ) : (
                  <div className="w-32 h-32 bg-blue-50 rounded-xl flex items-center justify-center border-4 border-dashed border-blue-300">
                    <ImageIcon className="w-12 h-12 text-blue-400" />
                  </div>
                )}
                {settings.school_logo && (
                  <button onClick={() => update('school_logo', '')}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div>
                <label className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium">
                  <Upload className="w-4 h-4" /> လိုဂို တင်ရန်
                  <input type="file" accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'school_logo', 500)} className="hidden" />
                </label>
                <p className="text-xs text-gray-500 mt-2">ကျောင်း Report Header မှာ ပေါ်ပါမယ်</p>
              </div>
            </div>
          </Card>

          {/* Basic Info */}
          <Card title="📋 အခြေခံ အချက်အလက်">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="ကျောင်း အမည် (မြန်မာ)" value={settings.school_name}
                onChange={v => update('school_name', v)} placeholder="Maw Goon Thit School" />
              <Input label="ကျောင်း အမည် (English)" value={settings.school_name_en}
                onChange={v => update('school_name_en', v)} placeholder="Maw Goon Thit School" />
              <Input label="တည်ထောင်သည့် နှစ်" value={settings.established_year}
                onChange={v => update('established_year', v)} placeholder="2005" />
              <Input label="ပညာသင်နှစ်" value={settings.academic_year}
                onChange={v => update('academic_year', v)} placeholder="2026-2027" />
              <Input label="အခွန် မှတ်ပုံတင် (Tax ID)" value={settings.tax_id}
                onChange={v => update('tax_id', v)} placeholder="123456789" />
            </div>
          </Card>

          {/* Contact */}
          <Card title="📞 ဆက်သွယ်ရန်">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="ဖုန်း ၁" value={settings.school_phone}
                onChange={v => update('school_phone', v)} placeholder="09xxxxxxxxx" />
              <Input label="ဖုန်း ၂" value={settings.school_phone2}
                onChange={v => update('school_phone2', v)} placeholder="09xxxxxxxxx" />
              <Input label="Email" type="email" value={settings.school_email}
                onChange={v => update('school_email', v)} placeholder="info@school.edu" />
              <Input label="Website" value={settings.school_website}
                onChange={v => update('school_website', v)} placeholder="www.school.edu" />
              <div className="md:col-span-2">
                <Textarea label="လိပ်စာ" value={settings.school_address}
                  onChange={v => update('school_address', v)} rows={2}
                  placeholder="အမှတ် (၁၂၃)၊ လမ်း ၅၀၊ ရန်ကုန်မြို့" />
              </div>
            </div>
          </Card>

          <SaveButton onClick={saveSettings} saving={saving} />
        </div>
      )}

      {/* ===== TAB 2: Principal & Founder ===== */}
      {activeTab === 'principal' && (
        <div className="space-y-6">
          {/* Principal */}
          <Card title="👤 ကျောင်းအုပ် အချက်အလက်">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="ကျောင်းအုပ် အမည် (မြန်မာ)" value={settings.principal_name}
                onChange={v => update('principal_name', v)} placeholder="ဦးကျော်မြင့်" />
              <Input label="ကျောင်းအုပ် အမည် (English)" value={settings.principal_name_en}
                onChange={v => update('principal_name_en', v)} placeholder="U Kyaw Myint" />
              <Input label="ဖုန်း" value={settings.principal_phone}
                onChange={v => update('principal_phone', v)} placeholder="09xxxxxxxxx" />
            </div>

            {/* Signature Upload */}
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                <PenTool className="w-4 h-4" /> ကျောင်းအုပ် လက်မှတ်
              </h4>
              <div className="flex items-center gap-6">
                {settings.principal_signature ? (
                  <div className="relative">
                    <img src={settings.principal_signature} alt="Signature"
                      className="h-24 bg-white border-2 border-gray-200 rounded-lg p-2" />
                    <button onClick={() => update('principal_signature', '')}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-48 h-24 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                    <PenTool className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div>
                  <label className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                    <Upload className="w-4 h-4" /> လက်မှတ် တင်ရန်
                    <input type="file" accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'principal_signature', 300)} className="hidden" />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">Certificate/Report မှာ ပေါ်ပါမယ်</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Founder */}
          <Card title="🌟 ကျောင်း တည်ထောင်သူ">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="တည်ထောင်သူ အမည် (မြန်မာ)" value={settings.founder_name}
                onChange={v => update('founder_name', v)} placeholder="ဦးလှကျော်" />
              <Input label="တည်ထောင်သူ အမည် (English)" value={settings.founder_name_en}
                onChange={v => update('founder_name_en', v)} placeholder="U Hla Kyaw" />
              <Input label="တည်ထောင်သည့် နှစ်" value={settings.founder_year}
                onChange={v => update('founder_year', v)} placeholder="2005" />
            </div>
            <div className="mt-4">
              <Textarea label="တည်ထောင်သူ အကြောင်း" value={settings.founder_bio}
                onChange={v => update('founder_bio', v)} rows={3}
                placeholder="ဦးလှကျော်သည် ၁၉၈၀ ပြည့်နှစ်တွင်..." />
            </div>
          </Card>

          <SaveButton onClick={saveSettings} saving={saving} />
        </div>
      )}

      {/* ===== TAB 3: History ===== */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <Card title="📜 ကျောင်းသမိုင်း" subtitle="ကျောင်း တည်ထောင်ခဲ့သည့် အကြောင်း အပြည့်အစုံ">
            <Textarea label="" value={settings.school_history}
              onChange={v => update('school_history', v)} rows={10}
              placeholder="၂၀၀၅ ခုနှစ်တွင် ကျောင်းကို စတင်တည်ထောင်ခဲ့သည်..." />
          </Card>

          <Card title="🎯 ဆောင်ပုဒ် / ရည်မှန်းချက် / တာဝန်">
            <div className="space-y-4">
              <Textarea label="🎯 ဆောင်ပုဒ် (Motto)" value={settings.school_motto}
                onChange={v => update('school_motto', v)} rows={2}
                placeholder="ပညာရေးသည် အလင်းရောင်" />
              <Textarea label="👁️ ရည်မှန်းချက် (Vision)" value={settings.school_vision}
                onChange={v => update('school_vision', v)} rows={3}
                placeholder="မြန်မာနိုင်ငံရဲ့ ထိပ်တန်း ကျောင်းတစ်ကျောင်း ဖြစ်လာရမည်..." />
              <Textarea label="🎯 တာဝန် (Mission)" value={settings.school_mission}
                onChange={v => update('school_mission', v)} rows={3}
                placeholder="ကျောင်းသားများကို ကောင်းမွန်တဲ့ ပညာရေး ပေးအပ်ရမည်..." />
            </div>
          </Card>

          <SaveButton onClick={saveSettings} saving={saving} />
        </div>
      )}

      {/* ===== TAB 4: Bank Info ===== */}
      {activeTab === 'bank' && (
        <div className="space-y-6">
          {/* Bank 1 */}
          <Card title="🏦 ဘဏ် အကောင့် ၁">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="ဘဏ် အမည်" value={settings.bank1_name}
                onChange={v => update('bank1_name', v)} placeholder="KBZ Bank" />
              <Input label="အကောင့် အမည်" value={settings.bank1_account_name}
                onChange={v => update('bank1_account_name', v)} placeholder="Maw Goon Thit School" />
              <Input label="အကောင့် နံပါတ်" value={settings.bank1_account_number}
                onChange={v => update('bank1_account_number', v)} placeholder="1234567890123" />
              <Input label="ဘဏ်ခွဲ" value={settings.bank1_branch}
                onChange={v => update('bank1_branch', v)} placeholder="ရန်ကုန် ဌာနချုပ်" />
              <Input label="SWIFT Code" value={settings.bank1_swift}
                onChange={v => update('bank1_swift', v)} placeholder="KBZMMMXXX" />
            </div>
          </Card>

          {/* Bank 2 */}
          <Card title="🏦 ဘဏ် အကောင့် ၂">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="ဘဏ် အမည်" value={settings.bank2_name}
                onChange={v => update('bank2_name', v)} placeholder="AYA Bank" />
              <Input label="အကောင့် အမည်" value={settings.bank2_account_name}
                onChange={v => update('bank2_account_name', v)} placeholder="Maw Goon Thit School" />
              <Input label="အကောင့် နံပါတ်" value={settings.bank2_account_number}
                onChange={v => update('bank2_account_number', v)} placeholder="9876543210987" />
              <Input label="ဘဏ်ခွဲ" value={settings.bank2_branch}
                onChange={v => update('bank2_branch', v)} placeholder="မန္တလေး" />
              <Input label="SWIFT Code" value={settings.bank2_swift}
                onChange={v => update('bank2_swift', v)} placeholder="AYABMMMXXX" />
            </div>
          </Card>

          {/* Payment Notes */}
          <Card title="📝 ငွေပေးချေမှု မှတ်ချက်">
            <Textarea label="" value={settings.payment_notes}
              onChange={v => update('payment_notes', v)} rows={4}
              placeholder="ကျောင်းလခ ပေးချေရာတွင် ဘဏ်အကောင့်သို့ လွှဲပြောင်းနိုင်ပါသည်။ Slip ကို ကျောင်းရုံးသို့ ပေးပို့ပါ..." />
          </Card>

          <SaveButton onClick={saveSettings} saving={saving} />
        </div>
      )}

      {/* ===== TAB 5: Security ===== */}
      {activeTab === 'security' && (
        <Card title="🔐 Password ပြောင်းရန်">
          <form onSubmit={changePassword} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Password အဟောင်း" type="password"
              value={passwords.old_password}
              onChange={v => setPasswords({ ...passwords, old_password: v })} required />
            <Input label="Password အသစ်" type="password"
              value={passwords.new_password}
              onChange={v => setPasswords({ ...passwords, new_password: v })} required />
            <Input label="အတည်ပြု Password" type="password"
              value={passwords.confirm}
              onChange={v => setPasswords({ ...passwords, confirm: v })} required />
            <div className="md:col-span-3">
              <button type="submit"
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-lg">
                <Lock className="w-4 h-4" /> Password ပြောင်းရန်
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* ===== TAB 6: Backup ===== */}
      {activeTab === 'backup' && (
        <Card title="💾 Database Backup" subtitle="Database ကို File အဖြစ် ရယူပါ">
          <button onClick={backup}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg">
            <Download className="w-4 h-4" /> Backup ရယူရန်
          </button>
          <p className="text-xs text-gray-500 mt-3">
            ⚠️ Backup File ကို လုံခြုံတဲ့နေရာမှာ သိမ်းထားပါ။
          </p>
        </Card>
      )}
    </div>
  );
}

// ===== Helper Components =====
function Card({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', placeholder, required }) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input type={type} value={value || ''} placeholder={placeholder} required={required}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
    </div>
  );
}

function Textarea({ label, value, onChange, rows = 3, placeholder }) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}
      <textarea value={value || ''} rows={rows} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
    </div>
  );
}

function SaveButton({ onClick, saving }) {
  return (
    <div className="flex justify-end">
      <button onClick={onClick} disabled={saving}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50">
        <Save className="w-5 h-5" /> {saving ? 'သိမ်းနေသည်...' : 'သိမ်းရန်'}
      </button>
    </div>
  );
}