/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Settings Report.
 *
 * Creates a Google Slides presentation from a template and replaces the
 * placeholders in it (for example --num_props--) with values that are
 * calculated from the GA4 settings listed in this spreadsheet and from the
 * Custom Definitions Checker. Additional placeholders, such as the company
 * name or the logos, are read from the "Report Settings" sheet. A checked row
 * in that sheet also replaces a calculated value, for example to reword a
 * highlight. The template slide with the speaker notes --snapshot_template--
 * is copied once for every property.
 */

/** The ID of the default template presentation. */
const SETTINGS_REPORT_TEMPLATE_ID =
  '1FikbCtbaU4BLqH8477wpFHCLDUMWalnnWW1VSchsR1s';

/** The name of the report if the "Report Name" setting is empty. */
const SETTINGS_REPORT_DEFAULT_NAME = 'GA4 Settings Report';

/** The sheet with the custom placeholders of the copied slides. */
const SETTINGS_REPORT_SNAPSHOT_SHEET_NAME = 'Report Settings - Snapshot';

/** The speaker notes of the template slide that is copied per property. */
const SETTINGS_REPORT_SNAPSHOT_MARKER = '--snapshot_template--';

/** The text that is shown when a value can't be calculated. */
const SETTINGS_REPORT_NOT_AVAILABLE = 'N/A';

/**
 * The milliseconds after the start of the report after which a step isn't
 * started anymore, so that the report finishes within the 6 minute Apps
 * Script limit.
 */
const SETTINGS_REPORT_TIME_LIMITS = {
  LIST_SETTINGS: 3 * 60 * 1000,
  CHECK_DEFINITIONS: 4 * 60 * 1000,
  CREATE_SLIDES: 5.5 * 60 * 1000
};

/** Limits that keep the text within the boxes of the template. */
const SETTINGS_REPORT_TEXT_LIMITS = {
  FINDINGS_PER_LIST: 3,
  FINDINGS_CHARACTERS: 300,
  NAMES_PER_FINDING: 2,
  NAME_CHARACTERS: 30,
  // The lists of unused custom definitions: the most items, the lines that
  // fit in a box and the characters that fit on a line.
  UNUSED_DEFINITIONS: 10,
  UNUSED_LINES: 14,
  UNUSED_LINE_CHARACTERS: 45,
  NEXT_STEPS: 6,
  LEFTOVERS: 10,
  // The most placeholders that are named in the warning about the values
  // from the "Report Settings" sheet.
  SHEET_VALUES: 10
};

/**
 * The labels in column A of the "Report Settings" sheet and their keys. The
 * reports that are run before the report is created are chosen when it's
 * created, so older settings such as "Request New Settings Information" are
 * ignored.
 */
const SETTINGS_REPORT_SETTING_LABELS = {
  'report name': 'reportName',
  'template presentation url': 'templateUrl',
  'template slides url': 'templateUrl',
  'who to share this report with': 'emails',
  'sharing access level': 'access',
  'percent range colors': 'percentColorRanges'
};

/**
 * The 0-based columns of the values that the report reads from the GA4
 * sheets. They must match the columns written by the list functions.
 */
const SETTINGS_REPORT_COLUMNS = {
  propertyId: 3,  // The same column in every sheet.
  properties: {
    name: 2,
    type: 4,
    serviceLevel: 14,
    eventCount: 15,
    googleSignals: 16,
    eventDataRetention: 17,
    attributionModel: 22,
    userProvidedData: 24
  },
  audiences: {name: 4},
  keyEvents: {name: 4, custom: 8, count: 9},
  streams: {type: 6, enhancedMeasurement: 14},
  customDimensions: {scope: 7},
  checkers: {displayName: 4, parameterName: 5, scope: 6},
  customDimensionsChecker: {status: 8},
  customMetricsChecker: {status: 10}
};

/** The custom definition limits of standard and 360 properties. */
const SETTINGS_REPORT_DEFINITION_LIMITS = {
  customDimensions: {
    EVENT: {standard: 50, ga360: 125},
    USER: {standard: 25, ga360: 100},
    ITEM: {standard: 10, ga360: 25}
  },
  customMetrics: {standard: 50, ga360: 125}
};

/** The share of a custom definition limit that counts as nearly full. */
const SETTINGS_REPORT_NEARLY_FULL = 0.9;

/** The event data retention settings in months. */
const SETTINGS_REPORT_RETENTION_MONTHS = {
  TWO_MONTHS: 2,
  FOURTEEN_MONTHS: 14,
  TWENTY_SIX_MONTHS: 26,
  THIRTY_EIGHT_MONTHS: 38,
  FIFTY_MONTHS: 50
};

/** The data-driven reporting attribution model. */
const SETTINGS_REPORT_DATA_DRIVEN_MODEL = 'PAID_AND_ORGANIC_CHANNELS_DATA_DRIVEN';

/** The names of the property types on the slides. */
const SETTINGS_REPORT_PROPERTY_TYPES = {
  PROPERTY_TYPE_ORDINARY: 'Ordinary',
  PROPERTY_TYPE_SUBPROPERTY: 'Subproperty',
  PROPERTY_TYPE_ROLLUP: 'Roll-up'
};

/** The audiences that GA4 creates in every property, in lowercase. */
const SETTINGS_REPORT_DEFAULT_AUDIENCES = ['all users', 'purchasers'];

/**
 * Percentages that describe the setup rather than its quality, so they
 * aren't colored with the percent range colors.
 */
const SETTINGS_REPORT_NEUTRAL_PERCENTS = [
  '--360_props_percent--',
  '--props_ios_data_streams_percent--',
  '--props_android_streams_percent--',
  '--props_dv360_percent--',
  '--props_firebase_percent--',
  '--user_data_percent--'
];

/** The text of highlight and lowlight lists without findings. */
const SETTINGS_REPORT_EMPTY_LISTS = {
  highlights: 'No highlights in this section yet.',
  lowlights: 'No issues found in this section.',
  nextSteps: 'No changes are needed right now. Create this report again ' +
    'after you change your GA4 setup.'
};

/**
 * Creates the settings report from the menu. It first asks for confirmation
 * and lists the reports that are run before the report is created. Like
 * other menu items, it shows nothing when it succeeds: the link to the report
 * is added to the "Report Settings" sheet. Anything to review is shown in an
 * alert, and errors are shown by Apps Script.
 */
function createHealthReport() {
  let ui = null;
  try {
    ui = SpreadsheetApp.getUi();
  } catch (e) {
    // There is no UI when the function runs from the script editor.
  }
  if (ui) {
    const steps = getSettingsReportSteps_()
      .map(step => `• ${step.sheet}: ${step.provides}`).join('\n');
    const response = ui.alert('Create Settings Report',
      'The report uses the information in these sheets. They are updated ' +
      'first for the properties that are selected in the "Account ' +
      `Summaries" sheet:\n\n${steps}\n\nThis can take several minutes. For ` +
      'many properties, use Create Report in the sidebar, which updates ' +
      'each sheet separately. Do you want to proceed?', ui.ButtonSet.YES_NO);
    if (response !== ui.Button.YES) {
      return;
    }
  }
  const result = createSettingsReport_({refresh: true});
  if (ui && result.warnings.length > 0) {
    ui.alert('Settings Report', 'The report was created, and its link was ' +
      'added to the "Report Settings" sheet. Please review the following:' +
      `\n\n${result.warnings.map(warning => `• ${warning}`).join('\n\n')}`,
      ui.ButtonSet.OK);
  }
}

/**
 * Creates the settings report from the sidebar with the information that is
 * already in the sheets. Before it calls this function, the sidebar asks for
 * confirmation and updates the sheets with runSettingsReportStep. It shows
 * the progress, the link to the report, anything to review and errors in its
 * status bar, like for every other task.
 * @return {{url: string, linkText: string, warnings: !Array<string>}}
 */
function createHealthReportFromSidebar() {
  return createSettingsReport_({refresh: false});
}

/**
 * Returns what the sidebar shows before it creates the report: the sheets
 * that the report uses and the number of selected properties.
 * @return {{selectedProperties: number,
 *     steps: !Array<{id: string, sheet: string, provides: string}>}}
 */
function getSettingsReportPlan() {
  return {
    selectedProperties: getSelectedGa4Properties().filter(row => row[3]).length,
    steps: getSettingsReportSteps_().map(step => ({
      id: step.id,
      sheet: step.sheet,
      provides: step.provides
    }))
  };
}

/**
 * Updates one of the sheets that the report uses. The sidebar calls this
 * function once for each sheet, so that each update has its own Apps Script
 * time limit.
 * @param {string} id The ID of the step, as returned by getSettingsReportPlan.
 */
function runSettingsReportStep(id) {
  const step = getSettingsReportSteps_().find(step => step.id === id);
  if (!step) {
    throw new Error(`The Settings Report has no step "${id}".`);
  }
  if (getSelectedGa4Properties().filter(row => row[3]).length === 0) {
    throw new Error('Select at least one property in the "Account ' +
      'Summaries" sheet.');
  }
  step.run({});
}

/**
 * Returns the reports that update the sheets the report uses, in the order in
 * which they are run. Property Details is first, because it defines the
 * properties of the report.
 * @return {!Array<{id: string, sheet: string, provides: string,
 *     isChecker: boolean, run: function(!Object)}>} The steps. The options of
 *     run are passed to the Custom Definitions Checker.
 */
