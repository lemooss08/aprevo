import { StudyData, Subject, StudySession } from '../types';

export interface StudyMergeResult extends StudyData {
  hasChanges: boolean;
}

export function mergeStudyData(local: StudyData, remote: StudyData): StudyMergeResult {
  const deleted = new Set([...(local.deletedIds ?? []), ...(remote.deletedIds ?? [])]);
  let hasChanges = deleted.size !== (local.deletedIds?.length ?? 0);

  // Merge Subjects by ID (Union with latest updatedAt winning)
  const subjectMap = new Map<string, Subject>();
  local.subjects.forEach((s) => subjectMap.set(s.id, s));
  remote.subjects.forEach((remSub) => {
    if (deleted.has(remSub.id)) return;
    const locSub = subjectMap.get(remSub.id);
    if (!locSub) {
      subjectMap.set(remSub.id, remSub);
      hasChanges = true;
    } else {
      const remTime = new Date(remSub.updatedAt || remSub.createdAt).getTime();
      const locTime = new Date(locSub.updatedAt || locSub.createdAt).getTime();
      if (remTime > locTime) {
        subjectMap.set(remSub.id, remSub);
        hasChanges = true;
      }
    }
  });

  // Merge Sessions by ID (Union: no session lost, latest edit wins)
  const sessionMap = new Map<string, StudySession>();
  local.sessions.forEach((s) => sessionMap.set(s.id, s));
  remote.sessions.forEach((remSess) => {
    if (deleted.has(remSess.id)) return;
    const locSess = sessionMap.get(remSess.id);
    if (!locSess) {
      sessionMap.set(remSess.id, remSess);
      hasChanges = true;
    } else {
      const remTime = new Date(remSess.updatedAt || remSess.endedAt).getTime();
      const locTime = new Date(locSess.updatedAt || locSess.endedAt).getTime();
      if (remTime > locTime) {
        sessionMap.set(remSess.id, remSess);
        hasChanges = true;
      }
    }
  });

  for (const id of deleted) {
    const subjectRemoved = subjectMap.delete(id);
    const sessionRemoved = sessionMap.delete(id);
    hasChanges ||= subjectRemoved || sessionRemoved;
  }

  // Legacy preferences have no edit timestamp.
  const remoteSettingsWin = (remote.settings.updatedAt ?? '') > (local.settings.updatedAt ?? '');
  const settings = remoteSettingsWin ? remote.settings : local.settings;
  hasChanges ||= remoteSettingsWin;

  return {
    deletedIds: [...deleted],
    subjects: Array.from(subjectMap.values()),
    sessions: Array.from(sessionMap.values()).sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    ),
    settings,
    hasChanges,
  };
}

