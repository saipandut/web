const countrySearchButton = document.getElementById('country-search-button');
const countryInput = document.getElementById('country-input');
const countryInfoElement = document.getElementById('country-info');

function displayCountryData(data) {
    countryInfoElement.innerHTML = ''; 

    if (data.length > 0) {
        const countryData = data[0];
        const capital = countryData.capital[0]; 
        const borders = countryData.borders.join(', '); 

        countryInfoElement.innerHTML = `
            <h2 style="color: red;">${countryData.name.common}</h2>
            <p style="color:orangered;">Population: ${countryData.population}</p>
            <p style="color:orangered;">Languages: ${Object.values(countryData.languages).join(', ')}</p>
            <p style="color:orangered;">Currency: ${Object.keys(countryData.currencies).join(', ')}</p>
            <p style="color:orangered;">Region: ${countryData.region}</p>
            <p style="color:orangered;">Capital: ${capital}</p>
            <p style="color:orangered;">Borders: ${borders}</p>
        `;
    } else {
        countryInfoElement.innerHTML = `<p>No information found for "${countryInput.value}".</p>`;
    }
}

function fetchAndDisplayCountryData(countryName) {
    const apiUrl = `https://restcountries.com/v3.1/name/${countryName}`;

    fetch(apiUrl)
        .then((response) => response.json())
        .then((data) => {
            displayCountryData(data);
        })
        .catch((error) => {
            console.error('Error fetching country data:', error);
            countryInfoElement.innerHTML = `<p>An error occurred while fetching data.</p>`;
        });
}

countrySearchButton.addEventListener('click', () => {
    const countryName = countryInput.value;
    if (countryName) {
        fetchAndDisplayCountryData(countryName);
    }
});


