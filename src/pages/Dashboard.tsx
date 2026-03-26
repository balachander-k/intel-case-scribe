import { useRequestStore } from '@/store/requestStore';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { StatusBadge, PriorityBadge, DueBadge } from '@/components/badges/RequestBadges';
import { isOverdue } from '@/lib/sla';
import { format, parseISO } from 'date-fns';
import { AlertTriangle, CheckCircle2, Clock, FileText, ArrowRight } from 'lucide-react';

const CHART_COLORS = ['hsl(27,100%,47%)', 'hsl(145,63%,42%)', 'hsl(38,92%,50%)', 'hsl(0,72%,51%)', 'hsl(0,0%,45%)'];

export default function Dashboard() {
  const { requests } = useRequestStore();
  const navigate = useNavigate();

  const openRequests = requests.filter((r) => r.status !== 'Finalized');
  const overdueRequests = requests.filter((r) => r.status !== 'Finalized' && isOverdue(r.dueDate));
  const onTimeRequests = openRequests.length - overdueRequests.length;

  const statusCounts = ['Draft', 'Reviewed', 'Approved', 'Finalized'].map((s) => ({
    name: s,
    count: requests.filter((r) => r.status === s).length,
  }));

  const typeCounts = ['Access', 'Issue', 'Information', 'Change', 'Other'].map((t) => ({
    name: t,
    count: requests.filter((r) => r.requestType === t).length,
  })).filter((t) => t.count > 0);

  const priorityCounts = [
    { name: 'High', count: openRequests.filter((r) => r.priority === 'High').length },
    { name: 'Medium', count: openRequests.filter((r) => r.priority === 'Medium').length },
    { name: 'Low', count: openRequests.filter((r) => r.priority === 'Low').length },
  ];

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-balance">Operations Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time overview of internal request pipeline</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <MetricCard icon={FileText} label="Total Open" value={openRequests.length} accent="primary" />
        <MetricCard icon={AlertTriangle} label="Overdue" value={overdueRequests.length} accent="destructive" />
        <MetricCard icon={CheckCircle2} label="On Time" value={onTimeRequests} accent="success" />
        <MetricCard icon={Clock} label="Total Requests" value={requests.length} accent="muted-foreground" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-lg border p-5 shadow-ink">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">By Status</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statusCounts}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(30,15%,88%)' }} />
              <Bar dataKey="count" fill="hsl(27,100%,47%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-lg border p-5 shadow-ink">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">By Type</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={typeCounts} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="count" paddingAngle={2}>
                {typeCounts.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(30,15%,88%)' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {typeCounts.map((t, i) => (
              <div key={t.name} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                {t.name}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-lg border p-5 shadow-ink">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">By Priority (Open)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={priorityCounts} layout="vertical">
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={52} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(30,15%,88%)' }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {priorityCounts.map((entry, i) => (
                  <Cell key={i} fill={entry.name === 'High' ? 'hsl(0,72%,51%)' : entry.name === 'Medium' ? 'hsl(38,92%,50%)' : 'hsl(0,0%,65%)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent overdue */}
      {overdueRequests.length > 0 && (
        <div className="bg-card rounded-lg border p-5 shadow-ink">
          <h2 className="text-xs font-bold text-destructive uppercase tracking-wider mb-3">Overdue Requests</h2>
          <div className="space-y-0">
            {overdueRequests.slice(0, 5).map((r) => (
              <button
                key={r.id}
                onClick={() => navigate(`/requests/${r.id}`)}
                className="w-full flex items-center gap-4 px-3 py-2.5 hover:bg-surface-raised rounded-md transition-colors text-left"
              >
                <span className="font-mono text-xs text-muted-foreground w-24">{r.id}</span>
                <span className="text-sm font-medium flex-1 truncate">{r.requestorName}</span>
                <PriorityBadge priority={r.priority} />
                <StatusBadge status={r.status} />
                <span className="font-mono text-xs text-muted-foreground tabular-nums w-20">{format(parseISO(r.dueDate), 'MMM dd')}</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: number; accent: string }) {
  return (
    <div className="bg-card rounded-lg border p-5 shadow-ink hover:shadow-elevated transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className={`h-4 w-4 text-${accent}`} />
        </div>
      </div>
      <p className="text-3xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
