const { isValidObjectId } = require("mongoose")
const Movie = require("../models/movie")
const Review = require("../models/review")
const User = require("../models/user");
const AlreadyVoted = require("../models/alreadyVoted")

const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

const MODEL_NAME = "gemini-1.0-pro";
const API_KEY = "AIzaSyCAI7xhK0knNoi7oXDZ6wPdF-Ao_vERUwo";

async function sentimentAnalysis(content) {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ];

  const parts = [
    { text: "Tell me whether the following sentence's sentiment is positive or negative or something in between. Output should be one word, Positive, Negative, Mixed or Neutral." },
    { text: `Sentence ${content}` },
    { text: "Sentiment " },
  ];

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig,
    safetySettings,
  });

  const response = result.response;
  // const tag = response.text()
  // console.log(response.text());
  return response.text()
}


exports.addReview = async (req, res) => {
  const { movieId } = req.params
  const { content, rating } = req.body
  const userId = req.user._id

  //checking is movie id is valid
  if (!isValidObjectId(movieId)) return res.json({ error: "Invalid Movie!" })

  //checking if the movie exists in DB
  const movie = await Movie.findOne({ _id: movieId })
  if (!movie) return res.status(404).json({ error: "Movie not found!" })

  //checking if the user has already reviewed this movie
  const isAlreadyReviewed = await Review.findOne({ owner: userId, parentMovie: movie._id })
  if (isAlreadyReviewed) return res.json({ error: "Already Reviewed this movie!" })


  const reviewTag = await sentimentAnalysis(content)
  //is all good then create and update review
  const newReview = new Review({
    owner: userId,
    parentMovie: movie._id,
    content,
    rating,
    reviewTag,
  })

  //creating and updating the review
  movie.reviews.push(newReview._id) //as the reviews field is array in movie model
  await movie.save() //updating review in the Movie DB

  await newReview.save() //saving the review in Review DB

  //sending response to frontend
  res.json({ message: "Your Review has been added!" })
}


exports.updateReview = async (req, res) => {

  const { reviewID } = req.params
  const { content } = req.body
  console.log("Backend...", reviewID, content)
  // checking is movie id is valid
  if (!isValidObjectId(reviewID)) return res.json({ error: "Invalid Review ID!" })

  const review = await Review.findById(reviewID)

  if (!review) return res.status(404).json({ error: "Review not found!" })
  try {
    review.content = content
    await review.save()
    res.json({ message: "Review has been updated!" })
  } catch (error) {
    res.status(500).json({ error: "Error Updating the review" })
  }
}

exports.removeReview = async (req, res) => {
  const { reviewID } = req.params

  if (!isValidObjectId(reviewID)) return res.json({ error: "Invalid Review ID" })
  try {
    const movie = await Movie.findOne({ reviews: reviewID });

    if (!movie) {
      return res.status(404).json({ error: "Movie not found or you don't have permission to delete the review" });
    }
    // Remove the review from the movie's reviews array
    movie.reviews.pull(reviewID);
    await movie.save();

    const review = await Review.findByIdAndDelete(reviewID)
    res.json({ message: "Review has been removed!" })
  } catch (error) {
    res.status(500).json({ error: "Error deleting the review" })
  }
}

exports.getReviewsByMovie = async (req, res) => {

  const { movieId } = req.params
  if (!isValidObjectId(movieId)) return res.json({ error: "Invalid Movie ID" })

  // console.log("fine till here")
  //movie.findById will give only ID, to get all the data about the review we need to populate it. Also while populating reviews we need to populate owner inside the review.
  const movie = await Movie.findById(movieId).populate({
    path: "reviews",
    populate: {
      path: "owner",
      select: "username",
    }
  }).select('reviews')

  // console.log("Reviews here"+reviews)
  const reviews = movie.reviews.map((r) => {
    const { owner, content, rating, _id: reviewId, upvotes, downvotes, reviewTag } = r
    const { username, _id: ownerId } = owner
    return {
      id: reviewId,
      owner: {
        id: ownerId,
        username,
      },
      content,
      rating,
      upvotes,
      downvotes,
      reviewTag,
    }
  })


  res.json({ reviews })
}
// exports.getReviewsByOwner = async (req, res) => {
//   const { userId } = req.params
//   if (!isValidObjectId(userId)) return res.json({ error: "Invalid User ID" })

//   const user = await User.findById(userId).populate({
//     path: "reviews",
//   }).select('reviews')
//   console.log(user)

//   // console.log("Reviews here"+reviews)
//   // const reviews = movie.reviews.map((r) => {
//   //   const { owner, content, rating, _id: reviewId, upvotes, downvotes, reviewTag } = r
//   //   const { username, _id: ownerId } = owner
//   //   return {
//   //     id: reviewId,
//   //     owner: {
//   //       id: ownerId,
//   //       username,
//   //     },
//   //     content,
//   //     rating,
//   //     upvotes,
//   //     downvotes,
//   //     reviewTag,
//   //   }
//   // })


//   // res.json({ reviews })
// }

exports.addUpvote = async (req, res) => {
  const { movieId, reviewID } = req.params
  const { ownerID } = req.body
  const userId = req.user._id
  const review = await Review.findOne({ _id: reviewID })

  //checking is movie id is valid
  if (!isValidObjectId(movieId)) return res.json({ error: "Invalid Movie!" })

  //checking if the movie exists in DB
  const movie = await Movie.findOne({ _id: movieId })
  if (!movie) return res.status(404).json({ error: "Movie not found!" })

  //checking if the user has already voted this review
  const isAlreadyVoted = await AlreadyVoted.findOne({ votedBy: userId, votedOn: reviewID })

  if (isAlreadyVoted) return res.json({ error: "Cannot Upvote! Already performed this action." })

  //is all good then upvote
  const newAlreadtVoted = new AlreadyVoted({
    votedBy: userId,
    votedOn: reviewID,
  })

  await newAlreadtVoted.save()

  const newUpvotes = review.upvotes + 1
  review.upvotes = newUpvotes
  await review.save()

  // review.upvotes =.push(newReview._id) //as the reviews field is array in movie model
  // await movie.save() //updating review in the Movie DB

  // await newReview.save() //saving the review in Review DB

  // //sending response to frontend
  res.json({ message: "Your Upvote has been added!" })
}
exports.addDownvote = async (req, res) => {
  const { movieId, reviewID } = req.params
  const { ownerID } = req.body
  const userId = req.user._id
  const review = await Review.findOne({ _id: reviewID })

  //checking is movie id is valid
  if (!isValidObjectId(movieId)) return res.json({ error: "Invalid Movie!" })

  //checking if the movie exists in DB
  const movie = await Movie.findOne({ _id: movieId })
  if (!movie) return res.status(404).json({ error: "Movie not found!" })

  //checking if the user has already voted this review
  const isAlreadyVoted = await AlreadyVoted.findOne({ votedBy: userId, votedOn: reviewID })

  if (isAlreadyVoted) return res.json({ error: "Cannot Downvote! Already performed this action." })

  //is all good then upvote
  const newAlreadtVoted = new AlreadyVoted({
    votedBy: userId,
    votedOn: reviewID,
  })

  await newAlreadtVoted.save()

  const newDownvotes = review.downvotes + 1
  review.downvotes = newDownvotes
  await review.save()

  // review.upvotes =.push(newReview._id) //as the reviews field is array in movie model
  // await movie.save() //updating review in the Movie DB

  // await newReview.save() //saving the review in Review DB

  // //sending response to frontend
  res.json({ message: "Your Downvote has been added!" })
}