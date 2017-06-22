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
	var loadArray = ["unavailable", "light","normal","heavy","packed"];
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
						var myLeg = [legOrigin, legDest, finalTrainDest, legOriginTime, load];
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
							// console.log("trip origin:", legOrigin, "trip destination:", legDest, "final destination:", finalTrainDest);
							// console.log("finalDest", finalDest);

							var myLeg = [legOrigin, legDest, finalTrainDest, legOriginTime, load];
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
							var lineColor = allEstimates[j].color;
							// console.log("minutesToArrive", minutesToArrive, "trainLength", trainLength, "lineColor", lineColor);
							var estimatesArray = [minutesToArrive,trainLength,lineColor];
							etdArray.push(estimatesArray);
						}
						realTimeArray.push(etdArray);
						displayRealTime();
					};
				};	 
					
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
				//append train crowding(load) info
				tripLeg.append("Train Crowding: "+loadValue+"<br>");
				//append final train destination
				tripLeg.append(finalTrainDest+" "+"Train"+" / ");
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
			var etd = $("<div style='color: "+realTimeArray[i][2][2]+ "'>");
			etd.addClass("etd-train");
			etd.append(realTimeArray[i][0]+"<br>");
			//looping through all train level estimate data for the origin station
			for (var j = 2; j < realTimeArray[i].length; j++) {
				//minsaway
				etd.append(realTimeArray[i][j][0]+"min"+" ");
				//if we want to display train length, uncomment
				// etd.append(realTimeArray[i][j][1]+" "+"cars"+" -- ");
				
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
				timeOfAlert.addClass("service-alert");
					if ((timeOfAlert === undefined) || (bsa === "No delays reported.")) {
					$("#service-advisories").empty();
					}	
					else {
					$("#service-advisories").append(timeOfAlert+"<br>", bsa);
					}
				}
			});
	};

























	// Youtube API CODE

	// Onclick event for Next and Previous buttons; when pressed, function youtubeAPIcall 
	//	will execute and grab the next set of videos
    youtubeApiCall();
    $("#pageTokenNext").on( "click", function( event ) {
        $("#pageToken").val($("#pageTokenNext").val());
        youtubeApiCall();
    });
    $("#pageTokenPrev").on( "click", function( event ) {
        $("#pageToken").val($("#pageTokenPrev").val());
        youtubeApiCall();
    });
    $("#hyv-searchBtn").on( "click", function( event ) {
        youtubeApiCall();
        return false;
    });

    // Function that will implement the YouTube search suggestions API
    jQuery( "#hyv-search" ).autocomplete({
      source: function( request, response ) {
        //console.log(request.term);
        var sqValue = [];
        jQuery.ajax({
            type: "POST",
            url: "https://suggestqueries.google.com/complete/search?hl=en&ds=yt&client=youtube&hjson=t&cp=1",
            dataType: 'json',
            data: jQuery.extend({
                q: request.term
            }, {  }),
            success: function(data){
                console.log(data[1]);
                obj = data[1];
                jQuery.each( obj, function( key, value ) {
                    sqValue.push(value[0]);
                });
                response(sqValue);
            }
        });
      },
      select: function( event, ui ) {
        setTimeout( function () { 
            youtubeApiCall();
        }, 300);
      }
    });  
        

	// Function that will pull the Youtube videos from YouTube Search V3 API
	function youtubeApiCall(){
	    $.ajax({
	        cache: false,
	        data: $.extend({
	            key: 'AIzaSyCjBRgUe6qWaI3aNmE7B1c-3AkEnY2RXRQ',
	            q: $('#hyv-search').val(),
	            part: 'snippet'
	        }, {maxResults:5,pageToken:$("#pageToken").val()}),
	        dataType: 'json',
	        type: 'GET',
	        timeout: 5000,
	        url: 'https://www.googleapis.com/youtube/v3/search'
	    })
	    .done(function(data) {
	    	console.log(data.items[0].id.videoId);
	        if (typeof data.prevPageToken === "undefined") {$("#pageTokenPrev").hide();}else{$("#pageTokenPrev").show();}
	        if (typeof data.nextPageToken === "undefined") {$("#pageTokenNext").hide();}else{$("#pageTokenNext").show();}
	        var items = data.items, videoList = "";
	        $("#pageTokenNext").val(data.nextPageToken);
	        $("#pageTokenPrev").val(data.prevPageToken);
	        $.each(items, function(index,e) {
	            videoList = videoList + '<li class="hyv-video-list-item"><div class="hyv-content-wrapper"><a href="" class="hyv-content-link" title="'+e.snippet.title+'"><span class="title">'+e.snippet.title+'</span><span class="stat attribution">by <span>'+e.snippet.channelTitle+'</span></span></a></div><div class="hyv-thumb-wrapper"><a href="" class="hyv-thumb-link"><span class="hyv-simple-thumb-wrap"><img class="vidImg" data-vid=' + data.items[index].id.videoId + ' alt="'+e.snippet.title+'" src="'+e.snippet.thumbnails.default.url+'" width="120" height="90"></span></a></div></li>';
	        });
	        $("#hyv-watch-related").html(videoList);
	        // JSON Responce to display for user
	        new PrettyJSON.view.Node({ 
	            el:$(".hyv-watch-sidebar-body"), 
	            data:data
	        });
	    });
	};

    $(document).on("click", ".vidImg", function(event){
    	event.preventDefault();
    	$("#hyv-watch-related").empty();
    	console.log("inside click handler");
    	var $this = $(this);
    	console.log("this", $this);
    	var vid = $this.attr("data-vid");
    	console.log("vid", vid);
    	var vidLink = "https://www.youtube.com/embed/" + vid;
    	// $('<iframe width="560" height="315" frameborder="0" allowfullscreen></iframe>').attr('src', vidLink).appendTo('#fullVideo');
    	$('#fullVideo').html('<iframe src="' + vidLink + '" width="560" height="315" frameborder="0" allowfullscreen></iframe>');
	});
});	









