$( document ).ready(function() {


//BART API CODE

	//can change from xml to json output by adding &json=y to end of query URL

	// BART API key: ZVZV-PH5D-9W3T-DWE9

	// service advisory API http://api.bart.gov/api/bsa.aspx?cmd=bsa&key=ZVZV-PH5D-9W3T-DWE9&date=today&json=y
		//determine how to tell if there is not a service advisory so that nothing will display

	// estimated time of departure: http://api.bart.gov/docs/etd/etd.aspx

	//departure info http://api.bart.gov/api/etd.aspx?cmd=etd&orig=+currentStation+&key=ZVZV-PH5D-9W3T-DWE9&json=y
		//destination (final dest of train)

	//array containining ALL stations in BART system
	var stationNameArray = [];
	//array containing ALL stations abbreviations - API calls use abbr
	var stationAbbrArray = [];

	var blue = [];
	var green = [];
	var orange = [];
	var yellow = [];
	var red = [];

	displayStations();
	stationsByLine();

	//function to pull station lists from BART API and push to arrays
	function displayStations() {
		var queryURL = "https://api.bart.gov/api/stn.aspx?cmd=stns&key=ZVZV-PH5D-9W3T-DWE9&json=y";

		    $.ajax({
		      url: queryURL,
		      method: "GET"
		    }).done(function(response) {

		    //loop through stations and push "name" and "abbr" to a arrays for user dropdown lists
		    	for (var i = 0; i < response.root.stations.station.length; i++) {
		    		var stationName = response.root.stations.station[i].name;
		    		var stationAbbr = response.root.stations.station[i].abbr;
		    		stationNameArray.push(stationName);
		    		stationAbbrArray.push(stationAbbr);
		    		//NOTE: list displaying to HTML but drop down button is not working
		    		//append station list to origin list
		    		originList = $("<li>");
		    		originList.text(stationNameArray[i]);
		    		$("#origin-list").append(originList);
		    		//append station list to destination list
		    		destList = $("<li>");
		    		destList.text(stationNameArray[i]);
		    		$("#destination-list").append(destList);

		    	};

			});
	};

	function stationsByLine() {

		var queryURL = "https://api.bart.gov/api/route.aspx?cmd=routeinfo&route=all&key=ZVZV-PH5D-9W3T-DWE9&json=y";

		$.ajax({
		      url: queryURL,
		      method: "GET"
		    }).done(function(response) {

		    	for (var j = 0; j < response.root.routes.route.length; j++) {
		    		var route = response.root.routes.route[j].name;
		    		var stationsOnRoute = response.root.routes.route[j].config.station;
		    		console.log(route, stationsOnRoute);
		    	}

		});    	

	};
			
	//Store users selection for origin and destination stations as variables

	//API URL for route info (stations along a particular line) http://api.bart.gov/api/route.aspx?cmd=routeinfo&route=6&key=ZVZV-PH5D-9W3T-DWE9&json=y

		//push list of stations per each route to arrays

		//loop through arrays to check for lines containing both origin and destination station
			//if route(s) contains origin and destination station - display next x number of trains matching that destination

			//else no arrays match both lines - transfer required

		


	




//UPSTREAM TRAINS

	//


















// MEDIUM API CODE



	
























});