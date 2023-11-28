// Define a color array for different line series
const colors = ['#2962FF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FFA500'];
const vendors = ['moneymetals', 'jmbullion', 'texmetals', 'usgoldbureau'];
const realPriceChart = document.getElementById('realPriceChart');

let chart; // Define chart in the global scope

// Define a mapping from checkbox id to category
let categoryMapping = {
  'option1': 'silver-royal-britannias',
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

// Listen for changes on the radio buttons
document.getElementsByName('metal').forEach(function(radio) {
    radio.addEventListener('change', function() {
      if (this.value === 'gold') {
        getAveragePrice('gold')
        // Change the categoryMapping to gold if the gold radio button is selected
        categoryMapping = {
          'option1': 'gold-royal-britannias',
          'option2': 'gold-american-eagles',
          'option3': 'gold-canadian-maple-leafs',
          'option4': 'gold-austrian-philharmonics',
          'option5': 'gold-south-african-krugerrands',
          'option6': 'gold-australian-kangaroos',
        };
      } else {
        getAveragePrice('silver')
        // Change the categoryMapping back to silver if the silver radio button is selected
        categoryMapping = {
          'option1': 'silver-royal-britannias',
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

// Sample function to fetch data from a CSV file and format it
const getData = async () => {
    // Fetch the CSV file
    const res = await fetch("/js/data/data.csv");
    // Convert the response to text
    const resp = await res.text();
    //console.log(resp);
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
      //console.log(cdata);
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
        width: 1250,
        height: 300,
        timescale: {
            timeVisible: true,
            secondVisible: true,
        },
    };

    const lineChartProperties = {
        width: 1250,
        height: 300,
        timescale: {
            timeVisible: true,
            secondVisible: true,
        },
    };

    const domElementReal = document.getElementById('tvchart-spot-gold');
    const chartReal = LightweightCharts.createChart(domElementReal, candleChartProperties);
    const candleseriesReal = chartReal.addCandlestickSeries();
    const klinedataReal = await getData();
    candleseriesReal.setData(klinedataReal);
    chartReal.timeScale().fitContent();   

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
