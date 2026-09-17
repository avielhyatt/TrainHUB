"""Lightweight idempotent schema patches for changes made after initial launch.

Base.metadata.create_all() only creates missing tables — it never alters
existing ones, and never drops obsolete ones. New tables are fine as-is;
everything else needs an explicit, idempotent statement here.
"""

from sqlalchemy import text
from sqlalchemy.engine import Engine

STATEMENTS = [
    "ALTER TABLE trainer_profiles ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT TRUE",
    """
    DO $$
    BEGIN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'users' AND column_name = 'passport_number'
        ) THEN
            ALTER TABLE users RENAME COLUMN passport_number TO phone_number;
        END IF;
    END $$;
    """,
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_data TEXT",
    "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS slot_id UUID REFERENCES slots(id) ON DELETE CASCADE",
    "DROP TABLE IF EXISTS working_hours",
    "DROP TABLE IF EXISTS blocked_slots",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_key TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS id_document_key TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS live_photo_key TEXT",
    "ALTER TABLE places ADD COLUMN IF NOT EXISTS latitude NUMERIC(9, 6)",
    "ALTER TABLE places ADD COLUMN IF NOT EXISTS longitude NUMERIC(9, 6)",
    "ALTER TABLE places ADD COLUMN IF NOT EXISTS details VARCHAR(255)",
    """
    DO $$
    BEGIN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'trainer_profiles' AND column_name = 'cost'
        ) THEN
            ALTER TABLE trainer_profiles RENAME COLUMN cost TO cost_per_hour;
        END IF;
    END $$;
    """,
]


def run_migrations(engine: Engine) -> None:
    with engine.begin() as conn:
        for statement in STATEMENTS:
            conn.execute(text(statement))
