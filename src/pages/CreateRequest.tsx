import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRequestStore } from '@/store/requestStore';
import { REQUEST_TYPE_OPTIONS, SOURCE_CHANNEL_OPTIONS, PRIORITY_OPTIONS, RequestType, SourceChannel, Priority } from '@/types/request';
import { toast } from 'sonner';
import { Mail, MessageSquare, FileText, Ticket, Upload, Sparkles, AlertCircle, User, Building, Hash, Tag, Clock } from 'lucide-react';

type ImportMode = 'form' | 'email' | 'chat' | 'ticketing';

const IMPORT_TABS: { mode: ImportMode; label: string; icon: React.ElementType; desc: string }[] = [
  { mode: 'form', label: 'Manual Form', icon: FileText, desc: 'Fill in request details manually' },
  { mode: 'email', label: 'Email Import', icon: Mail, desc: 'Paste an email thread to auto-parse' },
  { mode: 'chat', label: 'Chat Import', icon: MessageSquare, desc: 'Paste chat/IM conversation' },
  { mode: 'ticketing', label: 'Ticketing System', icon: Ticket, desc: 'Import from external ticket' },
];

// Simple heuristic parsers for demo
function parseEmail(raw: string) {
  const fromMatch = raw.match(/from:\s*(.+)/i);
  const subjectMatch = raw.match(/subject:\s*(.+)/i);
  const emailMatch = raw.match(/[\w.-]+@[\w.-]+\.\w+/);
  const name = fromMatch?.[1]?.replace(/<.*>/, '').trim() || '';
  const email = emailMatch?.[0] || '';
  const body = raw.replace(/^(from|to|subject|date|cc|bcc):.*$/gim, '').trim();
  return { name, email, subject: subjectMatch?.[1]?.trim() || '', body };
}

function parseChat(raw: string) {
  const lines = raw.split('\n').filter(Boolean);
  const nameMatch = lines[0]?.match(/^[\[(]?\s*[\d:/ APMapm]+[\]):]?\s*([^:]+):/i);
  const name = nameMatch?.[1]?.trim() || '';
  const body = lines.map(l => l.replace(/^[\[(]?[\d:/ APMapm]+[\]):]?\s*[^:]+:\s*/i, '')).join('\n').trim();
  return { name, body };
}

