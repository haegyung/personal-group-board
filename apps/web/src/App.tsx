import { useMemo, useState } from 'react';

type Task = { id: string; title: string; workspace: string; due: string; status: 'todo' | 'doing' | 'review' | 'done'; priority: '높음' | '보통' | '낮음' };
type View = 'personal' | 'group' | 'projects';

const seed: Task[] = [
  { id:'t1', title:'v0.1 발행 범위 검토', workspace:'제품 기획', due:'오늘', status:'review', priority:'높음' },
  { id:'t2', title:'개인 보드 데이터 모델 정리', workspace:'개인 작업', due:'오늘', status:'doing', priority:'높음' },
  { id:'t3', title:'Google Sheets 연결 계약 작성', workspace:'데이터 플랫폼', due:'내일', status:'todo', priority:'보통' },
  { id:'t4', title:'공지 확인 흐름 점검', workspace:'제품 기획', due:'9월 24일', status:'todo', priority:'보통' },
  { id:'t5', title:'RAG 출처·인용 기준 정리', workspace:'개인 작업', due:'9월 26일', status:'todo', priority:'낮음' },
];

const nav: { id: View; label: string }[] = [{id:'personal',label:'개인 작업'},{id:'group',label:'그룹 작업'},{id:'projects',label:'프로젝트 연결'}];
const statusLabel = { todo:'할 일', doing:'진행 중', review:'검토 중', done:'완료됨' };

export function App() {
  const [view, setView] = useState<View>('personal');
  const [tasks, setTasks] = useState(seed);
  const [selectedId, setSelectedId] = useState('t1');
  const [draft, setDraft] = useState('');
  const selected = tasks.find((task) => task.id === selectedId) ?? tasks[0];
  const visible = useMemo(() => view === 'personal' ? tasks.filter((task) => task.workspace === '개인 작업') : view === 'group' ? tasks.filter((task) => task.workspace !== '개인 작업') : tasks, [tasks, view]);
  const toggle = (id: string) => setTasks((all) => all.map((task) => task.id === id ? {...task, status: task.status === 'done' ? 'todo' : 'done'} : task));
  const addTask = () => { const title = draft.trim(); if (!title) return; const next: Task = {id:crypto.randomUUID(),title,workspace:view === 'group' ? '제품 기획' : '개인 작업',due:'마감 미정',status:'todo',priority:'보통'}; setTasks((all) => [next,...all]); setSelectedId(next.id); setDraft(''); };
  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><span className="brand-mark"/>나의 작업 공간</div><nav><p>작업</p>{nav.map((item) => <button className={view===item.id?'active':''} key={item.id} onClick={() => setView(item.id)}>{item.label}</button>)}<p>그룹 공간</p>{['제품 기획','데이터 플랫폼','브랜드 리서치','운영 · 관리'].map((name) => <button key={name} onClick={() => setView('group')}>{name}</button>)}</nav><div className="profile"><span className="avatar">G</span><div><strong>김해경</strong><small>개인 계정</small></div></div></aside>
    <main className="workspace"><header className="topbar"><div><h1>{view === 'personal' ? '오늘, 내 흐름을 정리합니다.' : view === 'group' ? '그룹의 약속을 실행합니다.' : '프로젝트 연결을 관리합니다.'}</h1><p>{view === 'projects' ? '권한을 가진 Google Sheet만 연결하고, 발행 이력을 남깁니다.' : '개인 원문은 개인 보드에 남고, 필요한 항목만 그룹으로 발행합니다.'}</p></div><button className="quiet-button" onClick={() => setView('personal')}>오늘</button></header>
      {view !== 'projects' && <><section className="timeline"><div className="timeline-head"><span>이번 주</span>{['월','화','수','목','금'].map((day) => <span key={day}>{day}</span>)}</div>{['개인 작업','제품 기획','데이터 플랫폼'].map((lane, laneIndex) => <div className="lane" key={lane}><strong>{lane}</strong><div className="lane-track">{tasks.filter((task) => task.workspace === lane).slice(0,2).map((task,index) => <button key={task.id} onClick={() => setSelectedId(task.id)} className={`timeline-task lane-${laneIndex} start-${index}`}>{task.title}</button>)}</div></div>)}</section>
      <section className="work-list"><div className="section-heading"><h2>{view === 'personal' ? '내 작업' : '그룹 작업'}</h2><div className="add-task"><input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => event.key==='Enter' && addTask()} placeholder="새 작업 제목"/><button onClick={addTask}>작업 추가</button></div></div><div className="table-head"><span>제목</span><span>작업 공간</span><span>마감일</span><span>상태</span><span>우선순위</span></div>{visible.map((task) => <button className={`task-row ${selectedId===task.id?'selected':''}`} key={task.id} onClick={() => setSelectedId(task.id)}><input aria-label={`${task.title} 완료`} type="checkbox" checked={task.status==='done'} onChange={(event) => { event.stopPropagation(); toggle(task.id); }}/><strong>{task.title}</strong><span>{task.workspace}</span><span className={task.due==='오늘'?'due-now':''}>{task.due}</span><span>{statusLabel[task.status]}</span><span className={`priority ${task.priority==='높음'?'high':''}`}>{task.priority}</span></button>)}</section></>}
      {view === 'projects' && <ProjectConnections />}
    </main>
    <aside className="inspector"><div className="inspector-top"><span>{selected.workspace}</span><button aria-label="패널 닫기">×</button></div><h2>{selected.title}</h2><p>개인 보드에서 검토한 뒤 그룹에 발행할 수 있는 작업입니다.</p><dl><div><dt>상태</dt><dd>{statusLabel[selected.status]}</dd></div><div><dt>마감</dt><dd>{selected.due}</dd></div><div><dt>담당</dt><dd>김해경</dd></div><div><dt>우선순위</dt><dd>{selected.priority}</dd></div></dl><div className="publish"><h3>그룹 발행</h3><p>발행하면 이벤트 ID를 남기고 같은 작업의 중복 생성을 막습니다.</p><button onClick={() => setView('group')}>그룹 보드로 열기</button></div><div className="activity"><h3>최근 이력</h3><p>개인 보드에 등록됨</p><p>그룹 발행 대기 중</p></div></aside>
  </div>;
}

function ProjectConnections() { return <section className="connections"><div><h2>연결한 프로젝트</h2><p>Google OAuth가 연결되면 선택한 스프레드시트의 구조를 읽고 동기화합니다.</p></div><article><h3>팀 업무 보드</h3><p>Google Sheet · 읽기 및 발행 권한 확인 필요</p><button>연결 설정</button></article><article><h3>새 프로젝트</h3><p>스프레드시트 URL을 추가하면 작업 공간을 만듭니다.</p><button>URL 추가</button></article></section>; }
