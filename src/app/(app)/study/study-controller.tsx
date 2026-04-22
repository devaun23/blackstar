'use client';

import { useState, useEffect } from 'react';
import SessionPicker from './session-picker';
import StudySession from './study-session';
import type { SessionMode, DimensionType } from '@/lib/types/database';

interface ActiveSession {
  id: string;
  mode: SessionMode;
  targetCount: number;
  targetDimensionType?: DimensionType;
  targetDimensionId?: string;
  timeLimitSeconds?: number;
  perQuestionTimer?: boolean;
}

export default function StudyController({ userId }: { userId: string }) {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [checking, setChecking] = useState(true);

  // Check for an existing active session on mount
  useEffect(() => {
    async function check() {
      const res = await fetch(`/api/session?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.session) {
          setActiveSession({
            id: data.session.id,
            mode: data.session.mode,
            targetCount: data.session.target_count,
            timeLimitSeconds: data.session.time_limit_seconds ?? undefined,
          });
        }
      }
      setChecking(false);
    }
    check();
  }, [userId]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
      </div>
    );
  }

  if (activeSession) {
    return (
      <StudySession
        userId={userId}
        sessionId={activeSession.id}
        sessionMode={activeSession.mode}
        targetCount={activeSession.targetCount}
        timeLimitSeconds={activeSession.timeLimitSeconds}
        perQuestionTimer={activeSession.perQuestionTimer}
        onSessionEnd={() => setActiveSession(null)}
      />
    );
  }

  return (
    <SessionPicker
      userId={userId}
      onSessionCreated={setActiveSession}
    />
  );
}
