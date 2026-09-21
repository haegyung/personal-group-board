export type WorkKind = 'task' | 'announcement' | 'question' | 'schedule';
export type WorkScope = 'personal' | 'shared';
export type WorkStatus = 'todo' | 'doing' | 'review' | 'done';
export type SyncEventType = 'publication' | 'item_update' | 'read_receipt';

export type WorkItem = {
  id: string; title: string; kind: WorkKind; scope: WorkScope; workspace: string;
  due: string; status: WorkStatus; priority: '높음' | '보통' | '낮음'; body: string;
  updatedAt: string; readBy: string[];
};
export type SyncEvent = { eventId: string; itemId: string; type: SyncEventType; occurredAt: string; state: 'pending' | 'sent' | 'failed' };
export type BoardState = { items: WorkItem[]; outbox: SyncEvent[] };

const now = '2026-09-21T09:00:00.000Z';
export const initialBoard: BoardState = { items: [
  { id: 'personal-model', title: '개인 업무 흐름 정리', kind: 'task', scope: 'personal', workspace: '나의 보드', due: '오늘', status: 'doing', priority: '높음', body: '오늘 처리할 일을 먼저 정리합니다. 공유할 내용만 팀 공간으로 보냅니다.', updatedAt: now, readBy: [] },
  { id: 'personal-research', title: '리서치 메모 정리', kind: 'task', scope: 'personal', workspace: '나의 보드', due: '내일', status: 'todo', priority: '보통', body: '개인 메모와 출처를 정리합니다.', updatedAt: now, readBy: [] },
  { id: 'announcement-1', title: '이번 주 마감 확인', kind: 'announcement', scope: 'shared', workspace: '운영팀', due: '9월 23일', status: 'doing', priority: '높음', body: '각 담당자는 오늘 오전까지 마감 가능 여부를 확인해 주세요.', updatedAt: now, readBy: ['김유진', '박민수'] },
  { id: 'question-1', title: '다음 회의에서 결정할 항목', kind: 'question', scope: 'shared', workspace: '운영팀', due: '9월 22일', status: 'review', priority: '보통', body: '우선순위가 충돌하는 업무를 질문으로 남기고, 회의에서 결정합니다.', updatedAt: now, readBy: [] },
  { id: 'schedule-1', title: '주간 업무 점검', kind: 'schedule', scope: 'shared', workspace: '운영팀', due: '매주 월요일 09:00', status: 'todo', priority: '보통', body: '업무 현황과 읽지 않은 공지를 확인합니다.', updatedAt: now, readBy: [] }
], outbox: [] };
export const kindLabel: Record<WorkKind, string> = { task: '업무', announcement: '공지', question: '질문', schedule: '일정' };
export const statusLabel: Record<WorkStatus, string> = { todo: '할 일', doing: '진행 중', review: '확인 필요', done: '완료' };
