import { useState, useEffect } from 'react';
import {
  GraduationCap, Search, Plus, Edit, Trash2, X, Save,
  AlertCircle, CheckCircle, Camera, Mail, Phone, Eye,
  PlusCircle, MinusCircle, User, MapPin
} from 'lucide-react';
import API from '../api/axios';

// ===== Currency Config =====
const CURRENCIES = {
  MMK: { symbol: 'K', name: 'ကျပ်' },
  THB: { symbol: '฿', name: 'ဘတ်' },
  USD: { symbol: '$', name: 'ဒေါ်လာ' },
  GBP: { symbol: '£', name: 'ပေါင်' },
  EUR: { symbol: '€', name: 'ယူရို' },
  SGD: { symbol: 'S$', name: 'စင်္ကာပူ' },
};

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewTeacher, setViewTeacher] = useState(null);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');

  const emptyForm = {
    teacher_id: '', name: '', name_en: '', email: '', phone: '',
    gender: 'Male', date_of_birth: '', blood_type: '', nrc: '',
    nationality: '', religion: '', address: '', permanent_address: '',
    subject: '', specialization: '', qualification: '',
    experience_years: '', employment_type: '', join_date: '',
    salary: '', salary_currency: 'MMK', status: 'Active',
    emergency_name: '', emergency_phone: '', emergency_relation: '',
    medical_notes: '', photo: '', custom_fields: {}
  };
  const [formData, setFormData] = useState(emptyForm);
  const [customPairs, setCustomPairs] = useState([]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const url = search ? `/teachers?search=${search}` : '/teachers';
      const res = await API.get(url);
      setTeachers(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTeachers(); }, [search]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('ပုံအရွယ်အစား 2MB အောက်သာ ရွေးပါ');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setFormData(prev => ({ ...prev, photo: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleAdd = () => {
    setEditingTeacher(null);
    setFormData(emptyForm);
    setCustomPairs([]);
    setActiveTab('basic');
    setShowModal(true);
  };

  const handleEdit = (t) => {
    setEditingTeacher(t);
    setFormData({
      teacher_id: t.teacher_id || '', name: t.name || '', name_en: t.name_en || '',
      email: t.email || '', phone: t.phone || '', gender: t.gender || 'Male',
      date_of_birth: t.date_of_birth || '', blood_type: t.blood_type || '',
      nrc: t.nrc || '', nationality: t.nationality || '', religion: t.religion || '',
      address: t.address || '', permanent_address: t.permanent_address || '',
      subject: t.subject || '', specialization: t.specialization || '',
      qualification: t.qualification || '', experience_years: t.experience_years || '',
      employment_type: t.employment_type || '', join_date: t.join_date || '',
      salary: t.salary || '', salary_currency: t.salary_currency || 'MMK',
      status: t.status || 'Active',
      emergency_name: t.emergency_name || '', emergency_phone: t.emergency_phone || '',
      emergency_relation: t.emergency_relation || '',
      medical_notes: t.medical_notes || '', photo: t.photo || '',
      custom_fields: t.custom_fields || {}
    });
    const pairs = Object.entries(t.custom_fields || {}).map(([key, value]) => ({ key, value }));
    setCustomPairs(pairs);
    setActiveTab('basic');
    setShowModal(true);
  };

  const handleView = (t) => {
    setViewTeacher(t);
    setShowViewModal(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const customFields = {};
    customPairs.forEach(p => {
      if (p.key.trim() && p.value.trim()) customFields[p.key.trim()] = p.value.trim();
    });
    const payload = { ...formData, custom_fields: customFields };

    try {
      if (editingTeacher) {
        await API.put(`/teachers/${editingTeacher.id}`, payload);
        setMessage({ type: 'success', text: 'ဆရာ/ဆရာမ အချက်အလက် ပြင်ပြီးပါပြီ' });
      } else {
        await API.post('/teachers', payload);
        setMessage({ type: 'success', text: 'ဆရာ/ဆရာမ ထည့်ပြီးပါပြီ' });
      }
      setShowModal(false);
      fetchTeachers();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Error ဖြစ်ပွားပါတယ်' });
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`"${name}" ကို ဖျက်မှာ သေချာလား?`)) return;
    try {
      await API.delete(`/teachers/${id}`);
      setMessage({ type: 'success', text: 'ဆရာ/ဆရာမ ဖျက်ပြီးပါပြီ' });
      fetchTeachers();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Error ဖြစ်ပွားပါတယ်' });
    }
  };

  const addCustomPair = () => setCustomPairs([...customPairs, { key: '', value: '' }]);
  const removeCustomPair = (i) => setCustomPairs(customPairs.filter((_, idx) => idx !== i));
  const updateCustomPair = (i, field, val) => {
    const updated = [...customPairs];
    updated[i][field] = val;
    setCustomPairs(updated);
  };

  const getCurrencyInfo = (code) => CURRENCIES[code] || CURRENCIES.MMK;

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

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-3 justify-between items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="ဆရာ/ဆရာမ ရှာဖွေရန်..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <button onClick={handleAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg transition">
          <Plus className="w-5 h-5" /> ဆရာ/ဆရာမ အသစ်
        </button>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">Loading...</div>
      ) : teachers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">ဆရာ/ဆရာမ မရှိသေးပါ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map((t) => (
            <div key={t.id} className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  {t.photo ? (
                    <img src={t.photo} alt={t.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-blue-100" />
                  ) : (
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {t.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-gray-800">{t.name}</h3>
                    {t.name_en && <p className="text-xs text-gray-500">{t.name_en}</p>}
                    <p className="text-xs font-mono text-blue-600 mt-0.5">{t.teacher_id}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleView(t)}
                    className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg" title="ကြည့်">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleEdit(t)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="ပြင်">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(t.id, t.name)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="ဖျက်">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-sm">
                {t.subject && (
                  <p className="text-gray-700">
                    <span className="text-gray-500">ဘာသာ:</span> <span className="font-medium">{t.subject}</span>
                    {t.specialization && <span className="text-xs text-gray-500 ml-1">({t.specialization})</span>}
                  </p>
                )}
                {t.email && (
                  <p className="text-gray-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span className="truncate text-xs">{t.email}</span>
                  </p>
                )}
                {t.phone && (
                  <p className="text-gray-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs">{t.phone}</span>
                  </p>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  t.status === 'Active' ? 'bg-green-100 text-green-700'
                    : t.status === 'Resigned' ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>{t.status}</span>
                {t.salary && (
                  <span className="text-xs font-bold text-gray-700">
                    {getCurrencyInfo(t.salary_currency).symbol} {new Intl.NumberFormat().format(t.salary)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== View Modal ===== */}
      {showViewModal && viewTeacher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold">ဆရာ/ဆရာမ အချက်အလက်</h3>
              <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                {viewTeacher.photo ? (
                  <img src={viewTeacher.photo} alt={viewTeacher.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-blue-100" />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-3xl">
                    {viewTeacher.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{viewTeacher.name}</h2>
                  {viewTeacher.name_en && <p className="text-gray-500">{viewTeacher.name_en}</p>}
                  <p className="text-sm font-mono text-blue-600 mt-1">{viewTeacher.teacher_id}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      viewTeacher.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>{viewTeacher.status}</span>
                    {viewTeacher.subject && (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {viewTeacher.subject}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoSection title="👤 ကိုယ်ရေးအချက်အလက်" items={[
                  ['လိင်', viewTeacher.gender],
                  ['မွေးသက္ကရာဇ်', viewTeacher.date_of_birth],
                  ['သွေးအုပ်စု', viewTeacher.blood_type],
                  ['မှတ်ပုံတင်', viewTeacher.nrc],
                  ['နိုင်ငံသား', viewTeacher.nationality],
                  ['ဘာသာ', viewTeacher.religion],
                ]} />

                <InfoSection title="🎓 ပညာရေး / အလုပ်" items={[
                  ['ဘာသာရပ်', viewTeacher.subject],
                  ['အထူးပြု', viewTeacher.specialization],
                  ['ပညာအရည်အချင်း', viewTeacher.qualification],
                  ['အတွေ့အကြုံ (နှစ်)', viewTeacher.experience_years],
                  ['အလုပ်စားပုံစံ', viewTeacher.employment_type],
                  ['ခန့်အပ်ရက်', viewTeacher.join_date],
                ]} />

                <InfoSection title="💰 လစာ" items={[
                  ['လစာ', viewTeacher.salary ? `${getCurrencyInfo(viewTeacher.salary_currency).symbol} ${new Intl.NumberFormat().format(viewTeacher.salary)} ${viewTeacher.salary_currency}` : null],
                ]} />

                <InfoSection title="📞 ဆက်သွယ်ရန်" items={[
                  ['ဖုန်း', viewTeacher.phone],
                  ['Email', viewTeacher.email],
                  ['လိပ်စာ', viewTeacher.address],
                  ['အမြဲတမ်းလိပ်စာ', viewTeacher.permanent_address],
                ]} />

                <InfoSection title="🚨 အရေးပေါ် ဆက်သွယ်ရန်" items={[
                  ['အမည်', viewTeacher.emergency_name],
                  ['ဖုန်း', viewTeacher.emergency_phone],
                  ['တော်စပ်ပုံ', viewTeacher.emergency_relation],
                ]} />

                {viewTeacher.medical_notes && (
                  <div className="md:col-span-2">
                    <InfoSection title="🏥 ကျန်းမာရေး မှတ်ချက်" items={[['မှတ်ချက်', viewTeacher.medical_notes]]} />
                  </div>
                )}

                {viewTeacher.custom_fields && Object.keys(viewTeacher.custom_fields).length > 0 && (
                  <div className="md:col-span-2">
                    <InfoSection title="➕ အပိုဆောင်း အချက်အလက်"
                      items={Object.entries(viewTeacher.custom_fields)} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Add/Edit Modal ===== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">
                {editingTeacher ? 'ဆရာ/ဆရာမ ပြင်ရန်' : 'ဆရာ/ဆရာမ အသစ် ထည့်ရန်'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex border-b bg-gray-50 px-6 overflow-x-auto">
                {[
                  { key: 'basic', label: '👤 အခြေခံ' },
                  { key: 'professional', label: '🎓 အလုပ်' },
                  { key: 'contact', label: '📞 ဆက်သွယ်ရန်' },
                  { key: 'emergency', label: '🚨 အရေးပေါ်' },
                  { key: 'custom', label: '➕ အပိုဆောင်း' },
                ].map(tab => (
                  <button key={tab.key} type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                      activeTab === tab.key
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}>{tab.label}</button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {/* Tab 1: Basic */}
                {activeTab === 'basic' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-6 p-4 bg-blue-50 rounded-xl">
                      <div className="relative">
                        {formData.photo ? (
                          <img src={formData.photo} alt="Preview"
                            className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md" />
                        ) : (
                          <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center border-4 border-dashed border-blue-300">
                            <Camera className="w-10 h-10 text-blue-400" />
                          </div>
                        )}
                        {formData.photo && (
                          <button type="button"
                            onClick={() => setFormData({ ...formData, photo: '' })}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div>
                        <label className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                          <Camera className="w-4 h-4" /> ဓာတ်ပုံ တင်ရန်
                          <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                        </label>
                        <p className="text-xs text-gray-600 mt-2">JPG, PNG · 2MB အောက်</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Teacher ID" required>
                        <input type="text" name="teacher_id" value={formData.teacher_id}
                          onChange={handleChange} required placeholder="TCH001"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                      </Field>
                      <Field label="အမည် (မြန်မာ)" required>
                        <input type="text" name="name" value={formData.name}
                          onChange={handleChange} required placeholder="ဒေါ်မြင့်မြင့်"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                      </Field>
                      <Field label="အမည် (English)">
                        <input type="text" name="name_en" value={formData.name_en}
                          onChange={handleChange} placeholder="Daw Myat Myat"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                      </Field>
                      <Field label="လိင်">
                        <select name="gender" value={formData.gender} onChange={handleChange}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </Field>
                      <Field label="မွေးသက္ကရာဇ်">
                        <input type="date" name="date_of_birth" value={formData.date_of_birth}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                      </Field>
                      <Field label="သွေးအုပ်စု">
                        <select name="blood_type" value={formData.blood_type} onChange={handleChange}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                          <option value="">-- ရွေးပါ --</option>
                          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b =>
                            <option key={b} value={b}>{b}</option>)}
                        </select>
                      </Field>
                      <Field label="မှတ်ပုံတင်နံပါတ်">
                        <input type="text" name="nrc" value={formData.nrc}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                      </Field>
                      <Field label="နိုင်ငံသား">
                        <input type="text" name="nationality" value={formData.nationality}
                          onChange={handleChange} placeholder="မြန်မာ"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                      </Field>
                      <Field label="ဘာသာ">
                        <input type="text" name="religion" value={formData.religion}
                          onChange={handleChange} placeholder="ဗုဒ္ဓ"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                      </Field>
                      <Field label="အခြေအနေ">
                        <select name="status" value={formData.status} onChange={handleChange}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Resigned">Resigned</option>
                          <option value="Retired">Retired</option>
                        </select>
                      </Field>
                    </div>
                  </div>
                )}

                {/* Tab 2: Professional */}
                {activeTab === 'professional' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="ဘာသာရပ်">
                      <input type="text" name="subject" value={formData.subject}
                        onChange={handleChange} placeholder="English"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </Field>
                    <Field label="အထူးပြု">
                      <input type="text" name="specialization" value={formData.specialization}
                        onChange={handleChange} placeholder="Grammar & Writing"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </Field>
                    <Field label="ပညာအရည်အချင်း">
                      <input type="text" name="qualification" value={formData.qualification}
                        onChange={handleChange} placeholder="B.A (English)"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </Field>
                    <Field label="အတွေ့အကြုံ (နှစ်)">
                      <input type="number" name="experience_years" value={formData.experience_years}
                        onChange={handleChange} placeholder="5"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </Field>
                    <Field label="အလုပ်စားပုံစံ">
                      <select name="employment_type" value={formData.employment_type} onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="">-- ရွေးပါ --</option>
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Contract">Contract</option>
                        <option value="Volunteer">Volunteer</option>
                      </select>
                    </Field>
                    <Field label="ခန့်အပ်ရက်">
                      <input type="date" name="join_date" value={formData.join_date}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </Field>
                    <Field label="လစာ">
                      <input type="number" name="salary" value={formData.salary}
                        onChange={handleChange} placeholder="300000"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </Field>
                    <Field label="ငွေကြေး">
                      <select name="salary_currency" value={formData.salary_currency} onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                        {Object.entries(CURRENCIES).map(([code, c]) => (
                          <option key={code} value={code}>{c.symbol} {code} - {c.name}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                )}

                {/* Tab 3: Contact */}
                {activeTab === 'contact' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="ဖုန်း">
                      <input type="text" name="phone" value={formData.phone}
                        onChange={handleChange} placeholder="09xxxxxxxxx"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </Field>
                    <Field label="Email">
                      <input type="email" name="email" value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="လက်ရှိ လိပ်စာ">
                        <textarea name="address" value={formData.address} onChange={handleChange} rows="2"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                      </Field>
                    </div>
                    <div className="md:col-span-2">
                      <Field label="အမြဲတမ်း လိပ်စာ">
                        <textarea name="permanent_address" value={formData.permanent_address}
                          onChange={handleChange} rows="2"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                      </Field>
                    </div>
                  </div>
                )}

                {/* Tab 4: Emergency */}
                {activeTab === 'emergency' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <h4 className="font-bold text-gray-700 mb-3">🚨 အရေးပေါ် ဆက်သွယ်ရန်</h4>
                    </div>
                    <Field label="အမည်">
                      <input type="text" name="emergency_name" value={formData.emergency_name}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </Field>
                    <Field label="ဖုန်း">
                      <input type="text" name="emergency_phone" value={formData.emergency_phone}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </Field>
                    <Field label="တော်စပ်ပုံ">
                      <input type="text" name="emergency_relation" value={formData.emergency_relation}
                        onChange={handleChange} placeholder="ခင်ပွန်း / ဇနီး / သား"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="ကျန်းမာရေး မှတ်ချက်">
                        <textarea name="medical_notes" value={formData.medical_notes}
                          onChange={handleChange} rows="4"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                      </Field>
                    </div>
                  </div>
                )}

                {/* Tab 5: Custom */}
                {activeTab === 'custom' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-gray-800">➕ အပိုဆောင်း အချက်အလက်</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          လိုအပ်တဲ့ Field တွေ ထပ်ထည့်နိုင်ပါတယ်
                        </p>
                      </div>
                      <button type="button" onClick={addCustomPair}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                        <PlusCircle className="w-4 h-4" /> Field ထပ်ထည့်
                      </button>
                    </div>

                    {customPairs.length === 0 ? (
                      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <PlusCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">Field မရှိသေးပါ</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {customPairs.map((pair, i) => (
                          <div key={i} className="flex gap-3 items-start">
                            <input type="text" value={pair.key}
                              onChange={(e) => updateCustomPair(i, 'key', e.target.value)}
                              placeholder="Field အမည်"
                              className="w-1/3 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                            <input type="text" value={pair.value}
                              onChange={(e) => updateCustomPair(i, 'value', e.target.value)}
                              placeholder="တန်ဖိုး"
                              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                            <button type="button" onClick={() => removeCustomPair(i)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                              <MinusCircle className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 p-6 border-t bg-gray-50">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border rounded-lg hover:bg-gray-100 font-medium">
                  ပယ်ဖျက်
                </button>
                <button type="submit"
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium">
                  <Save className="w-4 h-4" /> {editingTeacher ? 'ပြင်ရန်' : 'ထည့်ရန်'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Helper Components =====
function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function InfoSection({ title, items }) {
  const filtered = items.filter(([, v]) => v && v.toString().trim());
  if (filtered.length === 0) return null;
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="font-bold text-gray-700 mb-3 text-sm">{title}</h4>
      <div className="space-y-2">
        {filtered.map(([k, v], i) => (
          <div key={i} className="grid grid-cols-3 gap-2 text-sm">
            <span className="text-gray-500">{k}</span>
            <span className="col-span-2 text-gray-800 font-medium break-words">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}