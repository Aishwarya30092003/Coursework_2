// Import required modules
const express = require('express');
const path = require('path');

// Create an Express application
const app = express();

app.use(express.json());

// Set the port number
app.set('port', 3000);


app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
    next();
});

// Middleware for logging requests
app.use((req, res, next) => {
    console.log(`[${new Date().toUTCString()}] ${req.method} ${req.originalUrl}`);
    next();
});

// Connect to MongoDB database
const MongoClient = require('mongodb').MongoClient;
let db;
MongoClient.connect('mongodb+srv://aishwaryaabss:Aishmal%401@gettingstarted.tpzj3aa.mongodb.net', (err, client) => {
    db = client.db('AfterSchool');
});

// Middleware to handle collection name parameter
app.param('collectionName', (req, res, next, collectionName) => {
    req.collection = db.collection(collectionName);
    return next();
});

// Routes
app.get('/', (req, res, next) => {
    res.send('select a collection, e.g., /collection/messages');
});

// Get all documents in a collection
app.get('/collection/:collectionName', (req, res, next) => {
    req.collection.find({}).toArray((e, results) => {
        if (e) return next(e);
        res.send(results);
    });
});

// Insert a new document into a collection
app.post('/collection/:collectionName', (req, res, next) => {
    req.collection.insert(req.body, (e, results) => {
        if (e) return next(e);
        res.send(results.ops);
    });
});

// Get a document by ID from a collection
app.get('/collection/:collectionName/:id', (req, res, next) => {
    req.collection.findOne({ _id: new ObjectID(req.params.id) }, (e, result) => {
        if (e) return next(e);
        res.send(result);
    });
});

// Update inventory of a product
app.put('/collection/:collectionName/updateInventory/:id', (req, res, next) => {
    req.collection.update(
        { _id: new ObjectID(req.params.id) },
        { $set: req.body },
        { safe: true, multi: false },
        (e, result) => {
            if (e) return next(e);
            res.send((result.result.n === 1) ? { msg: 'success' } : { msg: 'error' });
        });
});

// Delete a document by ID from a collection
app.delete('/collection/:collectionName/:id', (req, res, next) => {
    req.collection.deleteOne(
        { _id: new ObjectID(req.params.id) },
        (e, result) => {
            if (e) return next(e);
            res.send((result.result.n === 1) ? { msg: 'success' } : { msg: 'error' });
        });
});

// Search products in a collection based on query
app.get('/collection/:collectionName/search/:searchQ', (req, res, next) => {
    const query = req.params.searchQ; 
    let filter = {}; 

    if (query) {
        filter = {
            $or: [
                { title: { $regex: query, $options: 'i' } }, 
            ]
        };
    }

    db.collection('Products').find(filter).toArray((err, results) => {
        if (err) {
            console.error('Error Searching:', err);
            return res.status(500).json({ error: 'Failed to search product' });
        }
        res.send(results);
    });
});

// Serve static images
const STATIC_IMAGE_DIR = path.join(__dirname, 'static', 'images');
app.use('/images', express.static(STATIC_IMAGE_DIR));
app.get('/images/:imageFilename', (req, res) => {
    const imageFilename = req.params.imageFilename;
    res.sendFile(path.join(STATIC_IMAGE_DIR, imageFilename));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Image Not Found');
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port);
