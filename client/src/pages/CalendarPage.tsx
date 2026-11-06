import { useState, useEffect } from 'react';
import { listBookingsCalendar, type Booking } from '../lib/api';

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  NO_SHOW: 'bg-red-100 text-red-800',
};

export default function CalendarPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const start = new Date();
    start.setDate(start.getDate() + weekOffset * 7);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    setLoading(true);
    listBookingsCalendar(start.toISOString().slice(0, 10), end.toISOString().slice(0, 10))
      .then((data) => setBookings(data))
      .catch((e) => console.error('Failed to load calendar', e))
      .finally(() => setLoading(false));
  }, [weekOffset]);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7 + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const byDay = new Map<string, Booking[]>();
  for (const b of bookings) {
    const day = new Date(b.startAt).toISOString().slice(0, 10);
    const arr = byDay.get(day) ?? [];
    arr.push(b);
    byDay.set(day, arr);
  }

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const weekStart = days[0];
  const weekEnd = days[6];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Calendar</h1>
            <p className="text-gray-600">
              {weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} –
              {weekEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset((o) => o - 1)}
              disabled={loading}
              className="px-3 py-2 bg-white border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              ← Prev week
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              disabled={loading}
              className="px-3 py-2 bg-white border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Today
            </button>
            <button
              onClick={() => setWeekOffset((o) => o + 1)}
              disabled={loading}
              className="px-3 py-2 bg-white border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Next week →
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading bookings…</p>
        ) : (
          <div className="grid grid-cols-7 gap-4">
            {days.map((day) => {
              const dayKey = day.toISOString().slice(0, 10);
              const dayBookings = (byDay.get(dayKey) ?? []).sort(
                (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
              );
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const isToday = day.getTime() === today.getTime();
              return (
                <div key={dayKey} className="bg-white rounded-lg shadow border border-gray-100">
                  <div className={`p-3 border-b border-gray-100 ${isToday ? 'bg-indigo-50' : ''}`}>
                    <div className="text-xs font-semibold text-gray-600">
                      {day.toLocaleDateString(undefined, { weekday: 'short' })}
                    </div>
                    <div className="text-lg font-bold">{day.getDate()}</div>
                    {isToday && <span className="text-xs text-indigo-600">Today</span>}
                  </div>
                  <div className="p-3">
                    {dayBookings.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center">No bookings</p>
                    ) : (
                      dayBookings.map((b) => (
                        <div key={b.id} className="mb-2 p-2 rounded border bg-white">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-medium">
                              {formatTime(b.startAt)} – {formatTime(b.endAt)}
                            </span>
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded ${
                                STATUS_COLOR[b.status] ?? 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {b.status}
                            </span>
                          </div>
                          <div className="text-sm font-semibold">{b.service.name}</div>
                          <div className="text-xs text-gray-600">
                            {b.staff?.name || 'Unassigned'} • {b.customer.name}
                          </div>
                          {b.notes && <p className="text-xs text-gray-500 mt-1">{b.notes}</p>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
