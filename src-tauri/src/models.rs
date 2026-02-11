use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Subject {
    pub id: Option<i32>,
    pub name: String,
    pub short_code: Option<String>,
    pub color: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StudentGroup {
    pub id: Option<i32>,
    pub name: String,
    pub head_count: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Teacher {
    pub id: Option<i32>,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Room {
    pub id: Option<i32>,
    pub name: String,
    pub capacity: i32,
    pub room_type: String, // 'STANDARD', 'LABO', etc.
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TimeSlot {
    pub id: Option<i32>,
    pub day_index: i32,
    pub start_time: String,
    pub end_time: String,
    pub type_: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Allocation {
    pub id: Option<i32>,
    pub group_id: i32,
    pub subject_id: i32,
    pub teacher_id: Option<i32>,
    pub count: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AllocationView {
    pub id: i32,
    pub group_name: String,
    pub subject_name: String,
    pub teacher_name: Option<String>,
    pub subject_color: String,
    pub count: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ScheduledLessonView {
    pub id: i32,
    pub day_index: i32,
    pub start_time: String,
    pub end_time: String,
    pub group_name: String,
    pub subject_name: String,
    pub teacher_name: Option<String>,
    pub subject_color: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Constraint {
    pub id: Option<i32>,
    pub rule_type: String,
    pub target_type: String,
    pub target_id: i32,
    pub param_value: String,
}