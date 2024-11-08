const lists = {};
let fetchedResults = []; 
let currentListName = '';
document.addEventListener('DOMContentLoaded', () => {
  const map = L.map('map').setView([48.8566, 2.3522], 5); 

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  const form = document.getElementById('searchForm');
  const listResultsContainer = document.getElementById('listResults'); 

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
      console.log(results); // Log the results to verify
      displayResults(results);
      displayMap(results);

    } catch (err) {
      console.error('Error fetching data:', err);
    }
  });
  const isValidListName = (name) => /^[a-zA-Z0-9 ]{1,15}$/.test(name);

  //create a new list and update client-side and server-side storage
  document.getElementById('listForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    let listName = document.getElementById('listName').value.trim();

    //input sanitization: remove unwanted characters, limit length
    listName = listName.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 30);

    if (!isValidListName(listName)) {
      alert("List name is invalid. Only alphanumeric characters and spaces are allowed, up to 15 characters.");
      return;
    }

    if (!lists[listName]) {
      lists[listName] = [];
      alert(`List "${listName}" created successfully!`);

      try {
        const createListResponse = await fetch(`http://localhost:5000/api/destination/list/${encodeURIComponent(listName)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!createListResponse.ok) throw new Error(`Server error: ${createListResponse.statusText}`);
        console.log(`Server confirmed list "${listName}" created.`);

        updateDropdownOptions();
      } catch (error) {
        console.error('Error creating list on server:', error);
      }
    } else {
      alert(`List "${listName}" already exists.`);
    }

    document.getElementById('listForm').reset();
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
  async function displayList(listName) {
    currentListName = listName; // Store the list name globally
  
    try {
      const response = await fetch(`http://localhost:5000/api/destination/list/${encodeURIComponent(listName)}/display`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
  
      if (!response.ok) throw new Error(`Error: ${response.statusText}`);
  
      const results = await response.json();
      fetchedResults = results; // Store results globally
      displayListResults(results, listName); 
    } catch (err) {
      console.error('Error fetching list:', err);
    }
  }
  function displayResults(results) {//using createTextNode to prevent XSS
    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '';
  
    results.forEach(destination => {
      const div = document.createElement('div');
      div.className = 'result-item';
  
      const title = document.createElement('h3');
      title.textContent = destination.Destination;
      div.appendChild(title);
  
      const region = document.createElement('p');
      region.textContent = `Region: ${destination.Region}`;
      div.appendChild(region);
  
      const country = document.createElement('p');
      country.textContent = `Country: ${destination.Country}`;
      div.appendChild(country);
  
      const coords = document.createElement('p');
      coords.textContent = `Coordinates: ${destination.Latitude}, ${destination.Longitude}`;
      div.appendChild(coords);
  
      const currency = document.createElement('p');
      currency.textContent = `Currency: ${destination.Currency}`;
      div.appendChild(currency);
  
      const language = document.createElement('p');
      language.textContent = `Language: ${destination.Language}`;
      div.appendChild(language);
  
      const listSelect = document.createElement('select');
      listSelect.id = `listSelect-${destination.index}`;
  
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = 'Select a list';
      listSelect.appendChild(defaultOption);
  
      for (const listName in lists) {
        const option = document.createElement('option');
        option.value = listName;
        option.textContent = listName;
        listSelect.appendChild(option);
      }
  
      div.appendChild(listSelect);
  
      const addButton = document.createElement('button');
      addButton.textContent = 'Add to List';
      addButton.onclick = () => {
        const selectedList = listSelect.value;
        if (selectedList) {
          addDestinationToList(selectedList, destination.index); // Add the destination to the selected list
        } else {
          alert('Please select a list.');
        }
      };
  
      div.appendChild(addButton);
      resultsContainer.appendChild(div);
    });
  }
  

  async function displayListResults(results, listName) {
    listResultsContainer.innerHTML = `<h3>List: ${listName}</h3>`; // Display list name
  
    results.forEach(destination => {
      const div = document.createElement('div');
      div.className = 'result-item';
      div.innerHTML = `
        <h3>${destination.name}</h3>
        <p>Region: ${destination.region}</p>
        <p>Country: ${destination.country}</p>
        <p>Coordinates: ${destination.coordinates.latitude}, ${destination.coordinates.longitude}</p>
        <p>Currency: ${destination.currency}</p>
        <p>Language: ${destination.language}</p>
      `;
  
      // Create delete button
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.onclick = async () => {
        await deleteDestinationFromList(currentListName, destination.index); // Pass original index
        await displayList(listName); // Refresh list display after deletion
      };
  
      div.appendChild(deleteButton); // Add delete button to each result item
      listResultsContainer.appendChild(div);
    });
  }
  

  async function deleteDestinationFromList(listName, destinationId) {
    try {
      const response = await fetch(`http://localhost:5000/api/destination/list/${listName}/${destinationId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
  
      if (!response.ok) throw new Error(`Error deleting destination: ${response.statusText}`);
      console.log(`Destination ID ${destinationId} deleted from list "${listName}".`);
    } catch (error) {
      console.error('Error deleting destination from list:', error);
    }
  }
  //helper function to update dropdown options after list creation
  function updateDropdownOptions() {
    const dropdowns = document.querySelectorAll('select[id^="listSelect-"]');
    dropdowns.forEach(listSelect => {
      listSelect.innerHTML = '<option value="">Select a list</option>';
      
      for (const listName in lists) {
        const option = document.createElement('option');
        option.value = listName;
        option.text = listName;
        listSelect.appendChild(option);
      }
    });
  }
  document.getElementById('sortButton').addEventListener('click', () => {
    const sortCriteria = document.getElementById('sortCriteria').value;
    sortAndDisplayListResults(sortCriteria);
  });
  
  function sortAndDisplayListResults(criteria) {
    const sortedResults = [...fetchedResults]; //use the global fetchedResults
  
    sortedResults.sort((a, b) => {
      if (a[criteria] < b[criteria]) return -1;
      if (a[criteria] > b[criteria]) return 1;
      return 0;
    });
  
    displayListResults(sortedResults, currentListName); }

    document.getElementById('viewListsButton').addEventListener('click', async () => {
    const listName = prompt('Enter the list name to view:');
    if (listName) {
      await displayList(listName);
    }
  });
});
