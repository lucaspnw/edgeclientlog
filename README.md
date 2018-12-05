# edgeclientlog

This project is a rough proof of concept for a log visualizer for Windows F5 Edge Client log files. It's 100% client-side, so that the log file does not need to be uploaded to a server. This avoids concerns with data retention and security, because the sensitive data is only parsed and interpreted inside the user's browser. Uploading to a server for analysis is not required.

# approach
The parsing is done in a very simple (and expensive) way: 

* The user generates an F5 Report using the f5wininfo utility. This utility is available on any APM-provisioned BIG-IP appliance at https://<your bigip>/downloads/f5wininfo.exe. The user saves the report to a filesystem. The report contains several log files in either HTML or TXT format. Use HTML format for this purpose.
* User browses to the edgeclientlog web site (this project).
* User "uploads" using HTML5 mechanisms from the filesystem to the user's browser. The ux is the same as a file upload to a server.
* Edgeclientlog decompresses the f5report file.
* Edgeclientlog merges these files and normalizes the timestamps and places the entries in order in a big array:
  * logterminal.txt
  * f5tunnelserver.txt
  * the EPI log file
* Next, the rules.json file containing a series of regexes is run against each line of logs. This can be expensive. TODO: these are all done in a row so it may trigger "script busy" errors from the browser (we should instead be doing them in batches or some other way). The regexes take the format of: "regex, tag". If a regex matches a log line, a tag is applied to it. Tags are simple text labels that have some special meanings. See the rules.json file header for more information. 
* The tag for each log line is parsed for its type. There are two types:
  * Instantaneous events. These are errors or other things that don't have a "duration".
  * Duration events. These are events that have a "start" and "stop" event. For example, "user desires VPN" or "is currently connected".
* The events are pushed into the Simile Timeline object on the screen for visualization.
* The user can click and scroll around the screen to view parts of the logs, events, etc.
  
# TO DO
* Implement a better solution than Simile Timeline. Simile is slow and has a bunch of problems, including memory leaks.
* Run the regex rules in batches of 100 lines or something , to give time back to the browser for processing and avoid "script busy" errors.
* Refactor the whole thing. Probably twice.

# Usage
The files here
The idea is that users will generate a logging report
