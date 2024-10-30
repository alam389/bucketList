const express = require('express');
const cors = require('cors');
const fs = require('fs');
const csv = require('csv-parser');

const app = express();
const router = express.Router();
const port = 5000;
const results = [];
const lists = {}; // Object to store lists

//middleware to parse URL-encoded and JSON payloads
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
//middleware to log requests
app.use((req, res, next) => {
  console.log(`${req.method} request for ${req.url}`);
  next();
});
app.use(cors());
app.use('/api/destination', router); // for all routes starting with /api/parts

//load CSV data on server start
let index = 0; // Define an index variable
fs.createReadStream('C:/SE 3316/clone2/se3316-lab3-alam389/server/europe-destinations.csv')
  .pipe(csv())
  .on('data', (data) => {
    data.index = index++; // Add index as a property to each row and increment it
    results.push(data);
  })
  .on('end', () => {
    console.log('CSV data loaded.');
  });

router.get('/country', (req, res) => {
  const countries = results.map(destination => destination.Country)// Get all countries
    .filter((value, index, self) => self.indexOf(value) === index); // Filter out duplicates
  res.json(countries);

});
// Get all information for a given destination ID
router.get('/:id', (req, res) => {
  const destinationId = parseInt(req.params.id, 10); // Convert ID to an integer
  const destination = results.find(d => d.index === destinationId - 1); // Find by index property

  if (destination) {
    res.json(destination);
  } else {
    res.status(404).send(`Destination with ID ${req.params.id} not found`);
  }
});

// Get geographical coordinates (latitude and longitude) of a given destination ID
router.get('/:id/coordinates', cors(), (req, res) => {
  const destinationId = parseInt(req.params.id, 10); // Convert ID to an integer
  const destination = results.find(d => d.index === destinationId - 1); // Find by index property

  if (destination && destination.Latitude && destination.Longitude) {
    res.json({
      Latitude: destination.latitude,
      Longitude: destination.longitude
    });

  } else {
    res.status(404).send(`Coordinates for destination with ID ${req.params.id} not found`);
  }
});

router.get('/search/:field/:pattern/:n?', (req, res) => {
  const { field, pattern, n } = req.params;
  const limit = n ? parseInt(n, 10) : undefined;
  const regex = new RegExp(pattern, 'i'); // Case-insensitive regex for matching

  const matches = results.filter(destination => regex.test(destination[field]));

  if (limit) {
    res.json(matches.slice(0, limit));
  } else {
    res.json(matches);
  }
});

router.post('/list/:listName', (req, res) => {
  const { listName } = req.params; // Get the list name from the URL

  if (lists[listName]) { // Check if the list name already exists
    res.status(400).send('List already exists');
  } else { // If no matches, create a new list
    lists[listName] = req.body; 
    res.status(201).send(lists[listName]);
  }
});


//starting the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
