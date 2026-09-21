const BOARD = {
  sheets: {
    members: ['Members', ['memberId', 'name', 'email', 'role', 'active']],
    tasks: ['Tasks', ['taskId', 'title', 'ownerId', 'dueDate', 'status', 'priority', 'driveUrl', 'updatedAt']],
    notices: ['Announcements', ['noticeId', 'title', 'body', 'authorId', 'publishedAt', 'audience', 'driveUrl']],
    reads: ['ReadReceipts', ['receiptId', 'noticeId', 'memberId', 'readAt']],
    questions: ['Questions', ['questionId', 'noticeId', 'authorId', 'body', 'createdAt', 'resolvedAt']],
    activity: ['Activity', ['activityId', 'actorId', 'verb', 'targetType', 'targetId', 'message', 'createdAt']],
    schedule: ['Schedule', ['scheduleId', 'title', 'startAt', 'endAt', 'ownerId', 'driveUrl']],
    promotions: ['Promotions', ['promotionId', 'sourceType', 'sourceId', 'title', 'summary', 'proposedType', 'payload', 'status', 'actorId', 'createdAt', 'sharedAt', 'sharedTargetId']],
    syncLedger: ['SyncLedger', ['ledgerId', 'promotionId', 'targetType', 'targetId', 'actorId', 'action', 'createdAt']],
    settings: ['Settings', ['key', 'value', 'updatedAt']]
  },
  driveFolderName: 'Team Workboard Files'
};

function doGet() {
  ensureBoard_();
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('팀 업무 보드')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include_(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getBootstrap() {
  ensureBoard_();
  const data = {};
  Object.keys(BOARD.sheets).forEach((key) => data[key] = readRows_(key));
  data.serverTime = new Date().toISOString();
  data.refreshLabel = getSetting_('lastRefreshAt') || data.serverTime;
  return data;
}

function saveMember(member) {
  required_(member.name, '이름');
  const row = {
    memberId: member.memberId || Utilities.getUuid(),
    name: member.name.trim(), email: (member.email || '').trim(),
    role: member.role || 'member', active: 'TRUE'
  };
  upsert_('members', 'memberId', row);
  record_(row.memberId, '등록', 'member', row.memberId, `${row.name}님이 보드에 참여했습니다.`);
  return row;
}

function saveTask(task, actorId) {
  required_(task.title, '업무 제목');
  const row = {
    taskId: task.taskId || Utilities.getUuid(), title: task.title.trim(),
    ownerId: task.ownerId || '', dueDate: task.dueDate || '', status: task.status || 'open',
    priority: task.priority || 'normal', driveUrl: task.driveUrl || '', updatedAt: now_()
  };
  upsert_('tasks', 'taskId', row);
  record_(actorId, task.taskId ? '수정' : '등록', 'task', row.taskId, `업무: ${row.title}`);
  return row;
}

function toggleTask(taskId, actorId) {
  const task = findRow_('tasks', 'taskId', taskId);
  if (!task) throw new Error('업무를 찾을 수 없습니다.');
  task.status = task.status === 'done' ? 'open' : 'done';
  task.updatedAt = now_();
  upsert_('tasks', 'taskId', task);
  record_(actorId, task.status === 'done' ? '완료' : '재개', 'task', taskId, `업무: ${task.title}`);
  return task;
}

function saveAnnouncement(notice, actorId) {
  required_(notice.title, '공지 제목');
  const row = {
    noticeId: notice.noticeId || Utilities.getUuid(), title: notice.title.trim(),
    body: (notice.body || '').trim(), authorId: actorId || '', publishedAt: now_(),
    audience: notice.audience || 'all', driveUrl: notice.driveUrl || ''
  };
  upsert_('notices', 'noticeId', row);
  record_(actorId, '게시', 'announcement', row.noticeId, `공지: ${row.title}`);
  return row;
}

function markAnnouncementRead(noticeId, memberId) {
  const existing = readRows_('reads').find((r) => r.noticeId === noticeId && r.memberId === memberId);
  if (existing) return existing;
  const row = { receiptId: Utilities.getUuid(), noticeId, memberId, readAt: now_() };
  append_('reads', row);
  record_(memberId, '확인', 'announcement', noticeId, '공지를 확인했습니다.');
  return row;
}

function askQuestion(question, actorId) {
  required_(question.body, '질문 내용');
  const row = {
    questionId: Utilities.getUuid(), noticeId: question.noticeId || '', authorId: actorId || '',
    body: question.body.trim(), createdAt: now_(), resolvedAt: ''
  };
  append_('questions', row);
  record_(actorId, '질문', 'announcement', row.noticeId, row.body);
  return row;
}

function saveSchedule(item, actorId) {
  required_(item.title, '일정 제목');
  required_(item.startAt, '시작 시각');
  const row = {
    scheduleId: item.scheduleId || Utilities.getUuid(), title: item.title.trim(),
    startAt: item.startAt, endAt: item.endAt || '', ownerId: item.ownerId || '', driveUrl: item.driveUrl || ''
  };
  upsert_('schedule', 'scheduleId', row);
  record_(actorId, '등록', 'schedule', row.scheduleId, `일정: ${row.title}`);
  return row;
}

// 개인 보드의 원문은 저장하지 않습니다. 팀에 필요한 요약과 합의된 필드만 대기함에 남깁니다.
function savePromotion(promotion, actorId) {
  required_(promotion.title, '공유할 제목');
  const proposedType = ['task', 'announcement', 'schedule'].includes(promotion.proposedType) ? promotion.proposedType : 'task';
  const row = {
    promotionId: Utilities.getUuid(), sourceType: safeText_(promotion.sourceType, 60) || 'manual',
    sourceId: safeText_(promotion.sourceId, 160), title: safeText_(promotion.title, 180),
    summary: safeText_(promotion.summary, 600), proposedType,
    payload: JSON.stringify(compactPromotionPayload_(promotion.payload || {})), status: 'pending',
    actorId: actorId || '', createdAt: now_(), sharedAt: '', sharedTargetId: ''
  };
  append_('promotions', row);
  record_(actorId, '공유 대기', 'promotion', row.promotionId, `공유 후보: ${row.title}`);
  return row;
}

function publishPromotion(promotionId, actorId) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const promotion = findRow_('promotions', 'promotionId', promotionId);
    if (!promotion) throw new Error('공유 대기 항목을 찾을 수 없습니다.');
    if (promotion.status === 'shared') return { promotion, alreadyPublished: true };
    const payload = parseJson_(promotion.payload);
    let target;
    if (promotion.proposedType === 'announcement') {
      target = saveAnnouncement({ title: promotion.title, body: payload.body || promotion.summary, driveUrl: payload.driveUrl || '' }, actorId);
    } else if (promotion.proposedType === 'schedule') {
      required_(payload.startAt, '팀 일정의 시작 시각');
      target = saveSchedule({ title: promotion.title, startAt: payload.startAt, endAt: payload.endAt || '', ownerId: payload.ownerId || '', driveUrl: payload.driveUrl || '' }, actorId);
    } else {
      target = saveTask({ title: promotion.title, ownerId: payload.ownerId || '', dueDate: payload.dueDate || '', priority: payload.priority || 'normal', driveUrl: payload.driveUrl || '' }, actorId);
    }
    const targetType = promotion.proposedType === 'announcement' ? 'announcement' : promotion.proposedType;
    const targetId = target.noticeId || target.scheduleId || target.taskId;
    promotion.status = 'shared'; promotion.sharedAt = now_(); promotion.sharedTargetId = targetId;
    upsert_('promotions', 'promotionId', promotion);
    append_('syncLedger', { ledgerId: Utilities.getUuid(), promotionId, targetType, targetId, actorId: actorId || '', action: 'PUBLISHED', createdAt: now_() });
    record_(actorId, '팀 반영', 'promotion', promotionId, `팀 ${targetType}으로 반영: ${promotion.title}`);
    return { promotion, target, alreadyPublished: false };
  } finally {
    lock.releaseLock();
  }
}