function getSettingsReportSteps_() {
  const ga4 = sheetsMeta.ga4;
  const list = (id, sheetMeta, provides, run) => ({
    id: id,
    sheet: sheetMeta.sheetName,
    provides: provides,
    isChecker: false,
    run: () => run()
  });
  const check = (id, checker, provides) => ({
    id: id,
    sheet: checker.sheetMeta.sheetName,
    provides: provides,
    isChecker: true,
    run: options => runCustomDefinitionsChecker_(
      checker, Object.assign({}, options, {silent: true}))
  });
  return [
    list('propertyDetails', ga4.properties,
      'properties, Google Signals, data retention and attribution',
      () => writeGA4PropertyDetailsToSheet()),
    list('audiences', ga4.audiences, 'audiences',
      () => writeGA4AudiencesToSheet()),
    list('keyEvents', ga4.keyEvents, 'key events',
      () => writeGA4KeyEventsToSheet()),
    list('streams', ga4.streams, 'data streams and enhanced measurement',
      () => writeGA4StreamsToSheet()),
    list('customDimensions', ga4.customDimensions, 'custom dimensions',
      () => writeGA4CustomDimensionsToSheet()),
    list('customMetrics', ga4.customMetrics, 'custom metrics',
      () => writeGA4CustomMetricsToSheet()),
    list('googleAdsLinks', ga4.googleAdsLinks, 'Google Ads links',
      () => writeGA4AdsLinksToSheet()),
    list('dv360Links', ga4.displayVideo360AdvertiserLinks, 'DV360 links',
      () => writeGA4DV360LinksToSheet()),
    list('firebaseLinks', ga4.firebaseLinks, 'Firebase links',
      () => writeGA4FirebaseLinksToSheet()),
    list('bigQueryLinks', ga4.bigqueryLinks, 'BigQuery links',
      () => writeGA4BigQueryLinksToSheet()),
    check('customDimensionsChecker', getCustomDimensionsChecker_(),
      'custom dimensions without data in the last 30 days'),
    check('customMetricsChecker', getCustomMetricsChecker_(),
      'custom metrics without data in the last 30 days')
  ];
}

/**
 * Creates the settings report.
 * @param {{refresh: boolean}} options Whether to update the sheets that the
 *     report uses first, all within the same Apps Script time limit.
 * @return {{url: string, linkText: string, warnings: !Array<string>}} The
 *     report URL, the text of the link to it, and anything to review.
 */
function createSettingsReport_(options) {
  const startTime = Date.now();
  const warnings = [];
  const settings = readSettingsReportSettings_(warnings);
  if (options.refresh) {
    refreshSettingsReportData_(startTime, warnings);
  }
  const data = loadSettingsReportData_();
  if (data.properties.length === 0) {
    throw new Error('There are no properties in the "Property Details" ' +
      'sheet. Select properties in the "Account Summaries" sheet, and then ' +
      'create the report again so that the Property Details sheet is ' +
      'updated first.');
  }
  const timeZone = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
  const report = buildSettingsReportValues_(data, timeZone);
  if (report.incompleteChecks) {
    warnings.push('Some custom definitions couldn\'t be checked. See the ' +
      '"Status" and "Notes" columns of the checker sheets.');
  }

  console.log('Creating the presentation...');
  const file = copySettingsReportTemplate_(settings);
  shareSettingsReport_(file, settings, warnings);
  const presentation = SlidesApp.openById(file.getId());
  fillSettingsReport_(presentation, report, settings, {
    timeZone: timeZone,
    colorRanges: settings.percentColorRanges,
    startTime: startTime,
    warnings: warnings
  });
  presentation.saveAndClose();

  addSettingsReportToList_(settings.reportName, file.getUrl());
  console.log(`Settings report created: ${file.getUrl()}`);
  warnings.forEach(warning => console.log(warning));
  return {
    url: file.getUrl(),
    linkText: `Open ${settings.reportName}`,
    warnings: warnings
  };
}

/**
 * Reads the settings and the placeholder rows from the "Report Settings"
 * sheet. The settings are found by their label in column A, so rows can be
 * added or moved. The placeholders are listed below the "Placeholder Text"
 * header row, and only the rows whose "Include" box is checked are read.
 * @param {!Array<string>} warnings Messages for the user.
 * @return {!Object} The settings.
 */
function readSettingsReportSettings_(warnings) {
  const sheetName = sheetsMeta.ga4.healthReport.sheetName;
  const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`The "${sheetName}" sheet doesn't exist. Copy it from ` +
      'the template spreadsheet.');
  }
  const lastRow = sheet.getLastRow();
  const rows = lastRow > 0 ? sheet.getRange(1, 1, lastRow, 4).getValues() : [];
  const headerIndex = rows.findIndex(
    row => normalizeSettingsReportLabel_(row[0]) === 'placeholder text');
  const settings = {
    reportName: SETTINGS_REPORT_DEFAULT_NAME,
    templateUrl: '',
    emails: '',
    access: '',
    percentColorRanges: [],
    placeholders: []
  };

  const settingRows = headerIndex === -1 ? rows : rows.slice(0, headerIndex);
  settingRows.forEach(row => {
    const key = SETTINGS_REPORT_SETTING_LABELS[
      normalizeSettingsReportLabel_(row[0])];
    const value = row[2];
    if (key === 'percentColorRanges') {
      settings[key] = parseSettingsReportColorRanges_(value, warnings);
    } else if (key === 'reportName') {
      settings[key] = String(value).trim() || SETTINGS_REPORT_DEFAULT_NAME;
    } else if (key) {
      settings[key] = String(value).trim();
    }
  });

  if (headerIndex !== -1) {
    rows.slice(headerIndex + 1).forEach(row => {
      const placeholder = String(row[0]).trim();
      if (!placeholder || !isSettingsReportChecked_(row[2])) {
        return;
      }
      if (isSettingsReportError_(row[3])) {
        // If the placeholder is in the template, the leftover check warns
        // about it.
        console.log(`The value of ${placeholder} in the "${sheetName}" ` +
          `sheet is an error (${row[3]}), so it isn't used.`);
        return;
      }
      settings.placeholders.push({
        placeholder: placeholder,
        marker: String(row[1]).trim(),
        value: row[3]
      });
    });
  }
  return settings;
}

/**
 * Updates all sheets that the report uses within one Apps Script run. Used
 * by the menu; the sidebar runs each step separately. Steps that would start
 * after their time limit are skipped, and the data that is already in their
 * sheets is used.
 * @param {number} startTime The start time of the report in milliseconds.
 * @param {!Array<string>} warnings Messages for the user.
 */
function refreshSettingsReportData_(startTime, warnings) {
  if (getSelectedGa4Properties().filter(row => row[3]).length === 0) {
    throw new Error('Select at least one property in the "Account ' +
      'Summaries" sheet.');
  }
  const limits = SETTINGS_REPORT_TIME_LIMITS;
  const skipped = [];
  getSettingsReportSteps_().forEach(step => {
    const limit = step.isChecker ? limits.CHECK_DEFINITIONS : limits.LIST_SETTINGS;
    if (Date.now() - startTime > limit) {
      skipped.push(step.sheet);
      return;
    }
    console.log(`Updating ${step.sheet}...`);
    try {
      step.run({deadline: startTime + limits.CHECK_DEFINITIONS});
    } catch (e) {
      console.log(e);
      warnings.push(`The "${step.sheet}" sheet couldn't be updated, so its ` +
        `existing data was used: ${e.message}`);
    }
  });
  if (skipped.length > 0) {
    warnings.push('To stay within the Apps Script time limit, these sheets ' +
      `weren't updated and their existing data was used: ` +
      `${skipped.join(', ')}. Use Create Report in the sidebar, which ` +
      'updates each sheet separately, or select fewer properties.');
  }
}

/**
 * Reads the GA4 settings from their sheets. Only the properties in the
 * "Property Details" sheet are included, so that data that was listed for
 * other properties is ignored.
 * @return {!Object} The properties and the rows of every sheet, grouped by
 *     property ID.
 */
function loadSettingsReportData_() {
  const idColumn = SETTINGS_REPORT_COLUMNS.propertyId;
  const properties = [];
  const ids = new Set();
  getDataFromSheet(sheetsMeta.ga4.properties.sheetName).forEach(row => {
    const id = String(row[idColumn]).trim();
    if (id && !ids.has(id)) {
      ids.add(id);
      properties.push({id: id, row: row});
    }
  });
  const groupByProperty = sheetMeta => {
    const groups = new Map();
    getDataFromSheet(sheetMeta.sheetName).forEach(row => {
      const id = String(row[idColumn]).trim();
      if (ids.has(id)) {
        if (!groups.has(id)) {
          groups.set(id, []);
        }
        groups.get(id).push(row);
      }
    });
    return groups;
  };
  const ga4 = sheetsMeta.ga4;
  return {
    properties: properties,
    audiences: groupByProperty(ga4.audiences),
    keyEvents: groupByProperty(ga4.keyEvents),
    streams: groupByProperty(ga4.streams),
    customDimensions: groupByProperty(ga4.customDimensions),
    customMetrics: groupByProperty(ga4.customMetrics),
    googleAdsLinks: groupByProperty(ga4.googleAdsLinks),
    dv360Links: groupByProperty(ga4.displayVideo360AdvertiserLinks),
    firebaseLinks: groupByProperty(ga4.firebaseLinks),
    bigQueryLinks: groupByProperty(ga4.bigqueryLinks),
    customDimensionsChecker: groupByProperty(ga4.customDimensionsChecker),
    customMetricsChecker: groupByProperty(ga4.customMetricsChecker)
  };
}

/**
 * Summarizes the settings of a single property.
 * @param {{id: string, row: !Array}} property The property and its row in
 *     the "Property Details" sheet.
 * @param {!Object} data The data returned by loadSettingsReportData_.
 * @return {!Object} The property statistics.
 */
