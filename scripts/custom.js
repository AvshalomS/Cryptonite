//------------------------------------------------------------------------------------------------------
// jQuery-AJAX API Project 
//       Cryptonite
// Written by: Shahar Avshalom
// Version: 1.1
// January 2021 Petah-Tikva ISRAEL
//------------------------------------------------------------------------------------------------------


// Global variables ------------------------------------------------------------------------------------

// Cryptonite API
var allCoinsAPI = `https://api.coingecko.com/api/v3/coins/`;
var moreInfoAPI = `https://api.coingecko.com/api/v3/coins/`;

// Boolean variables
var modalRemoveCoin = false;
var progressBar = true;

// Coins variables
var allCoinsList = []; // Coins array
var selectedCoin; // Object
var currentCoin; // Object

// Local Storage variables
var coinsJSON; // Local storage String
var localStorageSavedCoins; // Local storage Array of Objects

// Toggle Button variables
var chartSymbols = [null, null, null, null, null];
var saveSymbol;
var saveChartSymbols = [];

// Canvas Chart variables
var CanvasChartTitle;
var pricesFromAjax = [null, null, null, null, null];
var intervalID;

// ----------------------------------------------- START -----------------------------------------------
$(document).ready(function () {

    init();
    function init() {
        $(`#homePageContainer`).show();
        $(`#liveReportsContainer`).hide();
        $(`#aboutContainer`).hide();
        progressBar = true;
        loadAllCoins();
    }


    // Navigation Functions -----------------------------------------------------------------------------
    $("#home").on("click", function () {
        clearInterval(intervalID);
        progressBar = true;
        $(`#homePageContainer`).show();
        $(`#liveReportsContainer`).hide();
        $(`#aboutContainer`).hide();
    });
    $("#liveReports").on("click", function () {
        clearInterval(intervalID);
        progressBar = false;
        $(`#homePageContainer`).hide();
        $(`#aboutContainer`).hide();
        $(`#liveReportsContainer`).show();
        showReports();
    });
    $("#about").on("click", function () {
        clearInterval(intervalID);
        progressBar = false;
        $(`#homePageContainer`).hide();
        $(`#liveReportsContainer`).hide();
        $(`#aboutContainer`).show();
    });
    $("#searchInput").on("input", () => {
        const toSearch = $(`#searchInput`).val();
        if (toSearch == "" || toSearch == undefined) {
            $(`#homePage`).html(``);
            allCoinsList.filter((coin) => createHtmlCoinCard(coin))
        }
        else {
            $(`#homePage`).html(``);
            allCoinsList.filter((coin) => {
                coin.search = coin.id.toLowerCase() + coin.symbol.toLowerCase()
                if (coin.search.includes(toSearch.toLowerCase())) createHtmlCoinCard(coin)
            })
        }
    });


    // AJAX functions ----------------------------------------------------------------------------------

    // Load all coins to the Home page
    function loadAllCoins() {
        $.ajax({
            url: allCoinsAPI,
            success: function (result) {
                // console.log(result);

                $(`#homePage`).html(``);
                for (let index = 0; index < 50; index++) {
                    const element = result[index];
                    // console.log(element);

                    currentCoin = {
                        id: element.id,
                        symbol: element.symbol,
                        name: element.name,
                    }
                    // Save the coin and update HTML
                    allCoinsList.push(currentCoin);
                    createHtmlCoinCard(currentCoin);
                }
            },
            error: function () {
                $(`#homePage`).html(`<p>There is a problem getting the data from the server</p>`);
            },
        })
        // console.log(allCoinsList);
    }

    function ajaxGetPrices() {

        // Converts the symbol array to a string
        let insertCoinsIntoApi = ``;

        chartSymbols.forEach(element => {
            if (element != null) {
                insertCoinsIntoApi += element.toUpperCase() + `,`;
            };
        });
        // Deletes the last comma
        insertCoinsIntoApi = insertCoinsIntoApi.slice(0, insertCoinsIntoApi.length - 1);
        // Enter Symbols to api
        let pricesAPI = `https://min-api.cryptocompare.com/data/pricemulti?fsyms=BTC,ETH&tsyms=USD`;
        let ajaxAPI = pricesAPI.replace("BTC,ETH", insertCoinsIntoApi);

        $.ajax({
            url: ajaxAPI,
            success: function (result) {
                // console.log(result);

                // Get the prices
                for (let index = 0; index < chartSymbols.length; index++) {
                    if (chartSymbols[index] != null) {
                        pricesFromAjax[index] = result[chartSymbols[index].toUpperCase()]["USD"];
                    } else {
                        pricesFromAjax[index] = null;
                    }
                }
            },
            error: function () {
                alert(`There is a problem getting the data from the server`);
            },
        });
    }

    // MoreInfo Button - include Ajax 
    $("body").on("click", ".moreInfo", function () {


        if ($(this).hasClass(`collapsed`)) {
            $(this).text(`Less Info...`)
        } else {
            $(this).text(`More Info...`)
        }


        let id = $(this).next().attr(`id`);
        id = id.slice(9);
        // console.log(id);

        getCoinsFromLocalStorage();

        // Find the coin in localStorage
        selectedCoin = localStorageSavedCoins.find(x => x.id === id);
        let timeNow = new Date();

        if (selectedCoin == undefined) {
            // Coin not found in localStorage
            $.ajax({
                url: moreInfoAPI + id,
                success: function (result) {

                    setCurrentCoin(result);
                    // Add coin to array
                    localStorageSavedCoins.push(currentCoin);
                    // Update the localStorage
                    setCoinsToLocalStorage();
                    // UpDate HTML 
                    updateCollapserHtml(currentCoin);
                    updateCardTime(currentCoin.time, currentCoin.id);
                },
                error: function () {
                    $(`#${"coliapser" + id}`).html(`
                        <p>There is a problem getting the data from the server</p>
                    `);
                }
            });
        } else if ((timeNow.getTime() - parseInt(selectedCoin._time)) > 1000 * 60 * 2) {
            // Coin found in localStorage and passed 2 minutes
            $.ajax({
                url: moreInfoAPI + id,
                success: function (result) {

                    // console.log(result);

                    setCurrentCoin(result);
                    // Update the coins array
                    let coinIndex = localStorageSavedCoins.findIndex((obj => obj.id == id));

                    localStorageSavedCoins[coinIndex].usd = currentCoin.usd;
                    localStorageSavedCoins[coinIndex].eur = currentCoin.eur;
                    localStorageSavedCoins[coinIndex].ils = currentCoin.ils;
                    localStorageSavedCoins[coinIndex].time = currentCoin.time;
                    localStorageSavedCoins[coinIndex]._time = currentCoin._time;
                    // Update the localStorage
                    setCoinsToLocalStorage();
                    // UpDate HTML 
                    updateCollapserHtml(currentCoin);
                    updateCardTime(currentCoin.time, currentCoin.id);
                },
            });
        } else {
            // Coin found in localStorage and not passed 2 minutes
            // Update html (necessary if browser has been refreshed or reopens)
            updateCollapserHtml(selectedCoin);
            updateCardTime(selectedCoin.time, selectedCoin.id);
        }

    });

    function setCurrentCoin(_result) {

        let t = new Date();

        currentCoin = {
            id: _result.id,
            // Prices
            usd: _result.market_data.current_price.usd,
            eur: _result.market_data.current_price.eur,
            ils: _result.market_data.current_price.ils,
            // Image and time
            img: _result.image.thumb,
            time: t,
            _time: t.getTime(),
        };
        // console.log(currentCoin);
    }

    // Buttons and Modal --------------------------------------------------------------------------------

    // Toggel Button
    $("body").on("change", 'input[type="checkbox"]', function () {

        let place;
        let symbol = $(this).attr(`id`);
        // console.log(symbol);

        // Check whether the checkbox has been checked
        if ($(this).is(":checked")) {

            // alert(`checked`);
            if (!modalRemoveCoin) {
                // We are on the card
                place = chartSymbols.indexOf(null);
                if (place != -1) {
                    // If the array is not full
                    chartSymbols[place] = symbol;
                } else {
                    // The array is full - Save the array - And show modal
                    modalRemoveCoin = true;
                    saveSymbol = symbol;
                    insertHTMLToToggleModal();
                    let i = 0;
                    // Save the array
                    chartSymbols.forEach(element => {
                        saveChartSymbols[i] = element;
                        i += 1;
                    });

                    $('#myModal').modal();
                }

            } else {
                // We are in modal 
                // Selection deletes and does not add
                symbol = symbol.slice(1);
                $(`#${symbol}`).prop("checked", false);
                place = chartSymbols.indexOf(symbol);
                chartSymbols[place] = null;
            }

        } else {
            // alert(`no checked`);
            if (!modalRemoveCoin) {
                // We are on the card
                // No checked deletes a symbol
                place = chartSymbols.indexOf(symbol);
                if (place != -1) {
                    chartSymbols[place] = null;
                } else {
                    alert(`Coin does not exist in the array ???`);
                }
            } else {
                // We are in modal 
                // No checked add symbol
                symbol = symbol.slice(1);
                $(`#${symbol}`).prop("checked", true);
                place = chartSymbols.indexOf(null);
                chartSymbols[place] = symbol;
            }
        }
    });

    // Close Modal
    $("#myModal").on("hidden.bs.modal", function () {

        modalRemoveCoin = false;

        let place;
        place = chartSymbols.indexOf(null);
        if (place != -1) {
            // Inserting the chosen symbol into the free space
            chartSymbols[place] = saveSymbol;
        } else {
            // Or update button status
            $(`#${saveSymbol}`).prop("checked", false);
        }
    });

    // Modal Cancel Button
    $(`body`).on(`click`, `#btnModalCancel`, function () {
        let i = 0;
        saveChartSymbols.forEach(element => {
            chartSymbols[i] = element;
            $(`#${element}`).prop("checked", true);
            i += 1;
        });
        $('#myModal').modal('hide');
    })


    // HTML Functions -----------------------------------------------------------------------------------
    function insertHTMLToToggleModal() {

        $(`#modalTitle`).text(`Remove coins`);
        $(`#modalBody`).html(``);
        chartSymbols.forEach(symbol => {
            $(`#modalBody`).append(`
                
                <div class="custom-control custom-switch toggleChart">
                    <input type="checkbox" class="custom-control-input" id="${`_` + symbol}">
                    <label class="custom-control-label" for="${`_` + symbol}">Select to remove</label>
                </div>

                <p class="card-text">${symbol}</p>
            `);
        });
    }

    function createHtmlCoinCard(_currentCoin) {
        $(`#homePage`).append(`
            <div class = "col-sm-6 col-md-4 col-lg-3">
                <div class="card ${_currentCoin.symbol}" >
                    <div class="card-header">
                        <button type="button" class="btn btn-outline-success btnBuy" >Buy</button> 
                        <button type="button" class="btn btn-outline-danger btnSell" >Sell</button>
                    </div>
                    <div class="card-body">

                        <h5 class="card-title">${_currentCoin.symbol}</h5>

                        <div class="custom-control custom-switch toggleChart">
                            <input type="checkbox" class="custom-control-input" id="${_currentCoin.symbol}">
                            <label class="custom-control-label" for="${_currentCoin.symbol}">Chart</label>
                        </div>

                        <p class="card-text">${_currentCoin.name}</p>

                        <!-- Begin Collapser -->
                        <button type="button" class="btn btn-primary moreInfo" data-toggle="collapse" data-target="#${`coliapser` + _currentCoin.id}">More
                            Info</button>
                        <div id="${`coliapser` + _currentCoin.id}" class="collapse"></div>
                        <!-- End Collapser -->

                    </div> 

                    <div class="card-footer" id="${`footer` + _currentCoin.id}"></div>

                </div>
            </div>
        `)
    }

    function updateCollapserHtml(_coin) {

        $(`#${"coliapser" + _coin.id}`).html(`
            <br>
            <img src="${_coin.img}">
            <p>
                ${_coin.usd} $ <br>
                ${_coin.eur} &euro; <br>
                ${_coin.ils} &#x20AA; <br>
            </p>
        `);
    }

    function updateCardTime(cardtime, _id) {

        let _time = cardtime;
        if (typeof (_time) == "string") { _time = new Date(cardtime); }

        let day = pad(_time.getDate(), 2);
        let month = pad(_time.getMonth() + 1, 2);
        let year = pad(_time.getFullYear(), 4);

        let hour = pad(_time.getHours(), 2);
        let minutes = pad(_time.getMinutes(), 2);
        let seconds = pad(_time.getSeconds(), 2);

        $(`#${`footer` + _id}`).html(`
            ${day}-${month}-${year}
            <br>
            ${hour}:${minutes}:${seconds}
        `);
    }

    // Add zeros to the date / time
    function pad(str, max) {
        str = str.toString();
        // A recursion that adds zeros as needed
        return str.length < max ? pad("0" + str, max) : str;
    }

    // Canvasjs Charts Function ------------------------------------------------------------------------
    function showReports() {


        var dataPoints1 = [];
        var dataPoints2 = [];
        var dataPoints3 = [];
        var dataPoints4 = [];
        var dataPoints5 = [];


        var options = {
            title: {
                text: "Chart title"
            },
            axisX: {
                title: "chart updates every 2 secs"
            },
            axisY: {
                suffix: "$",
                includeZero: false
            },
            toolTip: {
                shared: true
            },
            legend: {
                cursor: "pointer",
                verticalAlign: "top",
                fontSize: 22,
                fontColor: "dimGrey",
                itemclick: toggleDataSeries
            },
            data: [{
                type: "line",
                xValueType: "dateTime",
                yValueFormatString: "#####.00000000 USD",
                xValueFormatString: "hh:mm:ss TT",
                showInLegend: true,
                // name: "Turbine 1",
                name: ``,
                dataPoints: dataPoints1
            },
            {
                type: "line",
                xValueType: "dateTime",
                yValueFormatString: "#####.00000000 USD",
                showInLegend: true,
                // name: "Turbine 2",
                name: ``,
                dataPoints: dataPoints2
            }, {
                type: "line",
                xValueType: "dateTime",
                yValueFormatString: "#####.00000000 USD",
                showInLegend: true,
                // name: "Turbine 3",
                name: ``,
                dataPoints: dataPoints3
            }, {
                type: "line",
                xValueType: "dateTime",
                yValueFormatString: "#####.00000000 USD",
                showInLegend: true,
                // name: "Turbine 4",
                name: ``,
                dataPoints: dataPoints4
            }, {
                type: "line",
                xValueType: "dateTime",
                yValueFormatString: "#####.00000000 USD",
                showInLegend: true,
                // name: "Turbine 5",
                name: ``,
                dataPoints: dataPoints5
            }]
        };

        var chart = $("#chartContainer").CanvasJSChart(options);

        function toggleDataSeries(e) {
            if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                e.dataSeries.visible = false;
            }
            else {
                e.dataSeries.visible = true;
            }
            e.chart.render();
        }

        var updateInterval = 2000;


        var time = new Date;

        function updateChart(count) {
            count = count || 1;

            // עדכון כותרת , וחלון מקרא קופץ
            CanvasChartTitle = ``;

            for (let index = 0; index < chartSymbols.length; index++) {
                if (chartSymbols[index] != null) {
                    CanvasChartTitle += chartSymbols[index] + `,  `;
                    options.data[index].name = chartSymbols[index];
                } else {
                    options.data[index].name = ``;
                }
            }
            // עדכון כותרת הגרף
            let addToUSD;
            CanvasChartTitle != `` ? addToUSD = `  to USD` : addToUSD = ``;
            options.title.text = CanvasChartTitle + addToUSD;

            // נקבל את הנתונים מהשרת כל 2 שניות
            ajaxGetPrices();
            // נכניס את הנתונים לגרף
            time.setTime(time.getTime() + updateInterval);
            yValue1 = pricesFromAjax[0] != null ? pricesFromAjax[0] : ``;
            yValue2 = pricesFromAjax[1] != null ? pricesFromAjax[1] : ``;
            yValue3 = pricesFromAjax[2] != null ? pricesFromAjax[2] : ``;
            yValue4 = pricesFromAjax[3] != null ? pricesFromAjax[3] : ``;
            yValue5 = pricesFromAjax[4] != null ? pricesFromAjax[4] : ``;

            // pushing the new values
            dataPoints1.push({
                x: time.getTime(),
                y: yValue1
            });
            dataPoints2.push({
                x: time.getTime(),
                y: yValue2
            });
            dataPoints3.push({
                x: time.getTime(),
                y: yValue3
            });
            dataPoints4.push({
                x: time.getTime(),
                y: yValue4
            });
            dataPoints5.push({
                x: time.getTime(),
                y: yValue5
            });


            // נכניס את שמות הניירות מתחת לכותרת הגרף
            // updating legend text with  updated with y Value 
            chartSymbols[0] != null ? options.data[0].legendText = chartSymbols[0] + " : " + yValue1 + "$" : options.data[0].legendText = "  " + yValue1 + "$";
            chartSymbols[1] != null ? options.data[1].legendText = chartSymbols[1] + " : " + yValue2 + "$" : options.data[1].legendText = "  " + yValue2 + "$";
            chartSymbols[2] != null ? options.data[2].legendText = chartSymbols[2] + " : " + yValue3 + "$" : options.data[2].legendText = "  " + yValue3 + "$";
            chartSymbols[3] != null ? options.data[3].legendText = chartSymbols[3] + " : " + yValue4 + "$" : options.data[3].legendText = "  " + yValue4 + "$";
            chartSymbols[4] != null ? options.data[4].legendText = chartSymbols[4] + " : " + yValue5 + "$" : options.data[4].legendText = "  " + yValue5 + "$";

            $("#chartContainer").CanvasJSChart().render();
        }
        // generates first set of dataPoints 
        updateChart(100);
        intervalID = setInterval(function () { updateChart() }, updateInterval);
    }
    // End Canvasjs Charts Function ---------------------------------------------------------------------

    // Progress Bar 
    $(document).ready(function () {
        $(document).ajaxStart(function () {
            if (progressBar) {
                $('#wait').show();
            }
        });
        $(document).ajaxStop(function () {
            $('#wait').hide();
        });
        $(document).ajaxComplete(function () {
            $('#wait').hide();
        })
        $(document).ajaxError(function () {
            $('#wait').hide();
        });
    });
})


// Local Storage Functions ----------------------------------------------------------------------------- 

function getCoinsFromLocalStorage() {
    coinsJSON = localStorage.getItem("savedCoins") == null ? JSON.stringify([]) : localStorage.getItem("savedCoins");
    localStorageSavedCoins = JSON.parse(coinsJSON);
}

function setCoinsToLocalStorage() {
    coinsJSON = JSON.stringify(localStorageSavedCoins);
    localStorage.setItem("savedCoins", coinsJSON);
}

// End ------------------------------------------------------------------------------------------------- 
