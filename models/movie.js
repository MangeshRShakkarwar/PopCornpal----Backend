const mongoose = require('mongoose')
const genres = require('../utils/genres')

const movieSchema = mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: true,
    },
    storyline: {
      type: String,
      trim: true,
      required: true,
    },
    director: {
      type: String,
      required: false,
    },
    releaseDate: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    genres: {
      type: [String],
      required: true,
      enum: genres,
    },
    tags: {
      type: [String],
      required: true,
    },
    cast: [
      {
        artistName: String ,
        roleAs: String,
        leadActor: Boolean,
      },
    ],
    poster: {
      type: Object,
      url: { type: String, required: true },
      public_id: { type: String, required: true },
      responsive:[URL],
      required: true,
    },
    trailer: {
      type: Object,
      url: { type: String, required: true },
      public_id: { type: String, required: true },
      required: true,
    },
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
    language: {
      type: String,
      required: true,
    },
    // timestamp
  }
)

module.exports = mongoose.model('Movie', movieSchema)