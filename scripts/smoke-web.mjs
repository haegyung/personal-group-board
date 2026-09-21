import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(process.env.WEB_URL || 'http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: '새 업무' }).click();
  await page.getByLabel('업무 제목').fill('동기화 API 계약 검토');
  await page.getByRole('button', { name: '기록하기' }).click();
  await page.getByRole('button', { name: '공유하기' }).click();
  await page.getByRole('button', { name: '공유 보드' }).click();
  if (await page.getByText('동기화 API 계약 검토').count() < 1) throw new Error('공유 항목이 렌더링되지 않았습니다.');
  await page.getByRole('button', { name: '공지 확인' }).click();
  await page.getByRole('button', { name: /이번 주 마감 확인/ }).click();
  await page.getByRole('button', { name: '읽음으로 기록' }).click();
  await page.getByRole('button', { name: '동기화' }).click();
  if (await page.getByText('전송 대기').count() < 1) throw new Error('동기화 대기열이 렌더링되지 않았습니다.');
  await page.screenshot({ path: '.codex/tmp/web-dashboard-interaction.png', fullPage: true });
  console.log('Web interaction smoke test: PASS');
} finally {
  await browser.close();
}
