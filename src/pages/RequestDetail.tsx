import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRequestStore } from '@/store/requestStore';
import { StatusBadge, PriorityBadge, TypeBadge, TagBadge, DueBadge } from '@/components/badges/RequestBadges';
import { generateAINotes } from '@/lib/ai';
import { STATUS_OPTIONS, RequestStatus } from '@/types/request';
import { format, parseISO } from 'date-fns';
import { daysUntilDue } from '@/lib/sla';
import { toast } from 'sonner';
import { ArrowLeft, Sparkles, Check, MessageSquare, Clock, Edit3, Brain } from 'lucide-react';

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
      <div className="p-6 max-w-4xl mx-auto animate-fade-in">
        <p className="text-sm text-muted-foreground">Request not found.</p>
        <button onClick={() => navigate('/requests')} className="mt-2 text-sm text-primary hover:underline font-bold">Back to Register</button>
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
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => navigate('/requests')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-5 transition-colors duration-200 font-semibold group animate-fade-in">
        <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform duration-200" /> Back to Register
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 animate-fade-in">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-extrabold tracking-tight font-mono text-gradient">{request.id}</h1>
            <StatusBadge status={request.status} />
            <PriorityBadge priority={request.priority} />
            <DueBadge dueDate={request.dueDate} />
          </div>
          <p className="text-sm text-muted-foreground font-medium">{request.requestorName} &middot; {request.requestorEmail}</p>
        </div>
        {!isFinalized && (
          <div className="flex items-center gap-2">
            {STATUS_OPTIONS.filter((s) => s !== request.status).map((s) => (
              <button key={s} onClick={() => handleStatusChange(s)}
                className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all duration-200 ${
                  s === 'Finalized'
                    ? 'bg-gradient-to-r from-primary to-[hsl(20,100%,42%)] text-primary-foreground border-primary hover:opacity-90 shadow-glow'
                    : 'hover:bg-primary/5 hover:border-primary/40'
                }`}
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
          <section className="bg-card rounded-xl border shadow-ink p-5 animate-slide-up opacity-0" style={{ animationDelay: '100ms' }}>
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Raw Request</h2>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{request.rawDescription}</p>
          </section>

          <section className="bg-card rounded-xl border shadow-ink p-5 animate-slide-up opacity-0" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Brain className="h-3.5 w-3.5 text-primary" />
                </div>
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">AI-Generated Notes</h2>
              </div>
              <div className="flex items-center gap-2">
                {request.aiNotes && !isFinalized && !isEditing && (
                  <button onClick={handleStartEdit} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors duration-200 font-bold">
                    <Edit3 className="h-3 w-3" /> Edit
                  </button>
                )}
                {!isFinalized && (
                  <button onClick={handleGenerateAI} disabled={isGenerating}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-gradient-to-r from-primary to-[hsl(20,100%,42%)] text-primary-foreground rounded-lg hover:opacity-90 transition-all duration-200 disabled:opacity-50 active:scale-[0.97] shadow-glow">
                    <Sparkles className="h-3 w-3" />
                    {isGenerating ? 'Generating...' : request.aiNotes ? 'Regenerate' : 'Generate Notes'}
                  </button>
                )}
              </div>
            </div>

            {isGenerating && (
              <div className="animate-shimmer rounded-lg p-5 border border-dashed border-primary/40 animate-pulse-border">
                <div className="h-3 bg-muted rounded-full w-3/4 mb-3" />
                <div className="h-3 bg-muted rounded-full w-full mb-3" />
                <div className="h-3 bg-muted rounded-full w-5/6" />
              </div>
            )}

            {request.aiNotes && !isGenerating && !isEditing && (
              <div className="space-y-4 animate-fade-in">
                <NoteBlock label="Summary" text={request.aiNotes.summary} />
                <NoteBlock label="Details & Context" text={request.aiNotes.details} />
                <NoteBlock label="Proposed Next Action" text={request.aiNotes.proposedAction} />
                {request.aiNotes.suggestedTags.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-muted-foreground mb-2">Suggested Tags</h3>
                    <div className="flex flex-wrap gap-1.5">{request.aiNotes.suggestedTags.map((t) => <TagBadge key={t} tag={t} />)}</div>
                  </div>
                )}
              </div>
            )}

            {isEditing && (
              <div className="space-y-3 animate-scale-in">
                <EditField label="Summary" value={editNotes.summary} onChange={(v) => setEditNotes((n) => ({ ...n, summary: v }))} />
                <EditField label="Details" value={editNotes.details} onChange={(v) => setEditNotes((n) => ({ ...n, details: v }))} textarea />
                <EditField label="Proposed Action" value={editNotes.proposedAction} onChange={(v) => setEditNotes((n) => ({ ...n, proposedAction: v }))} textarea />
                <div className="flex gap-2">
                  <button onClick={handleSaveEdit} className="px-4 py-2 text-xs font-bold bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">Save</button>
                  <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-xs font-bold border rounded-lg hover:bg-surface-raised transition-colors">Cancel</button>
                </div>
              </div>
            )}

            {!request.aiNotes && !isGenerating && (
              <div className="text-center py-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 animate-float">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">No AI notes yet. Click <span className="font-bold text-primary">"Generate Notes"</span> to create structured documentation.</p>
              </div>
            )}
          </section>

          <section className="bg-card rounded-xl border shadow-ink p-5 animate-slide-up opacity-0" style={{ animationDelay: '300ms' }}>
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Follow-ups</h2>
            {request.followUps.length > 0 && (
              <div className="space-y-1 mb-4">
                {request.followUps.map((f) => (
                  <div key={f.id} className="flex items-start gap-3 py-2.5 px-3 rounded-lg hover:bg-surface-raised transition-colors duration-150 border-b last:border-b-0">
                    <button onClick={() => toggleFollowUp(request.id, f.id)} disabled={isFinalized}
                      className={`mt-0.5 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                        f.completed ? 'bg-success border-success scale-100' : 'border-muted-foreground/30 hover:border-primary hover:scale-105'
                      }`}
                    >
                      {f.completed && <Check className="h-3 w-3 text-success-foreground" />}
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
                <input type="text" value={newFollowUp} onChange={(e) => setNewFollowUp(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddFollowUp()}
                  placeholder="Add a follow-up note..."
                  className="flex-1 px-4 py-2.5 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow duration-200"
                />
                <button onClick={handleAddFollowUp} className="px-3 py-2.5 text-xs font-bold border rounded-lg hover:bg-primary/5 hover:border-primary/40 transition-all duration-200">
                  <MessageSquare className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-card rounded-xl border shadow-ink p-5 space-y-3 animate-slide-up opacity-0" style={{ animationDelay: '150ms' }}>
            <DetailRow label="Request ID" value={request.id} mono highlight />
            <DetailRow label="Employee ID" value={request.requestorId || '—'} mono />
            <DetailRow label="Type"><TypeBadge type={request.requestType} /></DetailRow>
            <DetailRow label="Source" value={request.sourceChannel} />
            <DetailRow label="Priority"><PriorityBadge priority={request.priority} /></DetailRow>
            <DetailRow label="Status"><StatusBadge status={request.status} /></DetailRow>
          </div>

          <div className="bg-card rounded-xl border shadow-ink p-5 space-y-3 animate-slide-up opacity-0" style={{ animationDelay: '250ms' }}>
            <DetailRow label="Created" value={format(parseISO(request.createdAt), 'MMM dd, yyyy HH:mm')} mono />
            <DetailRow label="Updated" value={format(parseISO(request.updatedAt), 'MMM dd, yyyy HH:mm')} mono />
            <DetailRow label="Due Date" value={format(parseISO(request.dueDate), 'MMM dd, yyyy')} mono />
            <div className="flex items-center gap-2 pt-1">
              <div className={`h-6 w-6 rounded-md flex items-center justify-center ${days < 0 ? 'bg-destructive/10' : days <= 1 ? 'bg-warning/10' : 'bg-muted'}`}>
                <Clock className={`h-3.5 w-3.5 ${days < 0 ? 'text-destructive' : days <= 1 ? 'text-warning' : 'text-muted-foreground'}`} />
              </div>
              <span className={`text-xs font-bold tabular-nums ${days < 0 ? 'text-destructive' : days <= 1 ? 'text-warning' : 'text-muted-foreground'}`}>
                {days < 0 ? `${Math.abs(days)} days overdue` : days === 0 ? 'Due today' : `${days} days remaining`}
              </span>
            </div>
          </div>

          {request.tags.length > 0 && (
            <div className="bg-card rounded-xl border shadow-ink p-5 animate-slide-up opacity-0" style={{ animationDelay: '350ms' }}>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Tags</h3>
              <div className="flex flex-wrap gap-1.5">{request.tags.map((t) => <TagBadge key={t} tag={t} />)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NoteBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="bg-surface-raised rounded-lg p-3">
      <h3 className="text-xs font-bold text-primary mb-1">{label}</h3>
      <p className="text-sm leading-relaxed">{text}</p>
    </div>
  );
}

function DetailRow({ label, value, mono, highlight, children }: { label: string; value?: string; mono?: boolean; highlight?: boolean; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground font-semibold">{label}</span>
      {children || <span className={`text-sm ${mono ? 'font-mono text-xs tabular-nums' : ''} ${highlight ? 'text-primary font-bold' : ''}`}>{value}</span>}
    </div>
  );
}

function EditField({ label, value, onChange, textarea }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean }) {
  const cls = "w-full px-4 py-2.5 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow duration-200";
  return (
    <div>
      <label className="block text-xs font-bold text-muted-foreground mb-1">{label}</label>
      {textarea ? <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className={`${cls} resize-none`} /> : <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={cls} />}
    </div>
  );
}
