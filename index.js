const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


// Middleware 
app.use(cors());
app.use(express.json());



// -------MongoDB Connect------
const uri = process.env.DB_URL;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1
});

async function run() {
    try {
        await client.connect();
        const blogCollection = client.db("redux-ass1").collection("blog");
        const userCollection = client.db("redux-ass1").collection("user");


        app.post('/register', async (req, res) => {
            try {
                const result = await userCollection.insertOne(req.body);
                res.status(200).json(result);
            } catch (error) {
                if (error) return res.status(500).json({ message: error.message });
            }
        });

        app.post('/login', async (req, res) => {
            try {
                const user = await userCollection.findOne({ email: req.body.email });
                if (!user) return res.status(401).json({ error: "This email doesn't exist!" });
                if (user.password !== req.body.password) return res.status(401).json({ error: "Incorrect password!" });

                res.status(200).json(user);
            } catch (error) {
                if (error) return res.status(500).json({ message: error.message });
            }
        });

        app.post('/blog', async (req, res) => {
            try {
                const user = JSON.parse(req.headers.authorization);
                if (!user) return res.status(401).json({ error: "Unauthorized access!" });

                const isAdmin = await userCollection.findOne({ email: user.email });
                if (!isAdmin) return res.status(401).json({ error: "Unauthorized access!" });
                if (isAdmin.role !== 'admin') return res.status(401).json({ error: "You aren't Admin!" });

                const result = await blogCollection.insertOne(req.body);
                res.status(200).json(result);
            } catch (error) {
                if (error) return res.status(500).send({ error: error.message });
            }
        });

        app.get('/blog', async (req, res) => {
            try {
                const cursor = await blogCollection.find({});
                const data = await cursor.toArray();
                res.status(200).json(data);
            } catch (error) {
                if (error) return res.status(500).json({ error: error.message });
            }
        });

        app.patch('/blog/:id', async (req, res) => {
            try {
                const query = { _id: new ObjectId(req.params.id) };
                const result = await blogCollection.updateOne(
                    query,
                    { $set: req.body },
                    { upsert: true },
                );

                const cursor = await blogCollection.find({});
                const data = await cursor.toArray();
                
                res.status(200).json(data)
            } catch (error) {
                if (error) return res.status(500).json({ error: error.message });
            }
        });

        app.delete('/blog/:id', async (req, res) => {
            try {
                const query = { _id: new ObjectId(req.params.id) };
                const result = await blogCollection.deleteOne(query);
                res.status(200).json(result);
            } catch (error) {
                if (error) return res.status(500).json({ error: error.message });
            }
        });

    }
    finally { }
};
run().catch(console.dir);

app.get('/', async (req, res) => {
    res.send('Server is running successfully!')
});

app.listen(port, () => {
    console.log(`SERVER IS RUNNING AT ${port}`)
})