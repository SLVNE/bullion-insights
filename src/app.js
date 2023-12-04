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

// Define a GET route for '/latest-spot-price' that takes 'category' as a query parameter
app.get('/latest-spot-price', async (req, res) => {
  const { category } = req.query;
  if (!category) {
    return res.status(400).send('Missing category parameter');
  }

  try {
    // Query the database for the latest price where 'vendor' is 'spot' and 'category' matches the provided parameter
    const query = 'SELECT * FROM data WHERE vendor = $1 AND category = $2 ORDER BY date DESC LIMIT 1;';
    const values = ['spot', category];
    const result = await db.query(query, values);

    // If there's a result, send it back to the client as JSON
    if (result.rows.length > 0) {
      res.json({ price: result.rows[0].price });
    } else {
      res.status(404).send('No data found');
    }
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
        AND vendor != 'spot'
        AND category NOT IN ('all-gold-coins', '1-oz-gold-bars', '10-oz-gold-bars', '1-kg-gold-bars', 'gold-royal-britannias', 'silver-royal-britannias', '1-oz-silver-bars', '10-oz-silver-bars', '100-oz-silver-bars')
      ) 
      AND category LIKE $1 
      AND vendor != 'spot'
      AND category NOT IN ('all-gold-coins', '1-oz-gold-bars', '10-oz-gold-bars', '1-kg-gold-bars', 'gold-royal-britannias', 'silver-royal-britannias', '1-oz-silver-bars', '10-oz-silver-bars', '100-oz-silver-bars');
    `;
    const values = [category + '%'];
    const result = await db.query(query, values);
    res.json(result.rows); // Send the result back to the client as JSON
  } catch (err) {
    console.error(err); // Log any errors to the console
    res.status(500).send('Internal Server Error'); // Send a 500 status code for internal server errors
  }
});



app.get('/api/cheapest-price/:category', async (req, res) => {
  const category = req.params.category;

  if (!category) {
    return res.status(400).send('Missing category parameter');
  }

  try {
    const query = `
      SELECT price, vendor, date
      FROM public.data
      WHERE date = (
        SELECT date
        FROM (
          SELECT date, COUNT(DISTINCT vendor) as vendor_count
          FROM public.data
          WHERE category = $1
          GROUP BY date
        ) as data_per_date
        WHERE vendor_count = (
          SELECT COUNT(DISTINCT vendor)
          FROM public.data
          WHERE category = $1
        )
        ORDER BY date DESC
        LIMIT 1
      )
      AND category = $1
      ORDER BY price ASC
      LIMIT 1;
    `;
    const values = [category];
    const result = await db.query(query, values);

    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'No data found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
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