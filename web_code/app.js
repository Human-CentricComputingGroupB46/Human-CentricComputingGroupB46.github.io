/* Thin boot file: all behavior lives in focused modules under web_code/scripts. */
if (typeof initializeCampusCompassApp === "function") {
  void initializeCampusCompassApp();
} else if (typeof startCampusCompassApp === "function") {
  startCampusCompassApp();
}/* Thin boot file: all behavior lives in focused modules under web_code/scripts. */
if (typeof initializeCampusCompassApp === "function") {
  void initializeCampusCompassApp();
} else {
  startCampusCompassApp();
}