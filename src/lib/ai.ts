import { AINotes } from '@/types/request';

// Simulated AI note generation - in production, connect to Lovable Cloud edge function
export async function generateAINotes(rawDescription: string, requestType: string): Promise<AINotes> {
  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Simple heuristic-based generation for demo
  const cleaned = rawDescription
    .replace(/\b(pls|plz)\b/gi, 'please')
    .replace(/\b(cant|can't)\b/gi, 'cannot')
    .replace(/\b(asap)\b/gi, 'as soon as possible')
    .replace(/\b(tmrw)\b/gi, 'tomorrow')
    .replace(/\b(pw)\b/gi, 'password')
    .replace(/\b(db)\b/gi, 'database')
    .replace(/\b(prod)\b/gi, 'production')
    .replace(/\b(vpn)\b/gi, 'VPN');

  const sentences = cleaned.split(/[.!?]+/).filter(Boolean).map((s) => s.trim());
  const firstSentence = sentences[0] || cleaned.slice(0, 100);

  // Generate tags based on content
  const tagMap: Record<string, string[]> = {
    access: ['Access', 'Permissions'],
    password: ['Credentials', 'Access'],
    database: ['Database', 'Infrastructure'],
    deploy: ['Deployment', 'Release'],
    timeout: ['Performance', 'Infrastructure'],
    dashboard: ['Dashboard', 'UI'],
    vpn: ['VPN', 'Network', 'Remote'],
    email: ['Email', 'Communications'],
    license: ['Licensing', 'Procurement'],
    urgent: ['Urgent'],
    critical: ['Urgent', 'Critical'],
    team: ['Team-Wide'],
  };

  const suggestedTags: string[] = [];
  const lowerDesc = rawDescription.toLowerCase();
  for (const [keyword, tags] of Object.entries(tagMap)) {
    if (lowerDesc.includes(keyword)) {
      tags.forEach((t) => { if (!suggestedTags.includes(t)) suggestedTags.push(t); });
    }
  }
  if (suggestedTags.length === 0) suggestedTags.push(requestType);

  return {
    summary: `${requestType} request: ${firstSentence.charAt(0).toUpperCase() + firstSentence.slice(1)}`,
    details: `The requestor has reported the following: ${cleaned}. This has been categorized as a ${requestType.toLowerCase()} request and requires attention per standard operating procedures.`,
    proposedAction: `Review the ${requestType.toLowerCase()} request details. Assess requirements and assign to the appropriate team for resolution. Follow up with the requestor to confirm receipt and provide an estimated timeline.`,
    suggestedTags,
  };
}
