import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRequestStore } from '@/store/requestStore';
import { StatusBadge, PriorityBadge, TypeBadge, TagBadge, DueBadge } from '@/components/badges/RequestBadges';
import { generateAINotes } from '@/lib/ai';
import { STATUS_OPTIONS, RequestStatus } from '@/types/request';
import { format, parseISO } from 'date-fns';
import { daysUntilDue } from '@/lib/sla';
import { toast } from 'sonner';
import { ArrowLeft, Sparkles, Check, MessageSquare, Clock, Edit3 } from 'lucide-react';

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { requests, updateStatus, setAINotes, updateRequest, addFollowUp, toggleFollowUp } = useRequestStore();
  const request = requests.find((r) => r.id === id);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editNotes, setEditNotes] = useState({ summary: '', details: '', proposedAction: '' });
  const [newFollowUp, setNewFollowUp] = useState('');

  if (!request) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Request not found.</p>
        <button onClick={() => navigate('/requests')} className="mt-2 text-sm text-accent hover:underline">Back to Register</button>
      </div>
    );
  }

  const isFinalized = request.status === 'Finalized';
  const days = daysUntilDue(request.dueDate);

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      const notes = await generateAINotes(request.rawDescription, request.requestType);
      setAINotes(request.id, notes);
      toast.success('AI notes generated successfully.');
    } catch {
      toast.error('Failed to generate AI notes.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStatusChange = (status: RequestStatus) => {
    updateStatus(request.id, status);
    toast.success(`Status updated to ${status}.`);
  };

  const handleStartEdit = () => {
    if (request.aiNotes) {
      setEditNotes({ summary: request.aiNotes.summary, details: request.aiNotes.details, proposedAction: request.aiNotes.proposedAction });
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    if (request.aiNotes) {
      setAINotes(request.id, { ...request.aiNotes, ...editNotes });
      setIsEditing(false);
      toast.success('Notes updated.');
    }
  };

  const handleAddFollowUp = () => {
    if (!newFollowUp.trim()) return;
    addFollowUp(request.id, newFollowUp.trim());
    setNewFollowUp('');
    toast.success('Follow-up added.');
  };

  return (
    <div className="p-6 max-w-4xl">
      <button onClick={() => navigate('/requests')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Register
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-semibold tracking-tight font-mono">{request.id}</h1>
            <StatusBadge status={request.status} />
            <PriorityBadge priority={request.priority} />
            <DueBadge dueDate={request.dueDate} />
          </div>
          <p className="text-sm text-muted-foreground">{request.requestorName} &middot; {request.requestorEmail}</p>
        </div>
        {!isFinalized && (
          <div className="flex items-center gap-2">
            {STATUS_OPTIONS.filter((s) => s !== request.status).map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className="px-3 py-1.5 text-xs font-medium rounded-md border hover:bg-surface-raised transition-colors"
              >
                {s === 'Finalized' ? 'Finalize' : `Mark ${s}`}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2 space-y-5">
          {/* Raw Description */}
          <section className="bg-card rounded-lg border shadow-ink p-4">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Raw Request</h2>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{request.rawDescription}</p>
          </section>

          {/* AI Notes */}
          <section className="bg-card rounded-lg border shadow-ink p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">AI-Generated Notes</h2>
              <div className="flex items-center gap-2">
                {request.aiNotes && !isFinalized && !isEditing && (
                  <button onClick={handleStartEdit} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Edit3 className="h-3 w-3" /> Edit
                  </button>
                )}
                {!isFinalized && (
                  <button
                    onClick={handleGenerateAI}
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-accent text-accent-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 active:scale-[0.98]"
                  >
                    <Sparkles className="h-3 w-3" />
                    {isGenerating ? 'Generating...' : request.aiNotes ? 'Regenerate' : 'Generate Notes'}
                  </button>
                )}
              </div>
            </div>

            {isGenerating && (
              <div className="animate-shimmer rounded-md p-4 border border-dashed border-accent/40 animate-pulse-border">
                <div className="h-3 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-full mb-2" />
                <div className="h-3 bg-muted rounded w-5/6" />
              </div>
            )}

            {request.aiNotes && !isGenerating && !isEditing && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground mb-1">Summary</h3>
                  <p className="text-sm">{request.aiNotes.summary}</p>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground mb-1">Details & Context</h3>
                  <p className="text-sm leading-relaxed">{request.aiNotes.details}</p>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground mb-1">Proposed Next Action</h3>
                  <p className="text-sm leading-relaxed">{request.aiNotes.proposedAction}</p>
                </div>
                {request.aiNotes.suggestedTags.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-muted-foreground mb-1.5">Suggested Tags</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {request.aiNotes.suggestedTags.map((t) => <TagBadge key={t} tag={t} />)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {isEditing && (
              <div className="space-y-3">
                <EditField label="Summary" value={editNotes.summary} onChange={(v) => setEditNotes((n) => ({ ...n, summary: v }))} />
                <EditField label="Details" value={editNotes.details} onChange={(v) => setEditNotes((n) => ({ ...n, details: v }))} textarea />
                <EditField label="Proposed Action" value={editNotes.proposedAction} onChange={(v) => setEditNotes((n) => ({ ...n, proposedAction: v }))} textarea />
                <div className="flex gap-2">
                  <button onClick={handleSaveEdit} className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90">Save</button>
                  <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-xs font-medium border rounded-md hover:bg-surface-raised">Cancel</button>
                </div>
              </div>
            )}

            {!request.aiNotes && !isGenerating && (
              <p className="text-sm text-muted-foreground italic">No AI notes generated yet. Click "Generate Notes" to create structured documentation.</p>
            )}
          </section>

          {/* Follow-ups */}
          <section className="bg-card rounded-lg border shadow-ink p-4">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Follow-ups</h2>
            {request.followUps.length > 0 && (
              <div className="space-y-2 mb-4">
                {request.followUps.map((f) => (
                  <div key={f.id} className="flex items-start gap-3 py-2 border-b last:border-b-0">
                    <button
                      onClick={() => toggleFollowUp(request.id, f.id)}
                      disabled={isFinalized}
                      className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                        f.completed ? 'bg-success border-success' : 'border-muted-foreground/30 hover:border-accent'
                      }`}
                    >
                      {f.completed && <Check className="h-2.5 w-2.5 text-success-foreground" />}
                    </button>
                    <div className="flex-1">
                      <p className={`text-sm ${f.completed ? 'line-through text-muted-foreground' : ''}`}>{f.content}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 font-mono tabular-nums">{format(parseISO(f.createdAt), 'MMM dd, HH:mm')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!isFinalized && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFollowUp}
                  onChange={(e) => setNewFollowUp(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddFollowUp()}
                  placeholder="Add a follow-up note..."
                  className="flex-1 px-3 py-2 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                />
                <button onClick={handleAddFollowUp} className="px-3 py-2 text-xs font-medium border rounded-md hover:bg-surface-raised transition-colors">
                  <MessageSquare className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-card rounded-lg border shadow-ink p-4 space-y-3">
            <DetailRow label="Request ID" value={request.id} mono />
            <DetailRow label="Employee ID" value={request.requestorId || '—'} mono />
            <DetailRow label="Type"><TypeBadge type={request.requestType} /></DetailRow>
            <DetailRow label="Source" value={request.sourceChannel} />
            <DetailRow label="Priority"><PriorityBadge priority={request.priority} /></DetailRow>
            <DetailRow label="Status"><StatusBadge status={request.status} /></DetailRow>
          </div>

          <div className="bg-card rounded-lg border shadow-ink p-4 space-y-3">
            <DetailRow label="Created" value={format(parseISO(request.createdAt), 'MMM dd, yyyy HH:mm')} mono />
            <DetailRow label="Updated" value={format(parseISO(request.updatedAt), 'MMM dd, yyyy HH:mm')} mono />
            <DetailRow label="Due Date" value={format(parseISO(request.dueDate), 'MMM dd, yyyy')} mono />
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className={`text-xs font-medium tabular-nums ${days < 0 ? 'text-destructive' : days <= 1 ? 'text-warning' : 'text-muted-foreground'}`}>
                {days < 0 ? `${Math.abs(days)} days overdue` : days === 0 ? 'Due today' : `${days} days remaining`}
              </span>
            </div>
          </div>

          {request.tags.length > 0 && (
            <div className="bg-card rounded-lg border shadow-ink p-4">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {request.tags.map((t) => <TagBadge key={t} tag={t} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono, children }: { label: string; value?: string; mono?: boolean; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children || <span className={`text-sm ${mono ? 'font-mono text-xs tabular-nums' : ''}`}>{value}</span>}
    </div>
  );
}

function EditField({ label, value, onChange, textarea }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean }) {
  const cls = "w-full px-3 py-2 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent";
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className={`${cls} resize-none`} />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
      )}
    </div>
  );
}