function buildSettingsReportPropertyStats_(property, data) {
  const columns = SETTINGS_REPORT_COLUMNS;
  const row = property.row;
  const rowsOf = groups => groups.get(property.id) || [];
  const audiences = rowsOf(data.audiences);
  const streams = rowsOf(data.streams);
  const streamsOfType = type =>
    streams.filter(stream => stream[columns.streams.type] === type);
  const webStreams = streamsOfType('WEB_DATA_STREAM');
  const customDimensions = rowsOf(data.customDimensions);
  const type = String(row[columns.properties.type] || '').trim();
  const attributionModel =
    String(row[columns.properties.attributionModel] || '').trim();
  const userProvidedData = row[columns.properties.userProvidedData];

  const customDimensionsByScope = {EVENT: 0, USER: 0, ITEM: 0};
  customDimensions.forEach(customDimension => {
    const scope = customDimension[columns.customDimensions.scope];
    if (scope in customDimensionsByScope) {
      customDimensionsByScope[scope]++;
    }
  });

  return {
    id: property.id,
    name: String(row[columns.properties.name] || property.id),
    type: type,
    isOrdinary: !type || type === 'PROPERTY_TYPE_ORDINARY',
    is360: row[columns.properties.serviceLevel] === 'GOOGLE_ANALYTICS_360',
    signals: row[columns.properties.googleSignals] === 'GOOGLE_SIGNALS_ENABLED',
    eventCount: toSettingsReportNumber_(row[columns.properties.eventCount]),
    retentionMonths: SETTINGS_REPORT_RETENTION_MONTHS[
      row[columns.properties.eventDataRetention]] || null,
    attributionModel: attributionModel.endsWith('_UNSPECIFIED') ?
      '' : attributionModel,
    userProvidedData: isSettingsReportBoolean_(userProvidedData) ?
      isSettingsReportChecked_(userProvidedData) : null,
    audiences: audiences.length,
    customAudiences: audiences.filter(audience =>
      !SETTINGS_REPORT_DEFAULT_AUDIENCES.includes(
        String(audience[columns.audiences.name]).trim().toLowerCase())).length,
    keyEvents: rowsOf(data.keyEvents).map(keyEvent => ({
      name: String(keyEvent[columns.keyEvents.name]),
      custom: isSettingsReportChecked_(keyEvent[columns.keyEvents.custom]),
      count: toSettingsReportNumber_(keyEvent[columns.keyEvents.count])
    })),
    streams: streams.length,
    webStreams: webStreams.length,
    webStreamsWithEnhancedMeasurement: webStreams.filter(stream =>
      isSettingsReportChecked_(
        stream[columns.streams.enhancedMeasurement])).length,
    androidStreams: streamsOfType('ANDROID_APP_DATA_STREAM').length,
    iosStreams: streamsOfType('IOS_APP_DATA_STREAM').length,
    customDimensions: customDimensions.length,
    customDimensionsByScope: customDimensionsByScope,
    customMetrics: rowsOf(data.customMetrics).length,
    googleAdsLinks: rowsOf(data.googleAdsLinks).length,
    dv360Links: rowsOf(data.dv360Links).length,
    firebaseLinks: rowsOf(data.firebaseLinks).length,
    bigQueryLinks: rowsOf(data.bigQueryLinks).length,
    customDimensionsCheck: summarizeSettingsReportCheck_(
      rowsOf(data.customDimensionsChecker),
      columns.customDimensionsChecker.status),
    customMetricsCheck: summarizeSettingsReportCheck_(
      rowsOf(data.customMetricsChecker), columns.customMetricsChecker.status)
  };
}

/**
 * Summarizes the Custom Definitions Checker rows of a property.
 * @param {!Array<!Array>} rows The checker rows of the property.
 * @param {number} statusColumn The column of the "Status" values.
 * @return {?Object} null if the property wasn't checked, otherwise the
 *     number of checked definitions, the unused definitions, and whether
 *     some definitions couldn't be checked.
 */
function summarizeSettingsReportCheck_(rows, statusColumn) {
  const columns = SETTINGS_REPORT_COLUMNS.checkers;
  const statusOf = row => row[statusColumn];
  const checked = rows.filter(row => [
    CHECKER_STATUS.COLLECTED, CHECKER_STATUS.NOT_COLLECTED,
    CHECKER_STATUS.NONE_DEFINED].includes(statusOf(row)));
  if (checked.length === 0) {
    return null;
  }
  const definitions = checked.filter(
    row => statusOf(row) !== CHECKER_STATUS.NONE_DEFINED);
  return {
    checked: definitions.length,
    unused: definitions
      .filter(row => statusOf(row) === CHECKER_STATUS.NOT_COLLECTED)
      .map(row => ({
        displayName: String(row[columns.displayName]),
        parameterName: String(row[columns.parameterName]),
        scope: String(row[columns.scope])
      })),
    incomplete: rows.some(row => [
      CHECKER_STATUS.NOT_CHECKED, CHECKER_STATUS.ERROR].includes(statusOf(row)))
  };
}

/**
 * Calculates the values of all the placeholders that the report fills.
 * @param {!Object} data The data returned by loadSettingsReportData_.
 * @param {string} timeZone The time zone of the report date.
 * @return {{aggregate: !Object, snapshots: !Array<!Object>,
 *     incompleteChecks: boolean}} The values of the placeholders of the
 *     aggregate slides, and of the slides that are copied per property.
 */
function buildSettingsReportValues_(data, timeZone) {
  const stats = data.properties.map(
    property => buildSettingsReportPropertyStats_(property, data));
  const count = predicate => stats.filter(predicate).length;
  const sum = getValue => stats.reduce((total, s) => total + getValue(s), 0);
  const ratio = getSettingsReportRatio_;
  const total = stats.length;
  const ordinary = stats.filter(s => s.isOrdinary);
  const keyEvents = [].concat(...stats.map(s => s.keyEvents));
  const keyEventsWithCounts = keyEvents.filter(keyEvent => keyEvent.count !== null);
  const cdChecks = stats.map(s => s.customDimensionsCheck).filter(Boolean);
  const cmChecks = stats.map(s => s.customMetricsCheck).filter(Boolean);
  const sumChecks = (checks, getValue) =>
    checks.reduce((sumOfChecks, check) => sumOfChecks + getValue(check), 0);
  const unusedCount = checks => checks.length > 0 ?
    sumChecks(checks, check => check.unused.length) : null;
  const collectedShare = checks => ratio(
    sumChecks(checks, check => check.checked - check.unused.length),
    sumChecks(checks, check => check.checked));

  const aggregate = {
    '--report_date--': Utilities.formatDate(
      new Date(), timeZone, 'MMMM d, yyyy'),
    '--num_props--': total,
    '--props_google_signals_enabled_percent--': ratio(count(s => s.signals), total),
    '--360_props_percent--': ratio(count(s => s.is360), total),
    '--props_active_percent--': ratio(
      count(s => s.eventCount > 0), count(s => s.eventCount !== null)),
    '--retention_percent--': ratio(count(s => s.retentionMonths >= 14),
      count(s => s.retentionMonths !== null)),
    '--enhanced_meas_percent--': ratio(
      sum(s => s.webStreamsWithEnhancedMeasurement), sum(s => s.webStreams)),
    '--user_data_percent--': ratio(count(s => s.userProvidedData === true),
      count(s => s.userProvidedData !== null)),
    '--data_driven_percent--': ratio(
      count(s => s.attributionModel === SETTINGS_REPORT_DATA_DRIVEN_MODEL),
      count(s => !!s.attributionModel)),
    '--avg_audiences_per_property--': getSettingsReportAverage_(
      sum(s => s.audiences), total),
    '--num_audiences--': sum(s => s.audiences),
    '--props_custom_audiences_percent--': ratio(
      count(s => s.customAudiences > 0), total),
    '--num_custom_audiences--': sum(s => s.customAudiences),
    '--props_conversion_events_percent--': ratio(
      count(s => s.keyEvents.length > 0), total),
    '--num_conversion_events--': keyEvents.length,
    '--props_custom_conversion_events_percent--': ratio(
      count(s => s.keyEvents.some(keyEvent => keyEvent.custom)), total),
    '--percent_conversions_with_data--': ratio(
      keyEventsWithCounts.filter(keyEvent => keyEvent.count > 0).length,
      keyEventsWithCounts.length),
    '--props_web_streams_percent--': ratio(
      ordinary.filter(s => s.webStreams > 0).length, ordinary.length),
    '--props_ios_data_streams_percent--': ratio(
      ordinary.filter(s => s.iosStreams > 0).length, ordinary.length),
    '--props_android_streams_percent--': ratio(
      ordinary.filter(s => s.androidStreams > 0).length, ordinary.length),
    '--num_streams--': sum(s => s.streams),
    '--props_cds_percent--': ratio(count(s => s.customDimensions > 0), total),
    '--avg_cds--': getSettingsReportAverage_(sum(s => s.customDimensions), total),
    '--cds_collected_percent--': collectedShare(cdChecks),
    '--num_cds_unused--': unusedCount(cdChecks),
    '--props_cms_percent--': ratio(count(s => s.customMetrics > 0), total),
    '--avg_cms--': getSettingsReportAverage_(sum(s => s.customMetrics), total),
    '--cms_collected_percent--': collectedShare(cmChecks),
    '--num_cms_unused--': unusedCount(cmChecks),
    '--unused_cds_list--': buildSettingsReportUnusedList_(stats,
      'customDimensionsCheck', 'custom dimensions',
      sheetsMeta.ga4.customDimensionsChecker.sheetName),
    '--unused_cms_list--': buildSettingsReportUnusedList_(stats,
      'customMetricsCheck', 'custom metrics',
      sheetsMeta.ga4.customMetricsChecker.sheetName),
    '--props_ads_percent--': ratio(count(s => s.googleAdsLinks > 0), total),
    '--props_dv360_percent--': ratio(count(s => s.dv360Links > 0), total),
    '--props_firebase_percent--': ratio(count(s => s.firebaseLinks > 0), total),
    '--props_bigquery_percent--': ratio(count(s => s.bigQueryLinks > 0), total)
  };
  Object.assign(aggregate, buildSettingsReportFindingLists_(stats));

  return {
    aggregate: aggregate,
    snapshots: stats.map(s => ({
      propertyId: s.id,
      values: buildSettingsReportSnapshotValues_(s)
    })),
    incompleteChecks: cdChecks.concat(cmChecks).some(check => check.incomplete)
  };
}

/**
 * Returns the values of the placeholders of the slide that is copied for a
 * property.
 * @param {!Object} s The property statistics.
 * @return {!Object} The placeholders and their values.
 */
function buildSettingsReportSnapshotValues_(s) {
  return {
    '--snapshot_property_name--': s.name,
    '--snapshot_property_id--': s.id,
    '--snapshot_ce--': s.keyEvents.length,
    '--snapshot_aud--': s.audiences,
    '--snapshot_web--': s.webStreams,
    '--snapshot_and--': s.androidStreams,
    '--snapshot_ios--': s.iosStreams,
    '--snapshot_360--': s.is360,
    '--snapshot_sig--': s.signals,
    '--snapshot_type--': SETTINGS_REPORT_PROPERTY_TYPES[s.type] ||
      s.type || null,
    '--snapshot_ads--': s.googleAdsLinks,
    '--snapshot_dv--': s.dv360Links,
    '--snapshot_fire--': s.firebaseLinks > 0,
    '--snapshot_cd--': s.customDimensions,
    '--snapshot_cm--': s.customMetrics,
    '--snapshot_last_7_days_data--': s.eventCount === null ?
      null : s.eventCount > 0,
    '--snapshot_retention--': s.retentionMonths,
    '--snapshot_bq--': s.bigQueryLinks > 0,
    '--snapshot_unused_cd--': s.customDimensionsCheck ?
      s.customDimensionsCheck.unused.length : null,
    '--snapshot_unused_cm--': s.customMetricsCheck ?
      s.customMetricsCheck.unused.length : null
  };
}

