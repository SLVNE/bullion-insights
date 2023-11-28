// Import necessary modules
const express = require('express'); // Express.js for server and routing
const route = require('./routes/route'); // Custom routes module
const app = express(); // Create an Express.js app
const path = require('path'); // Node.js path module for handling and transforming file paths
const db = require('./pg'); // Custom PostgreSQL database module
app.use(express.json()); // Middleware to parse JSON bodies

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../public')));
app.use('/css', express.static(path.join(__dirname, '../public/css')));
app.use('/js', express.static(path.join(__dirname, '../public/js')));
app.use('/img', express.static(path.join(__dirname, '../public/img')));

// Define a GET route for '/data' that takes 'vendor' and 'category' as query parameters
app.get('/data', async (req, res) => {
  const { vendor, category } = req.query;
  if (!vendor || !category) {
    return res.status(400).send('Missing vendor or category parameter');
  }

  try {
    // Query the database for data where 'vendor' and 'category' match the provided parameters
    const query = 'SELECT * FROM data WHERE vendor = $1 AND category = $2 ORDER BY date ASC;';
    const values = [vendor, category];
    const result = await db.query(query, values);
    res.json(result.rows); // Send the result back to the client as JSON
  } catch (err) {
    console.error(err); // Log any errors to the console
    res.status(500).send('Internal Server Error'); // Send a 500 status code for internal server errors
  }
});

// Define a GET route for '/average' that takes 'category' as a query parameter
app.get('/average', async (req, res) => {
  const { category } = req.query;
  if (!category) {
    return res.status(400).send('Missing category parameter');
  }

  try {
    // Query the database for the average price where 'category' matches the provided parameter and the date is the latest for that category
    const query = `
      SELECT AVG(price) 
      FROM public.data 
      WHERE date = (
        SELECT MAX(date) 
        FROM public.data
        WHERE category LIKE $1
      ) AND category LIKE $1;
    `;
    const values = [category + '%'];
    const result = await db.query(query, values);
    res.json(result.rows); // Send the result back to the client as JSON
  } catch (err) {
    console.error(err); // Log any errors to the console
    res.status(500).send('Internal Server Error'); // Send a 500 status code for internal server errors
  }
});

// Use the custom routes module for all other routes
app.use('/', route);

// Set the views directory and the view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs'); // EJS for templating

// Listen on port 3000
const port = 3000;

// Start the server
app.listen(port, function () {
  console.log('Node app running on port ' + port);
});