'use client';

const REPAIR_MESSAGES: Record<string, string> = {
  advance: "Moving on \u2014 you've got this. We'll increase the review interval.",
  reinforce: "Next: we'll reinforce this concept with a similar question.",
  contrast: "Next: a contrasting case to sharpen the distinction.",
  remediate: "Next: targeted practice on this reasoning pattern.",
  transfer_test: "Next: same rule, different clinical setting.",
};

interface RepairActionCardProps {
  action: string;
  reason: string;
}

export default function RepairActionCard({ action, reason }: RepairActionCardProps) {
  return (
    <div className="rounded-[var(--radius-card)] border border-zinc-700 bg-zinc-900/50 p-[var(--space-card-padding)]">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
        What&apos;s Next
      </h4>
      <p className="mt-2 text-sm leading-relaxed text-zinc-300">
        {REPAIR_MESSAGES[action] ?? reason}
      </p>
    </div>
  );
}
