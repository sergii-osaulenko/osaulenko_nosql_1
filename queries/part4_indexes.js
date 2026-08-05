// queries/part4_indexes.js
use('spotify');

print("=== Завдання 1. Аналіз запиту та індексація ===");

// 1. Аналіз ДО створення індексу
print("План виконання ДО індексу:");
const explainBefore = db.tracks.explain("executionStats").find({
  track_genre: "pop",
  "audio_features.danceability": { $gte: 0.7 }
}).sort({ popularity: -1 });
printjson({
  winningPlan: explainBefore.queryPlanner.winningPlan,
  executionTimeMillis: explainBefore.executionStats.executionTimeMillis,
  totalDocsExamined: explainBefore.executionStats.totalDocsExamined
});

// 2. Створення індексу за правилом ESR (Equality, Sort, Range)
// Equality: track_genre
// Sort: popularity
// Range: audio_features.danceability
db.tracks.createIndex({ 
    track_genre: 1, 
    popularity: -1, 
    "audio_features.danceability": 1 
});
print("Індекс створено.");

// 3. Аналіз ПІСЛЯ створення індексу
print("План виконання ПІСЛЯ індексу:");
const explainAfter = db.tracks.explain("executionStats").find({
  track_genre: "pop",
  "audio_features.danceability": { $gte: 0.7 }
}).sort({ popularity: -1 });
printjson({
  winningPlan: explainAfter.queryPlanner.winningPlan,
  executionTimeMillis: explainAfter.executionStats.executionTimeMillis,
  totalDocsExamined: explainAfter.executionStats.totalDocsExamined
});

print("\n=== Завдання 2. Індекс для інших полів ===");
// Створюємо складений індекс для фонової музики
db.tracks.createIndex({ 
    explicit: 1, 
    "audio_features.instrumentalness": 1, 
    "audio_features.speechiness": 1 
});

const explainBackground = db.tracks.explain("executionStats").find({
  "audio_features.loudness": { $lt: -10 },
  "audio_features.speechiness": { $lt: 0.1 },
  "audio_features.instrumentalness": { $gt: 0.5 },
  explicit: false
});

print("План виконання для запиту фонової музики (перевірка використання індексу):");
printjson(explainBackground.queryPlanner.winningPlan);