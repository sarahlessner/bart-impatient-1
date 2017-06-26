$( document ).ready(function() {
	//when page loads call function getting stations for user selection and any advisories
	displayStations();
	serviceAdvisory();
	//array containining ALL stations by name in BART system
	var stationNameArray = [];
	var stationName = "";
	//array containing ALL stations by abbr - API calls use abbr
	var stationAbbrArray = [];
	var stationAbbr = "";
	//store abbreviations from stationAbbrArray that correspond to user selections for origin/dest stations
	var originStation;
	var destinationStation;
	//multidimensional array storing data from getTripPlan function
	var tripsArray = [];
	//multidimensional array storing data from realTime function
	var realTimeArray = [];
	//captures time if user inputs one. defaults to parameter "now"
	var myTime;
	//get load number 0-4 from API and access load array at idx of load #
	//0 load from bart means load info not available
	var loadArray = ["unavailable", "many seats","few seats","seat unlikely","good luck getting on"];
	var bartKey = 'ZVZV-PH5D-9W3T-DWE9';


	//function to pull station lists from BART API and push to arrays
	function displayStations() {
		var queryURL = "https://api.bart.gov/api/stn.aspx?cmd=stns&key=ZVZV-PH5D-9W3T-DWE9&json=y";

			$.ajax({
				// data: {
				// 	cmd:'stns',
				// 	key: bartKey,
				// 	json: 'y'
				// },
				url: queryURL,
				method: "GET"
				}).done(function(response) {

			    //loop through stations and push "name" and "abbr" to arrays for user dropdown lists
				for (var i = 0; i < response.root.stations.station.length; i++) {
					stationName = response.root.stations.station[i].name;
					stationAbbr = response.root.stations.station[i].abbr;
					stationNameArray.push(stationName);
					stationAbbrArray.push(stationAbbr);
					//append station list to <ul>origin list
					originList = $("<option>");
					originList.addClass("origin-selection");
					originList.text(stationName);
					originList.attr("value", stationAbbr);
					$("#origin-list").append(originList);
					//append station list to <ul>destination list
					destList = $("<option>");
					destList.addClass("destination-selection");
					destList.text(stationName);
					destList.attr("value", stationAbbr);
					$("#destination-list").append(destList);
				};
			});
	};

	//hide time entry fields as the default
	$("#am-pm").hide();
	$("#time-input").hide();
	//on click to toggle fields for departure time entry
	$("#enter-time").on("click", function(){
		event.preventDefault();
		$("#am-pm").toggle();
		$("#time-input").toggle();
	});

	//hide youtube, train schedules as default
	$("#youtube").hide();
	$("#real-time-container").hide();
	$("#trip-plan-container").hide();

	//on click for submit button
	$("#addTrainBtn").on("click", function(){
		event.preventDefault();
		//empty trip-plan and real-time divs
		$("#trip-plan").empty();
		$("#real-time").empty();
		$("#hyv-watch-related").empty();
		$('#fullVideo').empty();
		//capture station entry values (abbr version of train or station name)
		originStation = $("#origin-list").val();
		destinationStation = $("#destination-list").val();
		//gets time entry values
		var ampm = $("#am-pm").val();
		var timeInput = $("#time-input").val();
		//checks if user entered a time without selecting "AM" or "PM"
		if ((timeInput != "") && (ampm === "")) {
			//we're not allowed to use alerts so we'll have to do something else but this is here to test
			bootbox.alert("please clear your time entry or select am/pm");
			return;
		}
		//sets time to "now" if the user does not enter a time
		if ((timeInput === "") && (ampm === "")) {
			myTime = "now";
		}
		//if they entered a time properly, execute function to validate
		else {
			if (validateTime(timeInput)) {
			//if time is valid store the input 
			myTime = timeInput+ampm;
			}
			else {
				//need to alert with different method
				bootbox.alert("Please enter time in h:mm format");
			}
		}
		if ((originStation === "Select Origin Station") || (destinationStation === "Select Destination Station")) {
			bootbox.alert("Please select an origin AND destination station");
		}
		getTripPlan();
		realTime();
		$("#youtube").show();
		$("#trip-plan-container").show();
	});

	//function to validate time input 
	function validateTime(timestring) {
		var checkUserTime = moment(timestring,'h:mm');
		return checkUserTime.isValid();
	};

	//function calling BARTS schedule info API to get a trip plan based on origin/dest
	function getTripPlan() {

		var queryURL = "https://api.bart.gov/api/sched.aspx";
		
		$.ajax({
			data: {
				cmd: 'depart',
				orig: originStation,
				dest: destinationStation,
				time: myTime,
				key: bartKey,
				b: 1,
				a: 2,
				l: 1,
				json: 'y'
			},
			url: queryURL,
			method: "GET"
			}).done(function(response) {
				console.log(response);
				tripsArray = [];
				//for each available route at the station		    	
				for (i = 0; i < response.root.schedule.request.trip.length; i++) {
					//all trip options
					var myTrip = response.root.schedule.request.trip[i];
					//array to store leg or legs of trips
					var legsArray = [];
					//if the trip plan does not involve a transfer ("leg" is just an object)
					if(myTrip.leg.length === undefined) {
						var legOrigin = myTrip.leg['@origin'];
						var legDest = myTrip.leg['@destination'];
						var finalTrainDest = myTrip.leg['@trainHeadStation'];
						var legOriginTime = myTrip.leg['@origTimeMin'];
						var load = myTrip.leg['@load'];
						var line = myTrip.leg['@line'];
						var myLeg = [legOrigin, legDest, finalTrainDest, legOriginTime, load, line];
						legsArray.push(myLeg);
					}
					//else a transfer is required ("leg" is an array of objects)
					else {
						for (j = 0; j < myTrip.leg.length; j++) {
							var legOrigin = myTrip.leg[j]['@origin'];
							var legDest = myTrip.leg[j]['@destination'];
							var finalTrainDest = myTrip.leg[j]['@trainHeadStation'];
							var legOriginTime = myTrip.leg[j]['@origTimeMin'];
							var load = myTrip.leg[j]['@load'];
							var line = myTrip.leg[j]['@line'];
							var myLeg = [legOrigin, legDest, finalTrainDest, legOriginTime, load, line];
							legsArray.push(myLeg);
						}
					}
				tripsArray.push(legsArray);
				};
				displayTrips();
		});
	};

	//function to call BART API for real time train data
	function realTime() {

		var queryURL = "https://api.bart.gov/api/etd.aspx";

		$.ajax({
			data: {
				cmd: 'etd',
				orig: originStation,
				key: bartKey,
				json: 'y'
			},
			url: queryURL,
			method: "GET"
			}).done(function(response) {
				realTimeArray = [];
				//get all real time data at the origin station
				var allRealTime = response.root.station[0];
				// console.log("all real time", allRealTime);
				var etd = allRealTime.etd;
				//loop through ETD info
				for (i = 0; i < etd.length; i++) {
					//if there is no real time data 
					if (etd.length === undefined) {
						//do nothing, only want to show real time container if there's any real time to display
						return;
					}
					else {
						$("#real-time-container").show();
						var etdArray = [];
						//get train line (final dest) and abbrev for all trains
						var allRealTimeDest = etd[i].destination;
						var allRealTimeAbbr = etd[i].abbreviation;
						var allEstimates = etd[i].estimate;
						etdArray.push(allRealTimeDest, allRealTimeAbbr);
						//loop through estimate information for all specific trains arriving
						for (j = 0; j < allEstimates.length; j++) {
							var minutesToArrive = allEstimates[j].minutes;
							var trainLength = allEstimates[j]['length'];
							var lineColor = allEstimates[j].hexcolor;
							// console.log("minutesToArrive", minutesToArrive, "trainLength", trainLength, "lineColor", lineColor);
							var estimatesArray = [minutesToArrive,trainLength,lineColor];
							etdArray.push(estimatesArray);
						}
					realTimeArray.push(etdArray);	
					};
				};
				
				displayRealTime();	 	
			});
	};

	//function to display data from getTripPlan function
	function displayTrips() {
		// console.log("logMyTrips");
		//loop through all of the trip plans based on users origin/dest
		for(var i = 0; i < tripsArray.length; i++){
			//creates a div element for each trip option
			var tripOption = $("<div>");
			tripOption.addClass("trip-option");
			// console.log("Trip Option " + i);
			//loop through the train level data for leg(s) of each trip
			for(var j = 0; j < tripsArray[i].length; j++) {
				var tripLeg = $("<div>");
				//route number
				var routeNo = tripsArray[i][j][5];
				routeNo = getLineColor(routeNo);
				var colorBox = $("<div>");
					colorBox.css({
						'background-color': routeNo,
					}).addClass("color-box");
					tripLeg.append(colorBox);
				//access full name of the train (final station dest.)
				var finalTrainDest = tripsArray[i][j][2];
				//reset to result of function to convert abbr to full name
				finalTrainDest = convertStationAbbr(finalTrainDest);
				//load value
				var loadValue = tripsArray[i][j][4];
				// console.log("load value", loadValue);
				loadValue = loadArray[loadValue];
				//access origin station full name for trip leg
				var legOrigin = tripsArray[i][j][0];
				legOrigin = convertStationAbbr(legOrigin);
				//access destination station full name for trip leg
				var legDest = tripsArray[i][j][1];
				legDest = convertStationAbbr(legDest);
				//append arrival time for trip leg origin train
				tripLeg.append(tripsArray[i][j][3]+"  --  ");
				//append final train destination
				tripLeg.append(finalTrainDest+" "+"Train <br>");
				//append train crowding(load) info
				if (loadValue !== "unavailable") {
					tripLeg.append("Train Crowding: "+loadValue+"<br>");
				}
				// tripLeg.append("Train Crowding: "+loadValue+"<br>")
				// append origin leg
				tripLeg.append(legOrigin+" ---> ");
				// append destination leg
				tripLeg.append(legDest+" ");
				//append trip leg(s) to trip option div
				tripOption.append(tripLeg);
				// tripOption.append("<br>");
				//append all trip plan data to HTML
				$("#trip-plan").append(tripOption);
			}
		}
	};
	//function to display the data from realTime function
	function displayRealTime() {
		//loop through array containing all etd data 
		for (var i = 0; i < realTimeArray.length; i++) {
			//create a div for each piece of ETD data
			// var etd = $("<div>");
			var etd = $("<div>");
			etd.addClass("etd-train");
			var colorBox = $("<div>");
			colorBox.css({
				'background-color': realTimeArray[i][2][2],
			}).addClass("color-box");
			etd.append(colorBox);
			etd.append(realTimeArray[i][0]+"<br>");
			//looping through all train level estimate data for the origin station
			for (var j = 2; j < realTimeArray[i].length; j++) {
				//minsaway
				if(j != 2) {
					etd.append(" -- ");
				}
				if (realTimeArray[i][j][0] === "Leaving") {
					etd.append(realTimeArray[i][j][0]+" ");
				}
				else {
					etd.append(realTimeArray[i][j][0]+"min"+" ");
				}
				etd.append(realTimeArray[i][j][1]+" "+"cars");

				$("#real-time").append(etd);
			}
		}
	};

	//function to look up a train name abbreviation and access its display name
	//trip plan function returns train abbrv. necessary to convert for user display
	function convertStationAbbr(abbr) {
		//look up station abbr in the abbr array and save its index
		var abbrIdx = $.inArray(abbr, stationAbbrArray);
		//get full name at the same index as abbreviation
		var fullName = stationNameArray[abbrIdx];
		return fullName;
	};
	//function to get line color display for trip planner data
	//necessary because trip plan API does not have color info
	function getLineColor(line) {
		//look up route in routeNumsArr
		var routeIdx = $.inArray(line, routeNumsArr);
		//get line color at same index as route number
		var routeColor = routeColorsArr[routeIdx];
		return routeColor;

	};

	//service advisory API 
	function serviceAdvisory()	{

		var queryURL = "https://api.bart.gov/api/bsa.aspx?cmd=bsa&key=ZVZV-PH5D-9W3T-DWE9&date=today&json=y";

		$.ajax({
			// data: {
			// 	cmd: 'bsa',
			// 	key: bartKey,
			// 	json: 'y'
			// },
			url: queryURL,
			method: "GET"
			}).done(function(response) {
				//loop through available BSA
				for (var i = 0; i < response.root.bsa.length; i++) {
					//store text of each alert
					var bsa = response.root.bsa[i].description['#cdata-section'];
					var timeOfAlert = response.root.bsa[i].posted;
					if ((timeOfAlert === undefined) || (bsa === "No delays reported.")) {
						$("#service-advisories").empty();
					}	
					else {
						$("#service-advisories").addClass("service-alert");
						$("#service-advisories").append(timeOfAlert+"<br>", bsa);
					}
				}

			});
	};

	stationsByLine();
	// var routeNamesArray = [];
	// //multi-dimensional array containing lists of stations on the 12 routes 
	// var routeStationListsArray = [];
	var routeNumsArr = [];
	var routeColorsArr = [];

	function stationsByLine() {

		var queryURL = "https://api.bart.gov/api/route.aspx?cmd=routeinfo&route=all&key=ZVZV-PH5D-9W3T-DWE9&json=y";

		$.ajax({
			url: queryURL,
			method: "GET"
		}).done(function(response) {
			//loop through number of routes and pull route names and stations
			for (var i = 0; i < response.root.routes.route.length; i++) {
				var routeName = response.root.routes.route[i].name;
				var line = response.root.routes.route[i].routeID;
				var lineColor = response.root.routes.route[i].color;
				console.log(line, lineColor);
				routeColorsArr.push(lineColor);
				routeNumsArr.push(line);
				// var stationsOnRoute = response.root.routes.route[i].config.station;
				// //push route names to array
				// routeNamesArray.push(route);
				// //push lists of stations on routes to multi-dimensional array
				// routeStationListsArray.push(stationsOnRoute);
			}
			console.log(routeColorsArr);
		});    	

	};

});	









