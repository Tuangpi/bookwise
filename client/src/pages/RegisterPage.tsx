import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    businessName: '', ownerName: '', email: '', password: '', timezone: 'UTC',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.error?.message ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (k: string) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={submit} className="bg-white p-8 rounded-lg shadow w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold">Create Business</h1>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <input className="w-full border p-2 rounded" placeholder="Business name" value={form.businessName} onChange={set('businessName')} />
        <input className="w-full border p-2 rounded" placeholder="Owner name" value={form.ownerName} onChange={set('ownerName')} />
        <input className="w-full border p-2 rounded" placeholder="Email" value={form.email} onChange={set('email')} />
        <input className="w-full border p-2 rounded" type="password" placeholder="Password" value={form.password} onChange={set('password')} />
        <button disabled={loading} className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50">{loading ? '...' : 'Register'}</button>
        <p className="text-sm">Have account? <Link to="/login" className="text-blue-600">Login</Link></p>
      </form>
    </div>
  );
}
