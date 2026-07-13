function onOpen(e) {
  rebuildMenu();
}

function rebuildMenu() {
  const userProperties = PropertiesService.getUserProperties();
  let menuMode = 'full'; // Default to full
  try {
    menuMode = userProperties.getProperty('MENU_MODE') || 'full';
  } catch (err) {
    Logger.log('Error reading properties: ' + err.message);
  }
  
  createAnalyticsMenu(menuMode);
}

function createAnalyticsMenu(mode) {
  const ui = SpreadsheetApp.getUi();
  const menu = ui.createMenu('Google Analytics Utilities');
  
  if (mode === 'full') {
    menu.addItem('Show Sidebar', 'showSidebar')
        .addSeparator();
        
    menu
      // Selectors
      .addItem('List Account Summaries', 'writeGA4AccountSummariesToSheet')
      .addItem('List Data Stream Selection', 'writeDataStreamSelectionToSheet')
      .addSubMenu(
        ui.createMenu('Properties')
        .addItem('List', 'writeGA4PropertyDetailsToSheet')
        .addItem('Modify', 'modifyGA4Properties'))
      .addSubMenu(
        ui.createMenu('Users')
        .addItem('List', 'writeGA4AccessBindingsToSheet')
        .addItem('Modify', 'modifyGA4AccessBindings'))
      .addSubMenu(
        ui.createMenu('Audiences')
        .addItem('List', 'writeGA4AudiencesToSheet')
        .addItem('Modify', 'modifyGA4Audiences'))
      .addSubMenu(
        ui.createMenu('Channel Groups')
        .addItem('List', 'writeGA4ChannelGroupsToSheet')
        .addItem('Modify', 'modifyChannelGroups'))
      .addSubMenu(
        ui.createMenu('Custom Dimensions')
        .addItem('List', 'writeGA4CustomDimensionsToSheet')
        .addItem('Modify', 'modifyGA4CustomDimensions'))
      .addSubMenu(
        ui.createMenu('Custom Metrics')
        .addItem('List', 'writeGA4CustomMetricsToSheet')
        .addItem('Modify', 'modifyGA4CustomMetrics'))
      .addSubMenu(
        ui.createMenu('Calculated Metrics')
        .addItem('List', 'writeGA4CalculatedMetricsToSheet')
        .addItem('Modify', 'modifyCalculatedMetrics'))
      .addSubMenu(
        ui.createMenu('Key Events')
        .addItem('List', 'writeGA4KeyEventsToSheet')
        .addItem('Modify', 'modifyGA4KeyEvents'))
      .addSubMenu(
        ui.createMenu('Expanded Data Sets')
        .addItem('List', 'writeGA4ExpandedDataSetsToSheet')
        .addItem('Modify', 'modifyGA4ExpandedDataSets'))
      // Submenu for GA4 property link integrations
      .addSubMenu(
        ui.createMenu('Links')
        .addSubMenu(
          ui.createMenu('Google Ads')
          .addItem('List', 'writeGA4AdsLinksToSheet')
          .addItem('Modify', 'modifyGA4AdsLinks'))
        .addSubMenu(
          ui.createMenu('Firebase')
          .addItem('List', 'writeGA4FirebaseLinksToSheet')
          .addItem('Modify', 'modifyGA4FirebaseLinks'))
        .addSubMenu(
          ui.createMenu('DV360')
          .addItem('List', 'writeGA4DV360LinksToSheet')
          .addItem('Modify', 'modifyGA4DV360Links'))
        .addSubMenu(
          ui.createMenu('SA360')
          .addItem('List', 'writeGA4SA360LinksToSheet')
          .addItem('Modify', 'modifyGA4SA360Links'))
        .addSubMenu(
          ui.createMenu('BigQuery')
          .addItem('List', 'writeGA4BigQueryLinksToSheet')
          .addItem('Modify', 'modifyBigQueryLinks'))
        .addSubMenu(
          ui.createMenu('AdSense')
          .addItem('List', 'writeGA4AdSenseLinksToSheet')
          .addItem('Modify', 'modifyAdSenseLinks'))
        )
        .addSubMenu(
          ui.createMenu('Data Streams')
          .addItem('List', 'writeGA4StreamsToSheet')
          .addItem('Modify', 'modifyGA4Streams'))
        .addSubMenu(
          ui.createMenu('Measurement Protocol Secrets')
          .addItem('List', 'writeGA4MeasurementProtocolSecretsToSheet')
          .addItem('Modify', 'modifyMeasurementProtocolSecrets'))
        .addSubMenu(
          ui.createMenu('Event Create Rules')
          .addItem('List', 'writeGA4EventCreateRulesToSheet')
          .addItem('Modify', 'modifyEventCreateRules'))
        .addSubMenu(
          ui.createMenu('Event Edit Rules')
          .addItem('List', 'writeEventEditRulesToSheet')
          .addItem('Modify', 'modifyEventEditRules'))
        .addSubMenu(
          ui.createMenu('Subproperty Event Filters')
          .addItem('List', 'writeGA4SubpropertyEventFiltersToSheet')
          .addItem('Modify', 'modifySubpropertyEventFilters'))
        .addSubMenu(
          ui.createMenu('sKAd Conversion Schemas')
          .addItem('List', 'writeSKAdConversionSchemasToSheet')
          .addItem('Modify', 'modifySKAdConversionSchemas'))
        .addSubMenu(
          ui.createMenu('Rollup Property Source Links')
          .addItem('List', 'writeGA4RollupPropertySourceLinksToSheet')
          .addItem('Modify', 'modifyRollupPropertySourceLinks'))
      .addSubMenu(
        ui.createMenu('Annotations')
          .addItem('List', 'writeGA4AnnotationsToSheet')
          .addItem('Modify', 'modifyGA4Annotations'))
        .addSeparator()
        .addSubMenu(
          ui.createMenu('Advanced')
          .addSubMenu(
            ui.createMenu('Easy Property Creation')
            .addItem('List Templates', 'writePropertyTemplatesToSheet')
            .addItem('Create Properties', 'createPropertiesFromTemplates')
            .addItem(
              'Resize Row Heights', 'resizeEasyPropertyCreationSheetRowHeights'))
          .addSubMenu(
            ui.createMenu('Health Report')
            .addItem('Create Report', 'createHealthReport'))
          .addSubMenu(
            ui.createMenu('Audience Lists')
            .addItem('List Existing Audiences', 'writeGA4AudiencesToAudiencesListsSheet')
            .addItem('List Audience Lists', 'writeAudienceListsToSheet')
            .addItem('Create Audience Lists', 'createAudienceLists')
            .addItem('Check Audience List States', 'checkAudienceListsState')
            .addItem('Export Audience Lists', 'exportAudienceListsData'))
          .addSubMenu(
            ui.createMenu('User Access Report')
            .addItem('Run Report', 'writeUserAccessReportDataToSheet')))
        .addItem('List All Property Settings', 'confirmAndListAllGA4PropertyResources')
      .addItem('List Account Change History', 'listAccountHistory')
    
  } else {
    menu.addItem('Show Sidebar', 'showSidebar');
  }
  
  menu.addToUi();
}

