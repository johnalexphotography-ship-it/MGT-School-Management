import { useState, useEffect } from 'react';
import {
  Users, Plus, Edit, Trash2, X, Save, Search, Shield,
  User as UserIcon, GraduationCap, BookOpen, Key, Ban,
  CheckCircle, AlertCircle, Link as LinkIcon, Upload,
  UserPlus, Phone, Mail, Clock, ToggleLeft, ToggleRight
} from 'lucide-react';
import API from '../api/axios';

const ROLES = [
  { value: 'Admin', label: '👑 Admin', color: 'bg-red-100 text-red-700 border-red-300' },
  { value: 'Teacher', label: '👨‍🏫 ဆရာ/ဆရာမ', color: 'bg-green-100 text-green-700 border-green-300' },
  { value: 'Student', label: '👨‍🎓 ကျောင်းသား', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { value: 'Parent', label: '👪 မိဘ', color: 'bg-purple-100 text-purple-700 border-purple-300' },
];

const STATUSES = [
  { value: 'Active', label: '✅ Active', color: 'bg-green-100 text-green-700' },
  { value: 'Inactive', label: '🚫 Inactive', color: 'bg-gray-100 text-gray-600' },
];

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [message, setMessage] = useState(null);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [resetPassword, setResetPassword] = useState('');
  const [bulkForm, setBulkForm] = useState({ type: 'students', default_password: '123456' });

  const [formData, setFormData] = useState({
    username: '', password: '', role: 'Student', full_name: '',
    email: '', phone: '', linked_student_id: '', linked_teacher_id: '',
    avatar: '', status: 'Active'
  });

  // ===== Load =====
  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterRole) params.append('role', filterRole);
      if (filterStatus) params.append('status', filterStatus);

      const [uRes, stRes, sRes, tRes] = await Promise.all([
        API.get(`/users?${params}`),
        API.get('/users/stats'),
        API.get('/students?status=Active'),
        API.get('/teachers?status=Active')
      ]);
      setUsers(uRes.data);
      setStats(stRes.data);
      setStudents(sRes.data);
      setTeachers(tRes.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [search, filterRole, filterStatus]);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // ===== Add / Edit =====
  const handleAdd = () => {
    setEditing(null);
    setFormData({
      username: '', password: '', role: 'Student', full_name: '',
      email: '', phone: '', linked_student_id: '', linked_teacher_id: '',
      avatar: '', status: 'Active'
    });
    setShowModal(true);
  };

  const handleEdit = (u) => {
    setEditing(u);
    setFormData({
      username: u.username || '', password: '', role: u.role || 'Student',
      full_name: u.full_name || '', email: u.email || '', phone: u.phone || '',
      linked_student_id: u.linked_student_id || '',
      linked_teacher_id: u.linked_teacher_id || '',
      avatar: u.avatar || '', status: u.status || 'Active'
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500 * 1024) return alert('ပုံ 500KB အောက်သာ');
    const reader = new FileReader();
    reader.onloadend = () => setFormData(prev => ({ ...prev, avatar: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        const { password, ...data } = formData;
        await API.put(`/users/${editing.id}`, data);
        showMsg('success', 'User ပြင်ပြီးပါပြီ');
      } else {
        if (!formData.password || formData.password.length < 6) {
          return showMsg('error', 'Password အနည်းဆုံး ၆ လုံး ရှိရပါမယ်');
        }
        const r = await API.post('/users', formData);
        showMsg('success', `User ${formData.username} ဖန်တီးပြီးပါပြီ`);
      }
      setShowModal(false);
      load();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  const handleDelete = async (id, username) => {
    if (!confirm(`"${username}" ကို ဖျက်မှာ သေချာလား?`)) return;
    try {
      await API.delete(`/users/${id}`);
      showMsg('success', 'User ဖျက်ပြီးပါပြီ');
      load();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const r = await API.post(`/users/${id}/toggle-status`);
      showMsg('success', r.data.message);
      load();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  const openResetModal = (u) => {
    setResetUser(u);
    setResetPassword('');
    setShowResetModal(true);
  };

  const handleResetPassword = async () => {
    if (!resetPassword || resetPassword.length < 6) {
      return showMsg('error', 'Password အနည်းဆုံး ၆ လုံး');
    }
    try {
      await API.post(`/users/${resetUser.id}/reset-password`, { new_password: resetPassword });
      showMsg('success', 'Password ပြောင်းပြီးပါပြီ');
      setShowResetModal(false);
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  const handleBulkCreate = async () => {
    if (!confirm(`${bulkForm.type === 'students' ? 'ကျောင်းသား' : 'ဆရာ/ဆရာမ'} အားလုံးအတွက် Account ဖန်တီးမှာလား?`)) return;
    try {
      const r = await API.post('/users/bulk-create', bulkForm);
      showMsg('success', r.data.message);
      setShowBulkModal(false);
      load();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  // ===== Helpers =====
  const getRoleInfo = (r) => ROLES.find(x => x.value === r) || ROLES[2];
  const getStatusInfo = (s) => STATUSES.find(x => x.value === s) || STATUSES[0];

  const getLinkedInfo = (u) => {
    if (u.student_name) return `🎓 ${u.student_name} (${u.student_code})`;
    if (u.teacher_name) return `👨‍🏫 ${u.teacher_name} (${u.teacher_code})`;
    return null;
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

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          <StatCard icon={Users} label="စုစုပေါင်း" value={stats.total} color="bg-slate-100 text-slate-700" />
          <StatCard icon={Shield} label="Admin" value={stats.admins} color="bg-red-100 text-red-700" />
          <StatCard icon={GraduationCap} label="ဆရာ/ဆရာမ" value={stats.teachers} color="bg-green-100 text-green-700" />
          <StatCard icon={BookOpen} label="ကျောင်းသား" value={stats.students} color="bg-blue-100 text-blue-700" />
          <StatCard icon={UserIcon} label="မိဘ" value={stats.parents} color="bg-purple-100 text-purple-700" />
          <StatCard icon={CheckCircle} label="Active" value={stats.active} color="bg-emerald-100 text-emerald-700" />
          <StatCard icon={Ban} label="Inactive" value={stats.inactive} color="bg-gray-100 text-gray-600" />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Username / အမည် / Email ရှာရန်..."
            className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          className="px-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Role အားလုံး</option>
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Status အားလုံး</option>
          {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <div className="flex-1" />
        <button onClick={() => setShowBulkModal(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg">
          <UserPlus className="w-4 h-4" /> Bulk Create
        </button>
        <button onClick={handleAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg">
          <Plus className="w-5 h-5" /> User အသစ်
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">User မရှိပါ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold">Avatar</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">Username</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">အမည်</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">ချိတ်ဆက်</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold">Last Login</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold">လုပ်ဆောင်ချက်</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map(u => {
                  const roleInfo = getRoleInfo(u.role);
                  const statusInfo = getStatusInfo(u.status);
                  const linked = getLinkedInfo(u);
                  return (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.username}
                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200" />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {(u.full_name || u.username)?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-mono font-medium">{u.username}</p>
                        {u.email && <p className="text-xs text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3" />{u.email}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium">{u.full_name || '-'}</p>
                        {u.phone && <p className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" />{u.phone}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${roleInfo.color}`}>
                          {roleInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {linked || <span className="text-gray-400 text-xs">မချိတ်ဆက်ထား</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {u.last_login ? (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(u.last_login).toLocaleString('en-GB', {
                              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        ) : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button onClick={() => openResetModal(u)}
                          className="p-1.5 text-orange-600 hover:bg-orange-50 rounded" title="Password Reset">
                          <Key className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleToggleStatus(u.id)}
                          className={`p-1.5 rounded ${u.status === 'Active' ? 'text-gray-600 hover:bg-gray-100' : 'text-green-600 hover:bg-green-50'}`}
                          title={u.status === 'Active' ? 'Deactivate' : 'Activate'}>
                          {u.status === 'Active' ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleEdit(u)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="ပြင်">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(u.id, u.username)}
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

      {/* ===== Add/Edit Modal ===== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">
                {editing ? '👤 User ပြင်ရန်' : '👤 User အသစ်'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Avatar */}
              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
                {formData.avatar ? (
                  <img src={formData.avatar} alt="Avatar"
                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow" />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                    {(formData.full_name || formData.username || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <label className="cursor-pointer inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                    <Upload className="w-4 h-4" /> Avatar တင်ရန်
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </label>
                  {formData.avatar && (
                    <button type="button" onClick={() => setFormData({ ...formData, avatar: '' })}
                      className="block text-xs text-red-600 hover:underline mt-2">ဖျက်ရန်</button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Username *">
                  <input type="text" name="username" value={formData.username}
                    onChange={handleChange} required placeholder="john_doe"
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </Field>

                {!editing && (
                  <Field label="Password * (min 6)">
                    <input type="password" name="password" value={formData.password}
                      onChange={handleChange} required minLength={6}
                      className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                  </Field>
                )}

                <Field label="Role *">
                  <select name="role" value={formData.role} onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </Field>

                <Field label="အမည် အပြည့်အစုံ">
                  <input type="text" name="full_name" value={formData.full_name}
                    onChange={handleChange} placeholder="မောင်မောင်"
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </Field>

                <Field label="Email">
                  <input type="email" name="email" value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </Field>

                <Field label="ဖုန်း">
                  <input type="text" name="phone" value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </Field>

                {formData.role === 'Student' && (
                  <div className="md:col-span-2">
                    <Field label="ကျောင်းသား နဲ့ ချိတ်ဆက်">
                      <select name="linked_student_id" value={formData.linked_student_id} onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">-- မချိတ်ဆက်ပါ --</option>
                        {students.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.student_id}) - {s.grade}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                )}

                {formData.role === 'Teacher' && (
                  <div className="md:col-span-2">
                    <Field label="ဆရာ/ဆရာမ နဲ့ ချိတ်ဆက်">
                      <select name="linked_teacher_id" value={formData.linked_teacher_id} onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">-- မချိတ်ဆက်ပါ --</option>
                        {teachers.map(t => (
                          <option key={t.id} value={t.id}>{t.name} ({t.teacher_id}) - {t.subject}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                )}

                <Field label="Status">
                  <select name="status" value={formData.status} onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                    {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </Field>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border rounded-lg hover:bg-gray-50 font-medium">ပယ်ဖျက်</button>
                <button type="submit"
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium">
                  <Save className="w-4 h-4" /> {editing ? 'ပြင်ရန်' : 'ဖန်တီးရန်'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Reset Password Modal ===== */}
      {showResetModal && resetUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">🔑 Password Reset</h3>
              <button onClick={() => setShowResetModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p className="font-mono font-bold text-blue-600">{resetUser.username}</p>
                <p className="text-gray-600 text-xs">{resetUser.full_name || '-'}</p>
              </div>
              <Field label="Password အသစ် (min 6)">
                <input type="text" value={resetPassword}
                  onChange={e => setResetPassword(e.target.value)}
                  placeholder="New password..."
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
              </Field>
              <div className="flex gap-3 pt-4 border-t">
                <button onClick={() => setShowResetModal(false)}
                  className="flex-1 px-4 py-2.5 border rounded-lg hover:bg-gray-50">ပယ်ဖျက်</button>
                <button onClick={handleResetPassword}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-lg font-medium">
                  Password ပြောင်းရန်
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Bulk Create Modal ===== */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">👥 Bulk Account Create</h3>
              <button onClick={() => setShowBulkModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-xs">
                ⚠️ ဒီလုပ်ဆောင်ချက်က ကျောင်းသား/ဆရာ အားလုံးအတွက် Account ဖန်တီးပေးပါမယ်။ 
                ရှိပြီးသား Account များကို ကျော်ပါမယ်။ Username က Student ID / Teacher ID ဖြစ်ပါမယ်။
              </div>
              <Field label="ဘယ်သူတွေအတွက်?">
                <select value={bulkForm.type}
                  onChange={e => setBulkForm({ ...bulkForm, type: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="students">👨‍🎓 ကျောင်းသား အားလုံး</option>
                  <option value="teachers">👨‍🏫 ဆရာ/ဆရာမ အားလုံး</option>
                </select>
              </Field>
              <Field label="Default Password">
                <input type="text" value={bulkForm.default_password}
                  onChange={e => setBulkForm({ ...bulkForm, default_password: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
                <p className="text-xs text-gray-500 mt-1">အားလုံး ဒီ Password နဲ့ ဝင်ရပါမယ်။ နောက်ပြောင်းလို့ရပါတယ်။</p>
              </Field>
              <div className="flex gap-3 pt-4 border-t">
                <button onClick={() => setShowBulkModal(false)}
                  className="flex-1 px-4 py-2.5 border rounded-lg hover:bg-gray-50">ပယ်ဖျက်</button>
                <button onClick={handleBulkCreate}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg font-medium">
                  ဖန်တီးရန်
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className={`${color} rounded-xl p-4`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4" />
        <p className="text-xs font-medium opacity-80">{label}</p>
      </div>
      <p className="text-2xl font-bold">{value}</p>
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