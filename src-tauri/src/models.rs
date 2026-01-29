use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Subject {
    pub id: Option<i32>, // Optionnel car absent lors de la création
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
pub struct TimeSlot {
    pub id: Option<i32>,
    pub day_index: i32, // 0=Lundi, 6=Dimanche
    pub start_time: String, // HH:MM
    pub end_time: String,   // HH:MM
    pub type_: String,      // 'LESSON', 'BREAK', 'LUNCH'
}
