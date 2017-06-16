$( document ).ready(function() {


//BART API CODE - API key: ZVZV-PH5D-9W3T-DWE9

	//TODO if you have time: service advisory API https://api.bart.gov/api/bsa.aspx?cmd=bsa&key=ZVZV-PH5D-9W3T-DWE9&date=today&json=y
		//determine how to tell if there is not a service advisory so that nothing will display

	//array containining ALL stations in BART system
	var stationNameArray = [];
	//array containing ALL stations abbreviations - API calls use abbr
	var stationAbbrArray = [];
	//array containing names of all 12 routes - primarily for organization/maybe for displaying name of line
	var routeNamesArray = [];
	//multi-dimensional array containing lists of stations on the 12 routes 
	var routeStationListsArray = [];
	//store abbreviations from stationAbbrArray that correspond to user selections for origin/dest stations
	var originStation = "WARM";
	var destinationStation = "WOAK";
	//store direction of users train for real time look up
	var direction = "s";

	displayStations();
	stationsByLine();

	//function to pull station lists from BART API and push to arrays
	function displayStations() {
		var queryURL = "https://api.bart.gov/api/stn.aspx?cmd=stns&key=ZVZV-PH5D-9W3T-DWE9&json=y";

		    $.ajax({
		      url: queryURL,
		      method: "GET"
		    }).done(function(response) {

		    //loop through stations and push "name" and "abbr" to arrays for user dropdown lists
		    	for (var i = 0; i < response.root.stations.station.length; i++) {
		    		var stationName = response.root.stations.station[i].name;
		    		var stationAbbr = response.root.stations.station[i].abbr;
		    		stationNameArray.push(stationName);
		    		stationAbbrArray.push(stationAbbr);
		    		//append station list to <ul>origin list
		    		originList = $("<li>");
		    		originList.text(stationNameArray[i]);
		    		originList.attr("value", i);
		    		$("#origin-list").append(originList);
		    		//append station list to <ul>destination list
		    		destList = $("<li>");
		    		destList.text(stationNameArray[i]);
		    		originList.attr("value", i);
		    		$("#destination-list").append(destList);

		    	};

			});
	};

	//On Click or other event for capturing user selections for origin/destination trains

	//takes user input for origin and destination
		//accesses corresponding abbr for users stations & store as global variables
			//based on value assigned to each list item for full station name, look up in abbreviation list array
		//call getTripPlan function to look up route based on origin/dest

	//write a function calling BARTS schedule info API to get a trip plan based on origin/dest
	getTripPlan();
	function getTripPlan() {

		var queryURL = "https:api.bart.gov/api/sched.aspx?cmd=depart&orig="+originStation+"&dest="+destinationStation+"&date=now&key=ZVZV-PH5D-9W3T-DWE9&b=2&a=2&l=1&json=y";
		
		$.ajax({
		      url: queryURL,
		      method: "GET"
		    }).done(function(response) {
		    	//for each available route at the station
		    	for (j = 0; j < response.root.schedule.request.trip.length; j++) {
		    		//TODO: can't access some info I need directly with dot notation - HELP 
		    		//need trip legs/trainheadstation / transfer code / trip time
		    		//figure out how to store direction
		    		var trips = response.root.schedule.request.trip[j];
		    		trips = JSON.stringify(trips);
		    		
		    		console.log("trips", trips);
		    		// console.log("finalDest", finalDest);
		    	}
		});

	};
	realTime();
	//write a function to call BART API for real time train data
	function realTime() {

		var queryURL = "https://api.bart.gov/api/etd.aspx?cmd=etd&orig="+originStation+"&key=ZVZV-PH5D-9W3T-DWE9&json=y";

		$.ajax({
		      url: queryURL,
		      method: "GET"
		    }).done(function(response) {
		    	
		    	for (i = 0; i < response.root.station.length; i++) {
		    	//same issue as trip plan need abbrev (destination) minutes and length of train
		    	var realTime = response.root.station[i];
		    	console.log("realTime", realTime);
		    	//get minutes to arrive

		    	//train length
		    	}

		});
	};

	// api call to bart for all stops on every line (might not need this)
	function stationsByLine() {

		var queryURL = "https://api.bart.gov/api/route.aspx?cmd=routeinfo&route=all&key=ZVZV-PH5D-9W3T-DWE9&json=y";

		$.ajax({
		      url: queryURL,
		      method: "GET"
		    }).done(function(response) {
		    	//loop through number of routes and pull route names and stations
		    	for (var k = 0; k < response.root.routes.route.length; k++) {
		    		var route = response.root.routes.route[k].name;
		    		var stationsOnRoute = response.root.routes.route[k].config.station;
		    		//push route names to array
		    		routeNamesArray.push(route);
		    		//push lists of stations on routes to multi-dimensional array
		    		routeStationListsArray.push(stationsOnRoute);
		    	}
		    	// console.log(routeNamesArray, routeStationListsArray);
		});    	

	};
//--------//
//saving some psuedocode for reference but probably irrel

	//look up abbrs in route lists array to loop routelists array for routes containing both origin and dest
		// if there is a match:
			//arrays for both directions will return a match
			//need to look up which matching lists have origin at lower index than dest to determine users direction
				//store global variable as 'n' or 's' for real time query

	//call realTime function for accessing trains at the origin station in the right direction

	//else no arrays match both lines - transfer required
	//TODO: Write a function for transferring 
















// MEDIUM API CODE



	
























});