//--New update
/**
 * Opens the sidebar UI.
 */
function showSidebar() {
  try {
    const html = HtmlService.createHtmlOutputFromFile('sidebar')
        .setTitle('GA Utilities Navigation')
        .setWidth(300);
    SpreadsheetApp.getUi().showSidebar(html);
  } catch (err) {
    // If it fails, it will pop up a notification in your Google Sheet
    SpreadsheetApp.getActiveSpreadsheet().toast('Error loading sidebar: ' + err.message, 'Sidebar Error', -1);
  }
}
//--End update

function setMenuMode(mode) {
  PropertiesService.getUserProperties().setProperty('MENU_MODE', mode);
  rebuildMenu();
}

function getMenuMode() {
  try {
    return PropertiesService.getUserProperties().getProperty('MENU_MODE') || 'full';
  } catch (err) {
    return 'full';
  }
}

function setAutoJump(enabled) {
  PropertiesService.getUserProperties().setProperty('AUTO_JUMP', enabled ? 'true' : 'false');
}

function getAutoJump() {
  try {
    return PropertiesService.getUserProperties().getProperty('AUTO_JUMP') !== 'false'; // Default to true
  } catch (err) {
    return true;
  }
}

/**
 * Prompts user for confirmation before listing all GA4 resources.
 */
function confirmAndListAllGA4PropertyResources() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'List All Settings',
    'This option will populate ALL tabs. It runs through all actions for all selected properties, which can take several minutes to finish. Do you want to proceed?',
    ui.ButtonSet.YES_NO
  );
  if (response === ui.Button.YES) {
    listAllGA4PropertyResources();
  }
}
