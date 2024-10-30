const express = require('express')
const app = express()
const port = ""
const cors = require('cors')
const router = express.Router()


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors())

//utlitiy stuffto clean up the code
    // setting up middleware
app.use((req, res, next) => {// for all routes
  console.log(`${req.method} request for ${req.url}`);
  next();
});
app.use('/api/parts', router);// for all routes starting with /api/parts

router.route('/') 
  //get all parts
  .get((req, res) => {
    res.send(parts);
  })
  //create part
  .post((req, res) => {
    const newpart = req.body;
    newpart.id = 100 + parts.length;
    if (newpart.name){
      parts.push(newpart);
      res.status(201).send(newpart);

    }
    else{
      res
    }
  })
  

router.route('/:id')
  .get((req, res) => {  
    const part = parts.find(part => part.id === parseInt(req.params.id))
      if (!part) {
    res.status(404).send('The part with the given ID was not found')
      }
      res.send(part)
  })

  .put((req, res) => {
  const newpart = req.body
  console.log("part:", newpart)
  //add id to the new part
  newpart.id = parseInt(req.params.id)

  //replace the old part with the new part
  const part = parts.findIndex(part => part.id === parseInt(req.params.id))
  if (part <0) {
    console.log("part not found, creating new one")
    parts.push(newpart)
  }
  else {
    console.log("part found, replacing", req.params.id)
    parts[part] = newpart
  }
  
  res.send(newpart)
  })


  .post((req, res) => {
  const newpart = req.body;
  console.log("Part: ", newpart);

  // Find the part
  const part = parts.findIndex(p => p.id === parseInt(req.params.id));

  if (part < 0) { // not found
      res.status(404).send(`Part ${req.params.id} not found`);
  }
  else {
      console.log('Changing stock for ', req.params.id);
      parts[part].stock += parseInt(req.body.stock); // stock property must exist
      res.send(req.body);
  }
  })


router.use(express.json());
const parts =[
  {id: 1001, name: 'CPU', price: 100, stock: 20},
  {id: 1002, name: 'RAM', price: 50 , stock: 10},
  {id: 1003, name: 'SSD', price: 150 , stock: 5},
  {id: 1004, name: 'HDD', price: 50, stock: 10},
]


//starting the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
    //getting the listnpm start
router.get('/',cors(), (req, res) => {
  res.send(parts)
})
    //get details of a part
router.get('/:id',cors(), (req, res) => {

})
