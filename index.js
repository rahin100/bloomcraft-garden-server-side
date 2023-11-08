const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
var cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors(
  {
    origin:["http://localhost:5173"],
    credentials:true
  }
));
app.use(express.json());
app.use(cookieParser())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3fczceh.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    //jwt middleware
    const verify = async(req,res,next)=>{
      const token = req.cookies?.token
      if(!token){
        res.status(401).send({status: "unAuthorized Access", code: "401"})
        return
      }
      jwt.verify(token,process.env.SECRET,(err,decode)=>{
        if(err){
          res.status(403).send({status: "unAuthorized Access", code: "403"})
        }else{
          req.decode = decode
        }
      })
      next()
    }



    const bloomCraft_Service_collection = client.db("bloomCraft").collection("services");

    const bloomCraft_All_Service_collection = client.db("bloomCraft").collection("allservices");

    const bookings_collection = client.db("bloomCraft").collection("bookings");

    // auth related api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      // console.log("user for token", user);
      const token = jwt.sign(user, process.env.SECRET, {expiresIn: "1h"})
      const expirationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
     res.cookie("token",token,{
      httpOnly:true,
      secure:false,
      expires:expirationDate
      
     }).send({msg:"Succeed",token})
      // res.send({user, token})
      // res.send({token})

    });

    // ...........................................................
    app.get("/services",async (req, res) => {
      const query = req.params.id;
      console.log(query);
      const cursor = bloomCraft_Service_collection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    // .........................................................
    //email ....
    app.get("/allservices", async (req, res) => {
      console.log(req.decode)

      console.log(req.query.serviceEmail);
      let query = {};
      if (req.query?.serviceEmail) {
        query = { serviceEmail: req.query?.serviceEmail };
      }
      const cursor = bloomCraft_All_Service_collection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/allservices", async (req, res) => {
      const query = req.params.id;
      console.log(query);
      const cursor = bloomCraft_All_Service_collection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/allservices", async (req, res) => {
      const addService = req.body;
      console.log(addService);
      const result = await bloomCraft_All_Service_collection.insertOne(
        addService
      );
      res.send(result);
    });

    app.put("/allservices/:id",  async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateService = req.body;
      console.log(updateService);
      const updateData = {
        $set: {
          serviceImage: updateService.serviceImage,
          serviceName: updateService.serviceName,
          serviceProviderName: updateService.serviceProviderName,
          serviceEmail: updateService.serviceEmail,
          serviceArea: updateService.serviceArea,
          serviceDescription: updateService.serviceDescription,
          servicePrice: updateService.servicePrice,
          serviceProviderImage: updateService.serviceProviderImage,
        },
      };
      const result = await bloomCraft_All_Service_collection.updateOne(
        filter,
        updateData,
        options
      );
      res.send(result);
    });

    app.delete("/allservices/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = {
        _id: new ObjectId(id),
      };
      const result = await bloomCraft_All_Service_collection.deleteOne(query);
      res.send(result);
    });

    // .........................................................
    app.post("/bookings",async (req, res) => {
      const newBookings = req.body;
      console.log(newBookings);
      const result = await bookings_collection.insertOne(newBookings);
      res.send(result);
    });
    app.get("/bookings", async (req, res) => {
      let query = {};
      if (req.query?.serviceEmail) {
        query = { serviceEmail: req.query?.serviceEmail };
      }
      const cursor = bookings_collection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("bloomCraft Gardens is running");
});

app.listen(port, () => {
  console.log(`bloomCraft Gardens server is running on port ${port}`);
});
