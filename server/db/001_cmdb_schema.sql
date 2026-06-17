-- ============================================================
-- CMDB Schema — Dashboard Editor
-- Unified Configuration Management Database
-- ============================================================

-- ============ 1. CI (Configuration Items) Core ============

CREATE TABLE IF NOT EXISTS ci_types (
  id          SERIAL PRIMARY KEY,
  parent_id   INT REFERENCES ci_types(id),
  code        VARCHAR(64) NOT NULL UNIQUE,
  name        VARCHAR(128) NOT NULL,
  icon        VARCHAR(64),
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ci (
  id            SERIAL PRIMARY KEY,
  ci_type_id    INT NOT NULL REFERENCES ci_types(id),
  name          VARCHAR(256) NOT NULL,
  identifier    VARCHAR(128),
  ip            VARCHAR(64),
  status        VARCHAR(32) DEFAULT 'active',
  region        VARCHAR(128),
  vdc           VARCHAR(128),
  app_level     VARCHAR(64),
  owner         VARCHAR(128),
  source        VARCHAR(64),
  os_type       VARCHAR(64),
  db_type       VARCHAR(64),
  mw_type       VARCHAR(64),
  firmware      VARCHAR(128),
  dev_type      VARCHAR(64),
  metadata      JSONB DEFAULT '{}',
  description   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ci_relationships (
  id                SERIAL PRIMARY KEY,
  source_ci_id      INT NOT NULL REFERENCES ci(id) ON DELETE CASCADE,
  target_ci_id      INT NOT NULL REFERENCES ci(id) ON DELETE CASCADE,
  relationship_type VARCHAR(64) NOT NULL,
  description       TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ci_type ON ci(ci_type_id);
CREATE INDEX idx_ci_status ON ci(status);
CREATE INDEX idx_ci_region ON ci(region);

-- ============ 2. IAM ============

CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  username   VARCHAR(128) NOT NULL UNIQUE,
  name       VARCHAR(256),
  email      VARCHAR(256),
  phone      VARCHAR(32),
  "role"       VARCHAR(64),
  enabled    BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roles (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(128) NOT NULL UNIQUE,
  description TEXT,
  user_count  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_role (
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS user_groups (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(128) NOT NULL UNIQUE,
  description TEXT,
  users       INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resource_groups (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(128) NOT NULL UNIQUE,
  description TEXT,
  resources   INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS policies (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(256) NOT NULL,
  type        VARCHAR(64),
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============ 3. Security / Integration ============

CREATE TABLE IF NOT EXISTS applications (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(256) NOT NULL,
  type        VARCHAR(64),
  protocol    VARCHAR(64),
  tenant      VARCHAR(128),
  status      VARCHAR(32) DEFAULT 'active',
  app_id      VARCHAR(256),
  has_shortcut BOOLEAN DEFAULT FALSE,
  shortcut_group VARCHAR(128),
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS identity_providers (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(256) NOT NULL,
  protocol    VARCHAR(64),
  status      VARCHAR(32) DEFAULT 'active',
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS integration_accounts (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(256) NOT NULL,
  provider   VARCHAR(128),
  status     VARCHAR(32) DEFAULT 'active',
  last_sync  TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ 4. Alert ============

CREATE TABLE IF NOT EXISTS alert_rules (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(256) NOT NULL,
  description TEXT,
  level       VARCHAR(32),
  target      VARCHAR(256),
  condition   TEXT,
  enabled     BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alerts (
  id              SERIAL PRIMARY KEY,
  rule_id         INT REFERENCES alert_rules(id),
  ci_id           INT REFERENCES ci(id),
  level           VARCHAR(32) NOT NULL,
  title           VARCHAR(512),
  resource        VARCHAR(256),
  metric          VARCHAR(128),
  current_value   VARCHAR(64),
  threshold       VARCHAR(64),
  duration        VARCHAR(64),
  display_duration VARCHAR(64),
  duration_minutes INT,
  trigger_time    TIMESTAMPTZ,
  recovery_time   TIMESTAMPTZ,
  status          VARCHAR(32) DEFAULT 'active',
  suggestion      TEXT,
  operator        VARCHAR(128),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_level ON alerts(level);

-- ============ 5. Account Management ============

CREATE TABLE IF NOT EXISTS account_policies (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(256) NOT NULL,
  account_type   VARCHAR(64) NOT NULL,
  min_len        INT DEFAULT 8,
  expire_days    INT DEFAULT 90,
  lock_threshold INT DEFAULT 5,
  lock_duration  INT DEFAULT 30,
  timeout        INT DEFAULT 600,
  mfa            BOOLEAN DEFAULT FALSE,
  scope          VARCHAR(256),
  status         VARCHAR(32) DEFAULT 'active',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(256) NOT NULL,
  account_type  VARCHAR(64) NOT NULL,
  ci_id         INT REFERENCES ci(id),
  host          VARCHAR(256),
  port          INT,
  instance      VARCHAR(256),
  ip            VARCHAR(64),
  os_type       VARCHAR(64),
  db_type       VARCHAR(64),
  mw_type       VARCHAR(64),
  dev_type      VARCHAR(64),
  system        VARCHAR(128),
  status        VARCHAR(32) DEFAULT 'active',
  "user"          VARCHAR(128),
  "role"          VARCHAR(128),
  location      VARCHAR(256),
  last_login    TIMESTAMPTZ,
  description   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_accounts_type ON accounts(account_type);

CREATE TABLE IF NOT EXISTS safeboxes (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(256) NOT NULL,
  status      VARCHAR(32) DEFAULT 'active',
  scope       VARCHAR(256),
  permissions TEXT,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS safebox_accounts (
  id                SERIAL PRIMARY KEY,
  safebox_id        INT NOT NULL REFERENCES safeboxes(id) ON DELETE CASCADE,
  account_id        INT REFERENCES accounts(id),
  account_name      VARCHAR(256),
  account_status    VARCHAR(32),
  mgmt_status       VARCHAR(32),
  resource_ip       VARCHAR(64),
  resource_name     VARCHAR(256),
  device_type       VARCHAR(64),
  os_type           VARCHAR(64),
  region            VARCHAR(128),
  app               VARCHAR(128),
  last_login        TIMESTAMPTZ,
  description       TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS snapshots (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(256) NOT NULL,
  ci_id       INT REFERENCES ci(id),
  snap_type   VARCHAR(64),
  size        VARCHAR(32),
  creator     VARCHAR(128),
  status      VARCHAR(32) DEFAULT 'active',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS backup_tasks (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(256) NOT NULL,
  ci_id        INT REFERENCES ci(id),
  backup_type  VARCHAR(64),
  target       VARCHAR(512),
  schedule     VARCHAR(256),
  retention    VARCHAR(64),
  last_backup  TIMESTAMPTZ,
  status       VARCHAR(32) DEFAULT 'active',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============ 6. Operations ============

CREATE TABLE IF NOT EXISTS jobs (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(256) NOT NULL,
  target      VARCHAR(512),
  progress    INT DEFAULT 0,
  start_time  TIMESTAMPTZ,
  status      VARCHAR(32) DEFAULT 'running',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_history (
  id          SERIAL PRIMARY KEY,
  job_id      INT REFERENCES jobs(id),
  name        VARCHAR(256) NOT NULL,
  target      VARCHAR(512),
  start_time  TIMESTAMPTZ,
  end_time    TIMESTAMPTZ,
  duration    VARCHAR(64),
  status      VARCHAR(32),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inspection_plans (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(256) NOT NULL,
  description  TEXT,
  schedule     VARCHAR(256),
  target_count INT DEFAULT 0,
  status       VARCHAR(32) DEFAULT 'active',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resource_changes (
  id         SERIAL PRIMARY KEY,
  ci_id      INT REFERENCES ci(id),
  type       VARCHAR(64),
  resource   VARCHAR(256),
  detail     TEXT,
  operator   VARCHAR(128),
  time       TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ 7. Log Management ============

CREATE TABLE IF NOT EXISTS log_collect_tasks (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(256) NOT NULL,
  scene          VARCHAR(128),
  enabled        BOOLEAN DEFAULT TRUE,
  target         VARCHAR(512),
  region         VARCHAR(128),
  deploy_status  VARCHAR(32) DEFAULT 'deployed',
  last_collect   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS log_forward_tasks (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(256) NOT NULL,
  target_type    VARCHAR(64),
  target_addr    VARCHAR(512),
  forward_content JSONB DEFAULT '[]',
  enabled        BOOLEAN DEFAULT TRUE,
  last_forward   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS log_templates (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(256) NOT NULL,
  scene       VARCHAR(128),
  engine      VARCHAR(64),
  sample      TEXT,
  source_type VARCHAR(64),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS operation_logs (
  id        SERIAL PRIMARY KEY,
  hostname  VARCHAR(256),
  detail    TEXT,
  event     VARCHAR(256),
  resource  VARCHAR(256),
  level     VARCHAR(32),
  result    VARCHAR(64),
  "user"      VARCHAR(128),
  ip        VARCHAR(64),
  trace     TEXT,
  time      TIMESTAMPTZ,
  protocol  VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS runtime_logs (
  id        SERIAL PRIMARY KEY,
  time      TIMESTAMPTZ,
  content   TEXT,
  source    VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ 8. Application / Order Management ============

CREATE TABLE IF NOT EXISTS app_orders (
  id          SERIAL PRIMARY KEY,
  order_id    VARCHAR(128),
  title       VARCHAR(256),
  name        VARCHAR(256),
  type        VARCHAR(64),
  res_type    VARCHAR(64),
  reason      TEXT,
  handler     VARCHAR(128),
  applicant   VARCHAR(128),
  approver    VARCHAR(128),
  status      VARCHAR(32) DEFAULT 'pending',
  status_label VARCHAR(64),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS todos (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(512) NOT NULL,
  source      VARCHAR(128),
  priority    VARCHAR(32) DEFAULT 'normal',
  priority_label VARCHAR(64),
  deadline    TIMESTAMPTZ,
  status      VARCHAR(32) DEFAULT 'pending',
  status_label VARCHAR(64),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============ 9. Topology (Network) ============

CREATE TABLE IF NOT EXISTS topology_zones (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(256) NOT NULL,
  status      VARCHAR(32),
  icon        VARCHAR(64),
  parent_id   INT REFERENCES topology_zones(id),
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS topology_nodes (
  id          SERIAL PRIMARY KEY,
  zone_id     INT REFERENCES topology_zones(id),
  label       VARCHAR(256),
  icon_text   VARCHAR(64),
  combo       VARCHAR(128),
  status      VARCHAR(32),
  style       JSONB DEFAULT '{}',
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS topology_edges (
  id          SERIAL PRIMARY KEY,
  source_id   INT NOT NULL REFERENCES topology_nodes(id) ON DELETE CASCADE,
  target_id   INT NOT NULL REFERENCES topology_nodes(id) ON DELETE CASCADE,
  data        JSONB DEFAULT '{}',
  style       JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============ 10. Monitoring ============

CREATE TABLE IF NOT EXISTS monitor_metrics (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(256) NOT NULL,
  type        VARCHAR(64),
  enabled     BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============ Application List (for ops/account transfer) ============

CREATE TABLE IF NOT EXISTS app_list (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(256) NOT NULL,
  type        VARCHAR(64),
  region      VARCHAR(128),
  status      VARCHAR(32) DEFAULT 'active',
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
