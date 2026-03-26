import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRequestStore } from '@/store/requestStore';
import { REQUEST_TYPE_OPTIONS, SOURCE_CHANNEL_OPTIONS, PRIORITY_OPTIONS, RequestType, SourceChannel, Priority } from '@/types/request';
import { toast } from 'sonner';
import { Mail, MessageSquare, FileText, Ticket, Upload, Sparkles, AlertCircle, User, Building, Hash, Tag, Clock, Send } from 'lucide-react';

type ImportMode = 'form' | 'email' | 'chat' | 'ticketing';

const IMPORT_TABS: { mode: ImportMode; label: string; icon: React.ElementType; desc: string }[] = [
  { mode: 'form', label: 'Manual Form', icon: FileText, desc: 'Fill in details manually' },
  { mode: 'email', label: 'Email Import', icon: Mail, desc: 'Auto-parse email thread' },
  { mode: 'chat', label: 'Chat Import', icon: MessageSquare, desc: 'Parse chat conversation' },
  { mode: 'ticketing', label: 'Ticketing', icon: Ticket, desc: 'Import external ticket' },
];

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
  return { ticketId: idMatch?.[1] || '', priority: priorityMatch?.[1] || '', type: typeMatch?.[1] || '', body };
}

export default function CreateRequest() {
  const navigate = useNavigate();
  const { addRequest } = useRequestStore();
  const [importMode, setImportMode] = useState<ImportMode>('form');
  const [rawImport, setRawImport] = useState('');
  const [parsed, setParsed] = useState(false);

  const [form, setForm] = useState({
    requestorName: '', requestorEmail: '', requestorId: '',
    requestType: 'Issue' as RequestType, sourceChannel: 'Portal' as SourceChannel, priority: 'Medium' as Priority, rawDescription: '',
  });

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleParse = () => {
    if (!rawImport.trim()) { toast.error('Please paste content to import.'); return; }
    if (importMode === 'email') {
      const r = parseEmail(rawImport);
      setForm(f => ({ ...f, requestorName: r.name || f.requestorName, requestorEmail: r.email || f.requestorEmail, sourceChannel: 'Email', rawDescription: r.body || rawImport }));
    } else if (importMode === 'chat') {
      const r = parseChat(rawImport);
      setForm(f => ({ ...f, requestorName: r.name || f.requestorName, sourceChannel: 'Chat', rawDescription: r.body || rawImport }));
    } else if (importMode === 'ticketing') {
      const r = parseTicket(rawImport);
      const pm: Record<string, Priority> = { low: 'Low', medium: 'Medium', high: 'High', critical: 'High', urgent: 'High' };
      const tm: Record<string, RequestType> = { access: 'Access', issue: 'Issue', information: 'Information', change: 'Change', incident: 'Issue', request: 'Other' };
      setForm(f => ({ ...f, requestorId: r.ticketId || f.requestorId, priority: pm[r.priority.toLowerCase()] || f.priority, requestType: tm[r.type.toLowerCase()] || f.requestType, sourceChannel: 'Portal', rawDescription: r.body || rawImport }));
    }
    setParsed(true);
    toast.success('Content parsed! Review the pre-filled fields below.');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.requestorName || !form.requestorEmail || !form.rawDescription) { toast.error('Please fill in all required fields.'); return; }
    const id = addRequest(form);
    toast.success(`Request ${id} created successfully.`);
    navigate(`/requests/${id}`);
  };

  const resetImport = () => {
    setRawImport(''); setParsed(false);
    setForm({ requestorName: '', requestorEmail: '', requestorId: '', requestType: 'Issue', sourceChannel: 'Portal', priority: 'Medium', rawDescription: '' });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-extrabold tracking-tight">New Request</h1>
        <p className="text-sm text-muted-foreground mt-1">Capture an internal request from any source</p>
      </div>

      {/* Import Mode Tabs */}
      <div className="grid grid-cols-4 gap-3 mb-6 animate-slide-up opacity-0" style={{ animationDelay: '80ms' }}>
        {IMPORT_TABS.map(({ mode, label, icon: Icon, desc }) => (
          <button key={mode} type="button"
            onClick={() => { setImportMode(mode); setParsed(false); setRawImport(''); }}
            className={`group relative flex flex-col items-center gap-2 px-3 py-4 rounded-xl border text-xs font-bold transition-all duration-200
              ${importMode === mode
                ? 'border-primary bg-gradient-to-b from-primary/10 to-primary/5 text-primary shadow-sm shadow-primary/10'
                : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground hover-lift'
              }`}
          >
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center transition-colors duration-200 ${
              importMode === mode ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
            }`}>
              <Icon className="h-4 w-4" />
            </div>
            <span>{label}</span>
            <span className="text-[10px] font-medium text-muted-foreground leading-tight text-center hidden sm:block">{desc}</span>
          </button>
        ))}
      </div>

      {/* Import Area */}
      {importMode !== 'form' && (
        <div className="bg-card rounded-xl border shadow-ink p-5 mb-6 space-y-3 animate-scale-in">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
              <Upload className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {importMode === 'email' ? 'Paste Email Content' : importMode === 'chat' ? 'Paste Chat Conversation' : 'Paste Ticket Data'}
            </span>
          </div>
          <textarea value={rawImport} onChange={(e) => { setRawImport(e.target.value); setParsed(false); }}
            placeholder={importMode === 'email' ? 'From: John Doe <john@company.com>\nSubject: Need access...\n\nHi team...' : importMode === 'chat' ? '[10:32 AM] Sarah: hey, the VPN keeps dropping...' : 'Ticket ID: INC-4521\nPriority: High\n\nVPN connectivity drops...'}
            rows={7}
            className="w-full px-4 py-3 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none font-mono transition-shadow duration-200"
          />
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleParse}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-primary to-[hsl(20,100%,42%)] text-primary-foreground text-sm font-bold rounded-lg hover:opacity-90 transition-all duration-200 active:scale-[0.97] shadow-glow">
              <Sparkles className="h-3.5 w-3.5" /> Parse & Extract
            </button>
            <button type="button" onClick={resetImport} className="px-5 py-2.5 text-sm font-bold rounded-lg border hover:bg-surface-raised transition-colors duration-200">Clear</button>
            {parsed && <span className="text-xs text-success flex items-center gap-1 ml-auto font-bold animate-fade-in"><AlertCircle className="h-3 w-3" /> Fields pre-filled</span>}
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-card rounded-xl border shadow-ink p-6 space-y-6 animate-slide-up opacity-0" style={{ animationDelay: '150ms' }}>
        <fieldset className="space-y-4">
          <legend className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1.5 mb-2">
            <User className="h-3.5 w-3.5" /> Requestor Information
          </legend>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name *" value={form.requestorName} onChange={(v) => update('requestorName', v)} placeholder="e.g. Sarah Chen" icon={User} />
            <Field label="Email Address *" value={form.requestorEmail} onChange={(v) => update('requestorEmail', v)} placeholder="email@company.com" type="email" icon={Mail} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Employee ID" value={form.requestorId} onChange={(v) => update('requestorId', v)} placeholder="EMP-0000" icon={Hash} />
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1"><Building className="h-3 w-3" /> Department</label>
              <input type="text" placeholder="e.g. Engineering, HR" className="w-full px-4 py-2.5 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow duration-200" />
            </div>
          </div>
        </fieldset>

        <hr className="border-border" />

        <fieldset className="space-y-4">
          <legend className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1.5 mb-2">
            <Tag className="h-3.5 w-3.5" /> Request Classification
          </legend>
          <div className="grid grid-cols-3 gap-4">
            <SelectField label="Request Type" value={form.requestType} onChange={(v) => update('requestType', v)} options={REQUEST_TYPE_OPTIONS}
              descriptions={{ Access: 'System or resource access', Issue: 'Bug reports or incidents', Information: 'General inquiries', Change: 'Configuration changes', Other: 'Miscellaneous' }}
            />
            <SelectField label="Source Channel" value={form.sourceChannel} onChange={(v) => update('sourceChannel', v)} options={SOURCE_CHANNEL_OPTIONS} />
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1"><Clock className="h-3 w-3" /> Priority</label>
              <div className="flex gap-1.5">
                {PRIORITY_OPTIONS.map((p) => (
                  <button key={p} type="button" onClick={() => update('priority', p)}
                    className={`flex-1 px-3 py-2.5 text-sm font-bold rounded-lg border transition-all duration-200
                      ${form.priority === p
                        ? p === 'High' ? 'bg-destructive/10 border-destructive text-destructive shadow-sm'
                          : p === 'Medium' ? 'bg-warning/10 border-warning text-warning shadow-sm'
                          : 'bg-success/10 border-success text-success shadow-sm'
                        : 'bg-background text-muted-foreground hover:bg-surface-raised hover:border-foreground/20'
                      }`}
                  >{p}</button>
                ))}
              </div>
            </div>
          </div>
        </fieldset>

        <hr className="border-border" />

        <fieldset className="space-y-4">
          <legend className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1.5 mb-2">
            <FileText className="h-3.5 w-3.5" /> Request Details
          </legend>
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Raw Request Description *</label>
            <textarea value={form.rawDescription} onChange={(e) => update('rawDescription', e.target.value)}
              placeholder="Paste the original request text as received..." rows={6}
              className="w-full px-4 py-3 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none transition-shadow duration-200"
            />
            <p className="text-[11px] text-muted-foreground mt-1.5">AI will process this text to generate structured request notes.</p>
          </div>
        </fieldset>

        {/* SLA Preview */}
        <div className="bg-gradient-to-r from-primary/5 to-transparent rounded-lg px-4 py-3 flex items-center gap-3 text-xs border border-primary/15">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <div>
            <span className="font-bold text-foreground">Estimated SLA: </span>
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

        <div className="flex items-center gap-3 pt-2">
          <button type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary to-[hsl(20,100%,42%)] text-primary-foreground text-sm font-bold rounded-lg hover:opacity-90 transition-all duration-200 active:scale-[0.97] shadow-glow">
            <Send className="h-4 w-4" /> Create Request
          </button>
          <button type="button" onClick={() => navigate('/requests')} className="px-6 py-2.5 text-sm font-bold rounded-lg border hover:bg-surface-raised transition-colors duration-200">Cancel</button>
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
      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />} {label}
      </label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-2.5 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow duration-200"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options, descriptions }: {
  label: string; value: string; onChange: (v: string) => void; options: readonly string[]; descriptions?: Record<string, string>;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-foreground transition-shadow duration-200"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      {descriptions?.[value] && <p className="text-[10px] text-muted-foreground mt-1">{descriptions[value]}</p>}
    </div>
  );
}
