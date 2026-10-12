import { useState, useEffect } from 'react';
import { FileText, Plus, Edit, Trash2, X, Save, AlertCircle, CheckCircle, Award } from 'lucide-react';
import API from '../api/axios';

export default function Exams() {
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [currentExam, setCurrentExam] = useState(null);
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [message, setMessage] = useState(null);

  const emptyForm = {
    exam_name: '', exam_type: 'Monthly', class_id: '',
    subject: '', exam_date: '', total_marks: 100, pass_marks: 40, status: 'Scheduled'
  };
  const [formData, setFormData] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const [eRes, cRes] = await Promise.all([API.get('/exams'), API.get('/classes')]);
      setExams(eRes.data);
      setClasses(cRes.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = () => {
    setEditingExam(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const handleEdit = (e) => {
    setEditingExam(e);
    setFormData({
      exam_name: e.exam_name || '', exam_type: e.exam_type || 'Monthly',
      class_id: e.class_id || '', subject: e.subject || '',
      exam_date: e.exam_date || '', total_marks: e.total_marks || 100,
      pass_marks: e.pass_marks || 40, status: e.status || 'Scheduled'
    });
    setShowModal(true);
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    try {
      if (editingExam) {
        await API.put(`/exams/${editingExam.id}`, formData);
        setMessage({ type: 'success', text: 'စာမေးပွဲ ပြင်ပြီးပါပြီ' });
      } else {
        await API.post('/exams', formData);
        setMessage({ type: 'success', text: 'စာမေးပွဲ ထည့်ပြီးပါပြီ' });
      }
      setShowModal(false);
      load();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Error' });
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`"${name}" ကို ဖျက်မှာ သေချာလား?`)) return;
    try {
      await API.delete(`/exams/${id}`);
      setMessage({ type: 'success', text: 'ဖျက်ပြီးပါပြီ' });
      load();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Error' });
    }
  };

  const openResults = async (exam) => {
    setCurrentExam(exam);
    try {
      const [rRes, sRes] = await Promise.all([
        API.get(`/exams/${exam.id}/results`),
        API.get('/students?status=Active')
      ]);
      let filtered = sRes.data;
      const cls = classes.find(c => c.id === exam.class_id);
      if (cls) filtered = filtered.filter(s => s.grade === cls.grade && (!cls.section || s.section === cls.section));
      const map = {};
      rRes.data.forEach(r => { map[r.student_id] = r; });
      setResults(filtered.map(s => ({
        student_id: s.id, student_name: s.name, student_code: s.student_id,
        marks: map[s.id]?.marks ?? '', grade: map[s.id]?.grade ?? '', remarks: map[s.id]?.remarks ?? ''
      })));
      setShowResultModal(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const calcGrade = (marks, total, pass) => {
    const pct = (marks / total) * 100;
    if (marks < pass) return 'F';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B';
    if (pct >= 60) return 'C';
    if (pct >= 50) return 'D';
    return 'E';
  };

  const saveResults = async () => {
    const records = results
      .filter(r => r.marks !== '' && r.marks !== null)
      .map(r => ({
        student_id: r.student_id,
        marks: Number(r.marks),
        grade: calcGrade(Number(r.marks), currentExam.total_marks, currentExam.pass_marks),
        remarks: r.remarks
      }));
    try {
      await API.post(`/exams/${currentExam.id}/results`, { records });
      setMessage({ type: 'success', text: 'အမှတ်စာရင်း သိမ်းပြီးပါပြီ' });
      setShowResultModal(false);
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Error' });
    }
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

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-800">စာမေးပွဲများ</h2>
        <button onClick={handleAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg transition">
          <Plus className="w-5 h-5" /> စာမေးပွဲ အသစ်
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">Loading...</div>
      ) : exams.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">စာမေးပွဲ မရှိသေးပါ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map(e => (
            <div key={e.id} className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center text-white">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{e.exam_name}</h3>
                    <p className="text-xs text-gray-500">{e.subject} · {e.exam_type}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(e)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(e.id, e.exam_name)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                {e.class_name && <p>အတန်း: <span className="font-medium">{e.class_name}</span></p>}
                {e.exam_date && <p>ရက်စွဲ: {e.exam_date}</p>}
                <p>အမှတ်: {e.total_marks} · အောင်: {e.pass_marks}</p>
              </div>
              <button onClick={() => openResults(e)}
                className="mt-3 w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg transition text-sm">
                <Award className="w-4 h-4" /> အမှတ်စာရင်း ထည့်
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">{editingExam ? 'ပြင်ရန်' : 'စာမေးပွဲ အသစ်'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">စာမေးပွဲ အမည် *</label>
                <input type="text" name="exam_name" value={formData.exam_name} required
                  onChange={e => setFormData({ ...formData, exam_name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">အမျိုးအစား</label>
                <select value={formData.exam_type} onChange={e => setFormData({ ...formData, exam_type: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Monthly">Monthly</option>
                  <option value="Midterm">Midterm</option>
                  <option value="Final">Final</option>
                  <option value="Quiz">Quiz</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">အတန်း</label>
                <select value={formData.class_id} onChange={e => setFormData({ ...formData, class_id: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- ရွေးပါ --</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ဘာသာရပ်</label>
                <input type="text" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ရက်စွဲ</label>
                <input type="date" value={formData.exam_date} onChange={e => setFormData({ ...formData, exam_date: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">စုစုပေါင်းအမှတ်</label>
                <input type="number" value={formData.total_marks} onChange={e => setFormData({ ...formData, total_marks: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">အောင်အမှတ်</label>
                <input type="number" value={formData.pass_marks} onChange={e => setFormData({ ...formData, pass_marks: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">အခြေအနေ</label>
                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Scheduled">Scheduled</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="md:col-span-2 flex gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border rounded-lg hover:bg-gray-50">ပယ်ဖျက်</button>
                <button type="submit"
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg">
                  <Save className="w-4 h-4" /> {editingExam ? 'ပြင်ရန်' : 'ထည့်ရန်'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showResultModal && currentExam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
              <div>
                <h3 className="text-xl font-bold">{currentExam.exam_name}</h3>
                <p className="text-xs text-gray-500">စုစုပေါင်း: {currentExam.total_marks} · အောင်: {currentExam.pass_marks}</p>
              </div>
              <button onClick={() => setShowResultModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {results.length === 0 ? (
                <p className="text-center text-gray-500 py-8">ကျောင်းသား မရှိပါ</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold">ID</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold">အမည်</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold">အမှတ်</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold">အဆင့်</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold">မှတ်ချက်</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {results.map((r, i) => (
                        <tr key={r.student_id}>
                          <td className="px-3 py-2 text-xs font-mono text-blue-600">{r.student_code}</td>
                          <td className="px-3 py-2 text-sm">{r.student_name}</td>
                          <td className="px-3 py-2">
                            <input type="number" value={r.marks}
                              onChange={e => {
                                const v = e.target.value;
                                setResults(prev => prev.map((x, j) => j === i ? {
                                  ...x, marks: v,
                                  grade: v === '' ? '' : calcGrade(Number(v), currentExam.total_marks, currentExam.pass_marks)
                                } : x));
                              }}
                              className="w-20 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 outline-none" />
                          </td>
                          <td className="px-3 py-2 text-sm font-bold">
                            {r.grade && <span className={
                              r.grade === 'F' ? 'text-red-600' : r.grade === 'A' ? 'text-green-600' : 'text-blue-600'
                            }>{r.grade}</span>}
                          </td>
                          <td className="px-3 py-2">
                            <input type="text" value={r.remarks}
                              onChange={e => setResults(prev => prev.map((x, j) => j === i ? { ...x, remarks: e.target.value } : x))}
                              className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex gap-3 pt-4 mt-4 border-t">
                <button onClick={() => setShowResultModal(false)}
                  className="flex-1 px-4 py-2.5 border rounded-lg hover:bg-gray-50">ပိတ်</button>
                <button onClick={saveResults}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg">
                  <Save className="w-4 h-4" /> သိမ်းရန်
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}