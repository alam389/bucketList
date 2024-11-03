const express = require('express');
const cors = require('cors');
const fs = require('fs');
const csv = require('csv-parser');

const app = express();
const router = express.Router();
const port = 5000;
const results = [];//this will store parsed CSV data
const lists = {}; //object to store favorite lists

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${req.method} request for ${req.url}`);
  next();
});


let index = 0;

(async () => {
  const stripBomStream = (await import('strip-bom-stream')).default;

  fs.createReadStream('C:/SE 3316/clone2/se3316-lab3-alam389/server/europe-destinations.csv')
    .pipe(stripBomStream()) //remove BOM
    .pipe(csv())
    .on('data', (data) => {
      data.index = index++; //add index as a property to each row and increment it
      results.push(data);
    })
    .on('end', () => {
      console.log('CSV data loaded.');
    });
})();

router.get('/:id', (req, res) => {
  const destinationId = parseInt(req.params.id, 10); //convert ID to an integer
  const destination = results.find(d => d.index === destinationId ); //find by index property

  if (destination) {
    res.json(destination);
  } else {
    res.status(404).send(`Destination with ID ${req.params.id} not found`);
  }
});
// Get all countries
router.get('/country', (req, res) => {
  const countries = results.map(destination => destination.Country)
    .filter((value, index, self) => self.indexOf(value) === index); // take out duplicates
  res.json(countries);
});


router.get('/:id/coordinates',cors(), (req, res) => {
  const destinationId = parseInt(req.params.id, 10); // ID to an integer
  const destination = results.find(d => d.index === destinationId);

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
  const regex = new RegExp(pattern, 'i'); //case-insensitive regex for matching

  // Check if data is loaded
  if (results.length === 0) {
    return res.status(500).json({ error: 'CSV data not loaded' });
  }

  // preforms the search, ensuring the field exists in each entry
  const matches = results.filter(destination => {
    //check if the field exists in the destination and if it matches the pattern
    return destination[field] && regex.test(destination[field]);
  });

  if (matches.length === 0) {
    console.log(`No matches found for pattern: "${pattern}" in field: "${field}"`);
    return res.status(404).json({ error: 'No matches found' });
  } else {
    console.log(`Found ${matches.length} matches for pattern: "${pattern}" in field: "${field}"`);
  }

  //return limited results if specified
  if (limit) {
    return res.json(matches.slice(0, limit));
  } else {
    return res.json(matches);
  }
});

//create a new favorite list
router.post('/list/:listName', (req, res) => {
  let { listName } = req.params;

  // server sanitization
  listName = listName.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 15);

  if (lists[listName]) {
    res.status(400).json({ error: `List ${listName} already exists` });
  } else {
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

//retrieve a favorite list
router.get('/list/:listName', (req, res) => {
  const { listName } = req.params; //get the list name from the URL

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
      const destination = results.find(d => d.index === parseInt(id, 10) );
      if (destination) {
        return {//return a subset of the destination object
          index: destination.index, 
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
    }).filter(destination => destination !== null); //filter out any null values

    res.status(200).json(destinations);
  } else {
    res.status(400).json({
      error: 'List does not exist'
    });
  }
});

//retrieve all lists and their names
router.get('/lists', (req, res) => {
  const listNames = Object.keys(lists);
  res.status(200).json({
    listNames,
    lists
  });
});

app.use('/api/destination', router);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});