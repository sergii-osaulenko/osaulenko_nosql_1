// scripts/02_transform.js
// Запуск: mongosh "mongodb+srv://admin:~123Qwer@cluster0.7eu2snb.mongodb.net/?appName=Cluster0" --file scripts/02_transform.js

use('spotify');

// Видаляємо стару колекцію, якщо вона існує, для ідемпотентності
db.tracks.drop();

db.tracks_raw.aggregate([
  {
    $addFields: {
      // Розбиваємо рядок виконавців на масив та прибираємо зайві пробіли
      artists: {
        $map: {
          input: { $split: ["$artists", ";"] },
          as: "artist",
          in: { $trim: { input: "$$artist" } }
        }
      },
      // Групуємо аудіо-характеристики у вкладений об'єкт
      audio_features: {
        danceability: "$danceability",
        energy: "$energy",
        loudness: "$loudness",
        speechiness: "$speechiness",
        acousticness: "$acousticness",
        instrumentalness: "$instrumentalness",
        liveness: "$liveness",
        valence: "$valence",
        tempo: "$tempo",
        key: "$key",
        mode: "$mode",
        time_signature: "$time_signature"
      },
      // Обчислюємо тривалість у секундах з округленням до 1 знака
      duration_sec: { $round: [{ $divide: ["$duration_ms", 1000] }, 1] },
      // Визначаємо рівень популярності
      popularity_tier: {
        $switch: {
          branches: [
            { case: { $gte: ["$popularity", 70] }, then: "high" },
            { case: { $and: [{ $gte: ["$popularity", 40] }, { $lt: ["$popularity", 70] }] }, then: "medium" },
            { case: { $lt: ["$popularity", 40] }, then: "low" }
          ],
          default: "unknown"
        }
      }
    }
  },
  {
    // Залишаємо лише необхідні поля (виключаємо вихідні аудіофічі та старий рядок)
    $project: {
      track_id: 1,
      track_name: 1,
      album_name: 1,
      explicit: 1,
      popularity: 1,
      duration_ms: 1,
      track_genre: 1,
      artists: 1, // Новий масив
      audio_features: 1,
      duration_sec: 1,
      popularity_tier: 1
    }
  },
  {
    // Зберігаємо результат у нову колекцію
    $out: "tracks"
  }
]);

// Перевірка результатів
print(`Завантажено документів у колекцію tracks: ${db.tracks.countDocuments({})}`);
print("Приклад документа:");
printjson(db.tracks.findOne());