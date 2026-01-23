-- ============================================================================
-- SCHÉMA DE BASE DE DONNÉES KRONOS (SQLite)
-- ============================================================================

-- Force l'intégrité référentielle (Clés étrangères)
PRAGMA foreign_keys = ON;

-- ----------------------------------------------------------------------------
-- 1. CONFIGURATION & PROFIL
-- ----------------------------------------------------------------------------

-- Stocke les paramètres globaux du projet
-- Ex: ('school_mode', 'SINGLE_CLASS'), ('slot_duration', '60')
CREATE TABLE IF NOT EXISTS project_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- ----------------------------------------------------------------------------
-- 2. RESSOURCES (Matières, Groupes, Profs, Salles)
-- ----------------------------------------------------------------------------

-- Les matières enseignées
CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    short_code TEXT,              -- Ex: 'MATHS' pour l'affichage compact
    color TEXT DEFAULT '#3b82f6'  -- Code Hex pour l'UI
);

-- Les groupes d'élèves (Classes ou sous-groupes)
CREATE TABLE IF NOT EXISTS student_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,           -- Ex: 'CM2-A' ou 'Terminale S'
    head_count INTEGER DEFAULT 0  -- Effectif (utile pour capacité des salles)
);

-- Les enseignants (Utilisé principalement en mode 'MULTI_CLASS')
CREATE TABLE IF NOT EXISTS teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
);

-- Les salles de cours (Utilisé principalement en mode 'MULTI_CLASS')
CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    capacity INTEGER DEFAULT 30,
    type TEXT DEFAULT 'STANDARD'  -- Ex: 'INFO', 'LABO', 'GYM'
);

-- Liaison : Quelles matières un prof peut-il enseigner ?
CREATE TABLE IF NOT EXISTS teacher_subjects (
    teacher_id INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,
    PRIMARY KEY (teacher_id, subject_id),
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- 3. GRILLE TEMPORELLE
-- ----------------------------------------------------------------------------

-- Définition des "cases" disponibles dans la semaine
CREATE TABLE IF NOT EXISTS time_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day_index INTEGER NOT NULL,   -- 0 = Lundi, 1 = Mardi...
    start_time TEXT NOT NULL,     -- Format 'HH:MM'
    end_time TEXT NOT NULL,       -- Format 'HH:MM'
    type TEXT DEFAULT 'LESSON'    -- 'LESSON', 'BREAK', 'LUNCH'
);

-- ----------------------------------------------------------------------------
-- 4. BESOINS & ALLOCATIONS (Input de l'algo)
-- ----------------------------------------------------------------------------

-- Définition de la demande : "Le Groupe X veut N créneaux de la Matière Y"
CREATE TABLE IF NOT EXISTS allocations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,
    teacher_id INTEGER,           -- NULLABLE. Si défini, force ce prof.
    count INTEGER NOT NULL DEFAULT 1, -- Nombre de créneaux à placer
    
    FOREIGN KEY (group_id) REFERENCES student_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
);

-- ----------------------------------------------------------------------------
-- 5. RÈGLES MÉTIER
-- ----------------------------------------------------------------------------

-- Contraintes spécifiques pour guider l'algo
-- Ex: Rule='MAX_DAILY', Target='SUBJECT', ID=1 (Maths), Value='2'
CREATE TABLE IF NOT EXISTS constraints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_type TEXT NOT NULL,      -- 'MAX_DAILY_HOURS', 'FORBIDDEN_SLOT', etc.
    target_type TEXT,             -- 'GROUP', 'TEACHER', 'SUBJECT', 'GLOBAL'
    target_id INTEGER,            -- ID de la ressource concernée (0 ou NULL si GLOBAL)
    param_value TEXT              -- La valeur de la contrainte
);

-- ----------------------------------------------------------------------------
-- 6. RÉSULTATS (Output de l'algo)
-- ----------------------------------------------------------------------------

-- L'emploi du temps généré
CREATE TABLE IF NOT EXISTS scheduled_lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    allocation_id INTEGER NOT NULL,
    slot_id INTEGER NOT NULL,
    room_id INTEGER,              -- NULLABLE (non utilisé en mode Primaire)
    is_locked BOOLEAN DEFAULT 0,  -- Si TRUE, l'algo ne bouge pas ce cours (fixé par l'utilisateur)
    
    FOREIGN KEY (allocation_id) REFERENCES allocations(id) ON DELETE CASCADE,
    FOREIGN KEY (slot_id) REFERENCES time_slots(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
    
    -- Un même groupe ne peut pas avoir 2 cours au même moment (Contrainte Hard BDD)
    UNIQUE(slot_id, allocation_id) 
);