// queries/part2_queries.js
use('spotify');

print("=== Завдання 1. Треки для вечірки ===");
const partyTracks = db.tracks.find({
  "audio_features.danceability": { $gt: 0.7 },
  "audio_features.energy": { $gt: 0.7 },
  duration_ms: { $gte: 180000, $lte: 300000 }
}).toArray();
print(`Знайдено треків: ${partyTracks.length}`);

print("\n=== Завдання 2. Виконавці, у яких усі треки популярні ===");
const popularArtists = db.tracks.aggregate([
  { $unwind: "$artists" },
  {
    $group: {
      _id: "$artists",
      tracks_count: { $sum: 1 },
      min_pop: { $min: "$popularity" },
      avg_pop: { $avg: "$popularity" }
    }
  },
  {
    $match: {
      tracks_count: { $gte: 3 },
      min_pop: { $gte: 60 }
    }
  },
  { $sort: { avg_pop: -1 } },
  { $limit: 20 },
  {
    $project: {
      _id: 0,
      artist: "$_id",
      tracks_count: 1,
      min_pop: 1,
      avg_pop: { $round: ["$avg_pop", 1] }
    }
  }
]).toArray();
printjson(popularArtists);

print("\n=== Завдання 3. Нетипові треки (Outliers) ===");
const outlierTracks = db.tracks.aggregate([
  {
    $group: {
      _id: "$track_genre",
      avg_tempo: { $avg: "$audio_features.tempo" },
      std_dev: { $stdDevPop: "$audio_features.tempo" },
      tracks: { $push: "$$ROOT" }
    }
  },
  {
    $addFields: {
      outlier_threshold: { $add: ["$avg_tempo", { $multiply: [2, "$std_dev"] }] }
    }
  },
  { $unwind: "$tracks" },
  {
    $match: {
      $expr: { $gt: ["$tracks.audio_features.tempo", "$outlier_threshold"] }
    }
  },
  {
    $group: {
      _id: "$_id",
      genre: { $first: "$_id" },
      avg_tempo: { $first: "$avg_tempo" },
      outlier_threshold: { $first: "$outlier_threshold" },
      outlier_tracks: {
        $push: {
          _id: "$tracks._id",
          track_name: "$tracks.track_name",
          popularity: "$tracks.popularity",
          artists: "$tracks.artists",
          audio_features: { tempo: "$tracks.audio_features.tempo" }
        }
      }
    }
  },
  {
    $project: { _id: 0 }
  }
]).toArray();
print(`Знайдено жанрів з нетиповими треками: ${outlierTracks.length}`);

print("\n=== Завдання 4. Треки для фонової роботи ===");
const backgroundTracks = db.tracks.find({
  "audio_features.loudness": { $lt: -10 },
  "audio_features.speechiness": { $lt: 0.1 },
  "audio_features.instrumentalness": { $gt: 0.5 },
  explicit: false
}).toArray();
print(`Знайдено треків для фонової роботи: ${backgroundTracks.length}`);