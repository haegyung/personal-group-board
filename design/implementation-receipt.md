# 개인 보드 통합 적용 영수증

- 적용일: 2026-09-21
- 경계: 개인 신호는 요약만 대기함에 저장하고, 사용자가 발행할 때만 팀 기록으로 복사한다.
- 시트 확인: `Promotions!A1:L1`, `SyncLedger!A1:G1` 헤더와 고정 행을 Google Sheets에서 다시 읽어 확인했다.

## 검증

- `Index.html` JavaScript 구문: PASS
- `Code.gs` JavaScript 구문: PASS
- `audit_text_rasterization.py`: exit code 0
- `ffd_visual_engine.py`: exit code 0, AI index 1.2
- `audit_visual_parity.py`: exit code 0, composite 92.6/100

## SHA-256

| 파일 | SHA-256 |
| --- | --- |
| `apps-script/Code.gs` | `48aad73b238f8051ff2d64ff09ef1b2b888df60cff91fbfe8cf4fbb2613899b7` |
| `apps-script/Index.html` | `4d9375e151c2aab99f18b6c6fee8ec380c9f0b6911d1da399de6cd14986aafea` |
| `assets/private-to-team-anchor.png` | `e4fa698c491ad1ef991f46d1678308d7b901739df00d012844967cf71c248e0d` |
