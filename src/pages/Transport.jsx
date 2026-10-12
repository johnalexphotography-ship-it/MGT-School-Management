import { useState, useEffect } from 'react';
import {
  Bus, Plus, Edit, Trash2, X, Save, Search, MapPin,
  User, Phone, CheckCircle, AlertCircle, Users,
  Clock, Navigation, Hash, DollarSign, Filter
} from 'lucide-react';
import API from '../api/axios';

const CURRENCIES = {
  MMK: { symbol: 'K', name: 'ကျပ်' },
  THB: { symbol: '฿', name: 'ဘတ်' },
  USD: { symbol: '$', name: 'ဒေါ်လာ' },
};

export default function Transport() {
  const [activeTab, setActiveTab] = useState('routes');
  const [routes, setRoutes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRoute, setFilterRoute] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [message, setMessage] = useState(null);

  // Route Modal
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [routeForm, setRouteForm] = useState({
    route_name: '', route_code: '', start_point: '', end_point: '',
    distance_km: '', fare: '', currency: 'MMK', driver_name: '',
    driver_phone: '', vehicle_no: '', capacity: 30,
    departure_time: '', return_time: '', status: 'Active', notes: ''
  });

  // Assignment Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingAssign, setEditingAssign] = useState(null);
  const [assignForm, setAssignForm] = useState({
    student_id: '', route_id: '', pickup_point: '',
    monthly_fee: '', currency: 'MMK', start_date: '', end_date: '', notes: ''
  });

  // ===== Load =====
  const load = async () => {
    setLoading(true);
    try {
      const [rRes, sRes, stRes] = await Promise.all([
        API.get('/transport/routes'),
        API.get('/transport/stats'),
        API.get('/students?status=Active')
      ]);
      setRoutes(rRes.data);
      setStats(stRes.data);
      setStudents(sRes.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadAssignments = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterRoute) params.append('route_id', filterRoute);
      if (filterStatus) params.append('status', filterStatus);
      const r = await API.get(`/transport/assignments?${params}`);
      setAssignments(r.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (activeTab === 'assignments') loadAssignments(); }, [activeTab, search, filterRoute, filterStatus]);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // ===== Route CRUD =====
  const openRouteModal = (route = null) => {
    if (route) {
      setEditingRoute(route);
      setRouteForm({
        route_name: route.route_name || '', route_code: route.route_code || '',
        start_point: route.start_point || '', end_point: route.end_point || '',
        distance_km: route.distance_km || '', fare: route.fare || '',
        currency: route.currency || 'MMK', driver_name: route.driver_name || '',
        driver_phone: route.driver_phone || '', vehicle_no: route.vehicle_no || '',
        capacity: route.capacity || 30, departure_time: route.departure_time || '',
        return_time: route.return_time || '', status: route.status || 'Active',
        notes: route.notes || ''
      });
    } else {
      setEditingRoute(null);
      setRouteForm({
        route_name: '', route_code: '', start_point: '', end_point: '',
        distance_km: '', fare: '', currency: 'MMK', driver_name: '',
        driver_phone: '', vehicle_no: '', capacity: 30,
        departure_time: '', return_time: '', status: 'Active', notes: ''
      });
    }
    setShowRouteModal(true);
  };

  const handleRouteSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRoute) {
        await API.put(`/transport/routes/${editingRoute.id}`, routeForm);
        showMsg('success', 'လမ်းကြောင်း ပြင်ပြီးပါပြီ');
      } else {
        await API.post('/transport/routes', routeForm);
        showMsg('success', 'လမ်းကြောင်း ထည့်ပြီးပါပြီ');
      }
      setShowRouteModal(false);
      load();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  const handleDeleteRoute = async (id, name) => {
    if (!confirm(`"${name}" ကို ဖျက်မှာ သေချာလား?`)) return;
    try {
      await API.delete(`/transport/routes/${id}`);
      showMsg('success', 'ဖျက်ပြီးပါပြီ');
      load();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  // ===== Assignment CRUD =====
  const openAssignModal = (assign = null) => {
    if (assign) {
      setEditingAssign(assign);
      setAssignForm({
        student_id: assign.student_id || '', route_id: assign.route_id || '',
        pickup_point: assign.pickup_point || '', monthly_fee: assign.monthly_fee || '',
        currency: assign.currency || 'MMK', start_date: assign.start_date || '',
        end_date: assign.end_date || '', notes: assign.notes || ''
      });
    } else {
      setEditingAssign(null);
      setAssignForm({
        student_id: '', route_id: '', pickup_point: '',
        monthly_fee: '', currency: 'MMK',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '', notes: ''
      });
    }
    setShowAssignModal(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAssign) {
        await API.put(`/transport/assignments/${editingAssign.id}`, assignForm);
        showMsg('success', 'သတ်မှတ်ချက် ပြင်ပြီးပါပြီ');
      } else {
        await API.post('/transport/assignments', assignForm);
        showMsg('success', 'ကျောင်းသား သတ်မှတ်ပြီးပါပြီ');
      }
      setShowAssignModal(false);
      loadAssignments();
      load();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  const handleDeleteAssign = async (id) => {
    if (!confirm('ဖျက်မှာ သေချာလား?')) return;
    try {
      await API.delete(`/transport/assignments/${id}`);
      showMsg('success', 'ဖျက်ပြီးပါပြီ');
      loadAssignments();
      load();
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Error');
    }
  };

  const fmt = (n) => new Intl.NumberFormat('en-US').format(n || 0);
  const getCurrencyInfo = (c) => CURRENCIES[c] || CURRENCIES.MMK;

  const tabs = [
    { key: 'routes', label: '🚌 လမ်းကြောင်းများ', icon: Bus },
    { key: 'assignments', label: '👨‍🎓 ကျောင်းသား သတ်မှတ်ချက်', icon: Users },
  ];

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={Bus} label="လမ်းကြောင်း" value={stats.totalRoutes} color="bg-blue-100 text-blue-700" />
          <StatCard icon={Navigation} label="Active" value={stats.activeRoutes} color="bg-green-100 text-green-700" />
          <StatCard icon={Users} label="သတ်မှတ်ချက်" value={stats.totalAssignments} color="bg-purple-100 text-purple-700" />
          <StatCard icon={User} label="ကျောင်းသား" value={stats.totalStudents} color="bg-orange-100 text-orange-700" />
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
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
        </div>
      </div>

      {/* ===== TAB 1: Routes ===== */}
      {activeTab === 'routes' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="လမ်းကြောင်း / ယာဉ်မောင်း ရှာရန်..."
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex-1" />
            <button onClick={() => openRouteModal()}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg">
              <Plus className="w-5 h-5" /> လမ်းကြောင်း အသစ်
            </button>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">Loading...</div>
          ) : routes.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Bus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">လမ်းကြောင်း မရှိသေးပါ</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {routes.map(r => {
                const cur = getCurrencyInfo(r.currency);
                return (
                  <div key={r.id} className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                          <Bus className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800">{r.route_name}</h3>
                          <p className="text-xs font-mono text-blue-600">{r.route_code}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openRouteModal(r)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="ပြင်">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteRoute(r.id, r.route_name)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="ဖျက်">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-sm mb-3">
                      {(r.start_point || r.end_point) && (
                        <p className="text-gray-700 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          {r.start_point || '?'} → {r.end_point || '?'}
                        </p>
                      )}
                      {r.driver_name && (
                        <p className="text-gray-700 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          {r.driver_name}
                          {r.driver_phone && <span className="text-xs text-gray-500">· {r.driver_phone}</span>}
                        </p>
                      )}
                      {r.vehicle_no && (
                        <p className="text-gray-700 flex items-center gap-1.5">
                          <Hash className="w-3.5 h-3.5 text-gray-400" />
                          {r.vehicle_no}
                        </p>
                      )}
                      {r.departure_time && (
                        <p className="text-gray-700 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {r.departure_time} {r.return_time && `→ ${r.return_time}`}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-xs pt-3 border-t">
                      <div>
                        <span className="text-gray-500">ကျောင်းသား:</span>
                        <span className="font-bold text-gray-800 ml-1">{r.student_count} / {r.capacity}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">ခကြေး:</span>
                        <span className="font-bold text-blue-700 ml-1">{cur.symbol} {fmt(r.fare)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== TAB 2: Assignments ===== */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="ကျောင်းသား ရှာရန်..."
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <select value={filterRoute} onChange={e => setFilterRoute(e.target.value)}
              className="px-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">လမ်းကြောင်း အားလုံး</option>
              {routes.map(r => <option key={r.id} value={r.id}>{r.route_name}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Status အားလုံး</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <div className="flex-1" />
            <button onClick={() => openAssignModal()}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg">
              <Plus className="w-5 h-5" /> ကျောင်းသား သတ်မှတ်
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {assignments.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">သတ်မှတ်ချက် မရှိသေးပါ</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold">ကျောင်းသား</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">လမ်းကြောင်း</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">Pickup</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold">လစဉ်ခကြေး</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold">လုပ်ဆောင်ချက်</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {assignments.map(a => {
                      const cur = getCurrencyInfo(a.currency);
                      return (
                        <tr key={a.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium">{a.student_name}</p>
                            <p className="text-xs font-mono text-gray-500">{a.student_code} · {a.grade} {a.section}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium">{a.route_name}</p>
                            <p className="text-xs font-mono text-blue-600">{a.route_code}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{a.pickup_point || '-'}</td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-bold text-blue-700">
                              {cur.symbol} {fmt(a.monthly_fee)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              a.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                            }`}>{a.status}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => openAssignModal(a)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="ပြင်">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteAssign(a.id)}
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
        </div>
      )}

      {/* ===== Route Modal ===== */}
      {showRouteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Bus className="w-5 h-5 text-blue-600" />
                {editingRoute ? 'လမ်းကြောင်း ပြင်ရန်' : 'လမ်းကြောင်း အသစ်'}
              </h3>
              <button onClick={() => setShowRouteModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRouteSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="လမ်းကြောင်း အမည် *">
                  <input type="text" value={routeForm.route_name}
                    onChange={e => setRouteForm({ ...routeForm, route_name: e.target.value })} required
                    placeholder="ဥပမာ: ရွှေပြည်သာ လမ်းကြောင်း"
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </Field>

                <Field label="Route Code *">
                  <input type="text" value={routeForm.route_code}
                    onChange={e => setRouteForm({ ...routeForm, route_code: e.target.value })} required
                    placeholder="RT-001"
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
                </Field>

                <Field label="စတင်မှတ်">
                  <input type="text" value={routeForm.start_point}
                    onChange={e => setRouteForm({ ...routeForm, start_point: e.target.value })}
                    placeholder="ကျောင်း"
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </Field>

                <Field label="ဆုံးမှတ်">
                  <input type="text" value={routeForm.end_point}
                    onChange={e => setRouteForm({ ...routeForm, end_point: e.target.value })}
                    placeholder="ရွှေပြည်သာ"
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </Field>

                <Field label="အကွာအဝေး (km)">
                  <input type="number" step="0.1" value={routeForm.distance_km}
                    onChange={e => setRouteForm({ ...routeForm, distance_km: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </Field>

                <Field label="ခကြေး">
                  <input type="number" value={routeForm.fare}
                    onChange={e => setRouteForm({ ...routeForm, fare: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </Field>

                <Field label="ငွေကြေး">
                  <select value={routeForm.currency}
                    onChange={e => setRouteForm({ ...routeForm, currency: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                    {Object.entries(CURRENCIES).map(([k, v]) => (
                      <option key={k} value={k}>{v.symbol} {k} - {v.name}</option>
                    ))}
                  </select>
                </Field>

                <Field label="ဦးရေ ကန့်သတ်">
                  <input type="number" value={routeForm.capacity}
                    onChange={e => setRouteForm({ ...routeForm, capacity: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </Field>

                <Field label="ယာဉ်မောင်း အမည်">
                  <input type="text" value={routeForm.driver_name}
                    onChange={e => setRouteForm({ ...routeForm, driver_name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </Field>

                <Field label="ယာဉ်မောင်း ဖုန်း">
                  <input type="text" value={routeForm.driver_phone}
                    onChange={e => setRouteForm({ ...routeForm, driver_phone: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </Field>

                <Field label="ယာဉ် နံပါတ်">
                  <input type="text" value={routeForm.vehicle_no}
                    onChange={e => setRouteForm({ ...routeForm, vehicle_no: e.target.value })}
                    placeholder="YGN-1234"
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
                </Field>

                <Field label="အခြေအနေ">
                  <select value={routeForm.status}
                    onChange={e => setRouteForm({ ...routeForm, status: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </Field>

                <Field label="ထွက်ချိန်">
                  <input type="time" value={routeForm.departure_time}
                    onChange={e => setRouteForm({ ...routeForm, departure_time: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </Field>

                <Field label="ပြန်ချိန်">
                  <input type="time" value={routeForm.return_time}
                    onChange={e => setRouteForm({ ...routeForm, return_time: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </Field>

                <div className="md:col-span-2">
                  <Field label="မှတ်ချက်">
                    <textarea value={routeForm.notes}
                      onChange={e => setRouteForm({ ...routeForm, notes: e.target.value })} rows="2"
                      className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                  </Field>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowRouteModal(false)}
                  className="flex-1 px-4 py-2.5 border rounded-lg hover:bg-gray-50 font-medium">ပယ်ဖျက်</button>
                <button type="submit"
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium">
                  <Save className="w-4 h-4" /> {editingRoute ? 'ပြင်ရန်' : 'ထည့်ရန်'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Assignment Modal ===== */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                {editingAssign ? 'သတ်မှတ်ချက် ပြင်ရန်' : 'ကျောင်းသား သတ်မှတ်ရန်'}
              </h3>
              <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="ကျောင်းသား *">
                  <select value={assignForm.student_id}
                    onChange={e => setAssignForm({ ...assignForm, student_id: e.target.value })} required
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">-- ရွေးပါ --</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.student_id}) - {s.grade}</option>
                    ))}
                  </select>
                </Field>

                <Field label="လမ်းကြောင်း *">
                  <select value={assignForm.route_id}
                    onChange={e => setAssignForm({ ...assignForm, route_id: e.target.value })} required
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">-- ရွေးပါ --</option>
                    {routes.filter(r => r.status === 'Active').map(r => (
                      <option key={r.id} value={r.id}>{r.route_name} ({r.route_code})</option>
                    ))}
                  </select>
                </Field>

                <Field label="Pickup နေရာ">
                  <input type="text" value={assignForm.pickup_point}
                    onChange={e => setAssignForm({ ...assignForm, pickup_point: e.target.value })}
                    placeholder="ဥပမာ: ရွှေပြည်သာ ဘူတာ"
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </Field>

                <Field label="လစဉ် ခကြေး">
                  <input type="number" value={assignForm.monthly_fee}
                    onChange={e => setAssignForm({ ...assignForm, monthly_fee: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </Field>

                <Field label="ငွေကြေး">
                  <select value={assignForm.currency}
                    onChange={e => setAssignForm({ ...assignForm, currency: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                    {Object.entries(CURRENCIES).map(([k, v]) => (
                      <option key={k} value={k}>{v.symbol} {k} - {v.name}</option>
                    ))}
                  </select>
                </Field>

                <Field label="စတင်ရက်">
                  <input type="date" value={assignForm.start_date}
                    onChange={e => setAssignForm({ ...assignForm, start_date: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </Field>

                <Field label="ပြီးဆုံးရက်">
                  <input type="date" value={assignForm.end_date}
                    onChange={e => setAssignForm({ ...assignForm, end_date: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </Field>

                {editingAssign && (
                  <Field label="အခြေအနေ">
                    <select value={assignForm.status || 'Active'}
                      onChange={e => setAssignForm({ ...assignForm, status: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </Field>
                )}

                <div className="md:col-span-2">
                  <Field label="မှတ်ချက်">
                    <textarea value={assignForm.notes}
                      onChange={e => setAssignForm({ ...assignForm, notes: e.target.value })} rows="2"
                      className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                  </Field>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowAssignModal(false)}
                  className="flex-1 px-4 py-2.5 border rounded-lg hover:bg-gray-50 font-medium">ပယ်ဖျက်</button>
                <button type="submit"
                  className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg font-medium">
                  <Save className="w-4 h-4" /> {editingAssign ? 'ပြင်ရန်' : 'သတ်မှတ်ရန်'}
                </button>
              </div>
            </form>
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