/**
 * Lists the custom definitions that collected no data in the last 30 days.
 * @param {!Array<!Object>} stats The property statistics.
 * @param {string} checkKey Either customDimensionsCheck or
 *     customMetricsCheck.
 * @param {string} kind "custom dimensions" or "custom metrics".
 * @param {string} sheetName The name of the checker sheet.
 * @return {!Array<string>} The list items.
 */
function buildSettingsReportUnusedList_(stats, checkKey, kind, sheetName) {
  const checked = stats.filter(s => s[checkKey]);
  if (checked.length === 0) {
    return [`Not checked yet. Create the report again and let it update ` +
      `the "${sheetName}" sheet.`];
  }
  const showProperty = stats.length > 1;
  const items = [];
  checked.forEach(s => s[checkKey].unused.forEach(definition => {
    let item = truncateSettingsReportName_(definition.displayName);
    if (definition.parameterName &&
        definition.parameterName !== definition.displayName) {
      item += ` (${truncateSettingsReportName_(definition.parameterName)})`;
    }
    if (definition.scope && definition.scope !== 'EVENT') {
      item += `, ${definition.scope.toLowerCase()}-scoped`;
    }
    if (showProperty) {
      item += ` – ${truncateSettingsReportName_(s.name)}`;
    }
    items.push(item);
  }));
  if (items.length === 0) {
    return [`All checked ${kind} collected data in the last 30 days.`];
  }
  const limits = SETTINGS_REPORT_TEXT_LIMITS;
  const countLines = item =>
    Math.max(1, Math.ceil(item.length / limits.UNUSED_LINE_CHARACTERS));
  const lines = items.reduce((total, item) => total + countLines(item), 0);
  if (items.length <= limits.UNUSED_DEFINITIONS &&
      lines <= limits.UNUSED_LINES) {
    return items;
  }
  // Keeps the items that fit in the box, with room for the last item that
  // points to the checker sheet.
  const more = count => `${count} more in the "${sheetName}" sheet`;
  const shown = [];
  let shownLines = 0;
  for (const item of items) {
    const remaining = items.length - shown.length - 1;
    if (shown.length === limits.UNUSED_DEFINITIONS - 1 ||
        shownLines + countLines(item) + countLines(more(remaining)) >
          limits.UNUSED_LINES) {
      break;
    }
    shown.push(item);
    shownLines += countLines(item);
  }
  shown.push(more(items.length - shown.length));
  return shown;
}

/**
 * Builds the highlight and lowlight lists of every section and the next
 * steps.
 * @param {!Array<!Object>} stats The property statistics.
 * @return {!Object} The list placeholders and their items.
 */
function buildSettingsReportFindingLists_(stats) {
  const sections = {
    prop_details: getPropertyDetailsFindings_(stats),
    data_settings: getDataSettingsFindings_(stats),
    audiences: getAudienceFindings_(stats),
    conversions: getKeyEventFindings_(stats),
    streams: getStreamFindings_(stats),
    cds: getCustomDefinitionFindings_(stats, 'customDimensions'),
    cms: getCustomDefinitionFindings_(stats, 'customMetrics'),
    links: getLinkFindings_(stats)
  };
  const lists = {};
  const actions = [];
  Object.keys(sections).forEach(section => {
    const findings = sections[section];
    ['highlights', 'lowlights'].forEach(list => {
      const type = list === 'highlights' ? 'highlight' : 'lowlight';
      lists[`--${section}_${list}_list--`] = limitSettingsReportFindings_(
        findings.filter(finding => finding.type === type)
          .map(finding => finding.text),
        SETTINGS_REPORT_EMPTY_LISTS[list]);
    });
    findings.filter(finding => finding.action).forEach(finding =>
      actions.push(finding));
  });
  actions.sort((a, b) => a.priority - b.priority);
  const nextSteps = actions.slice(0, SETTINGS_REPORT_TEXT_LIMITS.NEXT_STEPS)
    .map(finding => finding.action);
  lists['--next_steps_list--'] = nextSteps.length > 0 ?
    nextSteps : [SETTINGS_REPORT_EMPTY_LISTS.nextSteps];
  return lists;
}

/**
 * Keeps the first findings of a list, so that the list fits on the slide.
 * @param {!Array<string>} items The findings in order of importance.
 * @param {string} emptyText The text of an empty list.
 * @return {!Array<string>} The list items.
 */
function limitSettingsReportFindings_(items, emptyText) {
  const limits = SETTINGS_REPORT_TEXT_LIMITS;
  const kept = [];
  let characters = 0;
  items.slice(0, limits.FINDINGS_PER_LIST).forEach(item => {
    if (kept.length === 0 ||
        characters + item.length <= limits.FINDINGS_CHARACTERS) {
      kept.push(item);
      characters += item.length;
    }
  });
  return kept.length > 0 ? kept : [emptyText];
}

/**
 * Creates a highlight.
 * @param {string} text
 * @return {!Object}
 */
function settingsReportHighlight_(text) {
  return {type: 'highlight', text: text};
}

/**
 * Creates a lowlight with the action that is listed in the next steps.
 * @param {string} text The lowlight.
 * @param {string} action The recommended next step.
 * @param {number} priority The order of the action in the next steps, where
 *     1 is the most important.
 * @return {!Object}
 */
function settingsReportLowlight_(text, action, priority) {
  return {type: 'lowlight', text: text, action: action, priority: priority};
}

/**
 * Returns the findings about the property details.
 * @param {!Array<!Object>} stats The property statistics.
 * @return {!Array<!Object>} The findings.
 */
function getPropertyDetailsFindings_(stats) {
  const findings = [];
  const withCounts = stats.filter(s => s.eventCount !== null);
  const inactive = withCounts.filter(s => s.eventCount === 0);
  if (inactive.length > 0) {
    findings.push(settingsReportLowlight_(
      `${countSettingsReportItems_(inactive.length, 'property', 'properties')}` +
      ` received no data in the last 7 days: ` +
      `${listSettingsReportNames_(inactive.map(s => s.name))}.`,
      `Check the tagging of ${theSettingsReportItems_(
        inactive.length, 'property', 'properties')} without data in the ` +
      `last 7 days, or delete ${inactive.length === 1 ?
        'it if you no longer use it' : 'the ones you no longer use'}.`,
      1));
  } else if (withCounts.length > 0) {
    findings.push(settingsReportHighlight_(
      'All of your properties received data in the last 7 days.'));
  }

  const signalsOff = stats.filter(s => !s.signals);
  if (signalsOff.length === 0) {
    findings.push(settingsReportHighlight_(
      'Google Signals is turned on in all of your properties.'));
  } else {
    const where = signalsOff.length === stats.length ? 'all of your properties' :
      countSettingsReportItems_(signalsOff.length, 'property', 'properties');
    findings.push(settingsReportLowlight_(
      `Google Signals is turned off in ${where}. Turn it on where your ` +
      'privacy policy allows to get demographics and cross-device data.',
      `Review whether Google Signals can be turned on in ${where}.`, 15));
  }

  const ga360 = stats.filter(s => s.is360).length;
  if (ga360 > 0) {
    findings.push(settingsReportHighlight_(
      `${countSettingsReportItems_(ga360, 'property is', 'properties are')} ` +
      'Google Analytics 360, with higher limits and longer data retention.'));
  }
  return findings;
}

/**
 * Returns the findings about data retention, enhanced measurement,
 * attribution and user-provided data collection.
 * @param {!Array<!Object>} stats The property statistics.
 * @return {!Array<!Object>} The findings.
 */
function getDataSettingsFindings_(stats) {
  const findings = [];
  const withRetention = stats.filter(s => s.retentionMonths !== null);
  const shortRetention = withRetention.filter(s => s.retentionMonths < 14);
  if (shortRetention.length > 0) {
    const properties = countSettingsReportItems_(
      shortRetention.length, 'property', 'properties');
    findings.push(settingsReportLowlight_(
      `${properties} only ${shortRetention.length === 1 ? 'keeps' : 'keep'} ` +
      'event data for 2 months. Increase the retention to 14 months to ' +
      'analyze longer periods in explorations.',
      `Increase the event data retention to 14 months in ${properties}.`, 5));
  } else if (withRetention.length > 0) {
    findings.push(settingsReportHighlight_(
      'All of your properties keep event data for 14 months or longer.'));
  }

  const webStreams = stats.reduce((total, s) => total + s.webStreams, 0);
  const enhancedOff = webStreams - stats.reduce(
    (total, s) => total + s.webStreamsWithEnhancedMeasurement, 0);
  if (enhancedOff > 0) {
    const streams = countSettingsReportItems_(
      enhancedOff, 'web stream', 'web streams');
    findings.push(settingsReportLowlight_(
      `Enhanced measurement is turned off for ${streams}. Turn it on to ` +
      'measure scrolls, outbound clicks, site search and downloads.',
      `Turn on enhanced measurement for ${streams}.`, 14));
  } else if (webStreams > 0) {
    findings.push(settingsReportHighlight_(
      'Enhanced measurement is turned on for all of your web streams.'));
  }

  const withModel = stats.filter(s => s.attributionModel);
  const notDataDriven = withModel.filter(
    s => s.attributionModel !== SETTINGS_REPORT_DATA_DRIVEN_MODEL);
  if (notDataDriven.length > 0) {
    const properties = countSettingsReportItems_(
      notDataDriven.length, 'property', 'properties');
    findings.push(settingsReportLowlight_(
      `${properties} ${notDataDriven.length === 1 ? 'uses' : 'use'} a last ` +
      'click attribution model. Check that this is intentional, because ' +
      'data-driven attribution credits every touchpoint.',
      `Review the attribution model of ${properties}.`, 16));
  } else if (withModel.length > 0) {
    findings.push(settingsReportHighlight_(
      'All of your properties use data-driven attribution.'));
  }

  const withUserData = stats.filter(s => s.userProvidedData !== null);
  const userDataOn = withUserData.filter(s => s.userProvidedData);
  if (userDataOn.length > 0) {
    const where = userDataOn.length === withUserData.length ?
      'all of your properties' :
      countSettingsReportItems_(userDataOn.length, 'property', 'properties');
    findings.push(settingsReportHighlight_(
      `User-provided data collection is turned on in ${where}.`));
  } else if (withUserData.length > 0) {
    findings.push(settingsReportLowlight_(
      'User-provided data collection is turned off. Consider turning it on ' +
      'if you collect data such as email addresses in line with the policies.',
      'Consider turning on user-provided data collection.', 20));
  }
  return findings;
}

