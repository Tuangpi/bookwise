import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  DollarSign,
  Users,
  Clock,
  Activity,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getDashboardSummary,
  getRevenueOverTime,
  getStaffUtilizationReport,
  getStatusBreakdownReport,
  getPopularServicesReport,
  type DashboardSummary,
  type RevenueDay,
  type StaffUtilization,
  type StatusBreakdown,
  type PopularService,
} from '../lib/api';

const toISODate = (date: Date): string => date.toISOString().slice(0, 10);

const defaultRange = (): { start: string; end: string } => {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(end.getDate() - 29);
  return { start: toISODate(start), end: toISODate(end) };
};

type ReportData = {
  summary: DashboardSummary | null;
  revenue: RevenueDay[] | null;
  staff: StaffUtilization[] | null;
  status: StatusBreakdown[] | null;
  services: PopularService[] | null;
};

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [range, setRange] = useState(defaultRange());
  const [data, setData] = useState<ReportData>({
    summary: null,
    revenue: null,
    staff: null,
    status: null,
    services: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summary, revenue, staff, status, services] = await Promise.all([
        getDashboardSummary(range.start, range.end),
        getRevenueOverTime(range.start, range.end),
        getStaffUtilizationReport(range.start, range.end),
        getStatusBreakdownReport(range.start, range.end),
        getPopularServicesReport(range.start, range.end),
      ]);
      setData({ summary, revenue, staff, status, services });
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [range.start, range.end]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const summary = data.summary;
  const revenue: RevenueDay[] = data.revenue ?? [];
  const staff: StaffUtilization[] = (data.staff ?? []).filter(
    (s) => s.active,
  );
  const status: StatusBreakdown[] = data.status ?? [];
  const services: PopularService[] = data.services ?? [];

  const maxRevenue =
    revenue.length > 0 ? Math.max(...revenue.map((d) => d.revenue)) : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">
              Welcome back, {user?.name}. Reporting range: {range.start} to{' '}
              {range.end}{' '}
              ({summary?.period.start ?? ''} – {summary?.period.end ?? ''})
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">From</label>
              <input
                type="date"
                value={range.start}
                onChange={(e) =>
                  setRange({ ...range, start: e.target.value })
                }
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">To</label>
              <input
                type="date"
                value={range.end}
                onChange={(e) => setRange({ ...range, end: e.target.value })}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            <button
              onClick={fetchReports}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Apply
            </button>
            <button
              onClick={logout}
              className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-2 rounded"
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {!loading && summary ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <KpiCard
                label="Total Bookings"
                value={summary.totalBookings}
                trend={`${summary.confirmedCount} confirmed`}
                icon={<Users className="w-5 h-5 text-indigo-600" />}
              />
              <KpiCard
                label="Total Revenue"
                value={new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(summary.totalRevenue)}
                trend={`≈ ${summary.averageRevenuePerBooking.toFixed(0)} avg/booking`}
                icon={<DollarSign className="w-5 h-5 text-indigo-600" />}
              />
              <KpiCard
                label="Completion Rate"
                value={summary.completionRate.toFixed(0) + '%'}
                trend={`${summary.completedCount} completed`}
                icon={<Activity className="w-5 h-5 text-indigo-600" />}
              />
              <KpiCard
                label="Cancelled + No-shows"
                value={summary.cancelledCount + summary.noShowCount}
                trend={`${summary.pendingCount} pending`}
                icon={<Clock className="w-5 h-5 text-indigo-600" />}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Revenue Trend</h2>
                  <span className="text-sm text-gray-500">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(summary.totalRevenue)} total
                  </span>
                </div>
                <RevenueChart series={revenue} maxRevenue={maxRevenue} />
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <Users className="w-4 h-4 mr-2" /> Staff Utilization
                </h2>
                {staff.length === 0 ? (
                  <p className="text-sm text-gray-500">No staff data.</p>
                ) : (
                  <div className="space-y-3">
                    {staff.map((s) => (
                      <div key={s.staffId} className="text-sm">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">{s.staffName}</span>
                          <span>
                            {s.utilizationPercent.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{
                              width: Math.min(100, s.utilizationPercent),
                            }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>
                            {s.bookingsCount} booking{s.bookingsCount === 1 ? '' : 's'}
                          </span>
                          <span>
                            {s.bookedMinutes}/{s.workingMinutes} min
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <Clock className="w-4 h-4 mr-2" /> Bookings by Status
                </h2>
                <div className="space-y-3">
                  {status.map((s) => (
                    <div key={s.status} className="text-sm flex justify-between">
                      <span>{s.status}</span>
                      <span className="font-mono">
                        {s.count} booking{s.count === 1 ? '' : 's'}
                      </span>
                      <span className="font-mono text-gray-500">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        }).format(s.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2" /> Popular Services
                </h2>
                {services.length === 0 ? (
                  <p className="text-sm text-gray-500">No service data.</p>
                ) : (
                  <div className="space-y-3">
                    {services.map((s) => (
                      <div key={s.serviceId} className="text-sm flex justify-between">
                        <span>{s.name}</span>
                        <span className="font-mono">
                          {s.bookings} booking{s.bookings === 1 ? '' : 's'}
                        </span>
                        <span className="font-mono text-gray-500">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                          }).format(s.revenue)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : loading && summary === null ? (
          <div className="text-center py-20 text-gray-500">Loading reports…</div>
        ) : null}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  trend,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  trend: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-gray-400">{trend}</p>
        </div>
        <div className="text-indigo-600">{icon}</div>
      </div>
    </div>
  );
}

function RevenueChart({
  series,
  maxRevenue,
}: {
  series: RevenueDay[];
  maxRevenue: number;
}) {
  if (series.length === 0 || maxRevenue === 0) {
    return (
      <div className="h-48 flex flex-col items-center justify-center text-gray-400 text-sm">
        No revenue data in range.
      </div>
    );
  }

  const barWidth = 22;
  const gap = 10;
  const chartHeight = 220;
  const topPadding = 24;

  return (
    <div className="w-full">
      <svg
        width="100%"
        height={chartHeight}
        className="text-indigo-600"
        role="img"
        aria-label="Revenue trend"
      >
        <defs>
          <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.35" />
          </linearGradient>
        </defs>
        {series.map((day, i) => {
          const height =
            maxRevenue > 0 ? (day.revenue / maxRevenue) * (chartHeight - topPadding) : 0;
          const x = i * (barWidth + gap) + 30;
          const y = chartHeight - height - 10;
          return (
            <g key={day.date}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={height}
                fill="url(#revGradient)"
                rx={2}
              />
              <text
                x={x + barWidth / 2}
                y={chartHeight - 4}
                textAnchor="middle"
                fontSize="10"
                fill="#9ca3af"
              >
                {day.date.slice(5)}
              </text>
              {day.revenue > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 6}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#4f46e5"
                  fontWeight="600"
                >
                  {day.revenue.toLocaleString(undefined, {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="mt-3 flex justify-between text-xs text-gray-500">
        <span>{series[0]?.date.slice(5)}</span>
        <span>{series[series.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  );
}
