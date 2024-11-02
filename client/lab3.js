// Initialize client-side storage for lists (declare once at the top)
const lists = {};

document.addEventListener('DOMContentLoaded', () => {
  const map = L.map('map').setView([48.8566, 2.3522], 5); 

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  const form = document.getElementById('searchForm');
  const resultsContainer = document.getElementById('results');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const searchType = document.querySelector('input[name="searchType"]:checked').value;
    const searchValue = document.getElementById('searchQuery').value;
    const selectNum = document.getElementById('selectNum').value;

    try {
      const searchResponse = await fetch(`http://localhost:5000/api/destination/search/${searchType}/${searchValue}/${selectNum}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!searchResponse.ok) throw new Error(`Error: ${searchResponse.statusText}`);

      const results = await searchResponse.json();
      displayResults(results);
      displayMap(results);

    } catch (err) {
      console.error('Error fetching data:', err);
    }
  });

  // Create a new list and update client-side and server-side storage
  document.getElementById('listForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const listName = document.getElementById('listName').value;

    if (!lists[listName]) {
      lists[listName] = []; // Initialize list in client-side object
      alert(`List "${listName}" created successfully!`);

      try {
        const createListResponse = await fetch(`http://localhost:5000/api/destination/list/${listName}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!createListResponse.ok) throw new Error(`Server error: ${createListResponse.statusText}`);
        console.log(`Server confirmed list "${listName}" created.`);

        // Update dropdown after creating a new list
        updateDropdownOptions();

      } catch (error) {
        console.error('Error creating list on server:', error);
      }
    } else {
      alert(`List "${listName}" already exists.`);
    }

    document.getElementById('listForm').reset(); // Clear form input
  });

  function displayMap(results) {
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

  async function addDestinationToList(listName, destinationId) {
    if (lists[listName]) {
      if (!lists[listName].includes(destinationId)) {
        lists[listName].push(destinationId);
        alert(`Destination ${destinationId} added to list "${listName}".`);

        try {
          const response = await fetch(`http://localhost:5000/api/destination/list/${listName}/${destinationId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
          });

          if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
          console.log(`Server confirmed destination ${destinationId} added to list "${listName}".`);
        } catch (error) {
          console.error('Error adding destination to list on server:', error);
        }
      } else {
        alert(`Destination ${destinationId} is already in list "${listName}".`);
      }
    } else {
      alert(`List "${listName}" does not exist.`);
    }
  }

  function displayResults(results) {
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '';

    results.forEach(destination => {
      const div = document.createElement('div');
      div.className = 'result-item';

      const listSelect = document.createElement('select');
      listSelect.id = `listSelect-${destination.index}`;

      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.text = 'Select a list';
      listSelect.appendChild(defaultOption);

      // Populate dropdown from client-side lists object
      for (const listName in lists) {
        const option = document.createElement('option');
        option.value = listName;
        option.text = listName;
        listSelect.appendChild(option);
      }

      div.innerHTML = `
        <h3>${destination.Destination}</h3>
        <p>Region: ${destination.Region}</p>
        <p>Country: ${destination.Country}</p>
        <p>Coordinates: ${destination.Latitude}, ${destination.Longitude}</p>
        <p>Currency: ${destination.Currency}</p>
        <p>Language: ${destination.Language}</p>
      `;

      const addButton = document.createElement('button');
      addButton.textContent = 'Add to List';
      addButton.onclick = () => {
        const selectedList = listSelect.value;
        if (selectedList) {
          addDestinationToList(selectedList, destination.index);
        } else {
          alert('Please select a list.');
        }
      };

      div.appendChild(listSelect);
      div.appendChild(addButton);
      resultsContainer.appendChild(div);
    });
  }

  // Helper function to update dropdown options after list creation
  function updateDropdownOptions() {
    const dropdowns = document.querySelectorAll('select[id^="listSelect-"]');
    dropdowns.forEach(listSelect => {
      // Clear existing options
      listSelect.innerHTML = '<option value="">Select a list</option>';
      
      // Populate with updated lists
      for (const listName in lists) {
        const option = document.createElement('option');
        option.value = listName;
        option.text = listName;
        listSelect.appendChild(option);
      }
    });
  }
});