/**
 * Returns the findings about audiences.
 * @param {!Array<!Object>} stats The property statistics.
 * @return {!Array<!Object>} The findings.
 */
function getAudienceFindings_(stats) {
  const findings = [];
  const withoutCustom = stats.filter(s => s.customAudiences === 0);
  if (withoutCustom.length === 0) {
    findings.push(settingsReportHighlight_(
      'All of your properties have custom audiences.'));
  } else if (withoutCustom.length === stats.length) {
    findings.push(settingsReportLowlight_(
      'None of your properties have custom audiences yet. Build audiences ' +
      'to use your GA4 data in your advertising.',
      'Build custom audiences, for example based on your key events.', 12));
  } else {
    const properties = countSettingsReportItems_(
      withoutCustom.length, 'property', 'properties');
    findings.push(settingsReportLowlight_(
      `${properties} only ${withoutCustom.length === 1 ? 'has' : 'have'} the ` +
      'default audiences. Build custom audiences to use your GA4 data in ' +
      'your advertising.',
      `Build custom audiences in ${properties}.`, 12));
  }
  const average = getSettingsReportAverage_(
    stats.reduce((total, s) => total + s.audiences, 0), stats.length);
  if (average >= 5) {
    findings.push(settingsReportHighlight_(
      `Your properties have ${formatSettingsReportNumber_(average)} ` +
      'audiences on average.'));
  }
  return findings;
}

/**
 * Returns the findings about key events.
 * @param {!Array<!Object>} stats The property statistics.
 * @return {!Array<!Object>} The findings.
 */
function getKeyEventFindings_(stats) {
  const findings = [];
  const withoutKeyEvents = stats.filter(s => s.keyEvents.length === 0);
  if (withoutKeyEvents.length > 0) {
    const properties = countSettingsReportItems_(
      withoutKeyEvents.length, 'property', 'properties');
    findings.push(settingsReportLowlight_(
      `${properties} ${withoutKeyEvents.length === 1 ? 'has' : 'have'} no ` +
      `key events: ${listSettingsReportNames_(
        withoutKeyEvents.map(s => s.name))}. Mark your most important ` +
      'events as key events.',
      `Set up key events in ${properties}.`, 3));
  } else {
    findings.push(settingsReportHighlight_(
      'All of your properties have key events.'));
  }

  const keyEvents = [].concat(...stats.map(s => s.keyEvents))
    .filter(keyEvent => keyEvent.count !== null);
  const withData = keyEvents.filter(keyEvent => keyEvent.count > 0);
  const share = getSettingsReportRatio_(withData.length, keyEvents.length);
  if (share !== null && share >= 0.7) {
    findings.push(settingsReportHighlight_(
      `${formatSettingsReportPercent_(share)} of your key events were ` +
      'triggered in the last 7 days.'));
  } else if (share !== null) {
    const withoutData = keyEvents.filter(keyEvent => keyEvent.count === 0);
    // Custom key events are listed first, because default key events (for
    // example purchase on a site without a shop) often have no data.
    const names = withoutData.filter(keyEvent => keyEvent.custom)
      .concat(withoutData.filter(keyEvent => !keyEvent.custom))
      .map(keyEvent => keyEvent.name);
    findings.push(settingsReportLowlight_(
      `Only ${formatSettingsReportPercent_(share)} of your key events were ` +
      `triggered in the last 7 days. No data for: ` +
      `${listSettingsReportNames_(Array.from(new Set(names)))}.`,
      `Check the tags of ${theSettingsReportItems_(
        withoutData.length, 'key event', 'key events')} without data in the ` +
      'last 7 days.', 4));
  }

  const onlyDefault = stats.filter(s => s.keyEvents.length > 0 &&
    !s.keyEvents.some(keyEvent => keyEvent.custom));
  if (onlyDefault.length > 0) {
    const properties = countSettingsReportItems_(
      onlyDefault.length, 'property', 'properties');
    findings.push(settingsReportLowlight_(
      `${properties} only ${onlyDefault.length === 1 ? 'uses' : 'use'} ` +
      'default key events, such as purchase. Mark the events that matter ' +
      'most to your business as key events.',
      `Mark your most important events as key events in ${properties}.`, 13));
  }
  return findings;
}

/**
 * Returns the findings about data streams. Subproperties and roll-up
 * properties don't have data streams, so only ordinary properties are
 * included.
 * @param {!Array<!Object>} stats The property statistics.
 * @return {!Array<!Object>} The findings.
 */
function getStreamFindings_(stats) {
  const findings = [];
  const ordinary = stats.filter(s => s.isOrdinary);
  if (ordinary.length === 0) {
    return findings;
  }
  const withoutStreams = ordinary.filter(s => s.streams === 0);
  if (withoutStreams.length > 0) {
    const properties = countSettingsReportItems_(
      withoutStreams.length, 'property', 'properties');
    findings.push(settingsReportLowlight_(
      `${properties} ${withoutStreams.length === 1 ? 'has' : 'have'} no data ` +
      `streams and can't collect data: ${listSettingsReportNames_(
        withoutStreams.map(s => s.name))}.`,
      `Add a data stream to ${theSettingsReportItems_(withoutStreams.length,
        'property', 'properties')} without one, or delete ` +
      `${withoutStreams.length === 1 ? 'it if you no longer use it' :
        'the ones you no longer use'}.`, 2));
  } else {
    findings.push(settingsReportHighlight_(
      'All of your properties have at least one data stream.'));
  }
  const webAndApp = ordinary.filter(
    s => s.webStreams > 0 && s.androidStreams + s.iosStreams > 0);
  if (webAndApp.length > 0) {
    findings.push(settingsReportHighlight_(
      `${countSettingsReportItems_(webAndApp.length, 'property combines',
        'properties combine')} web and app data streams for cross-platform ` +
      'reporting.'));
  }
  if (!ordinary.some(s => s.androidStreams + s.iosStreams > 0)) {
    findings.push({
      type: 'lowlight',
      text: 'None of your properties have app data streams. If you have an ' +
        'app, add an iOS or Android data stream to measure it in GA4.'
    });
  }
  return findings;
}

/**
 * Returns the findings about custom dimensions or custom metrics.
 * @param {!Array<!Object>} stats The property statistics.
 * @param {string} kind Either customDimensions or customMetrics.
 * @return {!Array<!Object>} The findings.
 */
function getCustomDefinitionFindings_(stats, kind) {
  const isDimension = kind === 'customDimensions';
  const name = isDimension ? 'custom dimensions' : 'custom metrics';
  const findings = [];

  const share = getSettingsReportRatio_(
    stats.filter(s => s[kind] > 0).length, stats.length);
  const goodShare = isDimension ? 0.7 : 0.4;
  if (share >= goodShare) {
    findings.push(settingsReportHighlight_(share === 1 ?
      `All of your properties use ${name}.` :
      `${formatSettingsReportPercent_(share)} of your properties use ${name}.`));
  } else {
    const parameters = isDimension ? 'event parameters' : 'numeric event ' +
      'parameters';
    findings.push(settingsReportLowlight_(
      `${share === 0 ? 'None' : `Only ${formatSettingsReportPercent_(share)}`}` +
      ` of your properties have ${name}. Register the ${parameters} that you ` +
      `want to use in reports as ${name}.`,
      `Register the ${parameters} that you use in reports as ${name}.`,
      isDimension ? 18 : 19));
  }

  const checks = stats.map(s => s[`${kind}Check`]).filter(Boolean);
  const checked = checks.reduce((total, check) => total + check.checked, 0);
  const unused = checks.reduce((total, check) => total + check.unused.length, 0);
  if (checked > 0 && unused === 0) {
    findings.push(settingsReportHighlight_(
      `All ${checked} checked ${name} collected data in the last 30 days.`));
  } else if (checked > 0) {
    findings.push(settingsReportLowlight_(
      `${unused} of ${checked} ${name} ` +
      `(${formatSettingsReportPercent_(unused / checked)}) collected no data ` +
      'in the last 30 days. Fix the tagging, or archive the ones you don\'t ' +
      'need to free up slots.',
      `Fix or archive ${theSettingsReportItems_(unused, name.slice(0, -1),
        name)} without data in the last 30 days.`,
      isDimension ? 6 : 7));
  }

  const limits = SETTINGS_REPORT_DEFINITION_LIMITS[kind];
  const isNearlyFull = (used, limit, is360) =>
    used >= SETTINGS_REPORT_NEARLY_FULL * (is360 ? limit.ga360 : limit.standard);
  const nearlyFull = stats.filter(s => isDimension ?
    Object.keys(limits).some(scope =>
      isNearlyFull(s.customDimensionsByScope[scope], limits[scope], s.is360)) :
    isNearlyFull(s.customMetrics, limits, s.is360));
  if (nearlyFull.length > 0) {
    const properties = countSettingsReportItems_(
      nearlyFull.length, 'property', 'properties');
    findings.push(settingsReportLowlight_(
      `${properties} ${nearlyFull.length === 1 ? 'uses' : 'use'} 90% or more ` +
      `of the available ${name}${isDimension ? ' for a scope' : ''}. Archive ` +
      'unused ones before you reach the limit.',
      `Free up ${name} in ${properties} that ` +
      `${nearlyFull.length === 1 ? 'is' : 'are'} close to the limit.`,
      isDimension ? 8 : 9));
  }
  return findings;
}

