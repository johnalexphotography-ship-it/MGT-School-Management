import { useState, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, Clock, Save, AlertCircle, CalendarCheck, Trash2, X } from 'lucide-react';
import API from '../api/axios';

export default function Attendance() {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [stats, setStats] = useState(null);

  // Month marking state
  const [showMonthModal, setShowMonthModal] = useState(false);
  const [monthForm, setMonthForm] = useState({
    class_id: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear().toString(),
    days_type: 'weekdays',
  });
  const [monthSummary, setMonthSummary] = useState(null);

  useEffect(() => {
    API.get('/classes').then(r => setClasses(r.data)).catch(console.error);
    loadStats();
  }, []);

  useEffect(() => {
    loadAttendance();
  }, [date, classId]);

  const loadStats = async () => {
    try {
      const r = await API.get('/attendance/stats');
      setStats(r.data);
    } catch (e) { console.error(e); }
  };

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const sRes = await API.get('/students?status=Active');
      let filtered = sRes.data;
      if (classId) {
        const cls = classes.find(c => String(c.id) === String(classId));
        if (cls) filtered = filtered.filter(s => s.grade === cls.grade && (!cls.section || s.section === cls.section));
      }
      setStudents(filtered);

      const aRes = await API.get(`/attendance?date=${date}${classId ? `&class_id=${classId}` : ''}`);
      const map = {};
      aRes.data.forEach(a => { map[a.student_id] = a.status; });
      setAttendance(map);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const setStatus = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status) => {
    const map = {};
    students.forEach(s => { map[s.id] = status; });
    setAttendance(map);
  };

  const handleSave = async () => {
    if (students.length === 0) return setMessage({ type: 'error', text: 'ကျောင်းသား မရှိပါ' });
    const records = students.map(s => ({
      student_id: s.id,
      status: attendance[s.id] || 'Absent',
      remarks: ''
    }));
    try {
      await API.post('/attendance/bulk', { date, class_id: classId || null, records });
      setMessage({ type: 'success', text: `${records.length} ယောက် တက်ရောက်မှု မှတ်ပြီးပါပြီ` });
      loadStats();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Error' });
    }
  };

  // ===== Mark Month Handler =====
  const handleMarkMonth = async () => {
    if (!confirm(`ဒီလအတွက် ကျောင်းသား အားလုံးကို "လာရောက်" အဖြစ် ဖြည့်စွက်မှာ သေချာလား?\n\n(မှတ်တမ်း ရှိပြီးသား ရက်တွေ မထိပါဘူး)`)) return;

    try {
      const res = await API.post('/attendance/mark-month', monthForm);
      setMonthSummary(res.data.summary);
      setMessage({ type: 'success', text: res.data.message });
      loadStats();
      loadAttendance();
      setTimeout(() => setMessage(null), 5000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Error' });
    }
  };

  const statusColors = {
    Present: 'bg-green-500 text-white',
    Absent: 'bg-red-500 text-white',
    Late: 'bg-yellow-500 text-white',
    Leave: 'bg-blue-500 text-white'
  };

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

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

      {monthSummary && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-bold text-blue-800 mb-2">📊 Month Fill Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">ကျောင်းသား:</span> <strong>{monthSummary.students}</strong></div>
            <div><span className="text-gray-500">ရက်:</span> <strong>{monthSummary.dates}</strong></div>
            <div><span className="text-green-600">✅ အသစ်ထည့်:</span> <strong>{monthSummary.created}</strong></div>
            <div><span className="text-gray-600">⏭️ ကျော်:</span> <strong>{monthSummary.skipped}</strong></div>
          </div>
          <button onClick={() => setMonthSummary(null)}
            className="mt-2 text-xs text-blue-600 hover:underline">ပိတ်ရန်</button>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-500">ယနေ့ စုစုပေါင်း</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-500">လာရောက်</p>
            <p className="text-2xl font-bold text-green-600">{stats.present}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-500">မလာ</p>
            <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-gray-500">နောက်ကျ</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div>
          <label className="block text-xs text-gray-500 mb-1">ရက်စွဲ</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">အတန်း</label>
          <select value={classId} onChange={(e) => setClassId(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">အားလုံး</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
          </select>
        </div>
        <div className="flex-1" />

        <button onClick={() => setShowMonthModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition text-sm font-medium">
          <CalendarCheck className="w-4 h-4" />
          Mark Month as Present
        </button>
        <button onClick={() => markAll('Present')}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm">
          အားလုံး လာရောက် (ယနေ့)
        </button>
        <button onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
          <Save className="w-4 h-4" /> သိမ်း
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading...</div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">ကျောင်းသား မရှိပါ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">အမည်</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">အတန်း</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">အခြေအနေ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map(s => {
                  const current = attendance[s.id];
                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono text-blue-600">{s.student_id}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{s.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{s.grade} {s.section}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-1">
                          {['Present', 'Absent', 'Late', 'Leave'].map(st => (
                            <button key={st} onClick={() => setStatus(s.id, st)}
                              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                                current === st ? statusColors[st] : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}>
                              {st === 'Present' ? 'လာ' : st === 'Absent' ? 'မလာ' : st === 'Late' ? 'နောက်ကျ' : 'ခွင့်'}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== Month Mark Modal ===== */}
      {showMonthModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex justify-between items-center p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CalendarCheck className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Mark Month as Present</h3>
                  <p className="text-xs text-gray-500">တစ်လလုံး လာရောက်အဖြစ် ဖြည့်စွက်ခြင်း</p>
                </div>
              </div>
              <button onClick={() => setShowMonthModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-xs">
                ⚠️ <strong>သတိ:</strong> ဒီလုပ်ဆောင်ချက်က မှတ်တမ်း <strong>မရှိသေးတဲ့ ရက်များ</strong> ကိုသာ 
                "လာရောက်" အဖြစ် ဖြည့်ပေးပါမယ်။ မှတ်တမ်း ရှိပြီးသား ရက်တွေကို မထိပါဘူး။
                အနာဂတ်ရက်များ မှတ်မပေးပါ။
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">အတန်း</label>
                  <select value={monthForm.class_id}
                    onChange={e => setMonthForm({ ...monthForm, class_id: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">အားလုံး</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">လ</label>
                  <select value={monthForm.month}
                    onChange={e => setMonthForm({ ...monthForm, month: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                    {monthNames.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">နှစ်</label>
                  <input type="text" value={monthForm.year}
                    onChange={e => setMonthForm({ ...monthForm, year: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ရက် အမျိုးအစား</label>
                  <select value={monthForm.days_type}
                    onChange={e => setMonthForm({ ...monthForm, days_type: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="weekdays">တနင်္လာ - သောကြာ</option>
                    <option value="mon-sat">တနင်္လာ - စနေ</option>
                    <option value="all">ရက်တိုင်း</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button onClick={() => setShowMonthModal(false)}
                  className="flex-1 px-4 py-2.5 border rounded-lg hover:bg-gray-50">ပယ်ဖျက်</button>
                <button onClick={handleMarkMonth}
                  className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg font-medium">
                  <CalendarCheck className="w-4 h-4" /> ဖြည့်စွက်ရန်
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}