import { useState, useEffect } from 'react';
import {
  Users, Search, Plus, Edit, Trash2, X, Save,
  AlertCircle, CheckCircle, Camera, User, Phone,
  MapPin, Heart, FileText, PlusCircle, MinusCircle,
  Eye, Download, Upload, FileDown
} from 'lucide-react';
import API from '../api/axios';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');

  // CSV Import States
  const [csvData, setCsvData] = useState([]);
  const [csvFileName, setCsvFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const emptyForm = {
    student_id: '', name: '', name_en: '', parent_name: '', father_name: '', mother_name: '',
    date_of_birth: '', gender: 'Male', blood_type: '', grade: '', section: '',
    phone: '', email: '', address: '', permanent_address: '',
    nationality: '', religion: '', nrc: '', previous_school: '',
    enrollment_date: '', status: 'Active',
    emergency_name: '', emergency_phone: '', emergency_relation: '',
    medical_notes: '', photo: '', custom_fields: {}
  };
  const [formData, setFormData] = useState(emptyForm);
  const [customPairs, setCustomPairs] = useState([]);

  // ===== Fetch =====
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const url = search ? `/students?search=${search}` : '/students';
      const res = await API.get(url);
      setStudents(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStudents(); }, [search]);

  // ===== Photo Upload =====
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

  // ===== Modal =====
  const handleAdd = () => {
    setEditingStudent(null);
    setFormData(emptyForm);
    setCustomPairs([]);
    setActiveTab('basic');
    setShowModal(true);
  };

  const handleEdit = (s) => {
    setEditingStudent(s);
    setFormData({
      student_id: s.student_id || '', name: s.name || '', name_en: s.name_en || '',
      parent_name: s.parent_name || '', father_name: s.father_name || '', mother_name: s.mother_name || '',
      date_of_birth: s.date_of_birth || '', gender: s.gender || 'Male',
      blood_type: s.blood_type || '', grade: s.grade || '', section: s.section || '',
      phone: s.phone || '', email: s.email || '', address: s.address || '',
      permanent_address: s.permanent_address || '', nationality: s.nationality || '',
      religion: s.religion || '', nrc: s.nrc || '', previous_school: s.previous_school || '',
      enrollment_date: s.enrollment_date || '', status: s.status || 'Active',
      emergency_name: s.emergency_name || '', emergency_phone: s.emergency_phone || '',
      emergency_relation: s.emergency_relation || '', medical_notes: s.medical_notes || '',
      photo: s.photo || '', custom_fields: s.custom_fields || {}
    });
    const pairs = Object.entries(s.custom_fields || {}).map(([key, value]) => ({ key, value }));
    setCustomPairs(pairs);
    setActiveTab('basic');
    setShowModal(true);
  };

  const handleView = (s) => {
    setViewStudent(s);
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
      if (editingStudent) {
        await API.put(`/students/${editingStudent.id}`, payload);
        setMessage({ type: 'success', text: 'ကျောင်းသား အချက်အလက် ပြင်ပြီးပါပြီ' });
      } else {
        await API.post('/students', payload);
        setMessage({ type: 'success', text: 'ကျောင်းသား ထည့်ပြီးပါပြီ' });
      }
      setShowModal(false);
      fetchStudents();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Error ဖြစ်ပွားပါတယ်' });
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`"${name}" ကို ဖျက်မှာ သေချာလား?`)) return;
    try {
      await API.delete(`/students/${id}`);
      setMessage({ type: 'success', text: 'ကျောင်းသား ဖျက်ပြီးပါပြီ' });
      fetchStudents();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Error ဖြစ်ပွားပါတယ်' });
    }
  };

  // ===== Custom Pairs =====
  const addCustomPair = () => setCustomPairs([...customPairs, { key: '', value: '' }]);
  const removeCustomPair = (i) => setCustomPairs(customPairs.filter((_, idx) => idx !== i));
  const updateCustomPair = (i, field, val) => {
    const updated = [...customPairs];
    updated[i][field] = val;
    setCustomPairs(updated);
  };

  // ===== CSV Template Download =====
  const downloadTemplate = () => {
    const headers = [
      'student_id', 'name', 'name_en', 'gender', 'date_of_birth',
      'grade', 'section', 'father_name', 'mother_name', 'phone',
      'email', 'blood_type', 'nrc', 'nationality', 'religion',
      'address', 'enrollment_date', 'status'
    ];
    const sampleRow = [
      'STU100', 'မောင်မောင်', 'Maung Maung', 'Male', '2015-05-15',
      'Grade 5', 'A', 'ဦးလှ', 'ဒေါ်မြင့်', '09123456789',
      'maung@email.com', 'O+', '12/ABC(N)123456', 'မြန်မာ', 'ဗုဒ္ဓ',
      'ရန်ကုန်မြို့', '2026-06-01', 'Active'
    ];
    const csvContent = [headers.join(','), sampleRow.join(',')].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ===== CSV Parse =====
  const parseCsvLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const handleCsvFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFileName(file.name);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result.replace(/^\uFEFF/, '');
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) {
          alert('CSV File မှာ Data မရှိပါ');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim());
        const rows = [];

        for (let i = 1; i < lines.length; i++) {
          const values = parseCsvLine(lines[i]);
          if (values.length === 0) continue;
          const obj = {};
          headers.forEach((h, idx) => {
            obj[h] = values[idx] ? values[idx].trim() : '';
          });
          if (obj.student_id || obj.name) rows.push(obj);
        }

        setCsvData(rows);
      } catch (err) {
        alert('CSV ဖတ်လို့မရပါ: ' + err.message);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleImport = async () => {
    if (csvData.length === 0) return;
    setImporting(true);
    try {
      const res = await API.post('/students/bulk-import', { students: csvData });
      setImportResult(res.data.summary);
      setMessage({ type: 'success', text: res.data.message });
      fetchStudents();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Error' });
    } finally {
      setImporting(false);
    }
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setCsvData([]);
    setCsvFileName('');
    setImportResult(null);
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

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-3 justify-between items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="ကျောင်းသား ရှာဖွေရန်..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <button onClick={() => setShowImportModal(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg transition">
          <Upload className="w-5 h-5" /> CSV တင်သွင်း
        </button>
        <button onClick={handleAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg transition">
          <Plus className="w-5 h-5" /> ကျောင်းသား အသစ်
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading...</div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">ကျောင်းသား မရှိသေးပါ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold">ဓာတ်ပုံ</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">အမည်</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">အတန်း</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">ဖုန်း</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">အခြေအနေ</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold">လုပ်ဆောင်ချက်</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {s.photo ? (
                        <img src={s.photo} alt={s.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-gray-200" />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                          {s.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-blue-600">{s.student_id}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-800">{s.name}</p>
                      {s.name_en && <p className="text-xs text-gray-500">{s.name_en}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {s.grade}{s.section ? ` - ${s.section}` : ''}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{s.phone || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        s.status === 'Active' ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>{s.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleView(s)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg" title="ကြည့်">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleEdit(s)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="ပြင်">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(s.id, s.name)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="ဖျက်">
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

      {/* ===== CSV Import Modal ===== */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Upload className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">CSV မှ ကျောင်းသား တင်သွင်းရန်</h3>
                  <p className="text-xs text-gray-500">Excel/CSV File ကနေ တစ်ခါတည်း ထည့်ပါ</p>
                </div>
              </div>
              <button onClick={closeImportModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Step 1: Template */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-bold text-blue-800 mb-2 text-sm">📄 အဆင့် ၁: Template ရယူပါ</h4>
                <p className="text-xs text-blue-700 mb-3">
                  ဖောင်ပုံစံ CSV File ကို Download လုပ်ပြီး Excel မှာ ဖြည့်ပါ။
                </p>
                <button onClick={downloadTemplate}
                  className="flex items-center gap-2 bg-white hover:bg-gray-50 text-blue-700 border border-blue-300 px-4 py-2 rounded-lg text-sm font-medium">
                  <FileDown className="w-4 h-4" /> Template.csv Download
                </button>
              </div>

              {/* Step 2: Upload */}
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6">
                <h4 className="font-bold text-gray-800 mb-2 text-sm">📤 အဆင့် ၂: CSV File တင်ပါ</h4>
                <label className="cursor-pointer flex flex-col items-center gap-2 py-6">
                  <Upload className="w-10 h-10 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {csvFileName ? `📎 ${csvFileName}` : 'CSV File ရွေးရန် နှိပ်ပါ'}
                  </span>
                  <span className="text-xs text-gray-400">UTF-8 Encoding ဖြစ်ရပါမယ်</span>
                  <input type="file" accept=".csv" onChange={handleCsvFile} className="hidden" />
                </label>
              </div>

              {/* Step 3: Preview */}
              {csvData.length > 0 && (
                <div className="bg-white border rounded-lg overflow-hidden">
                  <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                    <h4 className="font-bold text-gray-800 text-sm">
                      👁️ အဆင့် ၃: Preview ({csvData.length} ယောက်)
                    </h4>
                    <span className="text-xs text-gray-500">စစ်ဆေးပြီးမှ သိမ်းပါ</span>
                  </div>
                  <div className="overflow-x-auto max-h-64">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="px-2 py-2 text-left">#</th>
                          <th className="px-2 py-2 text-left">ID</th>
                          <th className="px-2 py-2 text-left">အမည်</th>
                          <th className="px-2 py-2 text-left">အတန်း</th>
                          <th className="px-2 py-2 text-left">ဖုန်း</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {csvData.slice(0, 20).map((s, i) => (
                          <tr key={i} className={!s.student_id || !s.name ? 'bg-red-50' : ''}>
                            <td className="px-2 py-1.5 text-gray-500">{i + 1}</td>
                            <td className="px-2 py-1.5 font-mono">{s.student_id || '❌'}</td>
                            <td className="px-2 py-1.5">{s.name || '❌'}</td>
                            <td className="px-2 py-1.5">{s.grade} {s.section}</td>
                            <td className="px-2 py-1.5">{s.phone}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {csvData.length > 20 && (
                      <p className="text-center text-xs text-gray-500 py-2">
                        ... နောက်ထပ် {csvData.length - 20} ယောက်
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Result */}
              {importResult && (
                <div className={`rounded-lg p-4 border-2 ${
                  importResult.failed === 0 ? 'bg-green-50 border-green-300' : 'bg-yellow-50 border-yellow-300'
                }`}>
                  <h4 className="font-bold mb-2 text-sm">📊 ရလဒ်</h4>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div><span className="text-gray-500">အောင်မြင်:</span> <strong className="text-green-700">{importResult.success}</strong></div>
                    <div><span className="text-gray-500">ကျရှုံး:</span> <strong className="text-red-700">{importResult.failed}</strong></div>
                    <div><span className="text-gray-500">စုစုပေါင်း:</span> <strong>{importResult.success + importResult.failed}</strong></div>
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="mt-3 max-h-32 overflow-y-auto text-xs bg-white rounded p-2">
                      {importResult.errors.map((e, i) => (
                        <p key={i} className="text-red-600">• {e}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-5 border-t bg-gray-50 flex gap-3">
              <button onClick={closeImportModal}
                className="flex-1 px-4 py-2.5 border rounded-lg hover:bg-gray-100">
                ပိတ်
              </button>
              <button onClick={handleImport}
                disabled={csvData.length === 0 || importing}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-medium disabled:opacity-50">
                <Upload className="w-4 h-4" />
                {importing ? 'တင်သွင်းနေသည်...' : `${csvData.length} ယောက် တင်သွင်းရန်`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== View Modal ===== */}
      {showViewModal && viewStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold">ကျောင်းသား အချက်အလက်</h3>
              <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                {viewStudent.photo ? (
                  <img src={viewStudent.photo} alt={viewStudent.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-blue-100" />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-3xl">
                    {viewStudent.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{viewStudent.name}</h2>
                  {viewStudent.name_en && <p className="text-gray-500">{viewStudent.name_en}</p>}
                  <p className="text-sm font-mono text-blue-600 mt-1">{viewStudent.student_id}</p>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                    viewStudent.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>{viewStudent.status}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoSection title="👤 ကိုယ်ရေးအချက်အလက်" items={[
                  ['လိင်', viewStudent.gender],
                  ['မွေးသက္ကရာဇ်', viewStudent.date_of_birth],
                  ['သွေးအုပ်စု', viewStudent.blood_type],
                  ['နိုင်ငံသား', viewStudent.nationality],
                  ['ဘာသာ', viewStudent.religion],
                  ['မှတ်ပုံတင်', viewStudent.nrc],
                ]} />

                <InfoSection title="🎓 ပညာရေး" items={[
                  ['အတန်း', viewStudent.grade],
                  ['ခွဲ', viewStudent.section],
                  ['ကျောင်းဝင်ရက်', viewStudent.enrollment_date],
                  ['အရင် ကျောင်း', viewStudent.previous_school],
                ]} />

                <InfoSection title="📞 ဆက်သွယ်ရန်" items={[
                  ['ဖုန်း', viewStudent.phone],
                  ['Email', viewStudent.email],
                  ['လိပ်စာ', viewStudent.address],
                  ['အမြဲတမ်းလိပ်စာ', viewStudent.permanent_address],
                ]} />

                <InfoSection title="👨‍👩‍👧 မိဘ / အုပ်ထိန်းသူ" items={[
                  ['ဖခင်အမည်', viewStudent.father_name],
                  ['မိခင်အမည်', viewStudent.mother_name],
                  ['အုပ်ထိန်းသူ', viewStudent.parent_name],
                  ['အရေးပေါ်ဆက်သွယ်ရန်', viewStudent.emergency_name],
                  ['အရေးပေါ်ဖုန်း', viewStudent.emergency_phone],
                  ['တော်စပ်ပုံ', viewStudent.emergency_relation],
                ]} />

                {viewStudent.medical_notes && (
                  <div className="md:col-span-2">
                    <InfoSection title="🏥 ကျန်းမာရေး မှတ်ချက်" items={[
                      ['မှတ်ချက်', viewStudent.medical_notes],
                    ]} />
                  </div>
                )}

                {viewStudent.custom_fields && Object.keys(viewStudent.custom_fields).length > 0 && (
                  <div className="md:col-span-2">
                    <InfoSection title="➕ အပိုဆောင်း အချက်အလက်"
                      items={Object.entries(viewStudent.custom_fields)} />
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
                {editingStudent ? 'ကျောင်းသား ပြင်ရန်' : 'ကျောင်းသား အသစ် ထည့်ရန်'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex border-b bg-gray-50 px-6 overflow-x-auto">
                {[
                  { key: 'basic', label: '👤 အခြေခံ' },
                  { key: 'contact', label: '📞 ဆက်သွယ်ရန်' },
                  { key: 'guardian', label: '👨‍👩‍👧 မိဘ' },
                  { key: 'medical', label: '🏥 ကျန်းမာရေး' },
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
                      <Field label="Student ID" required>
                        <input type="text" name="student_id" value={formData.student_id}
                          onChange={handleChange} required placeholder="STU001"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                      </Field>
                      <Field label="အမည် (မြန်မာ)" required>
                        <input type="text" name="name" value={formData.name}
                          onChange={handleChange} required placeholder="မောင်မောင်"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                      </Field>
                      <Field label="အမည် (English)">
                        <input type="text" name="name_en" value={formData.name_en}
                          onChange={handleChange} placeholder="Maung Maung"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                      </Field>
                      <Field label="မွေးသက္ကရာဇ်">
                        <input type="date" name="date_of_birth" value={formData.date_of_birth}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                      </Field>
                      <Field label="လိင်">
                        <select name="gender" value={formData.gender} onChange={handleChange}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </Field>
                      <Field label="သွေးအုပ်စု">
                        <select name="blood_type" value={formData.blood_type} onChange={handleChange}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                          <option value="">-- ရွေးပါ --</option>
                          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b =>
                            <option key={b} value={b}>{b}</option>)}
                        </select>
                      </Field>
                      <Field label="အတန်း">
                        <input type="text" name="grade" value={formData.grade}
                          onChange={handleChange} placeholder="Grade 5"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                      </Field>
                      <Field label="ခွဲ">
                        <input type="text" name="section" value={formData.section}
                          onChange={handleChange} placeholder="A"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                      </Field>
                      <Field label="မှတ်ပုံတင်နံပါတ်">
                        <input type="text" name="nrc" value={formData.nrc}
                          onChange={handleChange} placeholder="12/ABC(N)123456"
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
                      <Field label="ကျောင်းဝင်ရက်">
                        <input type="date" name="enrollment_date" value={formData.enrollment_date}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                      </Field>
                      <Field label="အခြေအနေ">
                        <select name="status" value={formData.status} onChange={handleChange}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Graduated">Graduated</option>
                          <option value="Transferred">Transferred</option>
                        </select>
                      </Field>
                    </div>
                  </div>
                )}

                {activeTab === 'contact' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="ဖုန်း">
                      <input type="text" name="phone" value={formData.phone}
                        onChange={handleChange} placeholder="09xxxxxxxxx"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </Field>
                    <Field label="Email">
                      <input type="email" name="email" value={formData.email}
                        onChange={handleChange} placeholder="example@email.com"
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
                    <div className="md:col-span-2">
                      <Field label="အရင် တက်ခဲ့သော ကျောင်း">
                        <input type="text" name="previous_school" value={formData.previous_school}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                      </Field>
                    </div>
                  </div>
                )}

                {activeTab === 'guardian' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="ဖခင်အမည်">
                      <input type="text" name="father_name" value={formData.father_name}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </Field>
                    <Field label="မိခင်အမည်">
                      <input type="text" name="mother_name" value={formData.mother_name}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="အုပ်ထိန်းသူ အမည်">
                        <input type="text" name="parent_name" value={formData.parent_name}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                      </Field>
                    </div>

                    <div className="md:col-span-2 pt-4 border-t">
                      <h4 className="font-bold text-gray-700 mb-3">🚨 အရေးပေါ် ဆက်သွယ်ရန်</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            onChange={handleChange} placeholder="ဦးလေး / အဒေါ်"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        </Field>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'medical' && (
                  <Field label="ကျန်းမာရေး မှတ်ချက် / ဓာတ်မတည့်မှု">
                    <textarea name="medical_notes" value={formData.medical_notes}
                      onChange={handleChange} rows="6"
                      placeholder="ဥပမာ: မြေပဲ ဓာတ်မတည့်ပါ။ ပန်းနာ ရင်ကျပ်ရောဂါ ရှိပါသည်။"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </Field>
                )}

                {activeTab === 'custom' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-gray-800">➕ အပိုဆောင်း အချက်အလက်</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          လိုအပ်တဲ့ Field တွေ ထပ်ထည့်နိုင်ပါတယ် (ဥပမာ: ဝါသနာ, ထူးချွန်ဆု, မှတ်ချက်)
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
                        <p className="text-xs text-gray-400 mt-1">"Field ထပ်ထည့်" ကို နှိပ်ပြီး စတင်ပါ</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {customPairs.map((pair, i) => (
                          <div key={i} className="flex gap-3 items-start">
                            <input type="text" value={pair.key}
                              onChange={(e) => updateCustomPair(i, 'key', e.target.value)}
                              placeholder="Field အမည် (ဥပမာ: ဝါသနာ)"
                              className="w-1/3 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                            <input type="text" value={pair.value}
                              onChange={(e) => updateCustomPair(i, 'value', e.target.value)}
                              placeholder="တန်ဖိုး (ဥပမာ: ဘောလုံး)"
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
                  <Save className="w-4 h-4" /> {editingStudent ? 'ပြင်ရန်' : 'ထည့်ရန်'}
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