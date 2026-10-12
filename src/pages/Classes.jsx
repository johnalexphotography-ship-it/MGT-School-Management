import { useState, useEffect } from 'react';
import { 
  BookOpen, Search, Plus, Edit, Trash2, X, Save, 
  AlertCircle, CheckCircle, Users, MapPin, User 
} from 'lucide-react';
import API from '../api/axios';

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [message, setMessage] = useState(null);

  const emptyForm = {
    class_name: '', grade: '', section: '', teacher_id: '',
    room: '', capacity: '', academic_year: '2026-2027', status: 'Active'
  };
  const [formData, setFormData] = useState(emptyForm);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const url = search ? `/classes?search=${search}` : '/classes';
      const res = await API.get(url);
      setClasses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await API.get('/teachers');
      setTeachers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, [search]);

  const handleAdd = () => {
    setEditingClass(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const handleEdit = (cls) => {
    setEditingClass(cls);
    setFormData({
      class_name: cls.class_name || '',
      grade: cls.grade || '',
      section: cls.section || '',
      teacher_id: cls.teacher_id || '',
      room: cls.room || '',
      capacity: cls.capacity || '',
      academic_year: cls.academic_year || '2026-2027',
      status: cls.status || 'Active'
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClass) {
        await API.put(`/classes/${editingClass.id}`, formData);
        setMessage({ type: 'success', text: 'အတန်း အချက်အလက် ပြင်ပြီးပါပြီ' });
      } else {
        await API.post('/classes', formData);
        setMessage({ type: 'success', text: 'အတန်း ထည့်ပြီးပါပြီ' });
      }
      setShowModal(false);
      fetchClasses();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.error || 'Error ဖြစ်ပွားပါတယ်' 
      });
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`"${name}" ကို ဖျက်မှာ သေချာလား?`)) return;
    try {
      await API.delete(`/classes/${id}`);
      setMessage({ type: 'success', text: 'အတန်း ဖျက်ပြီးပါပြီ' });
      fetchClasses();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.error || 'Error ဖြစ်ပွားပါတယ်' 
      });
    }
  };

  return (
    <div className="p-6">
      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-3 justify-between items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="အတန်း ရှာဖွေရန်..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          အတန်း အသစ်
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">Loading...</div>
      ) : classes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">အတန်း မရှိသေးပါ</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((c) => (
            <div key={c.id} className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{c.class_name}</h3>
                    <p className="text-xs text-gray-500">
                      {c.grade}{c.section ? ` - ${c.section}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(c)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id, c.class_name)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-sm">
                {c.teacher_name && (
                  <p className="text-gray-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    {c.teacher_name}
                  </p>
                )}
                {c.room && (
                  <p className="text-gray-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    အခန်း: {c.room}
                  </p>
                )}
                {c.capacity && (
                  <p className="text-gray-700 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    ဦးရေ: {c.capacity}
                  </p>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  c.status === 'Active' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {c.status}
                </span>
                {c.academic_year && (
                  <span className="text-xs text-gray-500">{c.academic_year}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-800">
                {editingClass ? 'အတန်း ပြင်ရန်' : 'အတန်း အသစ် ထည့်ရန်'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    အတန်း အမည် <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text" name="class_name" value={formData.class_name}
                    onChange={handleChange} required
                    placeholder="Grade 5 - A"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grade <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text" name="grade" value={formData.grade}
                    onChange={handleChange} required
                    placeholder="Grade 5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                  <input
                    type="text" name="section" value={formData.section}
                    onChange={handleChange}
                    placeholder="A"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ဆရာ/ဆရာမ</label>
                  <select
                    name="teacher_id" value={formData.teacher_id} onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">-- ရွေးပါ --</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.teacher_id})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">အခန်း</label>
                  <input
                    type="text" name="room" value={formData.room}
                    onChange={handleChange}
                    placeholder="Room 101"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ဦးရေ ကန့်သတ်</label>
                  <input
                    type="number" name="capacity" value={formData.capacity}
                    onChange={handleChange}
                    placeholder="40"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ပညာသင်နှစ်</label>
                  <input
                    type="text" name="academic_year" value={formData.academic_year}
                    onChange={handleChange}
                    placeholder="2026-2027"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">အခြေအနေ</label>
                  <select
                    name="status" value={formData.status} onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  ပယ်ဖျက်
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition"
                >
                  <Save className="w-4 h-4" />
                  {editingClass ? 'ပြင်ရန်' : 'ထည့်ရန်'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}