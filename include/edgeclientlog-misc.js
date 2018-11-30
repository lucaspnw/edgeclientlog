// Simile Timeline popup override, have to do this to override the default popup, to reformat it
//

var oldFillInfoBubble = Timeline.DefaultEventSource.Event.prototype.fillInfoBubble;
Timeline.DefaultEventSource.Event.prototype.fillInfoBubble = function(elmt, theme, labeller) {
  //oldFillInfoBubble.call(this, elmt, theme, labeller);
  // elmt is the div we're worknig on now
  
  // this should be the tag we're dealing with
  var friendlyTagDescription = friendlyNamesOfTags(this._text);

  elmt.classname = 'tlPopup';
  elmt.innerHTML = "<b>" + this._text + '</b><br><span class="infoBubbleTitleSubtext">' + friendlyTagDescription  + '</span><hr>' + this._description + '</span>';

  //console.log(this);
}



function centerTimeline(date) {
    tl.getBand(0).setCenterVisibleDate(Timeline.DateTime.parseGregorianDateTime(date));
}



// this does most of the processing work
// outputs are: 
// beginAndEndEvents -- this has events with a beginning and end
// allTimelineEvents -- all of the instant events to put on the timeline
// allLogsBuffer -- the colorized log lines
// relatedEventsTracker -- array of the related events, timestamps, and log messages