function uploadAttachment(file, actorId) {
  if (!file || !file.base64 || !file.name) throw new Error('첨부할 파일을 선택해 주세요.');
  const bytes = Utilities.base64Decode(file.base64);
  const blob = Utilities.newBlob(bytes, file.mimeType || 'application/octet-stream', sanitizeFileName_(file.name));
  const folder = getOrCreateDriveFolder_();
  const saved = folder.createFile(blob);
  record_(actorId, '첨부', 'driveFile', saved.getId(), `파일: ${saved.getName()}`);
  return { name: saved.getName(), url: saved.getUrl(), fileId: saved.getId() };
}

function runMorningDigest() {
  ensureBoard_();
  const summary = createDigest_('morning');
  setSetting_('morningDigest', JSON.stringify(summary));
  setSetting_('lastRefreshAt', now_());
  record_('', '갱신', 'digest', 'morning', '오전 업무 요약을 갱신했습니다.');
  return summary;
}

function runPeriodicRefresh() {
  ensureBoard_();
  setSetting_('lastRefreshAt', now_());
  record_('', '갱신', 'digest', 'periodic', '주기 상태를 갱신했습니다.');
  return createDigest_('periodic');
}

function installTriggers() {
  ScriptApp.getProjectTriggers().forEach((trigger) => ScriptApp.deleteTrigger(trigger));
  ScriptApp.newTrigger('runMorningDigest').timeBased().atHour(9).everyDays(1).create();
  ScriptApp.newTrigger('runPeriodicRefresh').timeBased().everyHours(3).create();
  return '오전 9시와 3시간 주기 갱신을 설정했습니다.';
}

