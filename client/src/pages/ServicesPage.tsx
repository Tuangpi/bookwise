import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface Service { id: string; name: string; durationMin: number; price: string; active: boolean; }

export default function ServicesPage() {
  const { logout } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(30);
  const [price, setPrice] = useState(0);

  const load = async () => {
    const r = await api.get('/services');
    setServices(r.data.data);
  };

  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/services', { name, durationMin: duration, price });
    setName('');
    load();
  };

  const remove = async (id: string) => {
    await api.delete(`/services/${id}`);
    load();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Services</h1>
          <button onClick={logout} className="bg-gray-200 px-4 py-2 rounded">Logout</button>
        </div>
        <form onSubmit={create} className="bg-white p-4 rounded shadow mb-6 flex gap-2">
          <input className="border p-2 rounded flex-1" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="border p-2 rounded w-24" type="number" placeholder="Min" value={duration} onChange={(e) => setDuration(+e.target.value)} />
          <input className="border p-2 rounded w-24" type="number" placeholder="Price" value={price} onChange={(e) => setPrice(+e.target.value)} />
          <button className="bg-blue-600 text-white px-4 rounded">Add</button>
        </form>
        <ul className="bg-white rounded shadow divide-y">
          {services.map((s) => (
            <li key={s.id} className="p-4 flex justify-between items-center">
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-sm text-gray-500">{s.durationMin} min · ${s.price}</p>
              </div>
              <button onClick={() => remove(s.id)} className="text-red-600 text-sm">Delete</button>
            </li>
          ))}
          {services.length === 0 && <li className="p-4 text-gray-500">No services yet.</li>}
        </ul>
      </div>
    </div>
  );
}