function handleNewLogFile(logs) { 
  var gottags = new Array;

  var rules = logrules();

  var allLogsBuffer = ""; 
 
  var lineNumber = 0;

  //var beginAndEndEvents = new Array; // changed this to a global so we can know it after processing
  beginAndEndEvents = [];

  var allTimelineEvents = new Array;


  // we need to keep track of when a large number of things happen, so we can identify client activity periods like
  // connecting and disconnecting, and also so we can magnify the timeline chart so we don't get too many things on the 
  // screen in one area.

  //var relatedEventsTracker = new Array; // changed this to a global so we can know it after processing
  relatedEventsTracker = [];

  var timeDeltaBetweenRelatedEventsSec = 1; // < 1 second displayed events will be probably related

  logs.split("\n").forEach( function(line) {
    lineNumber++;
    //    if(i % 500 === 0) { var retval = parseDateFromLogMessage(line); console.log(retval); }

    var matchedRule = "";

    Object.keys(rules).forEach( function(k) {
      // console.log('doing this regex: ' + k);
      try { var rx = new RegExp(k); }
      catch(e) { console.log('Regex Failure (' + e  + ') : ' + k ); next; }
        
      if(line.match(rx)) { 
        // This is the main area to deal with the matching log lines + regex rules.
        //

        // push into main 'gottags' variable
        gottags.push(rules[k]);  
        // do the capturing rules
        //

        if(rules[k].match(/#capture/) ) {

          var objCaptures = new Object;
          var captures = rules[k].match(/#capture\s+#([A-Za-z0-9]+)/g);
          captures = captures.map( function(a) { return a.split(' ').slice(1,2).join(); } );
          
          var matches = line.match(rx);
          matches = matches.splice(1,99); // nix first result

          // now zipper the keys, vals arrays
          for(var a = 0;a<captures.length;a++) {
            objCaptures[captures[a]] = matches[a];
          }
        }
        // done with capturing rules
        
        if(rules[k].match(/#begin/)) {
          //console.log('checking begin rule ' + k + ' -- ' + rules[k]);
          var beginRule = rules[k].match(/#begin\s+#([A-Za-z0-9]+)/);
          if(! beginRule) { alert('Error in rule ' + k + ':' + rules[k]); }
          beginRule = beginRule.splice(1,99).join();

          // now find the first match of this begiRule in array beginAndEndEvents that does not have an "endTime and replace it.
          // if not found, then push this one into the array at the end.
          // like this: beginAndEndEvents = [ {'title':'EdgeClientStartup','begin':'2016-04-03:04:04:04:345Z','end':'2016-04-03:05:04:04:345Z'}]

          var matchfound = 0;
          for(var a = 0;a<beginAndEndEvents.length;a++) { 
            if(beginAndEndEvents[a].title == beginRule && typeof beginAndEndEvents[a].end === 'undefined') {
              // we need to replace this one because we should only have 1 simultaneous BEGIN context
              matchfound = 1;
              beginAndEndEvents[a].begin = parseDateFromLogMessage(line);
              beginAndEndEvents[a].beginlinenumber = lineNumber;
            }
            
          }
          if(! matchfound) {
            beginAndEndEvents.push( { 'errorTags':[] , 'currentError':1,'title':beginRule,'begin':parseDateFromLogMessage(line),'beginlinenumber':lineNumber, errors:[] } );
          }
        }

        if(rules[k].match(/#end/)) {
          var endRule = rules[k].match(/#end\s+#([A-Za-z0-9]+)/);
          endRule = endRule.splice(1,99).join();

          // now find the first match of this beginRule that doesn't have any end value and put it there.
          // If there isn't any, then log an error

          var matchfound = 0;
          for(var a = 0;a<beginAndEndEvents.length;a++) {
            if(beginAndEndEvents[a].title == endRule && typeof beginAndEndEvents[a].end === 'undefined') {
              matchfound = 1;
              beginAndEndEvents[a].end = parseDateFromLogMessage(line);
              beginAndEndEvents[a].endlinenumber =  lineNumber ;
            }
          }
          if(! matchfound) { 
            console.log('WARNING: No begin found for this "'+endRule+'" END: ' + line + ' not dumping current variable on next line');
            // console.log(beginAndEndEvents);
          }
        } 
        
        // the duration events have an error counter, deal with it here
        if(rules[k].match(/#error/)) {
          // check to see what area(s) this error is in
      	  for(var a = 0;a<beginAndEndEvents.length;a++) {
      	    if(typeof beginAndEndEvents[a].begin === 'string' && typeof beginAndEndEvents[a].end === 'undefined') {
      	  	  beginAndEndEvents[a].errors.push(lineNumber);
      	  	  beginAndEndEvents[a].errorTags.push(rules[k]);
      	    }
      	  }
      	}
        

        // put stuff on the timeline
        if(rules[k].match(/showOnTimeline/)) {
          

          //
          //
          // do related events stuff here
          var relatedDoneFlag = 0;
          var timeFromThisLogLine = convertTLDateToJsDate(parseDateFromLogMessage(line));
          
          if(relatedEventsTracker.length == 0) {
            // must be the first line
            relatedEventsTracker.push({ begin:timeFromThisLogLine,
              loglines:[ lineNumber ],
              middle:timeFromThisLogLine
            });
            relatedDoneFlag = 1;
          }
          else {            
            for(var i = 0;i < relatedEventsTracker.length; i++) {
              if(typeof relatedEventsTracker[i].end === 'string' && typeof relatedEventsTracker[i].begin === 'string') {
                continue; // skip this one, already done
              }
              else if(typeof relatedEventsTracker[i].begin === 'string' && typeof relatedEventsTracker[i].middle === 'string') {
                var t1 = new Date(timeFromThisLogLine);
                var t2 = new Date(relatedEventsTracker[i].middle)
                var timeDelta = t1 - t2;
                
                // this one must not have an end time. is it time to end this related event area?
                if(timeDelta < 3000) {
                  // this related event area is still going on, set middle to it
                  relatedEventsTracker[i].middle = timeFromThisLogLine;
                  relatedEventsTracker[i].loglines.push(lineNumber);
                  relatedDoneFlag = 1;
                  //console.log('Extending related event ' + i + ' TS: ' + timeFromThisLogLine + ' delta: ' + timeDelta)
                }
                else {
                  // been a while, end this one with the time from the last one in the middle.
                  relatedEventsTracker[i].end = relatedEventsTracker[i].middle;
                  relatedDoneFlag = 1;
                  //console.log('Ending related event ' + i)
                }
              }
            }
            if(! relatedDoneFlag) {
              // insert this one into the event
              relatedEventsTracker.push({
                begin:timeFromThisLogLine,
                loglines:[ lineNumber ],
                middle:timeFromThisLogLine 
              });
              //console.log('pushing new event, begin= ' + timeFromThisLogLine )
            }

          }

          

          // Make the captured data prettier
          
          var prettyCaptures = '';
          if(typeof objCaptures === 'object') {
            var a = Object.keys(objCaptures).map(function(k) { return k + ': ' + objCaptures[k]; } );
            var prettyCaptures = a.join(',');
            //console.log('MAKING CAPTURES PRETTY')
          }
          else {
          	prettyCaptures = rules[k];
          	prettyCaptures.replace("#showOnTimeline",'');
          	//console.log('NOT MAKING CAPTURES PRETTY: ' + typeof objCaptures )
          }
          // end related events stuff
 
          allTimelineEvents.push( { 
            'begin':parseDateFromLogMessage(line),
            'title':prettyCaptures,
            'description':line,
            'linenumber':lineNumber,
            'tags':rules[k],
          } );


        }
        // done with stuff on the timeline
        matchedRule = rules[k];
      }
      else {
        // our line didn't match any of the regex rules
        
      } 

      // end of processing this log line
    
    } );


  // color red if no match, green if match
  if(matchedRule) { 
  	centerTlLink = 'onclick="centerTimeline(\'' + convertJSDateToTLDate(convertTLDateToJsDate(parseDateFromLogMessage(line))) + '\')"';
    allLogsBuffer = allLogsBuffer + '<span id="l'+lineNumber+'" title="'+matchedRule+'"'+centerTlLink+'><font color=#A0FFA0>' + line + "</font></span>";
  }
  else {
    allLogsBuffer = allLogsBuffer + '<span id="l'+lineNumber+'" title="No Tags Matched"><font color=#FFA0A0>' + line + "</font></span>";
  }


  } );

  //
  //
  //
  //
  //
  //
  //
  // Now we are done with all of the lines of the log file.
  // This is the data we have to work with:
  // beginAndEndEvents -- this has events with a beginning and end
  // allTimelineEvents -- all of the instant events to put on the timeline
  // allLogsBuffer -- the colorized log lines
  // relatedEventsTracker -- array of the related events, timestamps, and log messages
  //
  //
  //
  //

  // in case the last timeline event was in a magnification area, we need to set an end time to it
  console.log(relatedEventsTracker);

  if(relatedEventsTracker.length > 0 && typeof relatedEventsTracker[relatedEventsTracker.length - 1].end === 'undefined') {
    relatedEventsTracker[relatedEventsTracker.length - 1].end = relatedEventsTracker[relatedEventsTracker.length - 1].middle;
    console.log('finishing up, putting end = ' + relatedEventsTracker[relatedEventsTracker.length - 1].middle + ' in relatedEventsTracker[' + (relatedEventsTracker.length - 1) + ']');    
  }   

  document.getElementById('contents').innerHTML = allLogsBuffer;
  console.log('see if this happens at the end , related events tracker');
  console.log(relatedEventsTracker);


  // FIXME: We need to check here for duration things that don't have any end. If that's so, we can probably assume they are still running.

  console.log('Done processing. Now putting things on the timeline, num of events: ' + allTimelineEvents.length );

  //
  // start drawing the timeline here
  //


  //{   start:    "Aug 01 2006 00:00:00 GMT-0500",
  //                 end:      "Sep 01 2006 00:00:00 GMT-0500",
  //                 magnify:  10,
  //                 unit:     Timeline.DateTime.WEEK
  //}


  eventSource = new Timeline.DefaultEventSource(0);

  var zones = new Array;
  var zones2 = new Array;

  var defaultMiddleTimeToHighlight = 0;

  for(var i = 0;i<relatedEventsTracker.length;i++) {
  	if(! ( typeof relatedEventsTracker[i].end === 'string' && typeof relatedEventsTracker[i].begin === 'string' ) ) { continue; }
  	if(relatedEventsTracker[i].loglines.length < 10) { continue; }
    // we have to go a couple seconds before/after for the magnification to get the chart 
    // to work right
    var st = new Date(relatedEventsTracker[i].begin);
    var et = new Date(relatedEventsTracker[i].end);
    st.setSeconds(st.getSeconds() - 1 );
    et.setSeconds(et.getSeconds() + 0 ); 

  	zones.push({


  		'start':convertJSDateToTLDate(st),
  		'end':convertJSDateToTLDate(et),
  		'magnify':relatedEventsTracker[i].loglines.length * 200,
  		'unit':Timeline.DateTime.SECOND
    });
    var st = new Date(relatedEventsTracker[i].begin);
    var et = new Date(relatedEventsTracker[i].end);
    st.setMinutes(st.getMinutes() - 1 );
    et.setMinutes(et.getMinutes() + 0 ); 

    zones2.push({ 
  		'start':convertJSDateToTLDate(st),
  		'end':convertJSDateToTLDate(et),
  		'magnify':relatedEventsTracker[i].loglines.length * 5,
  		'unit':Timeline.DateTime.MINUTE
    });
    //console.log('related events tracker timestamp: ' + relatedEventsTracker[i].end )
    defaultMiddleTimeToHighlight = relatedEventsTracker[i].end;
  }
  
  console.log('our zones');
  console.log(zones);
  console.log('our related events');
  console.log(relatedEventsTracker);


  var theme = Timeline.ClassicTheme.create();
  theme.event.bubble.width= 250;

  var bandInfos = [
     Timeline.createHotZoneBandInfo({
         'dateTimeFormat': 'iso8601',
         timeZone:       -0,
         eventSource:    eventSource,
  //         date:           "2016-07-21T00:00:00.000Z",
         date: defaultMiddleTimeToHighlight,
         width:          "80%",
         intervalUnit:   Timeline.DateTime.MINUTE, 
         intervalPixels: 100,
         zones:zones,
         theme: theme
     }),
     Timeline.createHotZoneBandInfo({
         zones: zones2,
         'dateTimeFormat': 'iso8601',
         timeZone:       -0,
         eventSource:    eventSource,
         //date:           "2016-07-21T0:00:00.000Z",
         date: defaultMiddleTimeToHighlight,
         width:          "10%", 
         intervalUnit:   Timeline.DateTime.HOUR,
         overview: true,
         theme: theme,
         intervalPixels: 50
     }),
     Timeline.createHotZoneBandInfo({
         zones: zones2,
         'dateTimeFormat': 'iso8601',
         timeZone:       -0,
         eventSource:    eventSource,
         //date:           "2016-07-21T0:00:00.000Z",
         date: defaultMiddleTimeToHighlight,
         width:          "10%", 
         intervalUnit:   Timeline.DateTime.DAY,
         overview: true,
         theme: theme,
         intervalPixels: 400
     }),
   ];
   bandInfos[1].syncWith = 0;
   bandInfos[2].syncWith = 1;
   bandInfos[2].highlight = true;
   bandInfos[1].highlight = true;

   //bandInfos[1].eventPainter.setLayout(bandInfos[0].eventPainter.getLayout());
   tl = Timeline.create(document.getElementById("my-timeline"), bandInfos);

   // FIXME disabled this setupFilterHighlightControls(document.getElementById("filterdiv"), tl, [0,1,2], theme);


  var tlDurationEvts = new Array;

  // put duration things on the timeline
  for(var i = 1;i < beginAndEndEvents.length; i++) {
  	evt = beginAndEndEvents[i];
    if( typeof evt.begin === 'undefined' || typeof evt.end === 'undefined' || typeof evt.title === 'undefined' ) { console.log('event correlator missing data!');console.log(evt); }
    else {
      
      var tb = new Date(convertTLDateToJsDate(evt.begin));
      var te = new Date(convertTLDateToJsDate(evt.end));
      // console.log(evt.begin + '  -  ' + evt.end);
      var duration = timeConvertMsToHuman(te - tb);
      beginAndEndEvents[i].duration = duration;

      tlDurationEvts.push( {
        'start':evt.begin,
        'end':evt.end,
        'title':evt.title,
        'description':'<div class="durationeventpopup">Jump To: <span title="'+evt.beginlinenumber + '"><a href="javascript:scrollToLine('+evt.beginlinenumber + ');">'+evt.beginlinenumber + ' (Begin)</a></span> - <span title="' + evt.endlinenumber + '"><a href="javascript:scrollToLine(' + evt.endlinenumber + ')">' + evt.endlinenumber + ' (end)</a></span><br>Duration: ' + duration + "<br> Errors:" + evt.errors.length + "</div>",
      } );
        
    };
  }
  eventSource.loadJSON({'dateTimeFormat':'iso8601','events':tlDurationEvts },document.location.href);


  // put instant things on the timeline - try 2
  var tlSingleEvts = new Array;
  for(var i = 0;i < allTimelineEvents.length;i++) {
  	var evt = allTimelineEvents[i];
    if( typeof evt.begin === 'undefined' || evt.end === 'undefined' || evt.title === 'undefined' ) { console.log('missing!');console.log(evt); }
    else {
      var className = 'tlNormal';
      if(evt.tags.match('#error')) { 
      	className = 'tlErrors';
   
      }
      else if (evt.tags.match('#good')) {className = 'tlGood'; }

      var icon = 'foobar.png';
      var fixeduptitle = evt.title;
      fixeduptitle.replace("#showOnTimeline", "");

      tlSingleEvts.push(
      	{
          'icon':icon,
          'start':evt.begin,
          'classname':className,
          'title':'<span onClick="scrollToLine('+evt.linenumber+')">' + fixeduptitle + '</span>',
          'description':' Line: <span onclick="scrollToLine(' + evt.linenumber + ')">' + evt.linenumber + '</span><br>' + evt.description
        }
      );
    }
  }
  eventSource.loadJSON({'dateTimeFormat': 'iso8601','events':tlSingleEvts } ,document.location.href);



  // populate the controls area events table to give quick links and etc
  var evtControlTable = document.getElementById('timedEventsTable');
  var evtControlTableRow = evtControlTable.insertRow(0);
  for(var i = 0;i < beginAndEndEvents.length; i++) {
    evt = beginAndEndEvents[i];

    // don't show the event in the menu unless it's important
    if(true) {
      

      highlightErrorTracker[i]  = 0;
      
      var evtControlTableCell = evtControlTableRow.insertCell(i);

      if( typeof evt.begin === 'undefined' || typeof evt.end === 'undefined') { continue; }

      // skip everything but connected events, maybe we can show other ones later when we can have better formatting
      // added a scroll bar, I guess it's good enough.
      //if(! evt.title.match(/clientConnected/)) { continue; }

      var begScript = 'scrollToLine(' + evt.beginlinenumber + '); centerTimeline(\'' + convertJSDateToTLDate(convertTLDateToJsDate(evt.begin)) + '\' ); ';
      var endScript = 'scrollToLine(' +  evt.endlinenumber +  '); centerTimeline(\'' + convertJSDateToTLDate(convertTLDateToJsDate(evt.end)) + '\' ); ';

      evtControlTableCell.innerHTML = evt.title + '<br>' + evt.duration + '<br><span onmouseout="unhighlightError();" onclick="highlightError('+i+')"> Errors: ' + evt.errors.length + '</span><br><span style="float: left; " onclick="' + begScript + '"><img title="Jump to Beginning" width=20 height=20 src="arrow_left.png"></span> <span style="float: right;" onclick="' + endScript + '"><img title="Jump to End" width=20 height=20 src="arrow_right.png"></span>';
      //evtControlTableCell.style = i%2?'background: #303030':'background: #505050';

      evtControlTableCell.style = 'background: ' + navBarColor(evt.title);

      if(navBarColor(evt.title) === "hide") {
        evtControlTableCell.style = "visibility: collapse; display: none; width: 1px; ";

      }
    }

  }

}




// Local store stuff

function initStore() { 
  store("foo",store("foo") + "foo");
 // console.log(store('foo'));
}

function clearAll() {
  store.clearAll();
  // do some stuff here to refresh the screen
}

// Check for the various File API support in this browser
function checkForFileApi() { 
  
  if (window.File && window.FileReader && window.FileList && window.Blob) {
    // Great success! All the File APIs are supported.
  } else {
    alert('The File APIs are not fully supported in this browser.');
  }
}


// this big guy handles the file input object and calls up the parser
function handleFileSelect(evt) { 
  document.getElementById("filterdiv").innerHTML = '';

  var files = evt.target.files; // FileList object
  
  var output = [];
  for (var i = 0, f; f = files[i]; i++) {
    output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
                 f.size, ' bytes, last modified: ',
                  f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
                  '</li>');

    if(f.name.match(/.txt$/)) {
      document.getElementById('contents').textContent = 'Loading TXT log File...';
      var reader = new FileReader();
      reader.onloadend = function(evt) {
        if (evt.target.readyState == FileReader.DONE) { // DONE == 2
          // document.getElementById('contents').textContent = evt.target.result;
          document.getElementById('contents').textContent = 'Parsing...';
          handleNewLogFile(evt.target.result);
        }
      }
      reader.readAsBinaryString(f);
    }
    else if(f.name.match(/.html$/)) {
      document.getElementById('contents').textContent = 'Loading HTML Report file...';
      var reader = new FileReader();
      reader.onloadend = function(evt) {
        if (evt.target.readyState == FileReader.DONE) { // DONE == 2
          // document.getElementById('contents').textContent = evt.target.result;
          document.getElementById('contents').textContent = 'Parsing...';
          //handleNewLogFile(evt.target.result);
          // start line: <H4>logterminal.txt
          // end line: </PRE><A

          // these vars are to keep track of current context of the log file parsing
          var logterminalarray = new Array;
          var inlogterminalflag = 0;
          var intunnelserverflag = 0;
          var ininspectionhostflag = 0;
          var linenumber_counter = 0; 
          var timestampContext = '1985-10-26,01:21:00:000';
          var currentSection = '';
          // unfortunatley sometimes the logs are missing timestamps 
          // if they are missing, we'll insert one based on the last valid timestamp we got
          evt.target.result.split("\n").forEach( function(l) {
            linenumber_counter++;

            // sometimes the time is like "02:00:00" and sometimes like " 2:00:00"
            // also YY vs YYYY, so normalize it here
            l = l.replace(/^(\d{4}-\d{1,2}-\d{1,2},)\s/,"$1" + "0");
            var thisTimestamp = l.match(/^\d{4}-\d{1,2}-\d{1,2},\s?\d{1,2}:\d{1,2}:\d{1,2}:\d{3}/);
            
            // start looking at the line, see if we begin a section
            var matches = undefined;
            if(matches = l.match("A name=([^>]+)")) {
              //console.log(matches);
              currentSection = matches[1]; // [1] is capture group 1
              //console.log("(" + linenumber_counter + ") BEGIN SECTION: " + currentSection);
              //console.log('L' + linenumber_counter + ' ending section'); 
              inlogterminalflag = false; intunnelserverflag = false; ininspectionhostflag = false; 
            }
            
            if(thisTimestamp === null && ( inlogterminalflag || intunnelserverflag || ininspectionhostflag)) {
              l = timestampContext + ' ( &lt;TIMESTAMP ADDED) ' + l;
            }
            else {
              timestampContext = thisTimestamp;
            }
            if(intunnelserverflag) { logterminalarray.push(l.replace("\r"," (tunsvr)\r")  ); }
          	else if(inlogterminalflag) { logterminalarray.push( l.replace("\r"," (logtrm)\r")  ); }
            else if(ininspectionhostflag) { logterminalarray.push( l.replace("\r"," (inspct)\r")  ); }
            
          	if(l.match("name=logterminal[>_]")) { console.log('L' + linenumber_counter + ' start of logterminal or logterminal_low: ' + l); inlogterminalflag = true; timestampContext = '1985-10-26, 01:21:00:000'; }
            else if(l.match("name=f5TunnelServer>")) { console.log('L' + linenumber_counter + ' start of tunnelserver: ' + l); intunnelserverflag = true; timestampContext = '1985-10-26, 01:21:00:000'; }
            else if(l.match("name=F5InspHostCtrl>")) { console.log('L' + linenumber_counter + ' start of insphostctrl: ' + l); ininspectionhostflag = true; timestampContext = '1985-10-26, 01:21:00:000'; }
          } );
          
          // 
          console.log('number of lines found in report: ' + logterminalarray.length );

          handleNewLogFile(logterminalarray.sort().join("\n"));

        }
      }
      reader.readAsBinaryString(f);
    }
    else if(f.name.match(/gz$/i) || f.name.match(/zip$/i)) {
      alert('You can upload a report HTML from f5wininfo or logterminal.txt type report only. Please decompress first.');
    }
    else {
    	alert('Only logterminal.txt or f5report.html is allowed, not your file: ' + f.name);
    }
  }
}

function convertTLDateToJsDate(dt) {
  return dt.replace(/:(\d\d\d)/,".$1");
}

function convertJSDateToTLDate(dt) {
  //console.log('attempting convert of: ' + dt )
  var myDatetime = new Date(dt);
  return myDatetime.toUTCString();
}



function parseDateFromLogMessage(logline) {
  var retval = '';
  var rxT = /(\d{4})-(\d\d)-(\d\d),([\d\s]\d):(\d\d):(\d\d):(\d\d\d)/;
  var match = rxT.exec(logline);
  if(match) {
    
    if(match[4].substring(0,1) == " ") { match[4] = "0" + match[4].substring(1,2); }
    retval = match[1] + '-' + match[2] + '-' + match[3] + 'T' + match[4] + ':' + match[5] + ':' + match[6] + ':' + match[7] + "Z";
    return retval;
  }
  else {
    console.log("ERROR: cant grok the date: " + logline);
  }
      
    
}

// this guy scrolls to a line, highlights it, and then un-highlihts it
// 10 seconds later
function scrollToLine(lineNumber) {
  var myElement = document.getElementById('l' + lineNumber);
  myElement.style.backgroundColor = "#00CCFF";
  setTimeout( function() {
    myElement.style.backgroundColor = "#202020";
  }, 10000 );
  var topPos = myElement.offsetTop;
  $('#contents').animate({ scrollTop: topPos }, 50);
}

function unhighlightError() {
  $("#d").dialog('close');
}

function highlightError(whatDurationEvent) {
  // produce a little popup to show what error we're highlighting when user clicks
  // "errors:" in the top duration event area
  //
  
  if(highlightErrorTracker[whatDurationEvent] >= beginAndEndEvents[whatDurationEvent].errors.length) {
    highlightErrorTracker[whatDurationEvent] = 0;
  }
  var thisEventId = highlightErrorTracker[whatDurationEvent];

  console.log('[highlightError] evt: ' + whatDurationEvent + ', counter: ' + thisEventId );
  scrollToLine(beginAndEndEvents[whatDurationEvent].errors[thisEventId]);
  

  $( "#d" ).html("<em>Error " + (thisEventId + 1) + "/" + beginAndEndEvents[whatDurationEvent].errors.length + "</em><br><b>" + beginAndEndEvents[whatDurationEvent].errorTags[thisEventId] + "</b>");


  $( "#d" ).dialog({
    hide: {
      effect: "puff",
      delay: 250
    },
    show: "highlight",
    autoOpen: true,
    title: beginAndEndEvents[whatDurationEvent].title,
    position: { my: "top", at: "top", of: window }

  });

  
  highlightErrorTracker[whatDurationEvent]++;

}




















var numOfFilters = 0;

function setupFilterHighlightControls(div, timeline, bandIndices, theme) {
	// This code is horrible, it came from the examples page in Simile. and I didn't want to reinvent the wheel.
	// It's not all my fault!
   
    // Init Handler
    var handler = function(elmt, evt, target) {
        onKeyPress(timeline, bandIndices, table);
    };
   
   
    // Create Table
    var table = document.createElement("table");
   
    // First Row
    var tr = table.insertRow(0);
    var td = tr.insertCell(0);
 //   td.innerHTML = "Filters:";
   
      
    // Second Row
    tr = table.insertRow(1);
    tr.style.verticalAlign = "top";
   
    /* Create the text inputs for the filters and add eventListeners */
    for(var i=0; i<numOfFilters; i++) {     
        td = tr.insertCell(i); 
        var input = document.createElement("input");
        input.type = "text";
        input.size=8;
        //SimileAjax.DOM.registerEvent(input, "keypress", handler);
        td.appendChild(input);
        input.id = "filter"+i;     
    }
   
    // Third Row
    tr = table.insertRow(2);
    td = tr.insertCell(0);
 //      td.innerHTML = "Highlights:";
   
   
    // Fourth Row
       tr = table.insertRow(3);

 //      td = tr.insertCell(0);
 //      td.innerHTML = '<span style="color: #FFFFFF;">TEXT TO HIGLIGHT:&nbsp;</span>';
       
       /* Create the text inputs for the highlights and add event listeners */
       for (var i = 0; i < theme.event.highlightColors.length; i++) {
           td = tr.insertCell(i);
       
           input = document.createElement("input");
           input.type = "text";
           input.size = 8;
           input.width = 8;
           SimileAjax.DOM.registerEvent(input, "keypress", handler);
           // stupid hack to put label on the highlight boxes
     
           td.appendChild(input);
       
        input.id = "highlight"+i;
       
        var divColor = document.createElement("div");
        divColor.style.height = "0.5em";
        divColor.style.background = theme.event.highlightColors[i];
        td.appendChild(divColor);
    }
//    td = tr.insertCell(0);
//    td.innerHTML = '<span style="color: #FFFFFF;">TEXT TO HIGLIGHT:&nbsp;</span>';

    // Fifth Row
      
    tr = table.insertRow(4);
    td = tr.insertCell(0);
   
    // create the filter button
    var filterButton = document.createElement("button");
    filterButton.innerHTML = "Filter";
    filterButton.id = "filter"
    filterButton.className = "buttons"
    SimileAjax.DOM.registerEvent(filterButton, "click", handler);
 //   td.appendChild(filterButton);
   
   
    // create the clear all button
    td = tr.insertCell(1);
    var highlightButton = document.createElement("button");
    highlightButton.innerHTML = "Clear All";
    highlightButton.id = "clearAll"
    highlightButton.className = "buttons"
    SimileAjax.DOM.registerEvent(highlightButton, "click", function() {
        clearAll(timeline, bandIndices, table);
    });
//    td.appendChild(highlightButton);
   
   
    // Append the table to the div
    containertable = document.createElement("table");
    var containertr = containertable.insertRow(0);
    var containertd = containertr.insertCell(0);
    containertd.innerHTML = '<span style="color: #FFFFFF">HIGHLIGHT:&nbsp;</span>';
    var containertd = containertr.insertCell(1);    
    containertd.appendChild(table);
    div.appendChild(containertable);

}

var timerID = null;
var filterMatcherGlobal = null;
var highlightMatcherGlobal = null;

function onKeyPress(timeline, bandIndices, table) {
    if (timerID != null) {
        window.clearTimeout(timerID);
    }
    timerID = window.setTimeout(function() {
        performFiltering(timeline, bandIndices, table);
    }, 300);
}
function cleanString(s) {
    return s.replace(/^\s+/, '').replace(/\s+$/, '');
}

function performFiltering(timeline, bandIndices, table) {
    timerID = null;
    var tr = table.rows[1];
   
    // Add all filter inputs to a new array
    var filterInputs = new Array();
    for(var i=0; i<numOfFilters; i++) {
      filterInputs.push(cleanString(tr.cells[i].firstChild.value));
    }
   
    var filterMatcher = null;
    var filterRegExes = new Array();
    for(var i=0; i<filterInputs.length; i++) {
        /* if the filterInputs are not empty create a new regex for each one and add them
        to an array */
        if (filterInputs[i].length > 0){
                        filterRegExes.push(new RegExp(filterInputs[i], "i"));
        }
                filterMatcher = function(evt) {
                        /* iterate through the regex's and check them against the evtText
                        if match return true, if not found return false */
                        if(filterRegExes.length!=0){
                           
                            for(var j=0; j<filterRegExes.length; j++) {
                                    if(filterRegExes[j].test(evt.getText()) == true){
                                        return true;
                                    }
                            }
                        }
                        else{
                            return true;
                        }    
                   return false;
                };
    }
   
    var regexes = [];
    var hasHighlights = false;
    tr=table.rows[3];
    for (var x = 0; x < tr.cells.length; x++) {
        var input = tr.cells[x].firstChild;
        var text2 = cleanString(input.value);
        if (text2.length > 0) {
            hasHighlights = true;
            regexes.push(new RegExp(text2, "i"));
        } else {
            regexes.push(null);
        }
    }
    var highlightMatcher = hasHighlights ? function(evt) {
        var text = evt.getText();
        var description = evt.getDescription();
        for (var x = 0; x < regexes.length; x++) {
            var regex = regexes[x];
            //if (regex != null && (regex.test(text) || regex.test (description))) {
            if (regex != null && regex.test(text)) {
                return x;
            }
        }
        return -1;
    } : null;
   
    // Set the matchers and repaint the timeline
    filterMatcherGlobal = filterMatcher;
    highlightMatcherGlobal = highlightMatcher;   
    for (var i = 0; i < bandIndices.length; i++) {
        var bandIndex = bandIndices[i];
        timeline.getBand(bandIndex).getEventPainter().setFilterMatcher(filterMatcher);
        timeline.getBand(bandIndex).getEventPainter ().setHighlightMatcher(highlightMatcher);
    }
    timeline.paint();
}



function clearAll(timeline, bandIndices, table) {
   
    // First clear the filters
    var tr = table.rows[1];
    for (var x = 0; x < tr.cells.length; x++) {
        tr.cells[x].firstChild.value = "";
    }
   
    // Then clear the highlights
    var tr = table.rows[3];
    for (var x = 0; x < tr.cells.length; x++) {
        tr.cells[x].firstChild.value = "";
    }
   
    // Then re-init the filters and repaint the timeline
    for (var i = 0; i < bandIndices.length; i++) {
        var bandIndex = bandIndices[i];
        timeline.getBand(bandIndex).getEventPainter().setFilterMatcher(null);
        timeline.getBand(bandIndex).getEventPainter().setHighlightMatcher(null);
    }
    timeline.paint();
}

// copypaste from somewhere
function timeConvertMsToHuman(millisec) {
        var seconds = (millisec / 1000).toFixed(1);
        var minutes = (millisec / (1000 * 60)).toFixed(1);
        var hours = (millisec / (1000 * 60 * 60)).toFixed(1);
        var days = (millisec / (1000 * 60 * 60 * 24)).toFixed(1);
        if (seconds < 60) {
            return seconds + " Sec";
        } else if (minutes < 60) {
            return minutes + " Min";
        } else if (hours < 24) {
            return hours + " Hrs";
        } else {
            return days + " Days"
        }
    }

