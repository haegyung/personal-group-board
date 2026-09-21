-- 개인 원본은 이 공유 DB에 저장하지 않는다. 공유를 선택한 이벤트만 수신한다.
ALTER TABLE board_items ADD COLUMN IF NOT EXISTS source_event_id UUID UNIQUE;
ALTER TABLE board_items ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'workspace'
  CHECK (visibility IN ('workspace', 'announcement'));

CREATE TABLE sync_events (
  event_id UUID PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES users(id),
  source_device_id UUID,
  event_type TEXT NOT NULL CHECK (event_type IN ('publication', 'item_update', 'read_receipt')),
  subject_id UUID,
  payload JSONB NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  applied_at TIMESTAMPTZ
);

CREATE TABLE announcement_receipts (
  announcement_id UUID NOT NULL REFERENCES board_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID UNIQUE REFERENCES sync_events(event_id),
  read_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (announcement_id, user_id)
);

CREATE INDEX sync_events_workspace_received_idx ON sync_events(workspace_id, received_at DESC);
CREATE INDEX announcement_receipts_announcement_idx ON announcement_receipts(announcement_id, read_at DESC);
