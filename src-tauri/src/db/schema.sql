-- ============================================================================
-- SCHÉMA DE BASE DE DONNÉES KRONOS (SQLite)
-- ============================================================================

PRAGMA foreign_keys = ON;

-- 1. CONFIGURATION
CREATE TABLE IF NOT EXISTS project_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- 2. RESSOURCES
CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    short_code TEXT,
    color TEXT DEFAULT '#3b82f6'
);

CREATE TABLE IF NOT EXISTS student_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    head_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    capacity INTEGER DEFAULT 30,
    type TEXT DEFAULT 'STANDARD'
);

-- 3. GRILLE TEMPORELLE
CREATE TABLE IF NOT EXISTS time_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day_index INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    type TEXT DEFAULT 'LESSON'
);

-- 4. BESOINS & ALLOCATIONS
CREATE TABLE IF NOT EXISTS allocations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,
    teacher_id INTEGER,
    count INTEGER NOT NULL DEFAULT 1,
    required_room_type TEXT DEFAULT 'STANDARD', -- DÉPLACÉ ICI
    
    FOREIGN KEY (group_id) REFERENCES student_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
);

-- 5. RÈGLES MÉTIER
CREATE TABLE IF NOT EXISTS constraints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_type TEXT NOT NULL,
    target_type TEXT,
    target_id INTEGER,
    param_value TEXT
);

-- 6. RÉSULTATS
CREATE TABLE IF NOT EXISTS scheduled_lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    allocation_id INTEGER NOT NULL,
    slot_id INTEGER NOT NULL,
    room_id INTEGER,
    is_locked BOOLEAN DEFAULT 0,
    
    FOREIGN KEY (allocation_id) REFERENCES allocations(id) ON DELETE CASCADE,
    FOREIGN KEY (slot_id) REFERENCES time_slots(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
    
    UNIQUE(slot_id, allocation_id) 
);
