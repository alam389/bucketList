document.addEventListener('DOMContentLoaded', () => {
  const map = L.map('map').setView([48.8566, 2.3522], 5); 

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  const form = document.getElementById('searchForm'); // Get the form
  const resultsContainer = document.getElementById('results');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const searchType = document.querySelector('input[name="searchType"]:checked').value; // Get the value of the radio button
    const searchValue = document.getElementById('searchQuery').value;
    const selectNum = document.getElementById('selectNum').value; // Get the value of the select element
    console.log(searchType + ' ' + searchValue + ' ' + selectNum); // Testing to make sure the values are obtained

    try {
      // Perform the search
      const searchResponse = await fetch(`http://localhost:5000/api/destination/search/${searchType}/${searchValue}/${selectNum}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json' // Note to self: this means that the content being sent or received is in JSON
        }
      });

      if (!searchResponse.ok) {
        throw new Error(`Error: ${searchResponse.statusText}`);
      }

      const results = await searchResponse.json();
      console.log(results); // Log the results to test if the request is reaching the backend
      displayResults(results);
      displayMap(results);

    } catch (err) {
      console.error('Error fetching data:', err);
    }
  });

  function displayResults(results) {
    resultsContainer.innerHTML = '';
    results.forEach(destination => {
      const div = document.createElement('div');
      div.className = 'result-item';
      div.innerHTML = `
        <h3>${destination.Destination}</h3>
        <p>Region: ${destination.Region}</p>
        <p>Country: ${destination.Country}</p>
        <p>Coordinates: ${destination.Latitude}, ${destination.Longitude}</p>
        <p>Currency: ${destination.Currency}</p>
        <p>Language: ${destination.Language}</p>
      `;
      resultsContainer.appendChild(div);
    });
  }

  function displayMap(results) {
    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    results.forEach(destination => {
      if (destination.Latitude && destination.Longitude) {
        L.marker([destination.Latitude, destination.Longitude])
          .addTo(map)
          .bindPopup(`<b>${destination.Destination}</b><br>${destination.Region}, ${destination.Country}`)
          .openPopup();
      }
    });
  }
});