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

    app.get("/products", async (req, res) => {
      const cursor = productsCollection.find({});
      const products = await cursor.toArray();
      res.send(products);
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
    app.get("/orders", verifyToken, async (req, res) => {
      const email = req.query.email.toLowerCase();
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