function ensureBoard_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(BOARD.sheets).forEach((key) => {
    const [name, headers] = BOARD.sheets[key];
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#E9EEF2');
    }
  });
  seedIfEmpty_();
}

function seedIfEmpty_() {
  if (readRows_('members').length) return;
  const members = [
    {memberId: 'm-lead', name: '김해경', email: '', role: 'lead', active: 'TRUE'},
    {memberId: 'm-design', name: '이수민', email: '', role: 'member', active: 'TRUE'},
    {memberId: 'm-dev', name: '박준호', email: '', role: 'member', active: 'TRUE'}
  ];
  members.forEach((row) => append_('members', row));
  append_('tasks', {taskId:'t-1', title:'이번 주 운영 계획 확인', ownerId:'m-lead', dueDate:dateOffset_(0), status:'open', priority:'high', driveUrl:'', updatedAt:now_()});
  append_('tasks', {taskId:'t-2', title:'공지 문구 검토', ownerId:'m-design', dueDate:dateOffset_(1), status:'open', priority:'normal', driveUrl:'', updatedAt:now_()});
  append_('notices', {noticeId:'n-1', title:'이번 주 운영 기준', body:'업무 상태와 마감일을 퇴근 전 한 번만 갱신해 주세요.', authorId:'m-lead', publishedAt:now_(), audience:'all', driveUrl:''});
}

function createDigest_(kind) {
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const tasks = readRows_('tasks');
  const notices = readRows_('notices');
  const reads = readRows_('reads');
  const members = readRows_('members').filter((m) => m.active === 'TRUE');
  const openTasks = tasks.filter((t) => t.status !== 'done');
  const dueToday = openTasks.filter((t) => t.dueDate === today);
  const unreadCount = notices.reduce((sum, n) => sum + Math.max(0, members.length - reads.filter((r) => r.noticeId === n.noticeId).length), 0);
  return { kind, createdAt: now_(), openTaskCount: openTasks.length, dueTodayCount: dueToday.length, unreadReceiptCount: unreadCount };
}

function readRows_(key) {
  const [name, headers] = BOARD.sheets[key];
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues()
    .map((values) => headers.reduce((row, header, index) => { row[header] = stringifyCell_(values[index]); return row; }, {}));
}

function append_(key, row) {
  const [name, headers] = BOARD.sheets[key];
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name).appendRow(headers.map((header) => row[header] || ''));
}

function upsert_(key, idKey, row) {
  const [name, headers] = BOARD.sheets[key];
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  const rows = readRows_(key);
  const index = rows.findIndex((item) => item[idKey] === row[idKey]);
  if (index < 0) return append_(key, row);
  sheet.getRange(index + 2, 1, 1, headers.length).setValues([headers.map((header) => row[header] || '')]);
}

function findRow_(key, idKey, value) { return readRows_(key).find((row) => row[idKey] === value); }
function record_(actorId, verb, targetType, targetId, message) { append_('activity', {activityId: Utilities.getUuid(), actorId: actorId || 'system', verb, targetType, targetId, message, createdAt: now_()}); }
function getSetting_(key) { const row = findRow_('settings', 'key', key); return row ? row.value : ''; }
function setSetting_(key, value) { upsert_('settings', 'key', {key, value, updatedAt: now_()}); }
function getOrCreateDriveFolder_() { const folders = DriveApp.getFoldersByName(BOARD.driveFolderName); return folders.hasNext() ? folders.next() : DriveApp.createFolder(BOARD.driveFolderName); }
function now_() { return new Date().toISOString(); }
function dateOffset_(days) { const d = new Date(); d.setDate(d.getDate() + days); return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd'); }
function stringifyCell_(value) { return value instanceof Date ? value.toISOString() : String(value); }
function sanitizeFileName_(value) { return value.replace(/[\\/:*?"<>|]/g, '_').slice(0, 180); }
function required_(value, label) { if (!value || !String(value).trim()) throw new Error(`${label}을 입력해 주세요.`); }
function safeText_(value, maxLength) { return String(value || '').trim().slice(0, maxLength); }
function parseJson_(value) { try { return JSON.parse(value || '{}'); } catch (_) { return {}; } }
function compactPromotionPayload_(payload) {
  return {
    ownerId: safeText_(payload.ownerId, 160), dueDate: safeText_(payload.dueDate, 32), priority: ['low', 'normal', 'high'].includes(payload.priority) ? payload.priority : 'normal',
    driveUrl: safeText_(payload.driveUrl, 500), body: safeText_(payload.body, 1200),
    startAt: safeText_(payload.startAt, 40), endAt: safeText_(payload.endAt, 40)
  };
}
