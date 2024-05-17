const { isValidObjectId } = require("mongoose")
const cloudinary = require("../cloud/index")
const Movie = require("../models/movie")
const User = require("../models/user")
const { topRatedMoviesPipeline, getAverageRatings } = require("../utils/helper")

exports.uploadTrailer = async (req, res) => {
  const { file } = req
  if (!file) return res.status(404).json({ error: "Video File Missing!" })

  const videoRes = await cloudinary.uploader.upload(file.path, { resource_type: "video" })
  const { secure_url, public_id } = videoRes

  res.status(201).json({ public_id, secure_url })
}
exports.createMovie = async (req, res) => {
  const { file, body } = req
  const {
    title,
    storyline,
    director,
    releaseDate,
    type,
    genres,
    tags,
    cast,
    trailer,
    language
  } = body

  const newMovie = new Movie({
    title,
    storyline,
    director,
    releaseDate,
    type,
    genres,
    tags,
    cast,
    trailer,
    language
  })


  //upload poster
  const posterRes = await cloudinary.uploader.upload(file.path, {
    transformation: {
      width: 1280,
      height: 720
    },
    responsive_breakpoints: {
      create_derived: true,
      max_width: 640,
      max_images: 3
    }
  })
  const { secure_url, public_id, responsive_breakpoints } = posterRes
  const newPoster = { secure_url, public_id, responsive: [] }
  const { breakpoints } = responsive_breakpoints[0]
  if (breakpoints.length) {
    for (let imgObj of breakpoints) {
      const { secure_url } = imgObj
      newPoster.responsive.push(secure_url)
    }
  }
  newMovie.poster = newPoster

  await newMovie.save()
  res.status(201).json({
    id: newMovie._id,
    title: newMovie.title,
  })
}

exports.updateMovie = async (req, res) => {
  const { movieID } = req.params
  if (!isValidObjectId(movieID)) return res.status(400).json({ error: "Invalid Movie ID!" })

  if (!req.file) return res.status(404).json({ error: "Poster is Missing!" })
  const movie = await Movie.findById(movieID)
  if (!movie) return res.status(404).json({ error: "Movie not found!" })

  const {
    title,
    storyline,
    director,
    releaseDate,
    type,
    genres,
    poster,
    tags,
    cast,
    trailer,
    language
  } = req.body

  movie.title = title;
  movie.storyline = storyline;
  movie.director = director;
  movie.releaseDate = releaseDate;
  movie.type = type;
  movie.genres = genres;
  movie.tags = tags;
  movie.cast = cast;
  movie.trailer = trailer;
  movie.language = language;


  //update poster
  const posterID = movie.poster?.public_id
  if (posterID) {
    const { result } = await cloudinary.uploader.destroy(posterID)
    if (result !== "ok") return res.status(400).json({ error: "Cannot update Poster!" })
  }

  const posterRes = await cloudinary.uploader.upload(req.file.path, {
    transformation: {
      width: 1280,
      height: 720
    },
    responsive_breakpoints: {
      create_derived: true,
      max_width: 640,
      max_images: 3
    }
  })
  const { secure_url, public_id, responsive_breakpoints } = posterRes
  const newPoster = { secure_url, public_id, responsive: [] }
  const { breakpoints } = responsive_breakpoints[0]
  if (breakpoints.length) {
    for (let imgObj of breakpoints) {
      const { secure_url } = imgObj
      newPoster.responsive.push(secure_url)
    }
  }
  movie.poster = newPoster

  await movie.save()

  res.json({ message: "Movie Updated Successfully", movie })
}

