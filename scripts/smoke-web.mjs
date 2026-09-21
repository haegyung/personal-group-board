import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(process.env.WEB_URL || 'http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: '프로젝트 연결' }).click();
  await page.getByText('연결한 프로젝트').waitFor();
  await page.getByRole('button', { name: '개인 작업' }).click();
  await page.getByPlaceholder('새 작업 제목').fill('동기화 API 계약 검토');
  await page.getByRole('button', { name: '작업 추가' }).click();
  if (await page.getByText('동기화 API 계약 검토').count() < 1) throw new Error('새 작업이 렌더링되지 않았습니다.');
  await page.screenshot({ path: '.codex/tmp/web-dashboard-interaction.png', fullPage: true });
  console.log('Web interaction smoke test: PASS');
} finally {
  await browser.close();
}
