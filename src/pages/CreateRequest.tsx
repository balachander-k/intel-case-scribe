import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRequestStore } from '@/store/requestStore';
import { REQUEST_TYPE_OPTIONS, SOURCE_CHANNEL_OPTIONS, PRIORITY_OPTIONS, RequestType, SourceChannel, Priority } from '@/types/request';
import { toast } from 'sonner';

export default function CreateRequest() {
  const navigate = useNavigate();
  const { addRequest } = useRequestStore();

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

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">New Request</h1>
        <p className="text-sm text-muted-foreground mt-1">Capture an internal request for processing</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-lg border shadow-ink p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Requestor Name *" value={form.requestorName} onChange={(v) => update('requestorName', v)} placeholder="Full name" />
          <Field label="Requestor Email *" value={form.requestorEmail} onChange={(v) => update('requestorEmail', v)} placeholder="email@company.com" type="email" />
        </div>

        <Field label="Employee ID" value={form.requestorId} onChange={(v) => update('requestorId', v)} placeholder="EMP-0000" />

        <div className="grid grid-cols-3 gap-4">
          <SelectField label="Request Type" value={form.requestType} onChange={(v) => update('requestType', v)} options={REQUEST_TYPE_OPTIONS} />
          <SelectField label="Source Channel" value={form.sourceChannel} onChange={(v) => update('sourceChannel', v)} options={SOURCE_CHANNEL_OPTIONS} />
          <SelectField label="Priority" value={form.priority} onChange={(v) => update('priority', v)} options={PRIORITY_OPTIONS} />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
            Raw Request Description *
          </label>
          <textarea
            value={form.rawDescription}
            onChange={(e) => update('rawDescription', e.target.value)}
            placeholder="Paste the original request text as received (email, chat message, etc.)..."
            rows={6}
            className="w-full px-3 py-2 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none"
          />
        </div>

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

function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}</label>
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

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: readonly string[] }) {
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
    </div>
  );
}
