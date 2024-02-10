const express = require('express')

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

app.put('/collection/:collectionName/:id', (req, res, next) => {
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

// const port = process.env.PORT || 3000
// app.listen(port)