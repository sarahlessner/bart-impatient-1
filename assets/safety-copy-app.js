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
	        
    	$('#toggle-btn').add('#time-selection').on("click",function(e){   
        e.stopPropagation();
	        if ($('#time-selection').val() !== "") {
				$('#time-clear').show();
			}
        $('#time-selection').clockface('toggle');
    	});
    	
	});
	//clear time
	$('#time-clear').on("click", function(){
		$('#time-selection').val('');
		$('#time-clear').hide();
	});
	
	//hide train schedules as default
	$("#real-time-container").hide();
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
	$(".remove-via").hide();
	//on click for upstream option
	$(".upstream-button").on("click", function(){
		$("#via-list").show();
		$(".upstream-button").hide();
		$(".remove-via").show();
	});
	//on click to hide upstream field and clear value if entered
	$(".remove-via").on("click", function(){
		$("#via-list").hide();
		$("#via-list").val("placeholder-station");
		$(".upstream-button").show();
		$(".remove-via").hide();
	});
	
	var selectionsArray = [];
	var selectionsIdx = 0;
	//on click for submit button
	$("#addTrainBtn").on("click", function(){
		event.preventDefault();
		//empty trip-plan and real-time divs
		$("#real-time-container").hide();
		$("#trip-plan-container").hide();
		$("#trip-plan").empty();
		$("#real-time").empty();
		$("#real-time-origin").empty();
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
		getTripPlan(selectionsArray);
		realTime();
		$("#trip-plan-container").show();
	});


	//function to validate time input 
	function validateTime(timestring) {
		var checkUserTime = moment(timestring,'h:mm a', true);
		return checkUserTime.isValid();
	};
	

	//function calling BARTS schedule info API to get a trip plan based on origin/dest
	function getTripPlan(selections) {
		console.log(selections);
		var queryURL = "https://api.bart.gov/api/sched.aspx";
		var numBeforeReq = 1;
		var numAfterReq	= 2;
		if (selectionsIdx != 0) {
			numBeforeReq = 0;
			numAfterReq = 3;
		}
		console.log("pre-ajax", myTime);
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

	function getTripLegs(response) {
		
			//for each available route at the station		    	
			for (var i = 0; i < response.root.schedule.request.trip.length; i++) {
				//all trip options
				var myTrip = response.root.schedule.request.trip[i];
				//array to hold trip leg info from json response
				var tempArray = [];
				//array to store leg or legs of trips
				var legsArray = [];
				//if the trip plan does not involve a transfer ("leg" is just an object)
				console.log(myTrip);
				if(myTrip.leg.length === undefined) {
					tempArray.push(myTrip.leg);
				}
				else{
					for (var j = 0; j < myTrip.leg.length; j++) {
						tempArray.push(myTrip.leg[j]);
					}
				}
				console.log(tempArray);
				for (var k = 0; k < tempArray.length; k++) {
					var legOrigin = tempArray[k]['@origin'];
					var legDest = tempArray[k]['@destination'];
					var finalTrainDest = tempArray[k]['@trainHeadStation'];
					var legOriginTime = tempArray[k]['@origTimeMin'];
					if (i === 0) {
						myTime = tempArray[k]['@destTimeMin'];
					}
					var load = tempArray[k]['@load'];
					var line = tempArray[k]['@line'];
					var myLeg = [legOrigin, legDest, finalTrainDest, legOriginTime, load, line];
					if (selectionsIdx === 0) {
						legsArray.push(myLeg);
					} else {
						console.log(i, tripsArray[i]);
						tripsArray[i].push(myLeg);
					}
				}
				if (selectionsIdx === 0) {
					tripsArray.push(legsArray);
				}
			};
			console.log(myTime);
			selectionsIdx++;
			if (selectionsIdx < selectionsArray.length) {
				getTripPlan(selectionsArray);
			} else {
				displayTrips();	

			}


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
				var convertOrig = convertStationAbbr(originStation);
				$("#real-time-origin").append(convertOrig+" Station - "+" ");
				if (etd) {
					for (i = 0; i < etd.length; i++) {
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
				tripLeg.append(legDest+"<br>");
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
					etd.append(" - ");
				}
				if (realTimeArray[i][j][0] === "Leaving") {
					etd.append(realTimeArray[i][j][0]+" ");
				}
				else {
					etd.append(realTimeArray[i][j][0]+"min"+" ");
				}
				etd.append(" ("+realTimeArray[i][j][1]+" "+"cars)");

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