/**
 * Returns the findings about product links.
 * @param {!Array<!Object>} stats The property statistics.
 * @return {!Array<!Object>} The findings.
 */
function getLinkFindings_(stats) {
  const findings = [];
  const withoutAds = stats.filter(s => s.googleAdsLinks === 0);
  if (withoutAds.length === 0) {
    findings.push(settingsReportHighlight_(
      'All of your properties are linked to Google Ads.'));
  } else {
    const properties = countSettingsReportItems_(
      withoutAds.length, 'property', 'properties');
    findings.push(settingsReportLowlight_(
      `${properties} ${withoutAds.length === 1 ? 'isn\'t' : 'aren\'t'} ` +
      'linked to Google Ads. If you advertise on Google Ads, link them to ' +
      'share key events and audiences.',
      `Link Google Ads to ${properties} if you advertise on Google Ads.`, 11));
  }

  const withoutBigQuery = stats.filter(s => s.bigQueryLinks === 0);
  if (withoutBigQuery.length === 0) {
    findings.push(settingsReportHighlight_(
      'All of your properties export their data to BigQuery.'));
  } else {
    const properties = countSettingsReportItems_(
      withoutBigQuery.length, 'property', 'properties');
    findings.push(settingsReportLowlight_(
      `${properties} ${withoutBigQuery.length === 1 ? 'doesn\'t' : 'don\'t'} ` +
      'export data to BigQuery. Link BigQuery to keep a copy of your raw ' +
      'event data.',
      `Link BigQuery to ${properties}.`, 10));
  }

  const appsWithoutFirebase = stats.filter(
    s => s.androidStreams + s.iosStreams > 0 && s.firebaseLinks === 0);
  if (appsWithoutFirebase.length > 0) {
    const properties = countSettingsReportItems_(
      appsWithoutFirebase.length, 'property', 'properties');
    findings.push(settingsReportLowlight_(
      `${properties} ${appsWithoutFirebase.length === 1 ? 'has' : 'have'} ` +
      'app data streams but no Firebase link.',
      `Link Firebase to ${properties} with app data streams.`, 17));
  }

  const withDv360 = stats.filter(s => s.dv360Links > 0).length;
  if (withDv360 > 0) {
    findings.push(settingsReportHighlight_(
      `${countSettingsReportItems_(withDv360, 'property is',
        'properties are')} linked to Display & Video 360.`));
  }
  return findings;
}

/**
 * Fills the placeholders of the presentation and creates a copy of the
 * snapshot slide for every property. A checked row in the "Report Settings"
 * sheet replaces the calculated value of its placeholder, unless its value is
 * empty. The values of the slides that are copied per property are always
 * calculated.
 * @param {!SlidesApp.Presentation} presentation The copy of the template.
 * @param {!Object} report The values returned by buildSettingsReportValues_.
 * @param {!Object} settings The report settings.
 * @param {!Object} context The time zone, percent color ranges, start time
 *     and warnings.
 */
function fillSettingsReport_(presentation, report, settings, context) {
  const snapshotKeys = report.snapshots.length > 0 ?
    Object.keys(report.snapshots[0].values) : [];
  const sheetRows = settings.placeholders.filter(row => {
    if (snapshotKeys.includes(row.placeholder)) {
      console.log(`${row.placeholder} is calculated for every property, so ` +
        'its row in the "Report Settings" sheet is ignored.');
      return false;
    }
    // A checked row without a value keeps the calculated value.
    return !(row.placeholder in report.aggregate) ||
      toSettingsReportListItems_(row.value).length > 0;
  });

  const sheetValuesUsed = new Set();
  presentation.getSlides().forEach(slide => {
    const sheetValues =
      getSettingsReportCustomValues_(sheetRows, getSlideMarkers_(slide));
    const values = Object.assign({}, report.aggregate, sheetValues);
    fillSettingsReportSlide_(slide, values, context)
      .filter(key => key in sheetValues && key in report.aggregate)
      .forEach(key => sheetValuesUsed.add(key));
  });
  if (sheetValuesUsed.size > 0) {
    // Copies of the sheet from earlier versions have checked rows with
    // formulas for the calculated placeholders, so these rows are named.
    const keys = Array.from(sheetValuesUsed);
    const limit = SETTINGS_REPORT_TEXT_LIMITS.SHEET_VALUES;
    context.warnings.push('These placeholders show your values from the ' +
      '"Report Settings" sheet instead of the calculated values: ' +
      keys.slice(0, limit).join(', ') +
      (keys.length > limit ? ` and ${keys.length - limit} more` : '') +
      '. To show the calculated values, uncheck their rows.');
  }
  createSettingsReportCopiedSlides_(
    presentation, report, snapshotKeys, context);
  if (Date.now() - context.startTime <
      SETTINGS_REPORT_TIME_LIMITS.CREATE_SLIDES) {
    warnAboutSettingsReportLeftovers_(presentation, context.warnings);
  }
}

/**
 * Returns the values of the "Report Settings" rows for a slide. A row whose
 * "Template Slide" is in the speaker notes of the slide is used first, then a
 * row without a template slide, then the first row of the placeholder.
 * @param {!Array<!Object>} rows The checked placeholder rows.
 * @param {!Array<string>} markers The lines of the speaker notes.
 * @return {!Object} The placeholders and their values.
 */
function getSettingsReportCustomValues_(rows, markers) {
  const rowsByPlaceholder = new Map();
  rows.forEach(row => {
    if (!rowsByPlaceholder.has(row.placeholder)) {
      rowsByPlaceholder.set(row.placeholder, []);
    }
    rowsByPlaceholder.get(row.placeholder).push(row);
  });
  const values = {};
  rowsByPlaceholder.forEach((placeholderRows, placeholder) => {
    let selected = placeholderRows.filter(
      row => row.marker && markers.includes(row.marker));
    if (selected.length === 0) {
      selected = placeholderRows.filter(row => !row.marker);
    }
    if (selected.length === 0) {
      selected = placeholderRows.filter(
        row => row.marker === placeholderRows[0].marker);
    }
    values[placeholder] = isSettingsReportList_(placeholder) ?
      [].concat(...selected.map(row => toSettingsReportListItems_(row.value))) :
      selected[0].value;
  });
  return values;
}

/**
 * Creates the slides that are copied for every property, or for every row
 * of the "Report Settings - Snapshot" sheet with a custom template slide.
 * The copies are created right after their template slide, in the order of
 * the properties, and the template slide is removed.
 * @param {!SlidesApp.Presentation} presentation The report presentation.
 * @param {!Object} report The values returned by buildSettingsReportValues_.
 * @param {!Array<string>} snapshotKeys The calculated snapshot placeholders.
 * @param {!Object} context The report context.
 */
function createSettingsReportCopiedSlides_(
  presentation, report, snapshotKeys, context) {
  const groups = new Map([[SETTINGS_REPORT_SNAPSHOT_MARKER,
    report.snapshots.map(snapshot => ({
      propertyId: snapshot.propertyId,
      values: Object.assign({}, snapshot.values)
    }))]]);
  readSettingsReportSnapshotRows_(snapshotKeys)
    .forEach(row => {
      const snapshot = report.snapshots.find(
        snapshot => snapshot.propertyId === row.propertyId);
      if (row.marker === SETTINGS_REPORT_SNAPSHOT_MARKER) {
        const entry = groups.get(row.marker).find(
          entry => entry.propertyId === row.propertyId);
        if (entry) {
          Object.assign(entry.values, row.values);
        }
        return;
      }
      if (!groups.has(row.marker)) {
        groups.set(row.marker, []);
      }
      groups.get(row.marker).push({
        propertyId: row.propertyId,
        values: Object.assign({}, snapshot ? snapshot.values : {}, row.values)
      });
    });

  groups.forEach((entries, marker) => {
    const template = presentation.getSlides().find(
      slide => getSlideMarkers_(slide).includes(marker));
    if (!template) {
      // A custom template doesn't need a snapshot slide.
      if (marker !== SETTINGS_REPORT_SNAPSHOT_MARKER) {
        context.warnings.push(`No slide has "${marker}" in its speaker ` +
          'notes, so the slides for each property weren\'t created.');
      }
      return;
    }
    const templateText = getSettingsReportSlideText_(template);
    const keys = Array.from(new Set([].concat(
      ...entries.map(entry => Object.keys(entry.values)))))
      .filter(key => templateText.includes(key));
    // Each copy is inserted right after the template, so the copies are
    // created in reverse order to keep the order of the properties.
    const copies = [];
    for (let i = entries.length - 1; i >= 0; i--) {
      copies[i] = template.duplicate();
    }
    for (let i = 0; i < entries.length; i++) {
      if (Date.now() - context.startTime >
          SETTINGS_REPORT_TIME_LIMITS.CREATE_SLIDES) {
        copies.slice(i).forEach(copy => copy.remove());
        context.warnings.push('To stay within the Apps Script time limit, ' +
          `only ${i} of the ${entries.length} slides for "${marker}" were ` +
          'created. Select fewer properties and create the report again.');
        break;
      }
      copies[i].getNotesPage().replaceAllText(marker, '');
      // Placeholders without a value for this property are cleared.
      fillSettingsReportSlide_(copies[i], entries[i].values, context, keys);
    }
    template.remove();
  });
}

/**
 * Reads the custom placeholders of the copied slides from the
 * "Report Settings - Snapshot" sheet. Column A has the property ID, column B
 * the template slide, and the other columns have a placeholder in the first
 * row and its value for each property below it.
 * @param {!Array<string>} snapshotKeys The calculated snapshot placeholders,
 *     which are ignored in the sheet.
 * @return {!Array<{propertyId: string, marker: string, values: !Object}>}
 */
