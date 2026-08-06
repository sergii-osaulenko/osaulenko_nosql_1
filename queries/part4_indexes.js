// queries/part4_indexes
use('spotify');

print("=== Завдання 1. Аналіз запиту та індексація ===");

// 1. Аналіз ДО створення індексу
print("План виконання ДО індексу:");
const explainBefore = db.tracks.find({
  track_genre: "pop",
  "audio_features.danceability": { $gte: 0.7 }
}).sort({ popularity: -1 }).explain("executionStats");

printjson({
  // Залежно від версії Mongosh winningPlan може бути в queryPlanner або на верхньому рівні
  winningPlan: explainBefore.queryPlanner ? explainBefore.queryPlanner.winningPlan : explainBefore.winningPlan,
  executionTimeMillis: explainBefore.executionStats ? explainBefore.executionStats.executionTimeMillis : "N/A",
  totalDocsExamined: explainBefore.executionStats ? explainBefore.executionStats.totalDocsExamined : "N/A"
});

// 2. Створення індексу за правилом ESR (Equality, Sort, Range)
// Equality: track_genre
// Sort: popularity
// Range: audio_features.danceability
print("\nСтворюємо складений індекс...");
db.tracks.createIndex({ 
    track_genre: 1, 
    popularity: -1, 
    "audio_features.danceability": 1 
});
print("Індекс створено.");

// 3. Аналіз ПІСЛЯ створення індексу
print("\nПлан виконання ПІСЛЯ індексу:");
const explainAfter = db.tracks.find({
  track_genre: "pop",
  "audio_features.danceability": { $gte: 0.7 }
}).sort({ popularity: -1 }).explain("executionStats");

printjson({
  winningPlan: explainAfter.queryPlanner ? explainAfter.queryPlanner.winningPlan : explainAfter.winningPlan,
  executionTimeMillis: explainAfter.executionStats ? explainAfter.executionStats.executionTimeMillis : "N/A",
  totalDocsExamined: explainAfter.executionStats ? explainAfter.executionStats.totalDocsExamined : "N/A"
});

print("\n=== Завдання 2. Індекс для інших полів ===");
// Створюємо складений індекс для фонової музики
db.tracks.createIndex({ 
    explicit: 1, 
    "audio_features.instrumentalness": 1, 
    "audio_features.speechiness": 1 
});

const explainBackground = db.tracks.find({
  "audio_features.loudness": { $lt: -10 },
  "audio_features.speechiness": { $lt: 0.1 },
  "audio_features.instrumentalness": { $gt: 0.5 },
  explicit: false
}).explain("executionStats");

print("План виконання для запиту фонової музики (перевірка використання індексу):");
printjson(explainBackground.queryPlanner ? explainBackground.queryPlanner.winningPlan : explainBackground.winningPlan);