function parseTicket(raw: string) {
  const idMatch = raw.match(/(?:ticket|id|ref)[#:\s-]*([A-Z0-9-]+)/i);
  const priorityMatch = raw.match(/priority[:\s]*(low|medium|high|critical|urgent)/i);
  const typeMatch = raw.match(/type[:\s]*(access|issue|information|change|incident|request)/i);
  const body = raw.replace(/^(ticket|id|ref|priority|type|status|assignee|reporter|created)[#:\s-]*.+$/gim, '').trim();
  return {
    ticketId: idMatch?.[1] || '',
    priority: priorityMatch?.[1] || '',
    type: typeMatch?.[1] || '',
    body,
  };
}

export default function CreateRequest() {
  const navigate = useNavigate();
  const { addRequest } = useRequestStore();
  const [importMode, setImportMode] = useState<ImportMode>('form');
  const [rawImport, setRawImport] = useState('');
  const [parsed, setParsed] = useState(false);

  const [form, setForm] = useState({
    requestorName: '',
    requestorEmail: '',
    requestorId: '',
    requestType: 'Issue' as RequestType,
    sourceChannel: 'Portal' as SourceChannel,
    priority: 'Medium' as Priority,
    rawDescription: '',
  });

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleParse = () => {
    if (!rawImport.trim()) {
      toast.error('Please paste content to import.');
      return;
    }

    if (importMode === 'email') {
      const result = parseEmail(rawImport);
      setForm(f => ({
        ...f,
        requestorName: result.name || f.requestorName,
        requestorEmail: result.email || f.requestorEmail,
        sourceChannel: 'Email',
        rawDescription: result.body || rawImport,
      }));
    } else if (importMode === 'chat') {
      const result = parseChat(rawImport);
      setForm(f => ({
        ...f,
        requestorName: result.name || f.requestorName,
        sourceChannel: 'Chat',
        rawDescription: result.body || rawImport,
      }));
    } else if (importMode === 'ticketing') {
      const result = parseTicket(rawImport);
      const priorityMap: Record<string, Priority> = { low: 'Low', medium: 'Medium', high: 'High', critical: 'High', urgent: 'High' };
      const typeMap: Record<string, RequestType> = { access: 'Access', issue: 'Issue', information: 'Information', change: 'Change', incident: 'Issue', request: 'Other' };
      setForm(f => ({
        ...f,
        requestorId: result.ticketId || f.requestorId,
        priority: priorityMap[result.priority.toLowerCase()] || f.priority,
        requestType: typeMap[result.type.toLowerCase()] || f.requestType,
        sourceChannel: 'Portal',
        rawDescription: result.body || rawImport,
      }));
    }

    setParsed(true);
    toast.success('Content parsed! Review the pre-filled fields below.');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.requestorName || !form.requestorEmail || !form.rawDescription) {
      toast.error('Please fill in all required fields.');
      return;
    }
    const id = addRequest(form);
    toast.success(`Request ${id} created successfully.`);
    navigate(`/requests/${id}`);
  };

  const resetImport = () => {
    setRawImport('');
    setParsed(false);
    setForm({
      requestorName: '', requestorEmail: '', requestorId: '',
      requestType: 'Issue', sourceChannel: 'Portal', priority: 'Medium', rawDescription: '',
    });
  };

  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">New Request</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Capture an internal request from any source for processing
        </p>
      </div>

      {/* Import Mode Tabs */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {IMPORT_TABS.map(({ mode, label, icon: Icon, desc }) => (
          <button
            key={mode}
            type="button"
            onClick={() => { setImportMode(mode); setParsed(false); setRawImport(''); }}
            className={`group relative flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border text-xs font-medium transition-all
              ${importMode === mode
                ? 'border-accent bg-accent/5 text-accent shadow-sm'
                : 'border-border bg-card text-muted-foreground hover:border-accent/40 hover:text-foreground'
              }`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
            <span className="text-[10px] font-normal text-muted-foreground leading-tight text-center hidden sm:block">{desc}</span>
          </button>
        ))}
      </div>

      {/* Import Area (for non-form modes) */}
      {importMode !== 'form' && (
        <div className="bg-card rounded-lg border shadow-sm p-5 mb-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Upload className="h-4 w-4 text-accent" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {importMode === 'email' && 'Paste Email Content'}
              {importMode === 'chat' && 'Paste Chat / IM Conversation'}
              {importMode === 'ticketing' && 'Paste Ticket Data'}
            </span>
          </div>

          <textarea
            value={rawImport}
            onChange={(e) => { setRawImport(e.target.value); setParsed(false); }}
            placeholder={
              importMode === 'email'
                ? 'From: John Doe <john@company.com>\nSubject: Need access to production DB\nDate: 25 Mar 2026\n\nHi team, I need access to the production database for the upcoming deployment...'
                : importMode === 'chat'
                ? '[10:32 AM] Sarah Chen: hey, the VPN keeps dropping every 10 minutes\n[10:33 AM] Sarah Chen: my whole team is affected, we cant work from home\n[10:35 AM] Sarah Chen: can someone look into this urgently?'
                : 'Ticket ID: INC-4521\nPriority: High\nType: Issue\nReporter: Marcus Lee\nStatus: Open\n\nVPN connectivity drops intermittently affecting remote team...'
            }
            rows={7}
            className="w-full px-3 py-2 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none font-mono"
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleParse}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent text-accent-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity active:scale-[0.98]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Parse & Extract
            </button>
            <button
              type="button"
              onClick={resetImport}
              className="px-4 py-2 text-sm font-medium rounded-md border hover:bg-surface-raised transition-colors"
            >
              Clear
            </button>
            {parsed && (
              <span className="text-xs text-success flex items-center gap-1 ml-auto">
                <AlertCircle className="h-3 w-3" /> Fields pre-filled — review below
              </span>
            )}
          </div>
        </div>
      )}

      {/* Request Form */}
      <form onSubmit={handleSubmit} className="bg-card rounded-lg border shadow-sm p-6 space-y-5">
        {/* Section: Requestor Info */}
        <fieldset className="space-y-4">
          <legend className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-2">
            <User className="h-3.5 w-3.5" /> Requestor Information
          </legend>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name *" value={form.requestorName} onChange={(v) => update('requestorName', v)} placeholder="e.g. Sarah Chen" icon={User} />
            <Field label="Email Address *" value={form.requestorEmail} onChange={(v) => update('requestorEmail', v)} placeholder="email@company.com" type="email" icon={Mail} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Employee ID" value={form.requestorId} onChange={(v) => update('requestorId', v)} placeholder="EMP-0000" icon={Hash} />
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Building className="h-3 w-3" /> Department
              </label>
              <input
                type="text"
                placeholder="e.g. Engineering, HR, Finance"
                className="w-full px-3 py-2 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
            </div>
          </div>
        </fieldset>

        <hr className="border-border" />

        {/* Section: Request Classification */}
        <fieldset className="space-y-4">
          <legend className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-2">
            <Tag className="h-3.5 w-3.5" /> Request Classification
          </legend>
          <div className="grid grid-cols-3 gap-4">
            <SelectField label="Request Type" value={form.requestType} onChange={(v) => update('requestType', v)} options={REQUEST_TYPE_OPTIONS}
              descriptions={{
                Access: 'System or resource access requests',
                Issue: 'Bug reports or incidents',
                Information: 'General inquiries',
                Change: 'Configuration or process changes',
                Other: 'Miscellaneous requests',
              }}
            />
            <SelectField label="Source Channel" value={form.sourceChannel} onChange={(v) => update('sourceChannel', v)} options={SOURCE_CHANNEL_OPTIONS} />
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Priority
              </label>
              <div className="flex gap-1.5">
                {PRIORITY_OPTIONS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => update('priority', p)}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-md border transition-all
                      ${form.priority === p
                        ? p === 'High'
                          ? 'bg-destructive/10 border-destructive text-destructive'
                          : p === 'Medium'
                          ? 'bg-warning/10 border-warning text-warning'
                          : 'bg-success/10 border-success text-success'
                        : 'bg-background text-muted-foreground hover:bg-surface-raised'
                      }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </fieldset>

        <hr className="border-border" />

        {/* Section: Request Details */}
        <fieldset className="space-y-4">
          <legend className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-2">
            <FileText className="h-3.5 w-3.5" /> Request Details
          </legend>
          <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
              Raw Request Description *
            </label>
            <textarea
              value={form.rawDescription}
              onChange={(e) => update('rawDescription', e.target.value)}
              placeholder="Paste the original request text as received (email body, chat message, ticket description, etc.)..."
              rows={6}
              className="w-full px-3 py-2 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none"
            />
            <p className="text-[11px] text-muted-foreground mt-1.5">
              This raw text will be processed by AI to generate structured, professional request notes after creation.
            </p>
          </div>
        </fieldset>

        {/* SLA Preview */}
        <div className="bg-surface-raised rounded-md px-4 py-3 flex items-center gap-3 text-xs">
          <Clock className="h-4 w-4 text-accent" />
          <div>
            <span className="font-medium text-foreground">Estimated SLA: </span>
            <span className="text-muted-foreground">
              {(() => {
                const { requestType, priority } = form;
                const days = { Access: { Low: 5, Medium: 3, High: 1 }, Issue: { Low: 7, Medium: 3, High: 1 }, Information: { Low: 10, Medium: 5, High: 2 }, Change: { Low: 14, Medium: 7, High: 3 }, Other: { Low: 10, Medium: 5, High: 2 } };
                const d = days[requestType]?.[priority] || 5;
                return `${d} business day${d > 1 ? 's' : ''} (${requestType} / ${priority} priority)`;
              })()}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button type="submit" className="px-5 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity active:scale-[0.98]">
            Create Request
          </button>
          <button type="button" onClick={() => navigate('/requests')} className="px-5 py-2 text-sm font-medium rounded-md border hover:bg-surface-raised transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', icon: Icon }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string; icon?: React.ElementType;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />} {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options, descriptions }: {
  label: string; value: string; onChange: (v: string) => void; options: readonly string[]; descriptions?: Record<string, string>;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent text-foreground"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      {descriptions?.[value] && (
        <p className="text-[10px] text-muted-foreground mt-1">{descriptions[value]}</p>
      )}
    </div>
  );
}
