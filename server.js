const express = require('express')
const path = require('path');

const app = express()

app.use(express.json())
app.set('port', 3000)
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers")
    next();
})

// Logger middleware function
app.use((req, res, next) => {
    // Log the request method and URL
    console.log(`[${new Date().toUTCString()}] ${req.method} ${req.originalUrl}`);
    next()
    // Log request body if it exists
});
const MongoClient = require('mongodb').MongoClient;

let db;
MongoClient.connect('mongodb+srv://aishwaryaabss:Aishmal%401@gettingstarted.tpzj3aa.mongodb.net', (err, client) => {
    db = client.db('AfterSchool')

})

app.param('collectionName', (req, res, next, collectionName) => {
    req.collection = db.collection(collectionName)
    return next()
})
app.get('/', (req, res, next) => {
    res.send('select a collection, e.g., /collection/messages')
})

app.listen(3000, () => {
    console.log('Express.js server running at localhost:3000')
})

app.get('/collection/:collectionName', (req, res, next) => {
    req.collection.find({}).toArray((e, results) => {
        if (e) return next(e)
        res.send(results)
    })
})

app.post('/collection/:collectionName', (req, res, next) => {
    req.collection.insert(req.body, (e, results) => {
        if (e) return next(e)
        res.send(results.ops)
    })
})

const ObjectID = require('mongodb').ObjectID;
app.get('/collection/:collectionName/:id', (req, res, next) => {
    req.collection.findOne({ _id: new ObjectID(req.params.id) }, (e, result) => {
        if (e) return next(e)
        res.send(result)
    })
})

app.put('/collection/:collectionName/updateInventory/:id', (req, res, next) => {
    req.collection.update(
        { _id: new ObjectID(req.params.id) },
        { $set: req.body },
        { safe: true, multi: false },
        (e, result) => {
            if (e) return next(e)
            res.send((result.result.n === 1) ? { msg: 'success' } : { msg: 'error' })
        })
})

app.delete('/collection/:collectionName/:id', (req, res, next) => {
    req.collection.deleteOne(
        { _id: new ObjectID(req.params.id) },
        (e, result) => {
            if (e) return next(e)
            res.send((result.result.n === 1) ? { msg: 'success' } : { msg: 'error' })
        })
})

app.get('/collection/:collectionName/search/:searchQ', (req, res, next) => {
    const query = req.params.searchQ; // Retrieve the search query parameter

    let filter = {}; // Define an empty filter object

    if (query) {
        // If a search query is provided, construct a filter to search by title or description
        filter = {
            $or: [
                { title: { $regex: query, $options: 'i' } }, // Case-insensitive search by title // Case-insensitive search by description
            ]
        };
    }

    // Use the filter to find matching classes
    db.collection('Products').find(filter).toArray((err, results) => {
        if (err) {
            console.error('Error Searching:', err);
            return res.status(500).json({ error: 'Failed to search product' });
        }
        res.send(results); // Send the search results back to the client
    });
});

const STATIC_IMAGE_DIR = path.join(__dirname, 'static', 'images');

// Set up middleware to serve static files (images in this case)
app.use('/images', express.static(STATIC_IMAGE_DIR));

// Define a route to handle image requests
app.get('/images/:imageFilename', (req, res) => {
    const imageFilename = req.params.imageFilename;
    res.sendFile(path.join(STATIC_IMAGE_DIR, imageFilename));
});

// Error handler middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Image Not Found');
});

// const port = process.env.PORT || 3000
// app.listen(port)