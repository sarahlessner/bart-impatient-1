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
	var viaStation;
	var stationInfo;
	//multidimensional array storing data from getTripPlan function
	var tripsArray = [];
	//multidimensional array storing data from realTime function
	var realTimeArray = [];
	//store via stations in array if applicable
	var viaRealTimeArray = [];
	//keep track of times getRealTime is called to determine if origin or via station info
	var getRealTimeCount = 0;
	//captures time if user inputs one. defaults to parameter "now"
	var myTime;
	//get load number 0-4 from API and access load array at idx of load #
	//0 load from bart means load info not available
	var loadArray = ["unavailable", "many seats","few seats","seat unlikely","HEAVY CROWDS"];
	var bartKey = 'ZVZV-PH5D-9W3T-DWE9';


	//function to pull station lists from BART API and push to arrays
	function displayStations() {
		var queryURL = "https://api.bart.gov/api/stn.aspx?cmd=stns&key=ZVZV-PH5D-9W3T-DWE9&json=y";

			$.ajax({
				url: queryURL,
				method: "GET"
				}).done(function(response) {

			    //loop through stations and push "name" and "abbr" to arrays for user dropdown lists
				for (var i = 0; i < response.root.stations.station.length; i++) {
					stationName = response.root.stations.station[i].name;
					stationAbbr = response.root.stations.station[i].abbr;
					stationNameArray.push(stationName);
					stationAbbrArray.push(stationAbbr);
					//clean these lists up - DRY
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

					stnList = $("<option>");
					stnList.addClass("station-selection");
					stnList.text(stationName);
					stnList.attr("value", stationAbbr);
					$("#station-list").append(stnList);

					viaList = $("<option>");
					viaList.addClass("station-selection");
					viaList.text(stationName);
					viaList.attr("value", stationAbbr);
					$("#via-list").append(viaList);

				};
			});
	};

	//hide button to clear time until time is entered
	$('#time-clear').hide();
	//code to access clockface.js/css
	$(function(){
    	$('#time-selection').clockface({
        format: 'h:mm a',
        trigger: 'manual'
    	});   

    	$('#time-selection').hide();

    	$('#toggle-btn').on("click", function(){
    		$('#time-selection').toggle('fast');
    		$('#time-selection').val('');
    		$('#toggle-btn').hide();
    		$('#time-clear').show();
    	});

    	$('#time-selection').on("click",function(e){   
	        e.stopPropagation();
	        $('#time-selection').clockface('toggle');
    	});
    	
	});
	//clear time
	$('#time-clear').on("click", function(){
		$('#time-selection').val('');
		$('#time-selection').toggle('fast');
		$('#time-clear').hide();
		$('#toggle-btn').show();
	});
	
	//hide train schedules as default
	$("#real-time-container").hide();
	$("#via-rt-panel").hide();
	$("#trip-plan-container").hide();
	//swap origin/destination (reverse)
	$("#reverse-selection").on("click", function(){

		if (($("#origin-list").val() === "Select Origin Station") ||  ($("#destination-list").val() === "Select Destination Station")){
			return;
		}
		var placeholder = $("#origin-list").val();
		$("#origin-list").val($("#destination-list").val());
		$("#destination-list").val(placeholder);
		
	});
	//hide via station selection and its hide button as default
	$("#via-list").hide();

	$(".via-toggle").on("click", function() {
		$("#reverse-selection").toggle();
		$("#via-list").slideToggle('fast', function() {
			$("#via-list").val("placeholder-station");
		});

	});
	
	var selectionsArray = [];
	var selectionsIdx = 0;
	//on click for submit button
	$("#addTrainBtn").on("click", function(){
		event.preventDefault();
		//empty all trip-plan and real-time
		$("#real-time-container").hide();
		$("#via-rt-panel").hide();
		realTimeArray = [];
		viaRealTimeArray = [];
		$("#trip-plan-container").hide();
		$("#trip-plan").empty();
		getRealTimeCount = 0;
		$("#real-time").empty();
		$("#via-real-time").empty();
		$("#real-time-origin").empty();
		$("#via-real-time-origin").empty();
		//capture station entry values (abbr version of train or station name)
		originStation = $("#origin-list").val();
		destinationStation = $("#destination-list").val();
		viaStation = $("#via-list").val();

		//validate time inputs
		timeInput = $('#time-selection').val();
		//if no time was selected, default to now
		if (timeInput === "") {
			myTime = "now";
		} else if (validateTime(timeInput)) {
			//if time is valid store the input 
			myTime = timeInput;
		} else {
			bootbox.alert("Please enter time in 'h:mm am' format");
			return;
		}
		
		if ((originStation === "Select Origin Station") || (destinationStation === "Select Destination Station")) {
			bootbox.alert("Please select an origin AND destination station!");
			return;
		}
		if (originStation === destinationStation) {
			bootbox.alert("'Origin Station' and 'Destination Station' cannot be the same!");
			return;
		}
		
		selectionsArray = [];
		selectionsIdx = 0;
		if (viaStation === "placeholder-station") {
			selectionsArray.push([originStation, destinationStation]);
		} else {
			selectionsArray.push([originStation, viaStation]);
			selectionsArray.push([viaStation, destinationStation]);
			
		}
		tripsArray = [];
		getFirstTripPlan(selectionsArray);
		realTime();
		var convertOrig = convertStationAbbr(originStation);
		var convertVia = convertStationAbbr(viaStation);
		//append station name(s) to panel heading
		$("#real-time-origin").append(convertOrig+" Station - "+" ");
		$("#via-real-time-origin").append(convertVia+" Station - "+" ");
		$("#trip-plan-container").show();
	});


	//function to validate time input 
	function validateTime(timestring) {
		var checkUserTime = moment(timestring,'h:mm a', true);
		return checkUserTime.isValid();
	};
	
	var firstTripPlan = 5;
	//function calling BARTS schedule info API to get a trip plan based on origin/dest
	function getFirstTripPlan(selections) {
		console.log(selections);
		var queryURL = "https://api.bart.gov/api/sched.aspx";
		var numBeforeReq = 1;
		var numAfterReq	= 4;
		if ((tripsArray.length !== 0) || (myTime === "now")) {
			numBeforeReq = 0;
			numAfterReq = 4;
		}
			$.ajax({
				data: {
					cmd: 'depart',
					orig: selections[selectionsIdx][0],
					dest: selections[selectionsIdx][1],
					time: myTime,
					key: bartKey,
					b: numBeforeReq,
					a: numAfterReq,
					json: 'y'
				},
				url: queryURL,
				method: "GET"
				}).done(getTripLegs);
		
	};
	var firstTripIdx = 0;
	//function to get trip plan from via - dest if applicable
	function getViaPlan() {
		selectionsIdx = 1;
		tripArrivalTime = tripsArray[firstTripIdx][(tripsArray[firstTripIdx].length-1)][6];
		var queryURL = "https://api.bart.gov/api/sched.aspx";

			$.ajax({
				data: {
					cmd: 'depart',
					orig: viaStation,
					dest: destinationStation,
					time: tripArrivalTime,
					key: bartKey,
					b: 0,
					a: 1,
					json: 'y'
				},
				url: queryURL,
				method: "GET"
				}).done(getTripLegs);
//				}).done(dummyResponse);


	};
	//function to get trip legs for orig OR via to dest
	function getTripLegs(response) {
		console.log("response", response);
		//for each available route at the station
		tempTripsArray = [];
		var tripPlan = response.root.schedule.request.trip;
		if (tripPlan.length === undefined) {
			tempTripsArray.push(tripPlan)
		} else {
			for (var h = 0; h < tripPlan.length; h++) {
				tempTripsArray.push(tripPlan[h]);
			}
		}

		for (var i = 0; i < tempTripsArray.length; i++) {

			//all trip options
			var myTrip = tempTripsArray[i];
			//array to hold trip leg info from json response
			var tempLegsArray = [];
			//array to store leg or legs of trips
			var legsArray = [];
			//if the trip plan does not involve a transfer ("leg" is just an object)
			console.log("trip", myTrip);
			if(myTrip.leg.length === undefined) {
				tempLegsArray.push(myTrip.leg);
			}
			else{
				for (var j = 0; j < myTrip.leg.length; j++) {
					tempLegsArray.push(myTrip.leg[j]);
				}
			}
			console.log(tempLegsArray);
			for (var k = 0; k < tempLegsArray.length; k++) {
				var legOrigin = tempLegsArray[k]['@origin'];
				var legDest = tempLegsArray[k]['@destination'];
				var finalTrainDest = tempLegsArray[k]['@trainHeadStation'];
				var legOriginTime = tempLegsArray[k]['@origTimeMin'];
				var legDestTime = tempLegsArray[k]['@destTimeMin'];
				if (k === 0) {
					myTime = legOriginTime;
				}
				console.log("origTimeMin", myTime);
				var load = tempLegsArray[k]['@load'];
				var line = tempLegsArray[k]['@line'];
				var myLeg = [legOrigin, legDest, finalTrainDest, legOriginTime, load, line, legDestTime];
				if (selectionsIdx === 0) {
					legsArray.push(myLeg);
				} else {
				 	console.log(tripsArray.length + " " + firstTripIdx);
				 	tripsArray[firstTripIdx].push(myLeg);
				}
			}
			if (selectionsIdx === 0 && !isTripDupe(legsArray)) {
				tripsArray.push(legsArray);
			}

		};		
		if (selectionsIdx !== 0)
			firstTripIdx++;

		console.log(myTime);

		if (tripsArray.length < firstTripPlan) {
			getFirstTripPlan(selectionsArray);
			firstTripIdx = 0;
		} else if (selectionsArray.length === 2 && firstTripIdx < tripsArray.length) {
			//displayTrips();
			getViaPlan();

		} else {
			displayTrips();
		}

	};

	//check for duplicate trips
	function isTripDupe(newTripArr) {
		var newTripString = newTripArr.toString();
		for (var i = 0; i < tripsArray.length; i++) {
			var oldTripString = tripsArray[i].toString();
			console.log("oldTrip"+i+"="+oldTripString+" vs newTrip="+newTripString);
			if(oldTripString == newTripString)
				return true;
		}
	
		return false;
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
			}).done(getRealTime);
	};
	//function to get real time data at via station
	function viaRealTime() {
		var queryURL = "https://api.bart.gov/api/etd.aspx";

		$.ajax({
			data: {
				cmd: 'etd',
				orig: viaStation,
				key: bartKey,
				json: 'y'
			},
			url: queryURL,
			method: "GET"
			}).done(getRealTime);
	};
	//function that stores real time data from API
	function getRealTime(response) {
		getRealTimeCount++;
		//get all real time data at the origin station
		var allRealTime = response.root.station[0];
		// console.log("all real time", allRealTime);
		var etd = allRealTime.etd;
		//loop through ETD info (if there is an etd)
		if (etd) {
			$("#real-time-container").show();
			for (i = 0; i < etd.length; i++) {
				var etdArray = [];
				var viaEtdArray = [];
				//get train line (final dest) and abbrev for all trains
				var allRealTimeDest = etd[i].destination;
				var allRealTimeAbbr = etd[i].abbreviation;
				var allEstimates = etd[i].estimate;
		
				if ($("#real-time").is(':empty') === true) {
					etdArray.push(allRealTimeDest, allRealTimeAbbr);
				} else {
					viaEtdArray.push(allRealTimeDest, allRealTimeAbbr);
				}
				//loop through estimate information for all specific trains arriving
				for (j = 0; j < allEstimates.length; j++) {
					var minutesToArrive = allEstimates[j].minutes;
					var trainLength = allEstimates[j]['length'];
					var lineColor = allEstimates[j].hexcolor;
					// console.log("minutesToArrive", minutesToArrive, "trainLength", trainLength, "lineColor", lineColor);
					var estimatesArray = [minutesToArrive,trainLength,lineColor];
					if ($("#real-time").is(':empty') === true) {
						etdArray.push(estimatesArray);
					} else {
						viaEtdArray.push(estimatesArray);
					}	
				} 
				console.log("get realtime ETDArr", etdArray);
				if ($("#real-time").is(':empty') === true)	{
					realTimeArray.push(etdArray);
				} else {
					viaRealTimeArray.push(viaEtdArray);
				}	
			};

			if ($("#real-time").is(':empty') === true) {
				displayRealTime(realTimeArray);				
			} else {
				displayRealTime(viaRealTimeArray);
				$('#via-rt-panel').show();
			}
		};
					 	
	};

	//function to display data from getTripPlan function
	function displayTrips() {
		// console.log("logMyTrips");
		//loop through all of the trip plans based on users origin/dest
		for (var i = 0; i < tripsArray.length; i++){
			//creates a div element for containing each trip option
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
				tripLeg.append(tripsArray[i][j][3]+"  -  ");
				//append final train destination
				tripLeg.append(finalTrainDest+" "+"Train <br>");
				
				// tripLeg.append("Train Crowding: "+loadValue+"<br>")
				// append origin leg
				tripLeg.append(legOrigin+" "+"<img width='20'src='assets/images/greenarrow.png'>"+" ");
				// append destination leg
				tripLeg.append(legDest);
				//append arrival time  @ destination
				tripLeg.append(" - "+tripsArray[i][j][6]+"<br>");
				//append train crowding(load) info
				if (loadValue === "HEAVY CROWDS") {
					tripLeg.append("Alert: "+loadValue+"<br>");
				}
				//append trip leg(s) to trip option div
				tripOption.append(tripLeg);
				//append all trip plan data to HTML
				$("#trip-plan").append(tripOption);
			}
		}
	};
	//function to display the data from realTime function
	function displayRealTime(realTime) {
		//loop through array containing all etd data 
		for (var i = 0; i < realTime.length; i++) {
			//create a div for each piece of ETD data
			// var etd = $("<div>");
			var etd = $("<div>");
			etd.addClass("etd-train");
			var colorBox = $("<div>");
			colorBox.css({
				'background-color': realTime[i][2][2],
			}).addClass("color-box");
			etd.append(colorBox);
			etd.append(realTime[i][0]+"<br>");
			//looping through all train level estimate data for the origin station
			for (var j = 2; j < realTime[i].length; j++) {
				//minsaway
				if(j != 2) {
					etd.append(" - ");
				}
				if (realTime[i][j][0] === "Leaving") {
					etd.append(realTime[i][j][0]+" ");
				}
				else {
					etd.append(realTime[i][j][0]+"min"+" ");
				}
				etd.append(" ("+realTime[i][j][1]+" "+"cars)");

				if (getRealTimeCount === 1) {
					$("#real-time").append(etd);
				} else {
					$("#via-real-time").append(etd);
			
				}
			}
		}
		if ((getRealTimeCount === 1) && ($("#via-list").val !== "placeholder-station")); {
			viaRealTime();
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
	$("#service-advisories").hide();
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
						$("#service-advisories").hide();
					}	
					else {
						// $("#service-advisories").addClass("service-alert");
						$("#service-advisories").append(timeOfAlert+"<br>", bsa);
						$("#service-advisories").show();
					}
				}

			});
	};

	stationsByLine();
	var routeNamesArray = [];
	//multi-dimensional array containing lists of stations on the 12 routes 
	var routeStationListsArray = [];
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

	//Station Info Page
	$("#about-station-container").hide();
	//Station Info page list selector
	$("#getStnInfo").on("click", function(){
		event.preventDefault();
		$("#about-station").empty();
		$("#station-list-selection").empty();
		stationInfo = $("#station-list").val();
		$("#station-list-selection").append(convertStationAbbr(stationInfo));
		$("#about-station-container").show();
		getStationInfo();
	});
	
	//BART Station Info API
	function getStationInfo() {
		var queryURL = "https://api.bart.gov/api/stn.aspx";

		$.ajax({
			data: {
				cmd:'stninfo',
				orig: stationInfo,
				key: bartKey,
				json: 'y'
			},
			url: queryURL,
			method: "GET"
		}).done(function(response) {

		});
	};

	

});	









