import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <button onClick={logout} className="bg-gray-200 px-4 py-2 rounded">Logout</button>
        </div>
        <p className="text-gray-600">Welcome, {user?.name}</p>
        <p className="text-sm text-gray-500 mb-6">Role: {user?.role}</p>
        <div className="grid grid-cols-2 gap-4">
          <Link to="/services" className="bg-white p-6 rounded shadow hover:shadow-md">Services</Link>
          <Link to="/calendar" className="bg-white p-6 rounded shadow hover:shadow-md">Calendar</Link>
          <Link to="/notifications" className="bg-white p-6 rounded shadow hover:shadow-md">Notifications</Link>
        </div>
      </div>
    </div>
  );
}
