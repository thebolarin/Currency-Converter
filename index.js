class CurrencyConverter {
    countryList = [];

    selectedSourceCountry = null;
    sourceCurrencyValueEl = document.getElementById("sourceCurrencyValue");
    sourceCurrencyEl = document.getElementById("sourceCurrency");
    rateSourceCurrencyFlagEl = document.getElementById("rateSourceCurrencyFlag");
    rateSourceCurrencyCodeEl = document.getElementById("rateSourceCurrencyCode");
    
    sourceCurrencyFlagEl = document.getElementById("sourceCurrencyFlag");
    sourceCurrencyCodeEl = document.getElementById("sourceCurrencyCode");
    sourceCurrencyRates = [];

    swapButtonEl =  document.getElementById("swapButton");

    selectedDestinationCountry = null;
    destinationCurrencyEl = document.getElementById("destinationCurrency");
    destinationCurrencyFlagEl = document.getElementById("destinationCurrencyFlag");
    destinationCurrencyCodeEl = document.getElementById("destinationCurrencyCode");
    destinationCurrencyValueEl = document.getElementById("destinationCurrencyValue");
    destinationCurrencyRate = null;

    rateTableContainerEl = document.getElementById("rateTableContainer");

    upperLimitErrorBannerEl = document.getElementById("upperLimitErrorBanner");
    lowerLimitErrorBannerEl = document.getElementById("lowerLimitErrorBanner");

    constructor() {
        this.fetchCountryList();
        this.setupEventListeners();
    }

    async fetchCountryList() {
        let result = await fetch('/assets/json/countries.json');
        this.countryList = await result.json();

        this.loadCountriesIntoDropdown();
    }

    async loadCountriesIntoDropdown() {
        const template = this.countryList.map(item => `<option value="${item.name}">${item.name} - ${item.currency}</option>`).join('');

        this.sourceCurrencyEl.innerHTML = template;
        this.destinationCurrencyEl.innerHTML = template;

        // Select default countries
        this.sourceCurrencyEl.value = 'United Kingdom';
        await this.selectCountry(this.sourceCurrencyEl.value, 'source', 1);

        this.destinationCurrencyEl.value = 'Nigeria';
        this.selectCountry(this.destinationCurrencyEl.value, 'destination');
    }

    async selectCountry(name, type, value = null) {
        let country = this.countryList.find((item) => item.name == name);
        if (!country) return;

        this.loadCountryDetails(country, type);

        if (type == 'source') {
            this.selectedSourceCountry = country;
            await this.fetchSourceCountryRates();
        }
        else {
            this.selectedDestinationCountry = country;
            this.fetchDestinationCountryRates();
        }

        if (type === 'source' && value !== null) {
            this.sourceCurrencyValueEl.value = value;
        }
    }

    loadCountryDetails(country, type) {
        const currencyCodeEl = type === 'source' ? this.sourceCurrencyCodeEl : this.destinationCurrencyCodeEl;
        const currencyFlagEl = type === 'source' ? this.sourceCurrencyFlagEl : this.destinationCurrencyFlagEl;
    
        currencyCodeEl.innerText = country.currency;
        currencyFlagEl.src = country.flag;
        currencyFlagEl.alt = country.flagAlt;
    
        if (type === 'source') {
            const rateCurrencyCodeEl = this.rateSourceCurrencyCodeEl;
            const rateCurrencyFlagEl = this.rateSourceCurrencyFlagEl;
    
            rateCurrencyCodeEl.innerText = country.currency;
            rateCurrencyFlagEl.src = country.flag;
            rateCurrencyFlagEl.alt = country.flagAlt;
        }
    }
    

    async fetchSourceCountryRates() {
        const rateTableCurrency = ["USD", "EUR", "CAD", "AUD", "JPY", "GBP"];
        let result = await fetch(`https://www.floatrates.com/daily/${this.selectedSourceCountry.currency}.json`);
        this.sourceCurrencyRates = await result.json();
        console.log(this.sourceCurrencyRates);

        // Filter out the source currency from the rate table
        const filteredRates = rateTableCurrency.filter(currency => currency !== this.selectedSourceCountry.currency);

        // Create an array of objects for the rate table currency list
        const rateTable = filteredRates.map(currency => {
            return {
                currency: currency,
                rate: this.sourceCurrencyRates[currency.toLowerCase()].rate.toFixed(3),
                // inverseRate: this.sourceCurrencyRates[currency.toLowerCase()].inverseRate,
                date: new Date(this.sourceCurrencyRates[currency.toLowerCase()].date.toLocaleString("en-US", { timeZone: "Europe/London" })).toLocaleString()
            };
        });

        this.rateTableContainerEl.innerHTML = await this.generateRateTableHTML(rateTable);
    }

    async generateRateTableHTML(rateTable) {
        const tableHeaders = '<tr><th>Currency</th><th>Rate</th><th>Refresh Time</th></tr>';
        const tableRows = rateTable.map(rate => `
            <tr>
                <td>${rate.currency}</td>
                <td>${rate.rate}</td>
                <td>${rate.date}</td>
            </tr>
        `).join('');

        return tableHeaders + tableRows;
    }

    fetchDestinationCountryRates() {
        this.destinationCurrencyRate = this.sourceCurrencyRates[this.selectedDestinationCountry.currency.toLowerCase()];
        this.loadConversionRatesDetails();
        this.calculateExchangeRate('source');
    }

    loadConversionRatesDetails() {
        document.getElementById('sourceCurrencyConversion').innerText = this.selectedSourceCountry.currency;
        document.getElementById('conversionValue').innerText = this.destinationCurrencyRate.inverseRate.toFixed(3);
        document.getElementById('destinationCurrencyConversion').innerText = this.selectedDestinationCountry.currency;

        var inputDate = new Date(this.destinationCurrencyRate.date);
        var ukDateString = new Date(inputDate.toLocaleString("en-US", { timeZone: "Europe/London" })).toLocaleString();
        document.getElementById('timestamp').innerText = ukDateString;
    }

    calculateExchangeRate(type) {
        if(this.sourceCurrencyValueEl.value > 999999) {
            this.upperLimitErrorBannerEl.style.display = "block";
            this.destinationCurrencyValueEl.value = null;
            return;
        }

        if(this.sourceCurrencyValueEl.value < 1) {
            this.lowerLimitErrorBannerEl.style.display = "block";
            this.destinationCurrencyValueEl.value = null;
            return;
        }
       

        this.upperLimitErrorBannerEl.style.display = "none";
        this.lowerLimitErrorBannerEl.style.display = "none";
        
        if (type == 'source') {
            this.destinationCurrencyValueEl.value = (this.sourceCurrencyValueEl.value * this.destinationCurrencyRate.rate).toFixed(3);
            return;
        }

        this.sourceCurrencyValueEl.value = (this.destinationCurrencyValueEl.value * this.destinationCurrencyRate.inverseRate).toFixed(3);
    }

    setupEventListeners() {
        // event listeners for the inputs
        this.sourceCurrencyValueEl.addEventListener("input", () => this.calculateExchangeRate('source'));
        this.destinationCurrencyValueEl.addEventListener("input", () => this.calculateExchangeRate('destination'));

        // event listeners for the dropdowns
        this.sourceCurrencyEl.addEventListener("change", async () => {
            await this.selectCountry(this.sourceCurrencyEl.value, 'source');
            this.selectCountry(this.destinationCurrencyEl.value, 'destination');
        });

        this.destinationCurrencyEl.addEventListener("change", () => {
            this.selectCountry(this.destinationCurrencyEl.value, 'destination');
        });

        this.swapButtonEl.addEventListener("click", async () => {
            const temp = this.selectedSourceCountry;
            this.selectedSourceCountry = this.selectedDestinationCountry;
            this.selectedDestinationCountry = temp;

            this.sourceCurrencyEl.value = this.selectedSourceCountry.name;
            this.destinationCurrencyEl.value = this.selectedDestinationCountry.name;

            this.loadCountryDetails(this.selectedSourceCountry, 'source');
            this.loadCountryDetails(this.selectedDestinationCountry, 'destination');

            await this.selectCountry(this.sourceCurrencyEl.value, 'source');
            this.selectCountry(this.destinationCurrencyEl.value, 'destination');
            await this.fetchSourceCountryRates();
        });
    }
}

document.addEventListener("DOMContentLoaded", function () {
    new CurrencyConverter();
});