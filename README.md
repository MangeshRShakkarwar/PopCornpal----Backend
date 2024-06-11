# 🎬 PopCornPal Backend 🍿

Welcome to the backend repository for PopCornPal, a fully-fledged Movie Review App with full authentication, built using the MERN stack along with AI features and APIs. This repository contains the server-side code and logic for PopCornPal.

## Table of Contents

- [About](#about)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Setup and Installation](#setup-and-installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [License](#license)

## About

The backend of PopCornPal provides a robust API for managing movie reviews, user authentication, AI-powered recommendations, and sentiment analysis. It serves as the backbone for the PopCornPal frontend application.

## Features

- 🔐 **Full Authentication:** Secure login and registration using JWT.
- 🎥 **Movie Reviews:** API endpoints to add, edit, and delete movie reviews.
- 🤖 **AI Features:** AI-powered recommendations and sentiment analysis.
- 🌐 **External APIs:** Integration with movie databases for real-time data.
- 📊 **Admin Controls:** Endpoints for managing users and reviews.

## Technologies Used

- **Node.js:** JavaScript runtime for building scalable network applications.
- **Express.js:** Web framework for Node.js.
- **MongoDB:** NoSQL database for storage.
- **Mongoose:** MongoDB object modeling for Node.js.
- **JWT:** JSON Web Tokens for secure authentication.
- **Axios:** HTTP client for making API requests.
- **Dotenv:** For loading environment variables.

## Setup and Installation

To get started with the backend of the project, follow these steps:

1. **Clone the repository:**

    ```bash
    git clone https://github.com/MangeshRShakkarwar/PopCornpal----Backend.git
    cd popcornpal-backend
    ```

2. **Install dependencies:**

    Make sure you have [Node.js](https://nodejs.org/) and [MongoDB](https://www.mongodb.com/) installed.

    ```bash
    npm install
    ```

3. **Set up environment variables:**

    Create a `.env` file in the root directory and add the following variables:

    ```plaintext
    PORT=5000
    MONGODB_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret
    ```

4. **Run the server:**

    ```bash
    npm start
    ```

5. The server should now be running on [http://localhost:5000](http://localhost:5000).

## Usage

Once the backend server is running, it will handle requests from the frontend application. You can test the API endpoints using tools like [Postman](https://www.postman.com/).

## API Endpoints

Here are some of the key API endpoints:

- **Authentication:**
  - `POST /api/auth/register`: Register a new user.
  - `POST /api/auth/login`: Login a user and return a JWT.

- **Movies:**
  - `GET /api/movies`: Get a list of movies.
  - `GET /api/movies/:id`: Get details of a specific movie.

- **Reviews:**
  - `POST /api/reviews`: Add a new review.
  - `GET /api/reviews/:movieId`: Get reviews for a specific movie.
  - `PUT /api/reviews/:id`: Update a review.
  - `DELETE /api/reviews/:id`: Delete a review.

- **AI Features:**
  - `GET /api/ai/recommendations`: Get AI-powered movie recommendations.
  - `GET /api/ai/sentiment/:reviewId`: Get sentiment analysis of a review.

For a complete list of endpoints and detailed usage, refer to the [API Documentation](./API_DOCUMENTATION.md).

## Contributing

Contributions are welcome! If you have suggestions or improvements, feel free to create an issue or submit a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a pull request

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Crafted with ❤️ by [Mangesh Shakkarwar] (https://popcorn-pal-front.vercel.app/)
