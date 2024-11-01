const express = require('express');
const cors = require('cors');
const fs = require('fs');
const csv = require('csv-parser');

const app = express();
const router = express.Router();
const port = 5000;
const results = [];
const lists = {}; //object to store lists
let index = 0;//index for each destination


//middleware to parse URL-encoded and JSON payloads
app.use(express.urlencoded({ extended: true}));
app.use(express.json());
//middleware to log requests
app.use((req, res, next) => {
  console.log(`${req.method} request for ${req.url}`);
  next();
});
app.use(cors());

app.use('/api/destination', router); //for all routes starting with /api/parts

//load CSV data on server start

fs.createReadStream('C:/SE 3316/clone2/se3316-lab3-alam389/server/europe-destinations.csv')
  .pipe(csv())
  .on('data', (data) => {
    data.index = index++; // Add index as a property to each row and increment it
    results.push(data);
  })
  .on('end', () => {
    console.log('CSV data loaded.');
  });

router.get('/country',cors(), async (req, res) => {
  const countries = results.map(destination => destination.Country)// Get all countries
    .filter((value, index, self) => self.indexOf(value) === index); // Filter out duplicates
  res.json(countries);

});
//get all information for a given destination ID
router.get('/:id', (req, res) => {
  const destinationId = parseInt(req.params.id, 10); // Convert ID to an integer
  const destination = results.find(d => d.index === destinationId - 1); // Find by index property

  if (destination) {
    res.json(destination);
  } else {
    res.status(404).send(`Destination with ID ${req.params.id} not found`);
  }
});

//get geographical coordinates (latitude and longitude) of a given destination ID
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

router.get('/search/:field/:pattern/:n?', (req, res) => {
  const { field, pattern, n } = req.params;
  const limit = n ? parseInt(n, 10) : undefined;
  const regex = new RegExp(pattern, 'i'); // Case-insensitive regex for matching

  const matches = results.filter(destination => regex.test(destination[field]));

  if (limit) {
    res.json(matches.slice(0, limit));
  } else {
    res.json(matches);
  }});
//create a new list 
router.post('/list/:listName',cors(), (req, res) => {
  const { listName } = req.params; // getting the list name from the url

  if (lists[listName]) { // checking if the list name already exists
    res.status(400).json({
      error: `List ${listName} already exists`
    });
  } else { // If no matches, create a new list
    lists[listName] =  [];
    res.status(200).json({
      destinationId: lists[listName]
    });
  }});

router.put('/list/:listName/:destinationId', cors(), (req,res)=>{//adding indexs

  const {listName,destinationId} = req.params;// getting the list name from the url

  if (lists[listName]){
    lists[listName].push(destinationId)
    res.status(200).json({
      destinationId: lists[listName]
    })}
  else{
    res.status(400).send('List does not exist')
  }})

router.get('/list/:listName', (req, res) => {
  const {listName} = req.params;// getting the list name from the url
  if (lists[listName]){
    res.status(200).json({
      destinationId: lists[listName]
    })
  }else{
    res.status(400).json({
      error: 'List does not exist' 


    })
  }})

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
          name: destination.Name,
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

//starting the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
