CREATE TABLE IF NOT EXISTS "schema_migrations" (version varchar(255) primary key);
CREATE TABLE runs (
    id character(32) NOT NULL,
    future_state TEXT NOT NULL,
    name TEXT,
    calculator_path TEXT,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    started_at timestamp without time zone,
    ended_at timestamp without time zone,
    resolved_at timestamp without time zone,
    failed_at timestamp without time zone,
    parent_id character(32), description TEXT, tags TEXT, source_code TEXT, root_id character(32) NOT NULL,

    PRIMARY KEY (id)
);
CREATE TABLE artifacts (
    -- sha1 hex digest are 40 characters
    id character(40) NOT NULL,
    json_summary JSONB NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL, type_serialization JSONB NOT NULL,

    PRIMARY KEY (id)
);
CREATE TABLE run_artifacts (
    run_id character(32) NOT NULL,
    artifact_id character(40) NOT NULL,
    name TEXT,
    relationship TEXT,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,

    FOREIGN KEY(artifact_id) REFERENCES artifacts (id),
    FOREIGN KEY(run_id) REFERENCES runs (id),

    PRIMARY KEY(run_id, artifact_id, name)
);
CREATE TABLE edges (
    id character(32) NOT NULL,
    source_run_id character(32),
    source_name TEXT,
    destination_run_id character(32),
    destination_name TEXT,
    artifact_id character(40),
    parent_id character(32),
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,

    PRIMARY KEY (id),

    FOREIGN KEY(source_run_id) REFERENCES runs (id),
    FOREIGN KEY(destination_run_id) REFERENCES runs (id),
    FOREIGN KEY(artifact_id) REFERENCES artifacts (id),
    FOREIGN KEY(parent_id) REFERENCES edges (id)
);
-- Dbmate schema migrations
INSERT INTO "schema_migrations" (version) VALUES
  ('20220424062956'),
  ('20220514015440'),
  ('20220514020602'),
  ('20220519154144'),
  ('20220521155045'),
  ('20220521155336'),
  ('20220522082435'),
  ('20220527000512');
