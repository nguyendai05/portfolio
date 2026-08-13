CREATE TABLE rate_limit_buckets (
  scope VARCHAR(64) NOT NULL,
  bucket_key CHAR(64) NOT NULL,
  window_started_at TIMESTAMP(3) NOT NULL,
  request_count INT UNSIGNED NOT NULL DEFAULT 1,
  expires_at TIMESTAMP(3) NOT NULL,
  PRIMARY KEY (scope, bucket_key),
  INDEX idx_rate_limit_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE admin_auth_state (
  id TINYINT UNSIGNED PRIMARY KEY,
  session_version INT UNSIGNED NOT NULL DEFAULT 1,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO admin_auth_state (id, session_version) VALUES (1, 1);

CREATE TABLE admin_sessions (
  sid_hash CHAR(64) PRIMARY KEY,
  token_version INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP NULL,
  INDEX idx_admin_sessions_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE admin_audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  request_id VARCHAR(64) NOT NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(64) NULL,
  resource_id VARCHAR(128) NULL,
  outcome ENUM('success','failure') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin_audit_created (created_at),
  INDEX idx_admin_audit_request (request_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE contact_messages
  ADD COLUMN idempotency_hash CHAR(64) NULL,
  ADD COLUMN delivery_status ENUM('pending','processing','sent','failed','unknown') NOT NULL DEFAULT 'unknown',
  ADD COLUMN delivery_attempted_at TIMESTAMP NULL,
  ADD COLUMN delivery_error_code VARCHAR(64) NULL,
  ADD UNIQUE INDEX uq_contact_idempotency (idempotency_hash),
  ADD INDEX idx_contact_delivery (delivery_status, created_at),
  ADD INDEX idx_contact_cursor (created_at, id);

ALTER TABLE ideas
  ADD INDEX idx_ideas_cursor (created_at, id);
