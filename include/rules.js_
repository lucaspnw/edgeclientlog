function navBarColor(tagname) {
  // this function doesn't work at all
  var shdata = {
    "tunSvrSetupCon":"hide",
    "tunnelServerRunning":"hide",
    "connectSSL":"hide",
    "RASConnecting":"hide",
    "parseWebtop":"hide",
    "startTunServer":"hide",
    "getPreConfig":"hide",
    "policyChecks":"orange",
    "startWebLogonSession":"hide",
    "reconnecting":"red",
    "clientConnected":"green",
    "connectionDesired":"brown",
    "EdgeClientRunning":"hide",



  };

   if(typeof shdata[tagname] === "string") {
    return shdata[tagname];
  } else {
    return "NOTFOUND";
  }

};

function friendlyNamesOfTags(tagname) {
  var data = {
    "connectionDesired":"User activated connected mode",
    "policyChecks":"Client Endpoint Inspectors are executing",
    "parseWebtop":"Fetching parameters of VPN Connection",
    "startWebLogonSession":"Executing Access Policy",
    "tunSvrSetupCon":"Client SSL connecting to VPN server",
    "EdgeClientRunning":"Edge Client has been started",
    "connectSSL":"Client is creating an SSL connection to the server",
    "clientConnected":"VPN client has entered the connected phase",
    "getPreConfig":"VPN client is fetching the pre-configuration from the APM server",
    "RASConnecting":"Windows RAS subsystem is creating a connection via tunnelserver to APM",
    "startTunServer":"VPN client is starting up tunnelserver to handle TCP+SSL from client PC to APM",
    "tunnelServerRunning":"Tunnelserver is running to handle connections from client to APM",
    "reconnecting":"VPN client is attempt to re-start the connection",
    


  };

  if(typeof data[tagname] === "string") {
    return data[tagname];
  } else {
    return tagname;
  }


  

}

function friendlyNamesOfErrors(tagname) {
  var data = {
    "tunsvrFallbackNoProxy":"Computer is configured with Proxy Server, but it isn't responding. This will usually delay the connection process by 100-5000 milliseconds.",
    "alreadyRunning":"Someone tried to startup the Edge Client, but it was already running.",

  };

  if(typeof data[tagname] === "string") {
    return data[tagname];
  } else {
    return tagname;
  }
}
function heuristics(f5report_text) { 
  // heuristics, basically
  // 
  // takes as input f5report_text
  // outputs an array of potential problems like incompatible VPN clients
  // or other problems noticed in previous support cases
  // The input for this must be f5report, it can't be just a logterminal
  //

  var logOutput = new array;

    
  // first lets do some simple string matches for stuff that can be detected that way
  //

  // These two are potentially incompatible VPN clients (these will appear verbatim in the report output:
  //  Dell SonicWALL\Global VPN Client\SWGVCSvc.exe
  //  netSWVNIC.inf
  //  Cisco Systems\VPN Client\VAInst64.exe
  //  CVirtA64.sys
  // 
  // potentially incompatible services (these will be in the services list):
  //  Dell SonicWALL Global VPN Client Service
  //  Cisco Systems, Inc. VPN Service



}


