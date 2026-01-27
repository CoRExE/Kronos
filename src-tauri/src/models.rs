use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Subject {
    pub id: Option<i32>, // Optionnel car absent lors de la création
    pub name: String,
    pub short_code: Option<String>,
    pub color: String,
}
