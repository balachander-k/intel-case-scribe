import { useRequestStore } from '@/store/requestStore';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { StatusBadge, PriorityBadge, DueBadge } from '@/components/badges/RequestBadges';
import { isOverdue } from '@/lib/sla';
import { format, parseISO } from 'date-fns';
import { AlertTriangle, CheckCircle2, Clock, FileText, ArrowRight, TrendingUp } from 'lucide-react';

const CHART_COLORS = ['hsl(27,100%,47%)', 'hsl(145,63%,42%)', 'hsl(38,92%,50%)', 'hsl(0,72%,51%)', 'hsl(0,0%,60%)'];

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
      {/* Hero header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-[hsl(20,100%,42%)] flex items-center justify-center shadow-glow">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-balance">Operations Dashboard</h1>
            <p className="text-sm text-muted-foreground">Real-time overview of internal request pipeline</p>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { icon: FileText, label: 'Total Open', value: openRequests.length, color: 'primary', delay: 'stagger-1' },
          { icon: AlertTriangle, label: 'Overdue', value: overdueRequests.length, color: 'destructive', delay: 'stagger-2' },
          { icon: CheckCircle2, label: 'On Time', value: onTimeRequests, color: 'success', delay: 'stagger-3' },
          { icon: Clock, label: 'Total Requests', value: requests.length, color: 'muted-foreground', delay: 'stagger-4' },
        ].map(({ icon: Icon, label, value, color, delay }) => (
          <div key={label} className={`bg-card rounded-xl border p-5 shadow-ink hover-lift hover-glow cursor-default animate-stagger-in opacity-0 ${delay}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
              <div className={`h-9 w-9 rounded-lg bg-${color}/10 flex items-center justify-center`}>
                <Icon className={`h-4 w-4 text-${color}`} />
              </div>
            </div>
            <p className="text-3xl font-extrabold tabular-nums animate-count-up opacity-0" style={{ animationDelay: '200ms' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-card rounded-xl border p-5 shadow-ink hover-lift animate-slide-up opacity-0" style={{ animationDelay: '100ms' }}>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">By Status</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statusCounts}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(0,0%,45%)' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(0,0%,45%)' }} axisLine={false} tickLine={false} width={24} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid hsl(30,12%,90%)', boxShadow: '0 4px 12px rgba(0,0,0,.08)' }} />
              <Bar dataKey="count" fill="hsl(27,100%,47%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border p-5 shadow-ink hover-lift animate-slide-up opacity-0" style={{ animationDelay: '200ms' }}>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">By Type</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={typeCounts} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="count" paddingAngle={3} strokeWidth={2} stroke="hsl(0,0%,100%)">
                {typeCounts.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid hsl(30,12%,90%)', boxShadow: '0 4px 12px rgba(0,0,0,.08)' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {typeCounts.map((t, i) => (
              <div key={t.name} className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                {t.name}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border p-5 shadow-ink hover-lift animate-slide-up opacity-0" style={{ animationDelay: '300ms' }}>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">By Priority (Open)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={priorityCounts} layout="vertical">
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(0,0%,45%)' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'hsl(0,0%,45%)' }} axisLine={false} tickLine={false} width={52} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid hsl(30,12%,90%)', boxShadow: '0 4px 12px rgba(0,0,0,.08)' }} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                {priorityCounts.map((entry, i) => (
                  <Cell key={i} fill={entry.name === 'High' ? 'hsl(0,72%,51%)' : entry.name === 'Medium' ? 'hsl(38,92%,50%)' : 'hsl(0,0%,70%)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Overdue Requests */}
      {overdueRequests.length > 0 && (
        <div className="bg-card rounded-xl border p-5 shadow-ink animate-fade-in" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-6 w-6 rounded-md bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            </div>
            <h2 className="text-xs font-bold text-destructive uppercase tracking-wider">Overdue Requests</h2>
          </div>
          <div className="space-y-0">
            {overdueRequests.slice(0, 5).map((r, i) => (
              <button
                key={r.id}
                onClick={() => navigate(`/requests/${r.id}`)}
                className="w-full flex items-center gap-4 px-4 py-3 hover:bg-primary/5 rounded-lg transition-all duration-200 text-left group animate-stagger-in opacity-0"
                style={{ animationDelay: `${500 + i * 80}ms` }}
              >
                <span className="font-mono text-xs text-primary font-bold w-24">{r.id}</span>
                <span className="text-sm font-semibold flex-1 truncate">{r.requestorName}</span>
                <PriorityBadge priority={r.priority} />
                <StatusBadge status={r.status} />
                <span className="font-mono text-xs text-muted-foreground tabular-nums w-20">{format(parseISO(r.dueDate), 'MMM dd')}</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