function readSettingsReportSnapshotRows_(snapshotKeys) {
  const sheet = SpreadsheetApp.getActive()
    .getSheetByName(SETTINGS_REPORT_SNAPSHOT_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2 || sheet.getLastColumn() < 3) {
    return [];
  }
  const rows = sheet.getRange(
    1, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
  const headers = rows[0].map(header => String(header).trim());
  return rows.slice(1)
    .filter(row => String(row[0]).trim())
    .map(row => {
      const values = {};
      headers.forEach((placeholder, column) => {
        if (column < 2 || !placeholder || snapshotKeys.includes(placeholder)) {
          return;
        }
        if (isSettingsReportError_(row[column])) {
          console.log(`The value of ${placeholder} for property ${row[0]} ` +
            `in the "${SETTINGS_REPORT_SNAPSHOT_SHEET_NAME}" sheet is an ` +
            `error (${row[column]}), so it isn't used.`);
          return;
        }
        values[placeholder] = row[column];
      });
      return {
        propertyId: String(row[0]).trim(),
        marker: String(row[1]).trim() || SETTINGS_REPORT_SNAPSHOT_MARKER,
        values: values
      };
    });
}

/**
 * Replaces the placeholders of a slide. Lists, images and colored
 * percentages are replaced in their shapes, other values are replaced on the
 * whole slide.
 * @param {!SlidesApp.Slide} slide The slide.
 * @param {!Object} values The placeholders and their values.
 * @param {!Object} context The report context.
 * @param {!Array<string>=} presentKeys The placeholders that are on the
 *     slide, if they are already known.
 * @return {!Array<string>} The placeholders of the slide that were filled.
 */
function fillSettingsReportSlide_(slide, values, context, presentKeys) {
  let shapes = null;
  let texts = null;
  const readShapes = () => {
    if (!shapes) {
      shapes = getSettingsReportShapes_(slide);
      texts = shapes.map(getSettingsReportShapeText_);
    }
  };
  let keys = presentKeys;
  if (!keys) {
    readShapes();
    const slideText = texts.join('\n') + getSettingsReportTableText_(slide);
    keys = Object.keys(values).filter(key => slideText.includes(key));
  }
  // Longer placeholders first, in case a placeholder contains another one.
  keys = keys.slice().sort((a, b) => b.length - a.length);
  const richKeys = keys.filter(
    key => isSettingsReportRichValue_(key, values[key], context));
  // Rich values are replaced first, because they use the positions of the
  // placeholders in the text that was read before any replacement.
  if (richKeys.length > 0) {
    readShapes();
    shapes.forEach((shape, i) =>
      replaceSettingsReportRichPlaceholders_(
        shape, texts[i], richKeys, values, context));
  }
  keys.filter(key => !richKeys.includes(key)).forEach(key =>
    slide.replaceAllText(key,
      formatSettingsReportValue_(key, values[key], context.timeZone), true));
  // Lists and percentages in tables are replaced as plain text. Images are
  // only supported in shapes.
  const tableKeys = richKeys.filter(key => !isSettingsReportImage_(key));
  if (tableKeys.length > 0) {
    const tableText = getSettingsReportTableText_(slide);
    tableKeys.filter(key => tableText.includes(key)).forEach(key => {
      const value = Array.isArray(values[key]) ?
        toSettingsReportListItems_(values[key]).join('\n') : values[key];
      slide.replaceAllText(
        key, formatSettingsReportValue_(key, value, context.timeZone), true);
    });
  }
  return keys;
}

/**
 * Replaces the rich placeholders (lists, images and colored percentages) in
 * a shape.
 * @param {!SlidesApp.Shape} shape The shape.
 * @param {string} text The text of the shape before any replacement.
 * @param {!Array<string>} keys The rich placeholders, longest first.
 * @param {!Object} values The placeholders and their values.
 * @param {!Object} context The report context.
 */
function replaceSettingsReportRichPlaceholders_(
  shape, text, keys, values, context) {
  const matches = [];
  keys.forEach(key => {
    let start = text.indexOf(key);
    while (start !== -1) {
      const end = start + key.length;
      if (!matches.some(match => start < match.end && end > match.start)) {
        matches.push({key: key, start: start, end: end});
      }
      start = text.indexOf(key, end);
    }
  });
  if (matches.length === 0) {
    return;
  }
  const image = matches.find(match => isSettingsReportImage_(match.key));
  if (image) {
    replaceSettingsReportImage_(
      shape, text, image.key, values[image.key], context);
    return;
  }
  // Replaced from the end of the text, so that the start of the earlier
  // matches doesn't change.
  matches.sort((a, b) => b.start - a.start).forEach(match => {
    const value = values[match.key];
    const range = shape.getText().getRange(match.start, match.end);
    if (isSettingsReportList_(match.key) || Array.isArray(value)) {
      const items = toSettingsReportListItems_(value).map(
        item => formatSettingsReportValue_('', item, context.timeZone));
      const listText = items.join('\n');
      if (!listText) {
        range.clear();
        return;
      }
      range.setText(listText);
      shape.getText().getRange(match.start, match.start + listText.length)
        .getListStyle().applyListPreset(SlidesApp.ListPreset.DISC_CIRCLE_SQUARE);
      return;
    }
    const formatted = formatSettingsReportValue_(
      match.key, value, context.timeZone);
    if (!formatted) {
      range.clear();
      return;
    }
    range.setText(formatted);
    const color = getSettingsReportPercentColor_(
      match.key, value, context.colorRanges);
    if (color) {
      shape.getText().getRange(match.start, match.start + formatted.length)
        .getTextStyle().setForegroundColor(color);
    }
  });
}

/**
 * Replaces a shape that has an image placeholder with the image, keeping the
 * aspect ratio of the image. The shape is removed if there is no image URL.
 * @param {!SlidesApp.Shape} shape The shape.
 * @param {string} text The text of the shape.
 * @param {string} key The image placeholder.
 * @param {*} value The image URL.
 * @param {!Object} context The report context.
 */
function replaceSettingsReportImage_(shape, text, key, value, context) {
  const url = String(value === null || value === undefined ? '' : value).trim();
  if (text.trim() !== key) {
    context.warnings.push(`The image for ${key} can only replace a shape ` +
      'that contains nothing but the placeholder.');
    return;
  }
  if (!url) {
    shape.remove();
    return;
  }
  try {
    shape.replaceWithImage(url);
  } catch (e) {
    console.log(e);
    context.warnings.push(`The image for ${key} couldn't be inserted from ` +
      `${url}: ${e.message}`);
    shape.getText().clear();
  }
}

/**
 * Warns about placeholders that are still in the presentation.
 * @param {!SlidesApp.Presentation} presentation The report presentation.
 * @param {!Array<string>} warnings Messages for the user.
 */
function warnAboutSettingsReportLeftovers_(presentation, warnings) {
  const leftovers = new Set();
  presentation.getSlides().forEach(slide => {
    const text = getSettingsReportSlideText_(slide);
    (text.match(/--[A-Za-z0-9_]+--/g) || []).forEach(
      placeholder => leftovers.add(placeholder));
  });
  if (leftovers.size > 0) {
    warnings.push('These placeholders have no value, so they are still in ' +
      `the presentation: ${Array.from(leftovers)
        .slice(0, SETTINGS_REPORT_TEXT_LIMITS.LEFTOVERS).join(', ')}. ` +
      'Add them to the "Report Settings" sheet, or remove them from the ' +
      'template.');
  }
}

/**
 * Makes a copy of the template presentation.
 * @param {!Object} settings The report settings.
 * @return {!DriveApp.File} The copy.
 */
function copySettingsReportTemplate_(settings) {
  const templateId = getSettingsReportTemplateId_(settings.templateUrl);
  let template;
  try {
    template = DriveApp.getFileById(templateId);
  } catch (e) {
    console.log(e);
    throw new Error(`The template presentation (${templateId}) couldn't be ` +
      'opened. Check the "Template Presentation URL" in the "Report ' +
      'Settings" sheet and make sure that you have access to the ' +
      'presentation.');
  }
  return template.makeCopy(settings.reportName);
}

/**
 * Returns the ID of the template presentation.
 * @param {string} templateUrl The "Template Presentation URL" setting.
 * @return {string} The presentation ID.
 */
function getSettingsReportTemplateId_(templateUrl) {
  const value = String(templateUrl || '').trim();
  if (!value || value.toLowerCase() === 'default') {
    return SETTINGS_REPORT_TEMPLATE_ID;
  }
  const match = value.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
    value.match(/^([a-zA-Z0-9_-]{25,})$/);
  if (!match) {
    throw new Error('The "Template Presentation URL" in the "Report ' +
      `Settings" sheet isn't a Google Slides URL: ${value}`);
  }
  return match[1];
}

/**
 * Shares the report with the email addresses in the settings.
 * @param {!DriveApp.File} file The report.
 * @param {!Object} settings The report settings.
 * @param {!Array<string>} warnings Messages for the user.
 */
function shareSettingsReport_(file, settings, warnings) {
  const emails = settings.emails.split(/[\s,;]+/).filter(Boolean);
  if (emails.length === 0) {
    return;
  }
  const access = settings.access.toLowerCase();
  try {
    if (access === 'edit') {
      file.addEditors(emails);
    } else if (access === 'comment') {
      file.addCommenters(emails);
    } else {
      file.addViewers(emails);
    }
  } catch (e) {
    console.log(e);
    warnings.push(`The report couldn't be shared with ${emails.join(', ')}: ` +
      e.message);
  }
}

/**
 * Adds a link to the report and the creation date to the "Reports" list in
 * columns F and G of the "Report Settings" sheet.
 * @param {string} reportName The report name.
 * @param {string} reportUrl The report URL.
 */
function addSettingsReportToList_(reportName, reportUrl) {
  const sheet = SpreadsheetApp.getActive()
    .getSheetByName(sheetsMeta.ga4.healthReport.sheetName);
  const firstRow = 3;
  const linkColumn = 6;
  const maxRows = sheet.getMaxRows();
  const links = maxRows >= firstRow ? sheet.getRange(
    firstRow, linkColumn, maxRows - firstRow + 1, 1).getValues() : [];
  let index = links.findIndex(row => row[0] === '');
  if (index === -1) {
    sheet.insertRowsAfter(maxRows, 1);
    index = links.length;
  }
  const row = firstRow + index;
  sheet.getRange(row, linkColumn).setRichTextValue(
    SpreadsheetApp.newRichTextValue().setText(reportName)
      .setLinkUrl(reportUrl).build());
  sheet.getRange(row, linkColumn + 1).setValue(new Date());
}

/**
 * Formats a placeholder value for a slide.
 * @param {string} placeholder The placeholder.
 * @param {*} value The value.
 * @param {string} timeZone The time zone of dates.
 * @return {string} The text for the slide.
 */
function formatSettingsReportValue_(placeholder, value, timeZone) {
  if (value === null) {
    return SETTINGS_REPORT_NOT_AVAILABLE;
  }
  if (value === undefined) {
    return '';
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (value instanceof Date) {
    return Utilities.formatDate(value, timeZone, 'MMMM d, yyyy');
  }
  if (typeof value === 'number') {
    return isSettingsReportPercent_(placeholder) ?
      formatSettingsReportPercent_(value) : formatSettingsReportNumber_(value);
  }
  return String(value);
}

/**
 * Formats a share as a percentage.
 * @param {number} share A number between 0 and 1.
 * @return {string} For example "45%".
 */
function formatSettingsReportPercent_(share) {
  return `${Math.round(share * 100)}%`;
}

/**
 * Formats a number with at most one decimal and thousands separators.
 * @param {number} number
 * @return {string} For example "1,234.5".
 */
function formatSettingsReportNumber_(number) {
  const rounded = Math.round(number * 10) / 10;
  const [integer, decimals] = Math.abs(rounded).toString().split('.');
  return (rounded < 0 ? '-' : '') +
    integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',') +
    (decimals ? `.${decimals}` : '');
}

/**
 * Returns the color of a percentage from the percent range colors.
 * @param {string} placeholder The placeholder.
 * @param {*} value The value.
 * @param {!Array<{start: number, end: number, hex: string}>} colorRanges
 * @return {?string} The color, or null if the value isn't colored.
 */
function getSettingsReportPercentColor_(placeholder, value, colorRanges) {
  if (!isSettingsReportPercent_(placeholder) || typeof value !== 'number' ||
      SETTINGS_REPORT_NEUTRAL_PERCENTS.includes(placeholder)) {
    return null;
  }
  const percent = Math.round(value * 100);
  const range = colorRanges.find(
    colorRange => percent >= colorRange.start && percent <= colorRange.end);
  return range ? range.hex : null;
}

/**
 * Parses the "Percent Range Colors" setting, for example
 * "0-30,#FF0000;31-70,#FFA500;71-100,#34a853".
 * @param {*} value The setting.
 * @param {!Array<string>} warnings Messages for the user.
 * @return {!Array<{start: number, end: number, hex: string}>}
 */
function parseSettingsReportColorRanges_(value, warnings) {
  const ranges = [];
  String(value).split(';').map(range => range.trim()).filter(Boolean)
    .forEach(range => {
      const match = range.match(
        /^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*,\s*(#[0-9a-f]{3,8})$/i);
      if (match) {
        ranges.push({
          start: Number(match[1]),
          end: Number(match[2]),
          hex: match[3]
        });
      } else {
        warnings.push(`The percent range color "${range}" isn't valid. Use ` +
          'the format start-end,#hexcolor, for example 0-30,#FF0000.');
      }
    });
  return ranges;
}

/**
 * Returns the lines of the speaker notes of a slide.
 * @param {!SlidesApp.Slide} slide
 * @return {!Array<string>}
 */
function getSlideMarkers_(slide) {
  try {
    return slide.getNotesPage().getSpeakerNotesShape().getText().asString()
      .split('\n').map(line => line.trim()).filter(Boolean);
  } catch (e) {
    return [];
  }
}

/**
 * Returns all shapes of a slide, including the shapes in groups.
 * @param {!SlidesApp.Slide} slide
 * @return {!Array<!SlidesApp.Shape>}
 */
function getSettingsReportShapes_(slide) {
  const shapes = [];
  const addShapes = elements => elements.forEach(element => {
    const type = element.getPageElementType();
    if (type === SlidesApp.PageElementType.SHAPE) {
      shapes.push(element.asShape());
    } else if (type === SlidesApp.PageElementType.GROUP) {
      addShapes(element.asGroup().getChildren());
    }
  });
  addShapes(slide.getPageElements());
  return shapes;
}

/**
 * Returns the text of a shape.
 * @param {!SlidesApp.Shape} shape
 * @return {string} The text, or an empty string if the shape has no text.
 */
function getSettingsReportShapeText_(shape) {
  try {
    return shape.getText().asString();
  } catch (e) {
    return '';
  }
}

/**
 * Returns the text in the tables of a slide.
 * @param {!SlidesApp.Slide} slide
 * @return {string}
 */
function getSettingsReportTableText_(slide) {
  const texts = [];
  slide.getTables().forEach(table => {
    for (let row = 0; row < table.getNumRows(); row++) {
      for (let column = 0; column < table.getNumColumns(); column++) {
        try {
          texts.push(table.getCell(row, column).getText().asString());
        } catch (e) {
          // Merged cells other than the first one have no text.
        }
      }
    }
  });
  return texts.length > 0 ? '\n' + texts.join('\n') : '';
}

/**
 * Returns all text of a slide.
 * @param {!SlidesApp.Slide} slide
 * @return {string}
 */
function getSettingsReportSlideText_(slide) {
  return getSettingsReportShapes_(slide).map(getSettingsReportShapeText_)
    .join('\n') + getSettingsReportTableText_(slide);
}

/**
 * Whether a placeholder needs to be replaced in its shape: lists, images and
 * percentages with a color.
 * @param {string} placeholder
 * @param {*} value
 * @param {!Object} context The report context.
 * @return {boolean}
 */
function isSettingsReportRichValue_(placeholder, value, context) {
  return isSettingsReportImage_(placeholder) ||
    isSettingsReportList_(placeholder) || Array.isArray(value) ||
    getSettingsReportPercentColor_(
      placeholder, value, context.colorRanges) !== null;
}

/**
 * @param {string} placeholder
 * @return {boolean} Whether the placeholder is replaced with a bulleted list.
 */
function isSettingsReportList_(placeholder) {
  return /list/i.test(placeholder);
}

/**
 * @param {string} placeholder
 * @return {boolean} Whether the placeholder is replaced with an image.
 */
function isSettingsReportImage_(placeholder) {
  return /logo|image|graphic/i.test(placeholder);
}

/**
 * @param {string} placeholder
 * @return {boolean} Whether the placeholder is formatted as a percentage.
 */
function isSettingsReportPercent_(placeholder) {
  return /percent/i.test(placeholder);
}

/**
 * Converts a list value to its items. Text is split at double semicolons.
 * @param {*} value An array or text.
 * @return {!Array<*>} The non-empty items.
 */
function toSettingsReportListItems_(value) {
  const values = Array.isArray(value) ? value : [value];
  return [].concat(...values.map(item => typeof item === 'string' ?
    item.split(';;') : [item]))
    .map(item => typeof item === 'string' ? item.trim() : item)
    .filter(item => item !== '' && item !== null && item !== undefined);
}

/**
 * @param {*} value A cell value.
 * @return {boolean} Whether the value is a checked checkbox or "TRUE".
 */
function isSettingsReportChecked_(value) {
  return value === true || String(value).trim().toUpperCase() === 'TRUE';
}

/**
 * @param {*} value A cell value.
 * @return {boolean} Whether the value is a boolean or "TRUE" or "FALSE".
 */
function isSettingsReportBoolean_(value) {
  return typeof value === 'boolean' ||
    ['TRUE', 'FALSE'].includes(String(value).trim().toUpperCase());
}

/**
 * @param {*} value A cell value.
 * @return {boolean} Whether the value is a spreadsheet error such as #REF!.
 */
function isSettingsReportError_(value) {
  return typeof value === 'string' &&
    /^#(N\/A|REF!|VALUE!|DIV\/0!|NUM!|NAME\?|NULL!|ERROR!|SPILL!|CALC!)/
      .test(value.trim());
}

/**
 * Converts a cell value to a number.
 * @param {*} value A cell value, for example 120 or "No Access".
 * @return {?number} The number, or null if the value isn't a number.
 */
function toSettingsReportNumber_(value) {
  if (value === '' || value === null || value === undefined ||
      typeof value === 'boolean') {
    return null;
  }
  const number = Number(value);
  return isNaN(number) ? null : number;
}

/**
 * @param {number} part
 * @param {number} total
 * @return {?number} The share, or null if the total is zero.
 */
function getSettingsReportRatio_(part, total) {
  return total > 0 ? part / total : null;
}

/**
 * @param {number} sum
 * @param {number} count
 * @return {?number} The average rounded to one decimal, or null.
 */
function getSettingsReportAverage_(sum, count) {
  return count > 0 ? Math.round(sum / count * 10) / 10 : null;
}

/**
 * Normalizes a label of the "Report Settings" sheet.
 * @param {*} label
 * @return {string} The label in lowercase without extra spaces.
 */
function normalizeSettingsReportLabel_(label) {
  return String(label).trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * @param {number} count
 * @param {string} singular
 * @param {string} plural
 * @return {string} For example "1 property" or "3 properties".
 */
function countSettingsReportItems_(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`;
}

/**
 * @param {number} count
 * @param {string} singular
 * @param {string} plural
 * @return {string} For example "the property" or "the 3 properties".
 */
function theSettingsReportItems_(count, singular, plural) {
  return count === 1 ? `the ${singular}` : `the ${count} ${plural}`;
}

/**
 * Lists the first names and the number of other names.
 * @param {!Array<string>} names
 * @return {string} For example "Shop, Blog and 3 more".
 */
function listSettingsReportNames_(names) {
  const limit = SETTINGS_REPORT_TEXT_LIMITS.NAMES_PER_FINDING;
  const shown = names.slice(0, limit).map(truncateSettingsReportName_);
  if (names.length > limit) {
    return `${shown.join(', ')} and ${names.length - limit} more`;
  }
  return shown.length > 1 ?
    `${shown.slice(0, -1).join(', ')} and ${shown[shown.length - 1]}` :
    shown.join('');
}

/**
 * Shortens a long name.
 * @param {string} name
 * @return {string}
 */
function truncateSettingsReportName_(name) {
  const limit = SETTINGS_REPORT_TEXT_LIMITS.NAME_CHARACTERS;
  return name.length > limit ? `${name.slice(0, limit - 1).trim()}…` : name;
}