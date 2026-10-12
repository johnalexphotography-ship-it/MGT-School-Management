import { useState, useEffect } from 'react';
import {
  FileText, Users, GraduationCap, BookOpen, Award,
  DollarSign, Calendar, Printer, Filter
} from 'lucide-react';
import API from '../api/axios';

export default function Reports() {
  const [reportType, setReportType] = useState('students');
  const [data, setData] = useState([]);
  const [classes, setClasses] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    class_id: '',
    status: 'Active',
    date: new Date().toISOString().split('T')[0],
    month: '',
    year: new Date().getFullYear().toString(),
  });

  useEffect(() => {
    API.get('/settings').then(r => setSettings(r.data)).catch(console.error);
    API.get('/classes').then(r => setClasses(r.data)).catch(console.error);
  }, []);

  useEffect(() => { loadReport(); }, [reportType]);

  const loadReport = async () => {
    setLoading(true);
    try {
      let url = '';
      switch (reportType) {
        case 'students': url = '/students' + (filters.status ? `?status=${filters.status}` : ''); break;
        case 'teachers': url = '/teachers'; break;
        case 'classes': url = '/classes'; break;
        case 'attendance': url = `/attendance?date=${filters.date}`; break;
        case 'exams': url = '/exams'; break;
        case 'fees': url = '/fees' + (filters.status ? `?status=${filters.status}` : ''); break;
        default: url = '/students';
      }
      const res = await API.get(url);
      setData(res.data);
    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();
  const fmt = (n) => new Intl.NumberFormat('en-US').format(n || 0);

  const reportTypes = [
    { key: 'students', label: 'ကျောင်းသား စာရင်း', icon: Users, color: 'bg-blue-500' },
    { key: 'teachers', label: 'ဆရာ/ဆရာမ စာရင်း', icon: GraduationCap, color: 'bg-green-500' },
    { key: 'classes', label: 'အတန်း စာရင်း', icon: BookOpen, color: 'bg-purple-500' },
    { key: 'attendance', label: 'တက်ရောက်မှု စာရင်း', icon: Calendar, color: 'bg-orange-500' },
    { key: 'exams', label: 'စာမေးပွဲ စာရင်း', icon: Award, color: 'bg-red-500' },
    { key: 'fees', label: 'ကျောင်းလခ စာရင်း', icon: DollarSign, color: 'bg-teal-500' },
  ];

  const today = new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  });

  return (
    <div className="p-6">
      <div className="no-print">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-800">Report အမျိုးအစား ရွေးပါ</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {reportTypes.map(rt => {
              const Icon = rt.icon;
              const isActive = reportType === rt.key;
              return (
                <button key={rt.key} onClick={() => setReportType(rt.key)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition ${
                    isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}>
                  <div className={`${rt.color} w-10 h-10 rounded-lg flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className={`text-xs text-center ${isActive ? 'font-bold text-blue-700' : 'text-gray-600'}`}>
                    {rt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-end">
          {(reportType === 'students' || reportType === 'fees') && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">အခြေအနေ</label>
              <select value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                {reportType === 'students' ? (
                  <>
                    <option value="">အားလုံး</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Graduated">Graduated</option>
                  </>
                ) : (
                  <>
                    <option value="">အားလုံး</option>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
                  </>
                )}
              </select>
            </div>
          )}

          {reportType === 'attendance' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">ရက်စွဲ</label>
              <input type="date" value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          )}

          <button onClick={loadReport}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg">
            <Filter className="w-4 h-4" /> Filter လုပ်ရန်
          </button>

          <div className="flex-1" />

          <button onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg">
            <Printer className="w-5 h-5" /> Print / Save as PDF
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6 text-sm">
          💡 <strong>Print / Save as PDF</strong> ကို နှိပ်ပြီး Browser ရဲ့ Print Dialog မှာ 
          <strong> "Save as PDF"</strong> ကို ရွေးပြီး PDF ဖိုင် သိမ်းလို့ရပါတယ်။
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 print-area">
        <div className="border-b-2 border-gray-800 pb-4 mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {settings.school_name || 'Maw Goon Thit School'}
          </h1>
          {settings.school_address && (
            <p className="text-sm text-gray-600 mt-1">{settings.school_address}</p>
          )}
          <div className="flex justify-center gap-4 text-xs text-gray-600 mt-1">
            {settings.school_phone && <span>☎ {settings.school_phone}</span>}
            {settings.school_email && <span>✉ {settings.school_email}</span>}
          </div>
          <h2 className="text-lg font-bold text-gray-800 mt-4">
            {reportTypes.find(r => r.key === reportType)?.label}
          </h2>
          <div className="flex justify-center gap-6 text-xs text-gray-600 mt-2">
            <span>Report Date: {today}</span>
            {reportType === 'attendance' && <span>Date: {filters.date}</span>}
            <span>Total Records: {data.length}</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Data မရှိပါ</div>
        ) : (
          <>
            {reportType === 'students' && <StudentsReport data={data} />}
            {reportType === 'teachers' && <TeachersReport data={data} />}
            {reportType === 'classes' && <ClassesReport data={data} />}
            {reportType === 'attendance' && <AttendanceReport data={data} />}
            {reportType === 'exams' && <ExamsReport data={data} />}
            {reportType === 'fees' && <FeesReport data={data} fmt={fmt} />}
          </>
        )}

        <div className="mt-12 pt-6 border-t border-gray-300 grid grid-cols-2 gap-8 text-sm">
          <div>
            <p className="mb-12">ရေးဆွဲသူ ..........................</p>
            <p className="text-gray-600 border-t border-gray-400 pt-1">
              {settings.principal_name || 'ကျောင်းအုပ်'}
            </p>
          </div>
          <div className="text-right">
            <p className="mb-12">အတည်ပြုသူ ..........................</p>
            <p className="text-gray-600 border-t border-gray-400 pt-1 inline-block">ကျောင်းအုပ်</p>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-400">
          Generated by MGT School Management System · {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
}

function ReportTable({ headers, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-400 px-3 py-2 text-left">#</th>
            {headers.map((h, i) => <th key={i} className="border border-gray-400 px-3 py-2 text-left">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="even:bg-gray-50">
              <td className="border border-gray-400 px-3 py-2 text-gray-500">{i + 1}</td>
              {row.map((cell, j) => <td key={j} className="border border-gray-400 px-3 py-2">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StudentsReport({ data }) {
  const rows = data.map(s => [
    s.student_id, s.name, s.gender || '-',
    `${s.grade || ''}${s.section ? ' - ' + s.section : ''}`,
    s.parent_name || '-', s.phone || '-', s.status,
  ]);
  return <ReportTable headers={['ID', 'အမည်', 'လိင်', 'အတန်း', 'မိဘ', 'ဖုန်း', 'အခြေအနေ']} rows={rows} />;
}

function TeachersReport({ data }) {
  const rows = data.map(t => [
    t.teacher_id, t.name, t.subject || '-', t.qualification || '-',
    t.phone || '-', t.salary ? new Intl.NumberFormat('en-US').format(t.salary) : '-', t.status,
  ]);
  return <ReportTable headers={['ID', 'အမည်', 'ဘာသာ', 'ပညာအရည်', 'ဖုန်း', 'လစာ', 'အခြေအနေ']} rows={rows} />;
}

function ClassesReport({ data }) {
  const rows = data.map(c => [
    c.class_name, c.grade, c.section || '-', c.teacher_name || '-',
    c.room || '-', c.capacity || '-', c.academic_year || '-', c.status,
  ]);
  return <ReportTable headers={['အတန်း', 'Grade', 'Section', 'ဆရာ/ဆရာမ', 'အခန်း', 'ဦးရေ', 'ပညာသင်နှစ်', 'အခြေအနေ']} rows={rows} />;
}

function AttendanceReport({ data }) {
  const rows = data.map(a => [
    a.student_code || '-', a.student_name || '-', a.class_name || '-', a.date,
    a.status === 'Present' ? 'လာ' : a.status === 'Absent' ? 'မလာ' : a.status === 'Late' ? 'နောက်ကျ' : 'ခွင့်',
    a.remarks || '-',
  ]);
  return <ReportTable headers={['ID', 'ကျောင်းသား', 'အတန်း', 'ရက်စွဲ', 'အခြေအနေ', 'မှတ်ချက်']} rows={rows} />;
}

function ExamsReport({ data }) {
  const rows = data.map(e => [
    e.exam_name, e.exam_type || '-', e.class_name || '-', e.subject || '-',
    e.exam_date || '-', `${e.total_marks} / ${e.pass_marks}`, e.status,
  ]);
  return <ReportTable headers={['စာမေးပွဲ', 'အမျိုးအစား', 'အတန်း', 'ဘာသာ', 'ရက်စွဲ', 'အမှတ် (စုစုပေါင်း/အောင်)', 'အခြေအနေ']} rows={rows} />;
}

function FeesReport({ data, fmt }) {
  const rows = data.map(f => [
    f.student_code || '-', f.student_name || '-', f.fee_type,
    `${fmt(f.amount)} ကျပ်`,
    `${f.month || ''} ${f.year || ''}`.trim() || '-',
    f.due_date || '-', f.status,
  ]);
  const total = data.reduce((sum, f) => sum + (f.amount || 0), 0);
  const paid = data.filter(f => f.status === 'Paid').reduce((s, f) => s + (f.amount || 0), 0);
  return (
    <>
      <ReportTable headers={['ID', 'ကျောင်းသား', 'အမျိုးအစား', 'ပမာဏ', 'ကာလ', 'Due Date', 'အခြေအနေ']} rows={rows} />
      <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
        <div className="border border-gray-400 p-3 bg-gray-50">
          <p className="text-gray-600 text-xs">စုစုပေါင်း</p>
          <p className="font-bold text-gray-800 text-lg">{fmt(total)} ကျပ်</p>
        </div>
        <div className="border border-gray-400 p-3 bg-green-50">
          <p className="text-green-700 text-xs">ကောက်ခံရပြီး</p>
          <p className="font-bold text-green-700 text-lg">{fmt(paid)} ကျပ်</p>
        </div>
        <div className="border border-gray-400 p-3 bg-red-50">
          <p className="text-red-700 text-xs">ကျန်ရှိ</p>
          <p className="font-bold text-red-700 text-lg">{fmt(total - paid)} ကျပ်</p>
        </div>
      </div>
    </>
  );
}