import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Users, GraduationCap, BookOpen, Calendar, 
  DollarSign, TrendingUp, Award, Clock,
  CheckCircle, XCircle, AlertCircle, ArrowRight
} from 'lucide-react';
import API from '../api/axios';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await API.get('/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) => new Intl.NumberFormat('en-US').format(n || 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Dashboard Data ရယူလို့ မရပါ။ Server ကို စစ်ဆေးပါ။
        </div>
      </div>
    );
  }

  const mainStats = [
    {
      label: 'ကျောင်းသား',
      value: fmt(stats.students.total),
      sub: `Active: ${stats.students.active}`,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      link: '/students',
    },
    {
      label: 'ဆရာ/ဆရာမ',
      value: fmt(stats.teachers.total),
      sub: `Active: ${stats.teachers.active}`,
      icon: GraduationCap,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      link: '/teachers',
    },
    {
      label: 'အတန်း',
      value: fmt(stats.classes.total),
      sub: `Active: ${stats.classes.active}`,
      icon: BookOpen,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      link: '/classes',
    },
    {
      label: 'ယနေ့ တက်ရောက်မှု',
      value: `${stats.attendance.rate}%`,
      sub: `လာ: ${stats.attendance.present} / စုစုပေါင်း: ${stats.attendance.total}`,
      icon: Calendar,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      link: '/attendance',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-1">
          🎓 မင်္ဂလာပါ, {user?.username}!
        </h1>
        <p className="text-blue-100 text-sm">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
          })}
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainStats.map((stat, i) => (
          <Link
            key={i}
            to={stat.link}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition" />
            </div>
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
          </Link>
        ))}
      </div>

      {/* Secondary Row: Attendance Detail + Fees */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Breakdown */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">ယနေ့ တက်ရောက်မှု အသေးစိတ်</h3>
            <span className="text-xs text-gray-500">{stats.attendance.date}</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">လာရောက်</span>
              </div>
              <span className="text-lg font-bold text-green-600">{stats.attendance.present}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium text-gray-700">မလာရောက်</span>
              </div>
              <span className="text-lg font-bold text-red-600">{stats.attendance.absent}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-600" />
                <span className="text-sm font-medium text-gray-700">နောက်ကျ</span>
              </div>
              <span className="text-lg font-bold text-yellow-600">{stats.attendance.late}</span>
            </div>
          </div>
        </div>

        {/* Fees Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">ကျောင်းလခ အခြေအနေ</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">စုစုပေါင်း</span>
              <span className="text-lg font-bold text-gray-800">{fmt(stats.fees.total)} ကျပ်</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">ကောက်ခံရပြီး</span>
              <span className="text-lg font-bold text-green-600">{fmt(stats.fees.paid)} ကျပ်</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">ကျန်ရှိ</span>
              <span className="text-lg font-bold text-red-600">{fmt(stats.fees.pending)} ကျပ်</span>
            </div>
            {/* Progress bar */}
            {stats.fees.total > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>ကောက်ခံမှု ရာခိုင်နှုန်း</span>
                  <span>{Math.round((stats.fees.paid / stats.fees.total) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.round((stats.fees.paid / stats.fees.total) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Third Row: Gender + Grade Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">ကျောင်းသား လိင် အချိုး</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 mb-1">ကျား</p>
              <p className="text-3xl font-bold text-blue-700">{stats.students.male}</p>
            </div>
            <div className="text-center p-4 bg-pink-50 rounded-lg">
              <p className="text-sm text-pink-600 mb-1">မ</p>
              <p className="text-3xl font-bold text-pink-700">{stats.students.female}</p>
            </div>
          </div>
        </div>

        {/* Grade Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">အတန်းအလိုက် ကျောင်းသား</h3>
          {stats.gradeDistribution.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Data မရှိသေးပါ</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {stats.gradeDistribution.map((g, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-20 shrink-0">{g.grade}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full rounded-full flex items-center justify-end pr-2 transition-all"
                      style={{ 
                        width: `${Math.max((g.count / stats.students.total) * 100, 15)}%` 
                      }}
                    >
                      <span className="text-xs font-bold text-white">{g.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fourth Row: Recent Students + Upcoming Exams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Students */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">အသစ်ထည့်ထားသော ကျောင်းသား</h3>
            <Link to="/students" className="text-xs text-blue-600 hover:underline">
              အားလုံး ကြည့်ရန် →
            </Link>
          </div>
          {stats.recentStudents.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">ကျောင်းသား မရှိသေးပါ</p>
          ) : (
            <div className="space-y-3">
              {stats.recentStudents.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    {s.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{s.name}</p>
                    <p className="text-xs text-gray-500 font-mono">{s.student_id}</p>
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">
                    {s.grade}{s.section ? ` - ${s.section}` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Exams */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">လာမည့် စာမေးပွဲများ</h3>
            <Link to="/exams" className="text-xs text-blue-600 hover:underline">
              အားလုံး ကြည့်ရန် →
            </Link>
          </div>
          {stats.upcomingExams.length === 0 ? (
            <div className="text-center py-4">
              <Award className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">လာမည့် စာမေးပွဲ မရှိပါ</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.upcomingExams.map((e) => (
                <div key={e.id} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{e.exam_name}</p>
                    <p className="text-xs text-gray-500">
                      {e.subject} · {e.class_name || 'N/A'}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-orange-600 shrink-0">
                    {e.exam_date}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}