// Define a color array for different line series
const colors = ['#2962FF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FFA500'];
const vendors = ['moneymetals', 'jmbullion', 'texmetals', 'usgoldbureau'];
const realPriceChart = document.getElementById('realPriceChart');

let chart; // Define chart in the global scope

// Define a mapping from checkbox id to category
let categoryMapping = {
  'option1': 'spot-silver',
  'option2': 'silver-american-eagles',
  'option3': 'silver-canadian-maple-leafs',
  'option4': 'silver-austrian-philharmonics',
  'option5': 'silver-south-african-krugerrands',
  'option6': 'silver-australian-kangaroos',
};

// Create a dropdown menu for the vendors
let vendorDropdown = document.createElement('select');
vendors.forEach(vendor => {
  let option = document.createElement('option');
  option.value = vendor;
  option.text = vendor;
  vendorDropdown.appendChild(option);
});
realPriceChart.appendChild(vendorDropdown);

// Function to get average price
const getAveragePrice = async (category) => {
  try {
    const response = await fetch(`/average?category=${category}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const avgPrice = Number(data[0].avg).toFixed(2); // Round the average price to two decimal places

    // Find the 'a' element and update its text content with the average price
    const priceElement = document.querySelector('.header-today');
    priceElement.textContent = `Today's Real: $${avgPrice}`;

    return avgPrice;
  } catch (error) {
    console.error('Error:', error);
  }
};

async function updateSpotPrice(category) {
  const response = await fetch(`/latest-spot-price?category=${encodeURIComponent(category)}`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  const spotPriceElement = document.getElementById('header-spot');

  if (data && data.price) {
    spotPriceElement.textContent = `Today's Spot: $${Number(data.price).toFixed(2)}`;
  } else {
    spotPriceElement.textContent = `Today's Spot: N/A`;
  }
}

// Call the function with 'spot-silver' or 'spot-gold'
updateSpotPrice('spot-silver');

const getCheapestPrice = async (category) => {
  try {
    const response = await fetch(`/api/cheapest-price/${category}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const price = Number(data.price).toFixed(2); // Round the price to two decimal places
    const vendor = data.vendor;
    const date = new Date(data.date).toLocaleDateString(); // Convert the date to a local date string

    return data;
  } catch (error) {
    console.error('Error:', error);
  }
};

async function fillCoinData(metalType) {
  // Define the coin types
  const silverCoinTypes = ['silver-american-eagles', 'silver-canadian-maple-leafs', 'silver-austrian-philharmonics', 'silver-south-african-krugerrands', 'silver-australian-kangaroos'];
  const goldCoinTypes = ['gold-american-eagles', 'gold-canadian-maple-leafs', 'gold-austrian-philharmonics', 'gold-south-african-krugerrands', 'gold-australian-kangaroos'];

  const coinTypes = metalType === 'gold' ? goldCoinTypes : silverCoinTypes;

  // For each coin type, call the getCheapestPrice function and fill the data
  for (let i = 0; i < coinTypes.length; i++) {
    const coinType = coinTypes[i];
    const data = await getCheapestPrice(coinType);
    document.getElementById(`price${i + 1}`).textContent = `Lowest Price: $${Number(data.price).toFixed(2)}`;
    document.getElementById(`vendor${i + 1}`).textContent = `Vendor: ${data.vendor}`;
    document.getElementById(`date${i + 1}`).textContent = `Date: ${new Date(data.date).toLocaleDateString()}`;
  }
}

fillCoinData("silver");

// Listen for changes on the radio buttons
document.getElementsByName('metal').forEach(function(radio) {
    radio.addEventListener('change', function() {
      if (this.value === 'gold') {
        updateSpotPrice('spot-gold');
        getAveragePrice('gold');
        fillCoinData("gold");
        // Change the categoryMapping to gold if the gold radio button is selected
        categoryMapping = {
          'option1': 'spot-gold',
          'option2': 'gold-american-eagles',
          'option3': 'gold-canadian-maple-leafs',
          'option4': 'gold-austrian-philharmonics',
          'option5': 'gold-south-african-krugerrands',
          'option6': 'gold-australian-kangaroos',
        };
      } else {
        updateSpotPrice('spot-silver');
        getAveragePrice('silver');
        fillCoinData("silver");
        // Change the categoryMapping back to silver if the silver radio button is selected
        categoryMapping = {
          'option1': 'spot-silver',
          'option2': 'silver-american-eagles',
          'option3': 'silver-canadian-maple-leafs',
          'option4': 'silver-austrian-philharmonics',
          'option5': 'silver-south-african-krugerrands',
          'option6': 'silver-australian-kangaroos',
        };
      }
      // Get all checkboxes
      const checkboxes = document.querySelectorAll('input[type=checkbox]');
      // Loop through each checkbox
      checkboxes.forEach(function(checkbox) {
        // If the checkbox is checked, simulate a click event
        if (checkbox.checked) {
          checkbox.click();
          checkbox.click();
        }
      });
    });
  });

// Define a mapping from checkbox id to line series
const lineSeriesMapping = {};

const getData = async (metalType) => {
  // Fetch the CSV file
  const res = await fetch(`/js/data/${metalType}-data.csv`);
  // Convert the response to text
  const resp = await res.text();
  // Split the text into rows
  const cdata = resp.split('\n').map((row) => {
    // Split each line by comma to get the individual fields
    const [time, open, high, low, close] = row.split(',');
    // Return an object with the fields converted to the appropriate types
    return {
      time: new Date(time).getTime() / 1000, // Convert time to Unix timestamp
      open: open * 1, // Convert opening price to readable number
      high: high * 1, // Convert daily high price to readable number
      low: low * 1, // Convert daily low price to readable number
      close: close * 1, // Convert closing price to readable number
    };
  });
  // Return the formatted data
  return cdata;
}

// Universal function to fetch data from the server using vendor and category as parameters
const getLineData = async (vendor, category) => {
    // Fetch the data from the server
    const response = await fetch(`/data?vendor=${encodeURIComponent(vendor)}&category=${encodeURIComponent(category)}`);
    // If the response is not OK, throw an error
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    // Convert the response to JSON
    const cdata = await response.json();
    // Format the data
    const formattedData = cdata.map((row) => {
      return {
        value: row.price, // Get the price from its corresponding row
        time: new Date(row.date).getTime() / 1000,
      };
    });
    // Return the formatted data
    return formattedData;
  }

getAveragePrice('silver')

const displayChart = async () => {
    const candleChartProperties = {
        width: window.innerWidth * 0.95,
        height: 300,
        timescale: {
            timeVisible: true,
            secondVisible: true,
        },
    };

    const lineChartProperties = {
        width: window.innerWidth * 0.9,
        height: 300,
        timescale: {
            timeVisible: true,
            secondVisible: true,
        },
    };

    const domElementSpotSilver = document.getElementById('tvchart-spot-silver');
    const chartSpotSilver = LightweightCharts.createChart(domElementSpotSilver, candleChartProperties);
    const candleseriesSpotSilver = chartSpotSilver.addCandlestickSeries();
    const klinedataSpotSilver = await getData("silver");
    candleseriesSpotSilver.setData(klinedataSpotSilver);
    chartSpotSilver.timeScale().fitContent();    

    const domElementSpotGold = document.getElementById('tvchart-spot-gold');
    const chartSpotGold = LightweightCharts.createChart(domElementSpotGold, candleChartProperties);
    const candleseriesSpotGold = chartSpotGold.addCandlestickSeries();
    const klinedataSpotGold = await getData("gold");
    candleseriesSpotGold.setData(klinedataSpotGold);
    chartSpotGold.timeScale().fitContent();  

    const domElement = document.getElementById('tvchart-real-gold');
    chart = LightweightCharts.createChart(domElement, lineChartProperties);
};

// Define the event handler function
const handleCheckboxChange = async (checkbox) => {
  const category = categoryMapping[checkbox.id];
  let vendor = vendorDropdown.value;

  // If a line series already exists for this checkbox, remove it
  if (lineSeriesMapping[checkbox.id]) {
    chart.removeSeries(lineSeriesMapping[checkbox.id]);
    delete lineSeriesMapping[checkbox.id];
  }

  if (checkbox.checked) {
    // If the checkbox is checked, add a new line series to the chart
    const lineSeries = chart.addLineSeries({ color: colors[parseInt(checkbox.id.replace('option', '')) - 1] });
    console.log(checkbox.id)
    // the first id to be checked against the spot checkbox to change vendor for the spot price
    const isFirstChild = checkbox.id === "option1";
    // if it is the first child, change the vendor to spot
    vendor = isFirstChild ? 'spot' : vendor;
    const klinedata = await getLineData(vendor, category).catch(e => console.error('Error:', e));
    lineSeries.setData(klinedata);
    lineSeriesMapping[checkbox.id] = lineSeries;
    // Show the color box
    document.getElementById(`color-${checkbox.id}`).style.visibility = 'visible';
    document.getElementById(`color-${checkbox.id}`).style.backgroundColor = colors[parseInt(checkbox.id.replace('option', '')) - 1];
  } else {
    // If the checkbox is unchecked, hide the color box
    document.getElementById(`color-${checkbox.id}`).style.visibility = 'hidden';
  }

  chart.timeScale().fitContent();
};

  // Add event listeners to checkboxes
  for (let i = 1; i <= 6; i++) {
    const checkbox = document.getElementById(`option${i}`);
    checkbox.addEventListener('change', () => handleCheckboxChange(checkbox));
  }

    // Add an event listener to the vendor dropdown
  vendorDropdown.addEventListener('change', () => {
    // When the selected vendor changes, re-run the handleCheckboxChange function for all checked checkboxes
    for (let i = 1; i <= 6; i++) {
      const checkbox = document.getElementById(`option${i}`);
      if (checkbox.checked) {
        handleCheckboxChange(checkbox);
      }
    }
  });

  displayChart().then(() => {
    // After the chart is displayed, check the state of the checkboxes
    for (let i = 1; i <= 6; i++) {
      const checkbox = document.getElementById(`option${i}`);
      if (checkbox.checked) {
        // If the checkbox is checked, manually call the event handler function
        handleCheckboxChange(checkbox);
      }
    }
    chart.timeScale().fitContent();
  });

  document.querySelectorAll('.toggle-option input[type="radio"]').forEach((radio) => {
    radio.addEventListener('change', (event) => {
      const h3Elements = document.querySelectorAll('.price-chart');
      h3Elements.forEach(h3 => {
        if (event.target.id === 'silver') {
          h3.style.color = '#C0C0C0';
        } else if (event.target.id === 'gold') {
          h3.style.color = 'gold';
        }
      });
      const h5Elements = document.querySelectorAll('.coin-name');
      h5Elements.forEach(h5 => {
        if (event.target.id === 'silver') {
          h5.style.color = '#C0C0C0';
        } else if (event.target.id === 'gold') {
          h5.style.color = 'gold';
        }
      });

      const spotChartH3 = document.getElementById('spot-chart');
      if (event.target.id === 'silver') {
        spotChartH3.textContent = 'SILVER SPOT CANDLESTICK CHART:';
        document.getElementById('tvchart-spot-silver').hidden = false;
        document.getElementById('tvchart-spot-gold').hidden = true;
      } else if (event.target.id === 'gold') {
        spotChartH3.textContent = 'GOLD SPOT CANDLESTICK CHART:';
        document.getElementById('tvchart-spot-silver').hidden = true;
        document.getElementById('tvchart-spot-gold').hidden = false;
      }
    });
  });