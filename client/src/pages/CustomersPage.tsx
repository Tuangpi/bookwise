import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { listCustomers, createCustomer, updateCustomer, deleteCustomer, type Customer } from '../lib/api';

export default function CustomersPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState<{ name: string; email?: string; phone?: string; notes?: string; tags: string[] }>({ name: '', email: '', phone: '', notes: '', tags: [] });
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, [user?.id]);

  const fetchCustomers = async () => {
    try {
      const data = await listCustomers();
      setCustomers(data);
    } catch (e) {
      console.error('Failed to fetch customers', e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await updateCustomer(editing, { name: form.name, email: form.email || undefined, phone: form.phone || undefined, notes: form.notes || undefined, tags: form.tags });
      setEditing(null);
    } else {
      await createCustomer({ name: form.name, email: form.email || undefined, phone: form.phone || undefined, notes: form.notes || undefined, tags: form.tags });
    }
    setForm({ name: '', email: '', phone: '', notes: '', tags: [] });
    fetchCustomers();
  };

  const handleEdit = (id: string, customer: Customer) => {
    setForm({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      notes: customer.notes || '',
      tags: customer.tags,
    });
    setEditing(id);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Customer Management</h1>
          <button
            onClick={() => setForm({ name: '', email: '', phone: '', notes: '', tags: [] })}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Add Customer
          </button>
        </div>
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <form onSubmit={(e) => { e.preventDefault(); handleSave(e); }} className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                type="email"
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                type="tel"
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={form.notes || ''}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
              <input
                value={form.tags.join(', ')}
                onChange={(e) => { const tags = e.target.value.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0); setForm({ ...form, tags }); }}
                placeholder="e.g. VIP,Regular,Preferred"
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              {editing ? 'Update' : 'Create'}
            </button>
            {editing && (
              <button type="button" onClick={() => { setForm({ name: '', email: '', phone: '', notes: '', tags: [] }); setEditing(null); }} className="mt-2 text-gray-500 underline hover:text-gray-700">Cancel</button>
            )}
          </form>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((customer) => (
            <div key={customer.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-4">
                <h3 className="font-bold text-lg">{customer.name}</h3>
                <p className="text-sm text-gray-500">{customer.email || ''} {customer.phone || ''}.{customer.tags.length > 0 ? ' Tags: ' + customer.tags.join(', ') : ''}</p>
                {customer.notes && <p className="mt-2 text-xs text-gray-500">{customer.notes}</p>}
              </div>
              <div className="p-2 border-t border-gray-200">
                <button onClick={() => handleEdit(customer.id, customer)} className="text-blue-600 hover underline mr-3">Edit</button>
                <button onClick={() => { if (window.confirm('Are you sure?')) deleteCustomer(customer.id); }} className="text-red-600 hover underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}