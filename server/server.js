const express = require('express');
const cors = require('cors');
const fs = require('fs');
const csv = require('csv-parser');

const app = express();
const router = express.Router();
const port = 5000;
const results = [];
const lists = {}; // Object to store favorite lists

// Middleware to parse URL-encoded and JSON payloads
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors()); // Apply CORS middleware globally

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${req.method} request for ${req.url}`);
  next();
});

// Load CSV data on server start
let index = 0; // Define an index variable

// Use dynamic import for strip-bom-stream
(async () => {
  const stripBomStream = (await import('strip-bom-stream')).default;

  fs.createReadStream('C:/SE 3316/clone2/se3316-lab3-alam389/server/europe-destinations.csv')
    .pipe(stripBomStream()) // Remove BOM
    .pipe(csv())
    .on('data', (data) => {
      data.index = index++; // Add index as a property to each row and increment it
      results.push(data);
    })
    .on('end', () => {
      console.log('CSV data loaded.');
    });
})();

router.get('/:id', (req, res) => {
  const destinationId = parseInt(req.params.id, 10); // Convert ID to an integer
  const destination = results.find(d => d.index === destinationId - 1); // Find by index property

  if (destination) {
    res.json(destination);
  } else {
    res.status(404).send(`Destination with ID ${req.params.id} not found`);
  }
});
// Get all countries
router.get('/country', (req, res) => {
  const countries = results.map(destination => destination.Country)
    .filter((value, index, self) => self.indexOf(value) === index); // Filter out duplicates
  res.json(countries);
});


router.get('/:id/coordinates',cors(), (req, res) => {
  const destinationId = parseInt(req.params.id, 10); // Convert ID to an integer
  const destination = results.find(d => d.index === destinationId - 1); // Find by index property

  if (destination && destination.Latitude && destination.Longitude) {
    res.json({
      Latitude: destination.Latitude,
      Longitude: destination.Longitude
    });
  } else {
    res.status(404).send(`Coordinates for destination with ID ${req.params.id} not found`);
  }
});
// Search endpoint
router.get('/search/:field/:pattern/:n?', (req, res) => {
  const { field, pattern, n } = req.params;
  const limit = n ? parseInt(n, 10) : undefined;
  const regex = new RegExp(pattern, 'i'); // Case-insensitive regex for matching

  // Check if data is loaded
  if (results.length === 0) {
    return res.status(500).json({ error: 'CSV data not loaded' });
  }

  // Perform the search, ensuring the field exists in each entry
  const matches = results.filter(destination => {
    // Check if the field exists in the destination and if it matches the pattern
    return destination[field] && regex.test(destination[field]);
  });

  if (matches.length === 0) {
    console.log(`No matches found for pattern: "${pattern}" in field: "${field}"`);
    return res.status(404).json({ error: 'No matches found' });
  } else {
    console.log(`Found ${matches.length} matches for pattern: "${pattern}" in field: "${field}"`);
  }

  // Return limited results if specified
  if (limit) {
    return res.json(matches.slice(0, limit));
  } else {
    return res.json(matches);
  }
});

// Create a new favorite list
router.post('/list/:listName', (req, res) => {
  const { listName } = req.params; // Get the list name from the URL

  if (lists[listName]) { // Check if the list name already exists
    res.status(400).json({ error: `List ${listName} already exists` });
  } else { // If no matches, create a new list
    lists[listName] = [];
    res.status(200).json({ message: `List ${listName} created successfully` });
  }
});

router.put('/list/:listName/:destinationId', (req, res) => {
  const { listName, destinationId } = req.params; 
  
  if (lists[listName]) {
    lists[listName].push(destinationId);
    const updatedList = lists[listName].map(id => results.find(d => d.index === parseInt(id, 10)));
    res.status(200).json({ message: `Destination ID ${destinationId} added to list ${listName}`, list: updatedList });
  } else {
    res.status(400).json({ error: 'List does not exist' });
  }
});

// Retrieve a favorite list
router.get('/list/:listName', (req, res) => {
  const { listName } = req.params; // Get the list name from the URL

  if (lists[listName]) {
    const destinations = lists[listName].map(id => results.find(d => d.index === parseInt(id, 10)));
    res.status(200).json(destinations);
  } else {
    res.status(400).json({ error: 'List does not exist' });
  }
});

router.delete('/list/:listName/:destinationId', (req, res) => {
  const { listName, destinationId } = req.params; // Extract parameters from the URL

  if (lists[listName]) {
    const index = lists[listName].indexOf(destinationId);
    if (index > -1) {
      lists[listName].splice(index, 1); // Remove the destinationId from the list
      res.status(200).json({
        destinationId: lists[listName]
      });
    } else {
      res.status(404).json({
        error: `Destination ID ${destinationId} not found in list ${listName}`
      });
    }
  } else {
    res.status(400).json({
      error: 'List does not exist'
    });
  }
});
router.get('/list/:listName/display', (req, res) => {
  const { listName } = req.params; // Extract parameters from the URL

  if (lists[listName]) {
    const destinationIds = lists[listName];
    const destinations = destinationIds.map(id => {
      const destination = results.find(d => d.index === parseInt(id, 10) - 1);
      if (destination) {
        return {//return a subset of the destination object
          name: destination.Destination,
          region: destination.Region,
          country: destination.Country,
          coordinates: {
            latitude: destination.Latitude,
            longitude: destination.Longitude
          },
          currency: destination.Currency,
          language: destination.Language
        };
      }
      return null;
    }).filter(destination => destination !== null); // Filter out any null values

    res.status(200).json(destinations);
  } else {
    res.status(400).json({
      error: 'List does not exist'
    });
  }
});

// Retrieve all lists and their names
router.get('/lists', (req, res) => {
  const listNames = Object.keys(lists);
  res.status(200).json({
    listNames,
    lists
  });
});

// Apply the router for all routes starting with /api/destination
app.use('/api/destination', router);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});