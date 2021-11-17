const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

//middleware function
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mqo07.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
async function verifyToken(req, res, next) {
  if (req.headers?.authorization?.startsWith("Bearer ")) {
    const token = req.headers.authorization.split(" ")[1];

    try {
      const decodedUser = await admin.auth().verifyIdToken(token);
      req.decodedEmail = decodedUser.email;
    } catch {}
  }
  next();
}

async function run() {
  try {
    await client.connect();
    const database = client.db("mediEye");
    const productsCollection = database.collection("products");
    const usersCollection = database.collection("users");
    const ordersCollection = database.collection("orders");
    const reviewsCollection = database.collection("reviews");

    app.get("/products", async (req, res) => {
      const cursor = productsCollection.find({});
      const products = await cursor.toArray();
      res.send(products);
    });

    app.post("/products", async (req, res) => {
      const product = req.body;
      //   console.log(product, "product api is hit");
      const result = await productsCollection.insertOne(product);
      res.json(result);
    });

    app.post("/users", async (req, res) => {
      console.log("hitted");
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      console.log(result);
      res.json(result);
    });

    app.post("/orders", async (req, res) => {
      console.log("hitted");
      const order = req.body;
      const result = await ordersCollection.insertOne(order);
      console.log(result);
      res.json(result);
    });
    //crate reviews
    app.post("/reviews", async (req, res) => {
      console.log("hitted");
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      console.log(result);
      res.json(result);
    });
    app.get("/reviews", verifyToken, async (req, res) => {
      const cursor = reviewsCollection.find({});
      const reviews = await cursor.toArray();
      res.send(reviews);
    });

    app.get("/orders", verifyToken, async (req, res) => {
      const email = req.query.email;
      console.log(email);
      const query = { email: email };
      const cursor = ordersCollection.find(query);
      const orders = await cursor.toArray();
      res.json(orders);
    });
    app.put("/users", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });

    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let isAdmin = false;
      if (user?.role === "admin") {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });
    app.put("/users/admin", verifyToken, async (req, res) => {
      const user = req.body;
      console.log(user);
      const requester = req.decodedEmail;
      console.log(requester);
      if (requester) {
        const requesterAccount = await usersCollection.findOne({
          email: requester,
        });
        if (requesterAccount.role === "admin") {
          const filter = { email: user.email };
          const updateDoc = { $set: { role: "admin" } };
          const result = await usersCollection.updateOne(filter, updateDoc);
          res.json(result);
        }
      } else {
        res
          .status(403)
          .json({ message: "you do not have access to make admin" });
      }
    });
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Welcome to medical Imaging");
});

app.listen(port, () => {
  console.log("listening on port", port);
});
