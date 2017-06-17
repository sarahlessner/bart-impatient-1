$( document ).ready(function() {


//BART API CODE - API key: ZVZV-PH5D-9W3T-DWE9

	//TODO if you have time: service advisory API https://api.bart.gov/api/bsa.aspx?cmd=bsa&key=ZVZV-PH5D-9W3T-DWE9&date=today&json=y
		//determine how to tell if there is not a service advisory so that nothing will display

	//array containining ALL stations in BART system
	var stationNameArray = [];
	//array containing ALL stations abbreviations - API calls use abbr
	var stationAbbrArray = [];
	//store abbreviations from stationAbbrArray that correspond to user selections for origin/dest stations
	var originStation = "WOAK";
	var destinationStation = "SANL";
	//multidimensional array storing data from getTripPlan function
	var tripsArray = [];
	//multidimensional array storing data from realTime function
	var realTimeArray = [];
	//default to checking current time but here if user inputs a time. format: (time=h:mm+am/pm)
	var time = "now";

	displayStations();
	//stationsByLine();

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
		    		originList.text(stationName);
		    		originList.attr("data-abbr", stationAbbr);
		    		$("#origin-list").append(originList);
		    		//append station list to <ul>destination list
		    		destList = $("<li>");
		    		destList.text(stationName);
		    		destList.attr("data-abbr", stationAbbr);
		    		$("#destination-list").append(destList);

		    	};

			});
	};

	//On Click or other event for capturing user selections for origin/destination trains
	//PREVENT DEFAULT!!!!!!!!!!!!
	//takes user input for origin and destination
	
		//store the data-abbr attribute (stationAbbr) for the selections as global variables
		//call getTripPlan function to look up route based on origin/dest
		getTripPlan();
	//function calling BARTS schedule info API to get a trip plan based on origin/dest

	function getTripPlan() {

		var queryURL = "https:api.bart.gov/api/sched.aspx?cmd=depart&orig="+originStation+"&dest="+destinationStation+"&date=now&key=ZVZV-PH5D-9W3T-DWE9&b=2&a=2&l=1&json=y";
		
		$.ajax({
			  // data: {
			  // 	cmd: 'depart',
			  // 	orig: originStation,
			  //	time: time,
			  //	b: 0,
			  //	a: 3,
			  // }
		      url: queryURL,
		      method: "GET"
		    }).done(function(response) {
		    	//for each available route at the station
		    	// console.log(response.root.schedule.request.trip.length);
		    	tripsArray = [];
		    	for (i = 0; i < response.root.schedule.request.trip.length; i++) {

		    		var myTrip = response.root.schedule.request.trip[i];
		    		var legsArray = [];
		    		//if the trip plan does not involve a transfer ("leg" is just an object)
		    		if(myTrip.leg.length === undefined) {
		    			var legOrigin = myTrip.leg['@origin'];
		    			var legDest = myTrip.leg['@destination'];
		    			var finalTrainDest = myTrip.leg['@trainHeadStation'];
		    			var load = myTrip.leg['@load'];

		    			console.log("trip origin:", legOrigin, "trip destination:", legDest, "final destination:", finalTrainDest);
			    		// console.log("finalDest", finalDest);

			    		var myLeg = [legOrigin, legDest, finalTrainDest];
			    		legsArray.push(myLeg);
		    		}
		    		//else a transfer is required ("leg" is an array of objects)
		    		else {
			    		for (j = 0; j < myTrip.leg.length; j++) {
			    			var legOrigin = myTrip.leg[j]['@origin'];
			    			var legDest = myTrip.leg[j]['@destination'];
			    			var finalTrainDest = myTrip.leg[j]['@trainHeadStation'];
			    			var load = myTrip.leg['@load'];

			    			console.log("trip origin:", legOrigin, "trip destination:", legDest, "final destination:", finalTrainDest);
			    		// console.log("finalDest", finalDest);

				    		var myLeg = [legOrigin, legDest, finalTrainDest];
				    		legsArray.push(myLeg);

			    		}
		    		}

		    		tripsArray.push(legsArray);
		    	};
		    	// console.log(tripsArray);
				logMyTrips();
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
		    	realTimeArray = [];
		    	//get all real time data at the origin station
		    	var allRealTime = response.root.station[0];
		    	console.log("all real time", allRealTime);
		    	var etd = allRealTime.etd;
		    	console.log("etd", etd);
		    	//loop through ETD info
		    	for (i = 0; i < etd.length; i++) {
		    		var etdArray = [];
		    		//get train line (final dest) and abbrev for all trains
		    		var allRealTimeDest = etd[i].destination;
		    		var allRealTimeAbbr = etd[i].abbreviation;
		    		console.log("destination", allRealTimeDest, "abbrev", allRealTimeAbbr);
		    		var allEstimates = etd[i].estimate;
		    		console.log("estimates", allEstimates);
		    		etdArray.push(allRealTimeDest, allRealTimeAbbr);
		    		//loop through estimate information for all specific trains arriving
		    		for (j = 0; j < allEstimates.length; j++) {
		    			var minutesToArrive = allEstimates[j].minutes;
		    			var trainLength = allEstimates[j]['length'];
		    			var lineColor = allEstimates[j].color;
		    			console.log("minutesToArrive", minutesToArrive, "trainLength", trainLength, "lineColor", lineColor);
		    			var estimatesArray = [minutesToArrive,trainLength,lineColor];
		    			etdArray.push(estimatesArray);
		    		}
		    		realTimeArray.push(etdArray);
		    	};	 
		    console.log(realTimeArray);
		    displayRealTime();	
		});
	
	};

//function to display data from getTripPlan function
//TODO: Replace the console logs with JQuery code to display to HTML
	function logMyTrips() {
		console.log("logMyTrips");
		//loop through all of the trip plans based on users origin/dest
		for(var i = 0; i < tripsArray.length; i++){
			console.log("Trip Option " + i);
			//loop through the train level data for leg(s) of each trip
			for(var j = 0; j < tripsArray[i].length; j++) {
				console.log("Leg " + j);
				console.log("legOrigin:      " + tripsArray[i][j][0]);
				console.log("legDest:        " + tripsArray[i][j][1]);
				console.log("finalTrainDest: " + tripsArray[i][j][2]);
				console.log("");
			}
		}
	};
//function to display the data from realTime function
	function displayRealTime() {
		console.log("displayRealTime");
		//loop through array containing all etd data 
		for (var i = 0; i < realTimeArray.length; i++) {
			console.log("etd" + i); 
			//logging name & abbrev of final destination of each train line passing through origin station
			console.log("train destination name", realTimeArray[i][0], "abbr", realTimeArray[i][1]);
			//looping through all train level estimate data for the origin station
			for (var j = 2; j < realTimeArray[i].length; j++) {
				console.log("estimate" + j);
				console.log("minutes away", realTimeArray[i][j][0]);
				console.log("length", realTimeArray[i][j][1]);
				console.log("line color", realTimeArray[i][j][2]);
				console.log("_____");
			}
		}
	};

/*
// api call to bart for all stops on every line (don't need for xfer but might need for upstreaming)
//array containing names of all 12 routes - primarily for organization/maybe for displaying name of line
	// var routeNamesArray = [];
	// //multi-dimensional array containing lists of stations on the 12 routes 
	// var routeStationListsArray = [];
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
*/
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