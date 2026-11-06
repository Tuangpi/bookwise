import { useState, useEffect } from 'react';
import {
  listNotifications,
  createNotification,
  markNotificationSent,
  type Notification,
} from '../lib/api';

const CHANNEL_COLOR: Record<string, string> = {
  EMAIL: 'bg-blue-100 text-blue-800',
  SMS: 'bg-purple-100 text-purple-800',
  IN_APP: 'bg-indigo-100 text-indigo-800',
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  SENT: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [form, setForm] = useState<{ type: string; channel: 'EMAIL' | 'SMS' | 'IN_APP'; recipient: string }>({
    type: 'BOOKING_REMINDER',
    channel: 'IN_APP',
    recipient: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [statusFilter]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await listNotifications(statusFilter || undefined);
      setNotifications(data);
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createNotification({
        type: form.type,
        channel: form.channel,
        recipient: form.recipient,
        payload: {},
      });
      setForm({ type: 'BOOKING_REMINDER', channel: 'IN_APP', recipient: '' });
      fetchNotifications();
    } catch (e) {
      console.error('Failed to create notification', e);
    }
  };

  const handleMarkSent = async (id: string) => {
    try {
      await markNotificationSent(id);
      fetchNotifications();
    } catch (e) {
      console.error('Failed to mark notification as sent', e);
    }
  };

  const filtered = notifications.filter(
    (n) => !statusFilter || n.status === statusFilter
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Notifications</h1>
        </div>

        <div className="flex gap-2 mb-6">
          {['', 'PENDING', 'SENT', 'FAILED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded text-sm font-medium border ${
                statusFilter === s
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option>BOOKING_CREATED</option>
                <option>BOOKING_CONFIRMED</option>
                <option>BOOKING_CANCELLED</option>
                <option>BOOKING_REMINDER</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
              <select
                value={form.channel}
                onChange={(e) => setForm({ ...form, channel: e.target.value as 'EMAIL' | 'SMS' | 'IN_APP' })}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option>EMAIL</option>
                <option>SMS</option>
                <option>IN_APP</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
              <input
                value={form.recipient}
                onChange={(e) => setForm({ ...form, recipient: e.target.value })}
                placeholder="email or phone"
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
              >
                Send
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Type</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Channel</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Recipient</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600">Created</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-600 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Loading notifications…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No notifications{statusFilter ? ` with status "${statusFilter}"` : ''}.
                  </td>
                </tr>
              ) : (
                filtered.map((n) => (
                  <tr key={n.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{n.type}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${CHANNEL_COLOR[n.channel] ?? 'bg-gray-100 text-gray-800'}`}
                      >
                        {n.channel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{n.recipient}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${STATUS_COLOR[n.status] ?? 'bg-gray-100 text-gray-800'}`}
                      >
                        {n.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(n.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {n.status === 'PENDING' && (
                        <button
                          onClick={() => handleMarkSent(n.id)}
                          className="text-indigo-600 text-xs underline hover:text-indigo-800"
                        >
                          Mark as sent
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
