import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRequestStore } from '@/store/requestStore';
import { StatusBadge, PriorityBadge, TypeBadge, DueBadge } from '@/components/badges/RequestBadges';
import { RequestStatus, Priority, RequestType } from '@/types/request';
import { format, parseISO } from 'date-fns';
import { Search, ArrowUpDown, Plus, ListFilter } from 'lucide-react';

export default function RequestRegister() {
  const { requests } = useRequestStore();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<RequestStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | ''>('');
  const [typeFilter, setTypeFilter] = useState<RequestType | ''>('');
  const [sortField, setSortField] = useState<'createdAt' | 'dueDate' | 'priority'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filtered = useMemo(() => {
    let result = [...requests];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((r) =>
        r.id.toLowerCase().includes(q) || r.requestorName.toLowerCase().includes(q) ||
        r.requestorEmail.toLowerCase().includes(q) || r.rawDescription.toLowerCase().includes(q)
      );
    }
    if (statusFilter) result = result.filter((r) => r.status === statusFilter);
    if (priorityFilter) result = result.filter((r) => r.priority === priorityFilter);
    if (typeFilter) result = result.filter((r) => r.requestType === typeFilter);

    const priorityOrder = { High: 3, Medium: 2, Low: 1 };
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'createdAt') cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      else if (sortField === 'dueDate') cmp = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      else cmp = priorityOrder[a.priority] - priorityOrder[b.priority];
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return result;
  }, [requests, search, statusFilter, priorityFilter, typeFilter, sortField, sortDir]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('desc'); }
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Request Register</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} of {requests.length} requests</p>
        </div>
        <button
          onClick={() => navigate('/create')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-[hsl(20,100%,42%)] text-primary-foreground text-sm font-bold rounded-lg hover:opacity-90 transition-all duration-200 active:scale-[0.97] shadow-glow hover:shadow-[0_0_30px_hsl(27,100%,47%,0.25)]"
        >
          <Plus className="h-4 w-4" />
          New Request
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 animate-slide-up opacity-0" style={{ animationDelay: '100ms' }}>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by ID, name, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-sm bg-card border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow duration-200"
          />
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <ListFilter className="h-4 w-4" />
        </div>
        <SelectFilter label="Status" value={statusFilter} onChange={(v) => setStatusFilter(v as any)} options={['Draft', 'Reviewed', 'Approved', 'Finalized']} />
        <SelectFilter label="Priority" value={priorityFilter} onChange={(v) => setPriorityFilter(v as any)} options={['Low', 'Medium', 'High']} />
        <SelectFilter label="Type" value={typeFilter} onChange={(v) => setTypeFilter(v as any)} options={['Access', 'Issue', 'Information', 'Change', 'Other']} />
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border shadow-ink overflow-hidden animate-slide-up opacity-0" style={{ animationDelay: '200ms' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gradient-to-r from-primary/5 to-transparent">
              <Th onClick={() => toggleSort('createdAt')} active={sortField === 'createdAt'}>Request ID</Th>
              <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Requestor</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Type</th>
              <Th onClick={() => toggleSort('priority')} active={sortField === 'priority'}>Priority</Th>
              <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
              <Th onClick={() => toggleSort('dueDate')} active={sortField === 'dueDate'}>Due Date</Th>
              <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Created</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr
                key={r.id}
                onClick={() => navigate(`/requests/${r.id}`)}
                className="border-b last:border-b-0 hover:bg-primary/5 cursor-pointer transition-colors duration-150 group"
              >
                <td className="px-4 py-3.5 font-mono text-xs tabular-nums font-bold text-primary">{r.id}</td>
                <td className="px-4 py-3.5">
                  <div className="text-sm font-semibold group-hover:text-primary transition-colors">{r.requestorName}</div>
                  <div className="text-xs text-muted-foreground">{r.requestorEmail}</div>
                </td>
                <td className="px-4 py-3.5"><TypeBadge type={r.requestType} /></td>
                <td className="px-4 py-3.5"><PriorityBadge priority={r.priority} /></td>
                <td className="px-4 py-3.5"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs tabular-nums">{format(parseISO(r.dueDate), 'MMM dd, yyyy')}</span>
                    <DueBadge dueDate={r.dueDate} />
                  </div>
                </td>
                <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground tabular-nums">
                  {format(parseISO(r.createdAt), 'MMM dd')}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">No requests match your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SelectFilter({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2.5 text-sm bg-card border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-foreground font-medium transition-shadow duration-200"
    >
      <option value="">All {label}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Th({ children, onClick, active }: { children: React.ReactNode; onClick: () => void; active: boolean }) {
  return (
    <th onClick={onClick}
      className={`text-left px-4 py-3 text-xs font-bold uppercase tracking-wider cursor-pointer select-none transition-colors duration-200 ${
        active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      <span className="inline-flex items-center gap-1">{children}<ArrowUpDown className="h-3 w-3" /></span>
    </th>
  );
}
