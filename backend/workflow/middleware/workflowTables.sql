-- /backend/workflow/database/workflowTables.sql

-- This table stores the main workflow configurations.
CREATE TABLE IF NOT EXISTS workflows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  -- The 'data' column will store the entire workflow (nodes, edges, viewport) as a JSON string.
  data TEXT,
  is_active BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- This table will log each execution of a workflow.
CREATE TABLE IF NOT EXISTS workflow_executions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_id INTEGER NOT NULL,
  status TEXT NOT NULL, -- e.g., 'running', 'completed', 'failed'
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  finished_at DATETIME,
  -- 'results' can store logs or the final output as a JSON string.
  results TEXT,
  FOREIGN KEY (workflow_id) REFERENCES workflows(id)
);