function logrules() { 


// rules for the rules
// 1- these are regexes, escaping is necessary.
// 2- tags
//   a- #begin #<whatever> defines a BEGIN area for a length of time.
//   b- #end #<whatever> defines an END area for a length of time. Repeated ENDs will be ignored if there is no matching BEGIN.
//   c- #showOnTimeline means put it on the chart
//   d- #capture #<whatever> means capture the data and show it in a timeline event if #showOnTimeline is defined
//      to use capture, use a () capture group in the regex. multiple captures are OK, they'll be processed in order. 
//   e- #colorXXXX will use the hex color you say, it has to be like RRGGBB (white is FFFFFF red is FF0000, etc )
//   f- #error colors red text
//  3- the begin/end events will be collected together and shown separately in a little box. you'll be able to skip to the begin
//     or end event of these, and the errors during a duration event will be shown.


var rules = {
  "================ Starting BIG-IP Edge Client .TM. ================":"#begin #EdgeClientRunning",
  "CStandaloneApp::ExitInstance:Bye.":"#end #EdgeClientRunning",

  "MSI Profile Path: .+config.f5c":"#staticconfigfile #good",
  "Windows logoff detected":"#end #clientConnected #error #windowsShutdown",

  "createSubFolder.+ . CreateDirectory.C:.Users.+.AppData.Roaming.F5 Networks.":"#CheckDirectoryAccess #good",
  "createSubFolder.+ . CreateDirectory.C:.Users.+.AppData.Roaming.F5 Networks.VPN.":"#CheckDirectoryAccess #good",
  "createSubFolder.+ . CreateDirectory.C:.Users.+.AppData.Roaming.F5 Networks. already exists":"#CheckDirectoryAccess #good",
  "createSubFolder.+ . CreateDirectory.C:.Users.+.AppData.Roaming.F5 Networks.VPN. already exists":"#CheckDirectoryAccess #good",
  "CProfile::ResetClientProfile: Setup profile timestamp:[\\d:]+. Client profile: [\\d:]+":"#resetClientProfile #good",
  "CClientCustomization::CClientCustomization, User default UI Language and Locale, [\\d]+, ([^\\s]+)":"#getLanguage #capture #good",
  "uGetProcessIntegrityLevel.+, Running on medium integrity level":"#getIntegrityLevel #good",
  "::GetThreadDesktopName, Exit .desktop name: Default.":"#useless",
  "::GetThreadDesktopName, Enter .threadID: \\d+.":"#useless",
  "Connection mode changed to ALWAYS_CONNECTED":"#begin #connectionDesired",
  "Connection mode changed to ALWAYS_DISCONNECTED":"#end #connectionDesired",

  'CCertInfo::IsSignatureValid.+, filename, res, C:.Program Files .x86.+F5 VPN.':"#localFileCertCheck #good",
  "CCertInfo::IsOurSerialNumberAndPubKey.+, package is signed by the trusted certificate, C:.Program File. .x86.":"#localFileCertCheck #good",
  'CCertInfo::IsSignerTrusted.+, the file is signed by F5 Networks certificate':'#integritycheck #good',
  "CAppTunnelEx::put_ClientSubtype, edge":"#good #clientRunTimeInformation",
  "CStandaloneProfile::LoadSettings, Last connection mode loaded: ([A-Z_]+)":"#capture #loadedFromConfig #connectionMode",
  "CSimpleModeDlg::InitSysTray, SysTray Icon Initialized":"#good #mostlyUseless",
  "Server is: ([^\\s]+) .+User status is: Retrieving information...":"#begin #parseWebtop #capture #currentServerHostname #capture #currentUserStatus",
  'CAppTunnelEx::OnRetrievingFavoriteComplete, Favorite parameters retrieved':'#end #parseWebtop',
  "Server is: ([^\\s]+) .+User status is: Connected":"#begin #clientConnected ",
  "Server is: ([^\\s]+) .+User status is: Reconnecting":"#end #clientConnected ",
  "Server is: ([^\\s]+) .+User status is: Disconnected":"#end #clientConnected ",
  "Server is: ([^\\s]+) .+User status is: Downloading server settings":"#begin #getPreConfig",
  "CAppTunnelEx::InternalLoadConfiguration, Failed to load configuration.":"#end #getPreConfig",
  "Server is: ([^\\s]+) .+User status is: Connecting to server...":"#begin #connectSSL",
  'CAppTunnelEx::OnOpeningSessionComplete':'#end #connectSSL',
  'CAppTunnelEx::InternalOpenSessionEx, Open session':'#begin #connectSSL',
  'CStandaloneApp::FinishConnectServer':'#end #getPreConfig',
  'SESSION RECONNECT .+ . ENDS .Network Access Restored.':'#end #reconnecting #begin #clientConnected',
  "Session (.+) closed. Status 0x[0-9a-fA-F]+":"#sessionClosed #capture #sessionID",
  "System is resuming from standby/hibernation":"#clientWakeup #showOnTimeline",
  ".NLA. System is going into standby/hibernation":"#clientSleep #showOnTimeline #end #clientConnected",
  "RAS Connection Dropped - VPN IP: ([^\\s]+), Tunnel IP: ([^\\s]+)":"#capture #remoteHostIp #capture #remoteHostname #end #RASConnected #showOnTimeline",
  "SESSION RECONNECT .Server: .+ Re-established":"#end #reconnecting #reconnect #showOnTimeline",
  'Tunnel Channel Disconnected':'#end #tunSvrConnected',
  'Tunnel CONNECT .+ ENDS .SUCCESS.':'#begin #tunSvrConnected',
  'USocketBlocking::send.., EXCEPTION . Failed to send data':'#error',
  "Tunnel broken for Resource":"#showOnTimeline #bad #badConnectivity #error",
  "Reconnecting Resource: ([^\\s]+)":"#begin #reconnecting",
  "Successfully Reconnected Resource":"#end #reconnecting",
  "CNetworkAvailabilityMonitor::Start, Starting network availability monitor":"#begin #monitorNetworkAvailability #good",
  "CIpInterfaceChangeMonitor::Start, Starting IP interface monitor":"#begin #monitorIpInterface",
  'CIpInterfaceChangeMonitor::Start, IP interface monitor successfully started':'#begin #monitorIpInterface',
  "CNetworkAvailabilityMonitor::Run, Running network availability monitor":"#monitorNetworkAvailability #good",
  "CNLAController::TestNetworkLocation, .NLA.  Location test started":"#NLA",
  "CNLAController::TestNetworkLocation, .NLA.  Automatic connection mode disabled - no need to test location":"#NLA #disabled",
  "CNLAController::FireNetworkEvent, .NLA. Fire network event. Location: ([A-Z_]+)":"#capture #NLA",
  "CConnectionMgr::OnNetworkLocationEvent, .ConnMgr. Network Location Changed to ([A-Z_]+)":"#capture #nlaLocation",
  "CConnectionMgr::RefreshConnections, .ConnMgr. Connection Mode: ([A-Z_]+). Network Location: ([A-Z_]+). Session State: 0":"#capture #currentConnectionMode #capture #nlaLocation",
  "CStandaloneDoc::StopReconnect, Stopping reconnect":"#end #reconnecting",
  "CNetworkAvailabilityMonitor::Run, Network event occured":"#networkEvent #mostlyUseless",
  "WaitForConnectionToSettle::WaitForConnectionToSettle, Network event occured while waiting for connection to settle":"#mostlyUseless",
  "CConnectionMgr::OnConnectionModeChanged, .ConnMgr. Connection Mode Changed to ([A-Z_]+)":"#capture #newConnectionMode #warning #connectionModeChanged",
  
  "CConnectionMgr::EstablishSession, [ConnMgr] Number Of Active Network Interfaces: 1":"",
  "Number Of Active Network Interfaces: (\\d+)":"#capture #numberOfNetworkInterfaces #critical",
  "starting local TunnelServer":"#begin #startTunServer",
  "TunnelServer is ready":"#end #startTunServer",
  'Routing table changed':"#routeTableChanged",
  'Conflicting route':'#routeTableConflict #error',
  'APM IP address has changed, full reconnection is required':'#redirectToAnotherAPM #showOnTimeline',
  'Starting pending session ID':'#begin #startWebLogonSession',
  'Session [^\\s]+ established':'#end #startWebLogonSession',
  'Failed to resolve .+ (GetAddrInfo returned 11001)':'#reconnectDNSLookup #nxdomain #error',
  "CStandaloneDoc::SetState, Session State changed to (\\d+)":"#capture #sessionStateId #sessionStateChanged #critical",
  "CStandaloneDoc::GoOnline, Internet connection state: (\\d+)":"#capture #internetConnectionStateId #warning #internetConnectionStateChanged",
  'CAppTunnelEx::InternalLoadConfiguration, Loading configuration. URL: "https://vpn.f5.com/pre/config.php.version=2.0"':"#capture #retrievePreConfigUrl #required #io",
  'CAppTunnelEx::OnLoadConfigStatus, INTERNET_STATUS_DETECTING_PROXY - WinInet notifies the client application that a proxy has been detected.':'#huh #loadConfigStatus',
  'CAppTunnelEx::OnLoadConfigStatus, INTERNET_STATUS_RESOLVING_NAME - Looking up the IP address of the name: "([^"]+)':'#capture #dnsResolveServerName #good #io #loadConfigStatus',
  'CAppTunnelEx::OnLoadConfigStatus, INTERNET_STATUS_NAME_RESOLVED - Successfully found the IP address of the name: "([0-9\.]+)"':'#capture #remoteHostIp #good #io #loadConfigStatus',
  'AppTunnelEx::OnLoadConfigStatus, INTERNET_STATUS_CONNECTING_TO_SERVER - Connecting to the socket address .[0-9\.]+..':'#io #tcpConnection #loadConfigStatus',
  'CAppTunnelEx::OnLoadConfigStatus, INTERNET_STATUS_CONNECTED_TO_SERVER - Successfully connected to the socket address \([0-9\.]+\).':'#io #tcpConnection #good #loadConfigStatus',
  'CAppTunnelEx::OnLoadConfigStatus, INTERNET_STATUS_SENDING_REQUEST - Sending the information request to the server.':'#httpConnection #io #loadConfigStatus',
  'CAppTunnelEx::OnLoadConfigStatus, INTERNET_STATUS_REQUEST_SENT - Successfully sent the information request to the server. \\d+ byte(s) sent.':'#io #httpConnection #good #loadConfigStatus',
  'CAppTunnelEx::OnLoadConfigStatus, INTERNET_STATUS_RECEIVING_RESPONSE - Waiting for the server to respond to a request.':'#httpConnection #io #loadConfigStatus',
  'CAppTunnelEx::OnLoadConfigStatus, INTERNET_STATUS_RESPONSE_RECEIVED - Successfully received a response from the server. \\d+ byte(s) received.':'#io #loadConfigStatus',
  'CAppTunnelEx::OnLoadConfigStatus, INTERNET_STATUS_CLOSING_CONNECTION - Closing the connection to the server.':'#io #loadConfigStatus',
  'CAppTunnelEx::OnLoadConfigStatus, INTERNET_STATUS_CONNECTION_CLOSED - Successfully closed the connection to the server.':'#io #loadConfigstatus #good',
  'Primary host: \"([^\"]+)\", Primary IP address: \"([^\"]+)\" \(returned by WinInet\)':'#capture #serverHostname #capture #serverIpFromDns #dns #dnsPhaseTwo',
  'CStandaloneApp::FinishConnectServer, Dynamic file= (.+)':'#localRuntimeFile',
  'USmartUpdateEx::needUpdate(), current version ([^\.]+\..{3}) \d+ \d+ \(([\d\.]+)\) reqested 0x[a-f0-9]+ 0x[a-f0-9]+ (7120.2015.1230.1)':'#capture #imageName #capture #newVersionString #capture #oldVersionString',
  'Another instance of the application is already running':"#error #alreadyRunning",
  'New update.s. are found':"#upgrade #showOnTimeline",
  'Request to install/update SSL Tunnel':'#begin #swUpdate',
  'USmartUpdateEx::RunClassProcEx(), Thread finished':'#end #swUpdate',
  'CStandaloneApp::RunApplicationUpdate, CreateProcess Failed':"#upgrade #error #bad #showOnTimeline",
  'Starting policy checks .session ID:"([0-9a-fA-F]+)".':'#capture #sessionIDLong #begin #policyChecks',
  'Stop policy checks .session ID:"([0-9a-fA-F]+)".':'#capture #sessionIDLong #end #policyChecks',
  'URLConnect::BeginConnection, HttpSendRequest failed with HTTP ([0-9]+)':"#capture #httpResponseCode #error #httpRequestFailed",
  'URLConnect::BeginConnection, HttpSendRequest failed .error: ([0-9]+).':"#capture #microsoftHttpErrorCode #error #showOnTimeline",
  'The proxy server isn.t responding. Please check your proxy settings':"#error #badConnectivity #proxy",
  'Open Session Failed - Original Server: ([^,]+), Current Server: ([^,]+), Reason: (.+)':'#capture #originalserver #capture #currentserver #capture #reasoncode #error #openSessionFailed',
  'Failed to get IHTMLDocument2 pointer':'#cantOpenBrowserControl #error #IEProblemCantOpenControl',
  'WinInet error - ([0-9xa-fA-F]+)':'#capture #microsoftHttpErrorCode #error #showOnTimeline',
  'Failed to get IP interface entry for Interface Index':'#error #routing',
  'Running on high integrity level':'#update #winHighIntegrityLevel #showOnTimeline',
  'UWebBrowserParser::DocumentComplete, URL: (http.+)':"#capture #browserControlLoadedPageURL #webLogonMode",
  'CStandaloneDoc::OpenFavorite, Opening: ([^\s]+)':'#capture #favoriteFromFullWebtop',
  'WritePACFileFromURL2, try loading remote PAC file':'#proxyPAC',
  'Failed to download configuration':'#error #failedToGetConfigFromAPM #showOnTimeline',
  'Heartbeat from server was not received.':'#error #end #clientConnected',
  'CHostCtrl::ExecuteApplication:launch (.+)':'#capture #launchApp #warning #appLaunchPostConnected',
  'Starting pending session ID:\s+(.+)':'#capture #startPendingSessionID #showOnTimeline',
  'UWebBrowserParser::Invoke, Get WebLogonSoftTokenPasscode':'#softToken #showOnTimeline',
  'stopServer.. COM call failed':'#error #dontKnowWhatThisMeans',
  'CURDialer::RestoreValue, Cannot set internet options':'#error #dontKnowWhatThisMeans',
  'CHostCtrl::ProxyClose.., Close.. failed':'#error #dontKnowWhatThisMeans',
  'CHostCtrl::ProxyIsUI(), IsWaitUI failed':'#error #dontKnowWhatThisMeans',
  'UFilterService::DisableDynamicMapping.., Failure disabling dynamic mapping. Status=0x6ef':'#error #dnsRelayProxyNotRunning',
  'UFilterService::DisableDynamicMapping.., Run-time exception.Exception code=0x6ef':'#error #dnsRelayProxyNotRunning',
  'Failed to open DNScache service':'#error #noDNSCacheSvc',
  'WritePACFileFromURL, Failed to connect for downloading a PAC file':'#error #proxyPAC #showOnTimeline',
  'CDialer::OnRasCallback.., .RASCONNSTATE., (.+)':'#capture #RASState',
  'CDialer::OnRasCallback.., .RASCONNSTATE., .+ Opening':'#begin #RASConnecting',
  'CDialer::OnRasCallback.., .RASCONNSTATE., .+ Connected':'#end #RASConnecting',
  'CLEANER.+Run, Session start time, (.+)':'#capture #cacheCleanerStartup #showOnTimeline',
  'CHostCtrl::ProxyIsUI.., IsWaitUI failed, ([\d\-]+)':'#capture #isWaitUIFailedErrorCode',
  'CHostCtrl::RestoreConnection2Domain.+EXCEPTION - (.+)':'#capture #logonScriptError #error #showOnTimeline',


  



  // start the tunnelserver logs here
  'tunnel was not writeable several times in a row':'#error #badConnectivity',
  'USocketChannel::Read.., connection shut down':'#error #tunnelserver #apmIsBroken #showOnTimeline',
  '<< Remote peer shutdown':'#error #tunnelserver #apmIsBroken #showOnTimeline',
  'Tunnel Channel Disconnected':'#error #tunnelserver #showOnTimeline',
  'UEventHandlerImpl::DownloadAutoconfigScript: download failure':'#tunsvrCantGetPAC #showOnTimeline #error',
  'Tunnel CONNECT .Server: ([^,]+).+ BEGINS':'#begin #tunSvrSetupCon',
  'UEventHandlerImpl::MigrateProxySettings: Autoconfig URL ([^\s]+)':'#capture #proxyPACURLFromLAN #useProxySettingsFromLAN',
  'UDNSCacheEx::ResolveHostName.., Unable to resolve, ([^\s]+), No such host is known.':'#capture #targetHost #error #tunsvrCantResolveHost',
  'UChannelChain::BuildChannels.., dont use proxy':'#error #tunsvrFallbackNoProxy',
  'Tunnel CONNECT .Server: ([^,]+).+ ENDS':'#end #tunSvrSetupCon #begin #tunSvrConnected',
  'USocketChannel::Open... EXCEPTION . name resolution failed':'#error #tunsvrCantResolveHost',
  'USocketChannel::Open. Failed to open socket channel to':'#error #tunsvrCantOpenProxy',
  'UOverlappedIOSocket::collectBuffersToBeReleased.., WSAGetOverlappedResult.. error':'#error #dontKnowWhatThisMeans',
  'USoftWOCClient::processIncomingMessages.., EXCEPTION - (.+)':'#error #iSessionError #capture #iSessionError',
  'shutting down TunnelServer':'#end #tunnelServerRunning',
  'module.+TunnelServer.exe':'#begin #tunnelServerRunning',
  'UTunnelManager::closeTunnels.., exit, (\d+)':'#tunnelServerExitingForReals #showOnTimeline',
  'UWebBrowserParser::DocumentComplete, URL:':'#end #connectSSL',
  'configuration received':'#end #tunSvrGetConfig',
  // inspector
  'UXMLAgentParser::OnData.+we received the document completely':'#inspectorComms',
  'CUAgentHost::downloadNextAgent.+sending request to server':'#inspectorComms',

  

  

  
};
return rules;
}