exports.removeMovie = async (req, res) => {
  const { movieID } = req.params
  if (!isValidObjectId(movieID)) return res.status(400).json({ error: "Invalid Movie ID!" })

  const movie = await Movie.findById(movieID)
  if (!movie) return res.status(404).json({ error: "Movie not found!" })

  const posterID = movie.poster?.public_id
  if (posterID) {
    const { result } = await cloudinary.uploader.destroy(posterID)
    if (result !== "ok") return res.status(400).json({ error: "Could not remove poster from cloud!" })
  }

  const trailerID = movie.trailer?.public_id
  if (!trailerID) return res.status(400).json({ error: "Trailer not found on cloud" })

  const { result } = await cloudinary.uploader.destroy(trailerID, { resource_type: 'video' })
  if (result !== "ok") return res.json({ error: "Cannot remove trailer from cloud" })


  await Movie.findByIdAndDelete(movieID)
  res.json({ message: "Movie Removed Successfully!" })
}

//Search Movie

exports.getLatestUploads = async (req, res) => {


  // const results = await Movie.find().sort('-createdAt').limit(5)
  const results = await Movie.aggregate([
    {
      $lookup: {
        from: 'reviews', // Collection name for reviews
        localField: 'reviews',
        foreignField: '_id',
        as: 'reviews_data',
      },
    },
    {
      $addFields: {
        averageRating: {
          $avg: '$reviews_data.rating', // Calculate the average rating
        },
      },
    },
    {
      $sort: {
        averageRating: -1, // Sort by average rating in descending order
      },
    },
    {
      $limit: 5, // Limit the results to the top 5 movies
    },
  ]);
  const movies = results.map((m) => {
    return {
      id: m._id,
      title: m.title,
      poster: m.poster?.url,
      trailer: m.trailer?.url,
      description: m.storyline,
      genres: m.genres,
      averageRating: m.averageRating,
    }
  })

  res.json({ movies })
}

exports.getSingleMovie = async (req, res) => {
  const { movieId } = req.params
  if (!isValidObjectId(movieId)) return res.json({ error: "Invalid Movie ID" })

  const movie = await Movie.findById(movieId)

  const reviews = await getAverageRatings(movie._id)

  const {
    _id: id,
    title,
    storyline,
    director,
    releaseDate,
    type,
    genres,
    poster,
    tags,
    cast,
    trailer,
    language
  } = movie


  res.json({
    movie: {
      id,
      title,
      storyline,
      director,
      releaseDate,
      type,
      genres,
      tags,
      language,
      cast: cast.map((c) => ({
        name: c.artistName,
        roleAs: c.roleAs,
        leadActor: c.leadActor,
      })),
      poster: poster?.url,
      trailer: trailer?.url,
      reviews: { ...reviews }
    },
  })

}

exports.getTopRatedMovies = async (req, res) => {
  const { type = "Movie" } = req.query

  const movies = await Movie.aggregate(topRatedMoviesPipeline(type))

  const mapMovies = async (m) => {
    const reviews = await getAverageRatings(m._id)
    return {
      id: m._id,
      title: m.title,
      poster: m.poster,
      reviews: { ...reviews }
    }
  }
  const topRatedMovies = await Promise.all(movies.map(mapMovies))

  res.json({ movies: topRatedMovies })
}

exports.getAllMovies = async (req, res) => {
  const movies = await Movie.find()
  res.json({ movies })
}

exports.updateMovieLike = async (req, res) => {
  const { movieId, userId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const alreadyLiked = user.likedMovies.includes(movieId);
    if (alreadyLiked) {
      return res.status(401).json({ error: "Already Liked!" });
    }
    user.likedMovies.push(movieId);
    await user.save();

    res.status(201).json({ message: `Added to "Liked by you"` });
  } catch (error) {
    res.status(500).json({ error: "Couldn't like the movie" });
  }
};
exports.getMovieNamesFromIds = async (req, res) => {
  const { movieIdArray } = req.body
  const movieNameArray = []
  try {
    const promises = movieIdArray.map(async (m) => {
      const movie = await Movie.findById(m);
      if (!movie) return res.status(404).json({ error: "Movie not found among the List" })
      movieNameArray.push({ title: movie.title, id: movie._id })
    })
    await Promise.all(promises)
    res.status(201).json({ movieNameArray })
  } catch (error) {
    res.status(500).json({ error })
  }
}