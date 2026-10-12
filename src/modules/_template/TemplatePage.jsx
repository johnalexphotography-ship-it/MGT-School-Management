import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Save, Search, CheckCircle, AlertCircle } from 'lucide-react';
import API from '../../api/axios';

export default function TemplatePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const load = async () => {
    setLoading(true);
    try {
      const url = search ? `/template?search=${search}` : '/template';
      const r = await API.get(url);
      setItems(r.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [search]);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await API.put(`/template/${editing.id}`, formData);
        showMsg('success', 'ပြင်ပြီးပါပြီ');
      } else {
        await API.post('/template', formData);
        showMsg('success', 'ထည့်ပြီးပါပြီ');
      }
      setShowModal(false);
      load();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('ဖျက်မှာ သေချာလား?')) return;
    try {
      await API.delete(`/template/${id}`);
      showMsg('success', 'ဖျက်ပြီးပါပြီ');
      load();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
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

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ရှာရန်..."
            className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div className="flex-1" />
        <button onClick={() => { setEditing(null); setFormData({ name: '', description: '' }); setShowModal(true); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg">
          <Plus className="w-5 h-5" /> အသစ်
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-gray-500">Data မရှိပါ</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold">အမည်</th>
                <th className="px-4 py-3 text-right text-xs font-semibold">လုပ်ဆောင်ချက်</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono">{item.id}</td>
                  <td className="px-4 py-3 text-sm">{item.name}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => { setEditing(item); setFormData(item); setShowModal(true); }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold">{editing ? 'ပြင်ရန်' : 'အသစ်'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">အမည်</label>
                <input type="text" value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })} required
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border rounded-lg hover:bg-gray-50">ပယ်ဖျက်</button>
                <button type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg">
                  <Save className="w-4 h-4 inline mr-2" /> သိမ်းရန်
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}