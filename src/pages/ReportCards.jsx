import { useState, useEffect, useRef } from 'react';
import {
  FileText, Printer, User, Award, Calendar,
  Users, Settings as SettingsIcon, X, Save,
  CheckCircle, AlertCircle
} from 'lucide-react';
import API from '../api/axios';

export default function ReportCards() {
  const [activeTab, setActiveTab] = useState('single');
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [settings, setSettings] = useState({});
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [reportCard, setReportCard] = useState(null);
  const [classReports, setClassReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsForm, setSettingsForm] = useState({});
  const [schoolInfo, setSchoolInfo] = useState({});

  const printRef = useRef();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cRes, sRes, eRes, stRes, schRes] = await Promise.all([
        API.get('/classes'),
        API.get('/students?status=Active'),
        API.get('/reportcards/exams'),
        API.get('/reportcards/settings'),
        API.get('/settings')
      ]);
      setClasses(cRes.data);
      setStudents(sRes.data);
      setExams(eRes.data);
      setSettings(stRes.data);
      setSettingsForm(stRes.data);
      setSchoolInfo(schRes.data);
    } catch (e) { console.error(e); }
  };

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleGenerateSingle = async () => {
    if (!selectedStudent) return showMsg('error', 'ကျောင်းသား ရွေးပါ');
    setLoading(true);
    try {
      const url = selectedExam
        ? `/reportcards/student/${selectedStudent}?exam_id=${selectedExam}`
        : `/reportcards/student/${selectedStudent}`;
      const r = await API.get(url);
      setReportCard(r.data);
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
    setLoading(false);
  };

  const handleGenerateClass = async () => {
    if (!selectedClass) return showMsg('error', 'အတန်း ရွေးပါ');
    setLoading(true);
    try {
      const url = selectedExam
        ? `/reportcards/class/${selectedClass}?exam_id=${selectedExam}`
        : `/reportcards/class/${selectedClass}`;
      const r = await API.get(url);
      setClassReports(r.data.cards);
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveSettings = async () => {
    try {
      await API.put('/reportcards/settings', settingsForm);
      showMsg('success', 'Settings သိမ်းပြီးပါပြီ');
      setShowSettingsModal(false);
      loadData();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  const filteredStudents = selectedClass
    ? students.filter(s => {
        const cls = classes.find(c => String(c.id) === String(selectedClass));
        if (!cls) return false;
        return s.grade === cls.grade && (!cls.section || s.section === cls.section);
      })
    : students;

  const tabs = [
    { key: 'single', label: '📄 ကျောင်းသား တစ်ယောက်', icon: User },
    { key: 'class', label: '👥 အတန်းလိုက်', icon: Users },
  ];

  return (
    <div className="p-6">
      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg flex items-center gap-2 no-print ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden no-print">
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
          <div className="flex-1" />
          <button onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-2 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50">
            <SettingsIcon className="w-4 h-4" /> Settings
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-center no-print">
        {activeTab === 'single' && (
          <>
            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
              className="px-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]">
              <option value="">အတန်း အားလုံး</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
            </select>
            <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}
              className="px-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 min-w-[250px]">
              <option value="">-- ကျောင်းသား ရွေးပါ --</option>
              {filteredStudents.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.student_id}) - {s.grade}</option>
              ))}
            </select>
          </>
        )}

        {activeTab === 'class' && (
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
            className="px-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 min-w-[250px]">
            <option value="">-- အတန်း ရွေးပါ --</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
          </select>
        )}

        <select value={selectedExam} onChange={e => setSelectedExam(e.target.value)}
          className="px-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 min-w-[250px]">
          <option value="">စာမေးပွဲ အားလုံး</option>
          {exams.map(e => (
            <option key={e.id} value={e.id}>
              {e.exam_name} {e.class_name ? `- ${e.class_name}` : ''} {e.exam_date ? `(${e.exam_date})` : ''}
            </option>
          ))}
        </select>

        <div className="flex-1" />

        {activeTab === 'single' && (
          <button onClick={handleGenerateSingle} disabled={!selectedStudent || loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg disabled:opacity-50">
            <FileText className="w-5 h-5" /> Generate
          </button>
        )}
        {activeTab === 'class' && (
          <button onClick={handleGenerateClass} disabled={!selectedClass || loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg disabled:opacity-50">
            <Users className="w-5 h-5" /> Generate Class
          </button>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg mb-6 text-sm no-print">
        💡 <strong>Print</strong> ကို နှိပ်ပြီး Browser ရဲ့ Print Dialog မှာ <strong>"Save as PDF"</strong> ရွေးပြီး 
        PDF ဖိုင် သိမ်းလို့ရပါတယ်။
      </div>

      {activeTab === 'single' && reportCard && (
        <div className="bg-white rounded-xl shadow-sm p-8" ref={printRef}>
          <ReportCardView data={reportCard} settings={settings} schoolInfo={schoolInfo} />
          <div className="mt-6 flex justify-end no-print">
            <button onClick={handlePrint}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg">
              <Printer className="w-5 h-5" /> Print / Save as PDF
            </button>
          </div>
        </div>
      )}

      {activeTab === 'class' && classReports.length > 0 && (
        <div className="space-y-6">
          <div className="flex justify-end no-print">
            <button onClick={handlePrint}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg">
              <Printer className="w-5 h-5" /> Print All ({classReports.length})
            </button>
          </div>
          <div ref={printRef} className="space-y-6 print-area">
            {classReports.map((rc, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-8 print-page">
                <ReportCardView data={rc} settings={settings} schoolInfo={schoolInfo} />
              </div>
            ))}
          </div>
        </div>
      )}

      {!reportCard && classReports.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-16 text-center no-print">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Report Card ထုတ်ယူရန် ကျောင်းသား (သို့) အတန်း ရွေးပါ</p>
        </div>
      )}

      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">⚙️ Report Card Settings</h3>
              <button onClick={() => setShowSettingsModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <Field label="Report Card ခေါင်းစဉ်">
                <input type="text" value={settingsForm.report_card_header || ''}
                  onChange={e => setSettingsForm({ ...settingsForm, report_card_header: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </Field>
              <Field label="Class Teacher Label">
                <input type="text" value={settingsForm.report_card_teacher_remarks_label || ''}
                  onChange={e => setSettingsForm({ ...settingsForm, report_card_teacher_remarks_label: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </Field>
              <Field label="Principal Label">
                <input type="text" value={settingsForm.report_card_principal_remarks_label || ''}
                  onChange={e => setSettingsForm({ ...settingsForm, report_card_principal_remarks_label: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </Field>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox"
                    checked={settingsForm.report_card_show_position === '1'}
                    onChange={e => setSettingsForm({ ...settingsForm, report_card_show_position: e.target.checked ? '1' : '0' })}
                    className="w-4 h-4" />
                  <span className="text-sm">Position ပြရန်</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox"
                    checked={settingsForm.report_card_show_attendance === '1'}
                    onChange={e => setSettingsForm({ ...settingsForm, report_card_show_attendance: e.target.checked ? '1' : '0' })}
                    className="w-4 h-4" />
                  <span className="text-sm">Attendance ပြရန်</span>
                </label>
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <button onClick={() => setShowSettingsModal(false)}
                  className="flex-1 px-4 py-2.5 border rounded-lg hover:bg-gray-50">ပယ်ဖျက်</button>
                <button onClick={handleSaveSettings}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium">
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

function ReportCardView({ data, settings, schoolInfo }) {
  const { student, attendance, results, summary } = data;
  const attendancePct = attendance.total > 0
    ? ((attendance.present / attendance.total) * 100).toFixed(1) : '0';

  const gradeColor = (g) => {
    if (g === 'A') return 'text-green-600';
    if (g === 'B') return 'text-blue-600';
    if (g === 'C') return 'text-cyan-600';
    if (g === 'D') return 'text-yellow-600';
    if (g === 'E') return 'text-orange-600';
    if (g === 'F') return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="report-card">
      <div className="border-b-2 border-gray-800 pb-4 mb-6 text-center">
        {schoolInfo.school_logo && (
          <img src={schoolInfo.school_logo} alt="Logo"
            className="w-20 h-20 mx-auto mb-3 object-contain" />
        )}
        <h1 className="text-2xl font-bold text-gray-900">
          {schoolInfo.school_name || 'Maw Goon Thit School'}
        </h1>
        {schoolInfo.school_name_en && (
          <p className="text-sm text-gray-600">{schoolInfo.school_name_en}</p>
        )}
        {schoolInfo.school_address && (
          <p className="text-xs text-gray-500 mt-1">{schoolInfo.school_address}</p>
        )}
        <h2 className="text-lg font-bold text-blue-800 mt-4 pb-2 border-b-2 border-blue-800 inline-block px-6">
          {settings.report_card_header || 'Student Report Card'}
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <InfoBox label="ကျောင်းသား အမည်" value={student.name} />
        <InfoBox label="Student ID" value={student.student_id} mono />
        <InfoBox label="အတန်း" value={`${student.grade} ${student.section || ''}`} />
        <InfoBox label="မွေးသက္ကရာဇ်" value={student.date_of_birth || '-'} />
        {student.father_name && <InfoBox label="ဖခင်အမည်" value={student.father_name} />}
        {student.mother_name && <InfoBox label="မိခင်အမည်" value={student.mother_name} />}
        <InfoBox label="ခုနှစ်" value={schoolInfo.academic_year || '2026-2027'} />
        <InfoBox label="ရက်စွဲ" value={new Date().toLocaleDateString('en-GB')} />
      </div>

      <div className="mb-6">
        <h3 className="font-bold text-gray-800 mb-2 border-b-2 border-gray-400 pb-1">
          📊 ဘာသာရပ် အမှတ်စာရင်း
        </h3>
        {results.length === 0 ? (
          <p className="text-center text-gray-400 py-4">အမှတ် Data မရှိပါ</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 px-3 py-2 text-left text-sm">#</th>
                <th className="border border-gray-400 px-3 py-2 text-left text-sm">ဘာသာရပ်</th>
                <th className="border border-gray-400 px-3 py-2 text-center text-sm">ရမှတ်</th>
                <th className="border border-gray-400 px-3 py-2 text-center text-sm">စုစုပေါင်း</th>
                <th className="border border-gray-400 px-3 py-2 text-center text-sm">ရာခိုင်နှုန်း</th>
                <th className="border border-gray-400 px-3 py-2 text-center text-sm">Grade</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={r.id} className="even:bg-gray-50">
                  <td className="border border-gray-400 px-3 py-2 text-sm">{i + 1}</td>
                  <td className="border border-gray-400 px-3 py-2 text-sm font-medium">
                    {r.subject || r.exam_name}
                  </td>
                  <td className="border border-gray-400 px-3 py-2 text-center text-sm font-bold">
                    {r.marks}
                  </td>
                  <td className="border border-gray-400 px-3 py-2 text-center text-sm">
                    {r.total_marks}
                  </td>
                  <td className="border border-gray-400 px-3 py-2 text-center text-sm">
                    {r.percentage}%
                  </td>
                  <td className={`border border-gray-400 px-3 py-2 text-center text-sm font-bold ${gradeColor(r.grade)}`}>
                    {r.grade}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-xs text-blue-700 mb-1">စုစုပေါင်း ရမှတ်</p>
          <p className="text-2xl font-bold text-blue-800">
            {summary.total_obtained} / {summary.total_max}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-xs text-green-700 mb-1">ရာခိုင်နှုန်း</p>
          <p className="text-2xl font-bold text-green-800">{summary.percentage}%</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <p className="text-xs text-purple-700 mb-1">အဆင့် (Grade)</p>
          <p className={`text-2xl font-bold ${gradeColor(summary.overall_grade)}`}>
            {summary.overall_grade}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {settings.report_card_show_position === '1' && summary.position && (
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <p className="text-xs text-yellow-700 mb-1 flex items-center gap-1">
              <Award className="w-3 h-3" /> အတန်းအဆင့်
            </p>
            <p className="text-xl font-bold text-yellow-800">
              အဆင့် {summary.position} / {summary.total_students} ယောက်
            </p>
          </div>
        )}

        {settings.report_card_show_attendance === '1' && (
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <p className="text-xs text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> တက်ရောက်မှု
            </p>
            <p className="text-xl font-bold text-slate-800">{attendancePct}%</p>
            <p className="text-xs text-gray-500 mt-1">
              လာ: {attendance.present} · မလာ: {attendance.absent} · နောက်ကျ: {attendance.late}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-6 border-t border-gray-300">
        <div>
          <p className="text-xs text-gray-600 mb-1">
            {settings.report_card_teacher_remarks_label || 'Class Teacher'}
          </p>
          <div className="border-b border-gray-400 mt-8 pt-1">
            <p className="text-xs text-gray-400 text-center">လက်မှတ် / အမည်</p>
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">
            {settings.report_card_principal_remarks_label || 'Principal'}
          </p>
          <div className="border-b border-gray-400 mt-8 pt-1">
            <p className="text-xs text-gray-400 text-center">လက်မှတ် / အမည်</p>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 mt-6 pt-4 border-t border-gray-200">
        Generated by MGT School Management System · {new Date().toLocaleString()}
      </p>
    </div>
  );
}

function InfoBox({ label, value, mono }) {
  return (
    <div className="border border-gray-300 rounded p-2">
      <p className="text-[10px] text-gray-500 mb-0.5">{label}</p>
      <p className={`text-sm font-medium text-gray-800 ${mono ? 'font-mono' : ''}`}>{value || '-'}</p>
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