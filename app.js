import express from "express";
import {
  MongoClient,
  ObjectId
} from "mongodb";
import cors from "cors";
import validators from "format-validator";

// Define MongoDB connection settings
const MONGO_USER = process.env.MONGO_USER || "TRINDADE";
const MONGO_PASSWORD = process.env.MONGO_PASSWORD || "zambujeiro8";
const MONGO_URI = `mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}@hubevent.ju6y9dv.mongodb.net/?retryWrites=true&w=majority`;

// Apply middleware to Express app
const app = express();
app.use(cors());
app.use(express.json());

app.get("/", function (req, res) {
  const ipAddresses = req.header("x-forwarded-for");
  console.log(ipAddresses);
  res.send(ipAddresses);
});

// Routes
const registerUser = async (req, res, db) => {
  console.log("Chegou o pedido")
  // function for handling user registration
  const {
    name,
    email,
    password
  } = req.body; // get user information from request body´
  if (validators.isEmail(email)) {
    try {
      const user = await db
        .collection("Users")
        .insertOne({
          name,
          email,
          password
        }); // insert user into Users collection in MongoDB
      res.status(201).json(user);
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(500).json({
        message: "Error registering user"
      });
    }
  } else {
    res.status(400).json({
      message: "Invalid Email"
    });
  }
};

const loginUser = async (req, res, db) => {
  const {
    email,
    password
  } = req.body; // get login credentials from request body
  console.log(email);
  if (validators.isEmail(email)) {
    try {
      const user = await db.collection("Users").findOne({
        email,
        password
      }); // find user in Users collection in MongoDB
      console.log(user);
      if (user) {
        // if user exists, send response and success message and user document
        res.status(200).send(
          user._id
        );
      } else {
        // if user does not exist, send response (Unauthorized) and error message
        res.status(401).send({
          message: "Invalid email or password"
        });
      }
    } catch (error) {
      console.error("Error logging in user:", error);
      res.status(500).send({
        message: "Error logging in user"
      });
    }
  } else {
    res.status(400).json({
      message: "Invalid Email"
    });
  }
};

////////////////////////////////////////////////////////////////////////////////////////

// POST/FETCH_10

const posts = async (req, res, db) => {
  try {
    const posts = await db.collection("Post").find().limit(100).toArray();
    res.status(200).send(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).send({
      message: "Error fetching posts"
    });
  }
};



//CRIA POST
const createPost = async (req, res, db) => {
  const {
    title,
    description,
    image,
    local,
    date,
    userID
  } = req.body;
  console.log(req.body);
  const post = {
    title,
    description,
    image,
    local,
    date,
    userID
  };
  console.log(post);
  try {
    const result = await db.collection("Post").insertOne(post);
    console.log(result);
    res.status(201).json({
      message: "Post created",
      post: result
    });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({
      message: "Error creating post"
    });
  }
};

//COMENTARIOS
const addComment = async (req, res, db) => {
  try {
    const {
      postId,
      userId,
      comment
    } = req.body;
    const result = await db
      .collection("Post")
      .updateOne({
        _id: new ObjectId(postId)
      }, {
        $push: {
          comments: {
            userId,
            comment
          }
        }
      });
    if (result.modifiedCount === 1) {
      res.status(200).send({
        message: "Comment added"
      });
    } else {
      res.status(404).send({
        message: "Post not found"
      });
    }
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).send({
      message: "Error adding comment"
    });
  }
};

//POST FETCH_1
const getPost = async (req, res, db) => {
  const {
    postId
  } = req.query;
  console.log(postId);
  try {
    const post = await db
      .collection("Post")
      .findOne({
        _id: new ObjectId(postId)
      });
    if (post) {
      res.status(200).send(post);
    } else {
      res.status(404).send({
        message: "Post not found"
      });
    }
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).send({
      message: "Error fetching post"
    });
  }
};

const getRecentPosts = async (req, res, db) => {
  try {
    const posts = await db.collection("Post").find().sort({ datefield: -1 }).limit(10).toArray();
    if (posts.length > 0) {
      const lastPostId = posts[posts.length - 1]._id;
      res.status(200).send({ posts, lastPostId });
    } else {
      res.status(404).send({
        message: "No posts found"
      });
    }
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).send({
      message: "Error fetching posts"
    });
  }
};

const getNextPosts = async (req, res, db) => {
  const {
    lastPostId
  } = req.query;
  console.log(lastPostId);
  try {
    const post = await db.collection("Post")
      .find({ _id: { $lt: new ObjectId(lastPostId) } })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
    const lastPost = post[post.length - 1];
    const nextLastPostId = lastPost ? lastPost._id.toString() : null;
    res.status(200).send({ posts: post, lastPostId: nextLastPostId });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).send({
      message: "Error fetching posts"
    });
  }
};


const profile = async (req, res, db) => {
  const {
    userID
  } = req.query;
  console.log(userID);
  console.log(req.query);
  try {
    const user = await db
      .collection("Users")
      .findOne({_id: new ObjectId(userID)});
    if (user) {
      res.status(200).send(user);
    } else {
      res.status(404).send({
        message: "user not found"
      });
    }
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).send({
      message: "Error fetching post"
    });
  }
};


const getprofilePosts = async (req, res, db) => {
  const { userID } = req.query;
  console.log(userID);
  console.log(req.query);
  try {
    const userPosts = await db
      .collection("Posts")
      .find({ userId: userID })
      .limit(100)
      .toArray();
    if (userPosts.length > 0) {
      res.status(200).send(userPosts);
    } else {
      res.status(200).send({
        message: "No Posts Created Yet",
      });
    }
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).send({
      message: "Error fetching posts",
    });
  }
};

////////////////////////////////////////////////////////////////////////////////

// Main function
const main = async () => {
  // Connect to MongoDB
  const client = new MongoClient(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await client.connect();
    console.log("Connected to MongoDB");
    const db = client.db();

    app.post("/users/register", (req, res) => registerUser(req, res, db)); // handle user registration
    app.post("/users/login", (req, res) => loginUser(req, res, db)); // handle user login
    app.get("/posts/getallposts", (req, res) => posts(req, res, db));
    app.get("/posts/getrecentposts", (req, res) => getRecentPosts(req, res, db));
    app.get("/posts/getnextposts", (req, res) => getNextPosts(req, res, db));
    app.get("/posts/getpost", (req, res) => getPost(req, res, db));
    app.post("/posts", (req, res) => createPost(req, res, db));
    app.post("/posts/addComment", (req, res) => addComment(req, res, db));
    app.post("/posts/getprofilePosts", (req, res) => getprofilePosts(req, res, db));
    app.post("/users/profile", (req, res) => profile(req, res, db));
    // Start the server
    const port = process.env.PORT || 3001;
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  }
};

main();