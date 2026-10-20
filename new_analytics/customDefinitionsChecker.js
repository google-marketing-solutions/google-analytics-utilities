/**
 * Copyright 2026 Google LLC
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
 * @fileoverview Custom Definitions Checker.
 *
 * Lists the custom dimensions and custom metrics of the properties selected
 * in the "Account Summaries" sheet and uses the GA4 Data API to count how
 * many events collected each of them in the last 30 days. This makes it easy
 * to find custom definitions that are registered but not collected at all.
 */

/** The last 30 full days (ending yesterday) in each property's time zone. */
const CHECKER_DATE_RANGE = {startDate: '30daysAgo', endDate: 'yesterday'};

/** The maximum number of requests in a single batchRunReports call. */
const CHECKER_BATCH_SIZE = 5;

/** The maximum number of event names listed in the "Top Events" column. */
const CHECKER_TOP_EVENTS_LIMIT = 10;

/**
 * No new Data API requests are started after this many milliseconds so that
 * the results can still be written before the 6 minute Apps Script limit.
 */
const CHECKER_TIME_BUDGET_MS = 5 * 60 * 1000;

/** The Data API name prefix of a custom definition for each scope. */
const CHECKER_API_NAME_PREFIX = {
  EVENT: 'customEvent:',
  USER: 'customUser:',
  ITEM: 'customItem:'
};

/**
 * Item-scoped custom dimensions are not compatible with eventCount or
 * eventName, so they are checked with the item-scoped ecommerce metrics
 * instead. Each metric counts the items (units) of one ecommerce event.
 */
const CHECKER_ITEM_METRICS = [
  {metric: 'itemsViewedInList', eventName: 'view_item_list'},
  {metric: 'itemsClickedInList', eventName: 'select_item'},
  {metric: 'itemsViewedInPromotion', eventName: 'view_promotion'},
  {metric: 'itemsClickedInPromotion', eventName: 'select_promotion'},
  {metric: 'itemsViewed', eventName: 'view_item'},
  {metric: 'itemsAddedToCart', eventName: 'add_to_cart'},
  {metric: 'itemsCheckedOut', eventName: 'begin_checkout'},
  {metric: 'itemsPurchased', eventName: 'purchase'}
];

/**
 * The values of the "Status" column.
 * @enum {string}
 */
const CHECKER_STATUS = {
  COLLECTED: 'Collected',
  NOT_COLLECTED: 'Not collected',
  NONE_DEFINED: 'None defined',
  NOT_CHECKED: 'Not checked',
  ERROR: 'Error'
};

/**
 * The explanations written to the "Notes" column.
 * @enum {string}
 */
const CHECKER_NOTES = {
  USER_SCOPE: 'User-scoped: counts the events of users who had this user ' +
    'property set.',
  ITEM_SCOPE: 'Item-scoped: the counts are item units, not events. Only ' +
    'these ecommerce events are checked: ' +
    CHECKER_ITEM_METRICS.map(itemMetric => itemMetric.eventName).join(', ') +
    '.',
  TIME_LIMIT: 'Not checked to stay within the Apps Script time limit. ' +
    'Select fewer properties and run the report again.'
};

/**
 * Writes the custom dimensions of the selected properties to the
 * "Custom Dimensions Checker" sheet, together with the number of events that
 * collected each of them in the last 30 days.
 */
function writeGA4CustomDimensionsCheckerToSheet() {
  runCustomDefinitionsChecker_({
    resourceKey: 'customDimensions',
    sheetMeta: sheetsMeta.ga4.customDimensionsChecker,
    buildRequest: buildCustomDimensionCheckRequest_,
    summarizeReport: summarizeCustomDimensionReport_,
    buildRow: buildCustomDimensionCheckRow_
  });
}

/**
 * Writes the custom metrics of the selected properties to the
 * "Custom Metrics Checker" sheet, together with their total value and the
 * number of events that recorded them in the last 30 days.
 */
function writeGA4CustomMetricsCheckerToSheet() {
  runCustomDefinitionsChecker_({
    resourceKey: 'customMetrics',
    sheetMeta: sheetsMeta.ga4.customMetricsChecker,
    buildRequest: buildCustomMetricCheckRequest_,
    summarizeReport: summarizeCustomMetricReport_,
    buildRow: buildCustomMetricCheckRow_
  });
}

/**
 * Checks the custom definitions of every selected property and writes the
 * results to the checker's sheet.
 * @param {!Object} checker The settings of the custom dimensions or the
 *     custom metrics checker.
 */
function runCustomDefinitionsChecker_(checker) {
  // Accounts without properties are listed with an empty property ID.
  const properties = getSelectedGa4Properties().filter(row => row[3]);
  if (properties.length === 0) {
    SpreadsheetApp.getUi().alert(
      'Please select at least one property in the "Account Summaries" sheet.');
    return;
  }
  const deadline = Date.now() + CHECKER_TIME_BUDGET_MS;
  const rows = [];

  properties.forEach(property => {
    const propertyColumns = property.slice(0, 4);
    if (Date.now() > deadline) {
      rows.push(checker.buildRow(propertyColumns, null, {
        status: CHECKER_STATUS.NOT_CHECKED,
        note: CHECKER_NOTES.TIME_LIMIT
      }));
      return;
    }
    const propertyName = ENTITY_PREFIX.PROPERTIES + property[3];
    const response = listGA4Entities(checker.resourceKey, propertyName);
    const definitions = response[checker.resourceKey] || [];
    if (definitions.length === 0) {
      // listGA4Entities returns the error instead of throwing it.
      rows.push(checker.buildRow(propertyColumns, null, response.message ? {
        status: CHECKER_STATUS.ERROR,
        note: getCheckerErrorMessage_(response)
      } : {status: CHECKER_STATUS.NONE_DEFINED}));
      return;
    }
    const results = runCheckerReports_(
      propertyName, definitions.map(checker.buildRequest), deadline);
    definitions.forEach((definition, i) => {
      const result = results[i];
      rows.push(checker.buildRow(propertyColumns, definition, result.report ?
        checker.summarizeReport(definition, result.report) : result));
    });
  });

  clearSheetContent(checker.sheetMeta);
  writeToSheet(rows, checker.sheetMeta.sheetName);
}

/**
 * Builds the Data API request that checks a custom dimension. Only events
 * (or items) where the custom dimension is set are counted.
 * @param {!Object} customDimension A custom dimension from the Admin API.
 * @return {!Object} A RunReportRequest.
 */
function buildCustomDimensionCheckRequest_(customDimension) {
  const prefix = CHECKER_API_NAME_PREFIX[customDimension.scope] ||
    CHECKER_API_NAME_PREFIX.EVENT;
  const dimensionIsSet = {
    notExpression: {
      filter: {
        fieldName: prefix + customDimension.parameterName,
        stringFilter: {matchType: 'EXACT', value: '(not set)'}
      }
    }
  };
  if (customDimension.scope === 'ITEM') {
    return {
      dateRanges: [CHECKER_DATE_RANGE],
      metrics: CHECKER_ITEM_METRICS.map(itemMetric => ({name: itemMetric.metric})),
      dimensionFilter: dimensionIsSet
    };
  }
  return {
    dateRanges: [CHECKER_DATE_RANGE],
    dimensions: [{name: 'eventName'}],
    metrics: [{name: 'eventCount'}],
    dimensionFilter: dimensionIsSet,
    orderBys: [{metric: {metricName: 'eventCount'}, desc: true}]
  };
}

/**
 * Builds the Data API request that checks a custom metric. It returns the
 * metric and the event count for each event name.
 * @param {!Object} customMetric A custom metric from the Admin API.
 * @return {!Object} A RunReportRequest.
 */
function buildCustomMetricCheckRequest_(customMetric) {
  const prefix = CHECKER_API_NAME_PREFIX[customMetric.scope] ||
    CHECKER_API_NAME_PREFIX.EVENT;
  return {
    dateRanges: [CHECKER_DATE_RANGE],
    dimensions: [{name: 'eventName'}],
    metrics: [
      {name: prefix + customMetric.parameterName},
      {name: 'eventCount'}
    ],
    orderBys: [{metric: {metricName: 'eventCount'}, desc: true}]
  };
}

/**
 * Runs the Data API requests of a property in batches. If a batch fails, its
 * requests are run one at a time, so that a single failing request (for
 * example for a definition that was created too recently to be queried)
 * doesn't hide the results of the other definitions.
 * @param {string} propertyName The property resource name.
 * @param {!Array<!Object>} requests The RunReportRequests to run.
 * @param {number} deadline The time after which no requests are started.
 * @return {!Array<!Object>} For each request either {report} or the
 *     {status, note} explaining why there is no report.
 */
function runCheckerReports_(propertyName, requests, deadline) {
  const results = [];
  for (let start = 0; start < requests.length; start += CHECKER_BATCH_SIZE) {
    const batch = requests.slice(start, start + CHECKER_BATCH_SIZE);
    if (Date.now() > deadline) {
      batch.forEach(() => results.push({
        status: CHECKER_STATUS.NOT_CHECKED,
        note: CHECKER_NOTES.TIME_LIMIT
      }));
      continue;
    }
    let reports = null;
    try {
      reports = AnalyticsData.Properties.batchRunReports(
        {requests: batch}, propertyName).reports || [];
    } catch (e) {
      console.log(e);
    }
    if (reports) {
      batch.forEach((request, i) => results.push(reports[i] ?
        {report: reports[i]} :
        {status: CHECKER_STATUS.ERROR, note: 'No report was returned.'}));
      Utilities.sleep(ga4RequestDelay);
    } else {
      batch.forEach(request => results.push(
        runSingleCheckerReport_(propertyName, request)));
    }
  }
  return results;
}

/**
 * Runs a single Data API request.
 * @param {string} propertyName The property resource name.
 * @param {!Object} request The RunReportRequest to run.
 * @return {!Object} Either {report} or the {status, note} of the error.
 */
function runSingleCheckerReport_(propertyName, request) {
  try {
    return {report: AnalyticsData.Properties.runReport(request, propertyName)};
  } catch (e) {
    return {status: CHECKER_STATUS.ERROR, note: getCheckerErrorMessage_(e)};
  } finally {
    Utilities.sleep(ga4RequestDelay);
  }
}

/**
 * Summarizes the Data API report of a custom dimension.
 * @param {!Object} customDimension A custom dimension from the Admin API.
 * @param {!Object} report The RunReportResponse of the custom dimension.
 * @return {!Object} The values of the result columns.
 */
function summarizeCustomDimensionReport_(customDimension, report) {
  const rows = report.rows || [];
  if (customDimension.scope === 'ITEM') {
    // Each item metric counts the items of one ecommerce event.
    const itemEvents = CHECKER_ITEM_METRICS
      .map((itemMetric, i) => [
        itemMetric.eventName,
        rows.reduce((sum, row) =>
          sum + toCheckerNumber_((row.metricValues[i] || {}).value), 0)
      ])
      .filter(itemEvent => itemEvent[1] > 0)
      .sort((a, b) => b[1] - a[1]);
    const itemCount = itemEvents.reduce((sum, event) => sum + event[1], 0);
    return {
      eventCount: itemCount,
      status: getCheckerStatus_(itemCount),
      topEvents: formatCheckerTopEvents_(itemEvents),
      note: CHECKER_NOTES.ITEM_SCOPE
    };
  }
  const topEvents = rows.map(row => [
    row.dimensionValues[0].value,
    toCheckerNumber_(row.metricValues[0].value)
  ]);
  const eventCount = topEvents.reduce((sum, event) => sum + event[1], 0);
  return {
    eventCount: eventCount,
    status: getCheckerStatus_(eventCount),
    topEvents: formatCheckerTopEvents_(topEvents),
    note: customDimension.scope === 'USER' ? CHECKER_NOTES.USER_SCOPE : ''
  };
}

/**
 * Summarizes the Data API report of a custom metric. Only the event names
 * that recorded a non-zero value for the metric are counted.
 * @param {!Object} customMetric A custom metric from the Admin API.
 * @param {!Object} report The RunReportResponse of the custom metric.
 * @return {!Object} The values of the result columns.
 */
function summarizeCustomMetricReport_(customMetric, report) {
  let eventCount = 0;
  let totalValue = 0;
  const topEvents = [];
  (report.rows || []).forEach(row => {
    const value = toCheckerNumber_(row.metricValues[0].value);
    if (value !== 0) {
      const events = toCheckerNumber_(row.metricValues[1].value);
      eventCount += events;
      totalValue += value;
      topEvents.push([row.dimensionValues[0].value, events]);
    }
  });
  return {
    eventCount: eventCount,
    // Removes floating point noise, e.g. 0.30000000000000004 becomes 0.3.
    totalValue: Number(totalValue.toPrecision(15)),
    status: getCheckerStatus_(topEvents.length),
    topEvents: formatCheckerTopEvents_(topEvents)
  };
}

/**
 * Builds a row of the "Custom Dimensions Checker" sheet.
 * @param {!Array} propertyColumns The account and property names and ids.
 * @param {?Object} customDimension The custom dimension, or null for rows
 *     that describe the whole property.
 * @param {!Object} check The values of the result columns.
 * @return {!Array} The row.
 */
function buildCustomDimensionCheckRow_(
    propertyColumns, customDimension, check) {
  const definition = customDimension || {};
  return [
    ...propertyColumns,
    definition.displayName || '',
    definition.parameterName || '',
    definition.scope || '',
    getCheckerCellValue_(check.eventCount),
    check.status,
    check.topEvents || '',
    check.note || ''
  ];
}

/**
 * Builds a row of the "Custom Metrics Checker" sheet.
 * @param {!Array} propertyColumns The account and property names and ids.
 * @param {?Object} customMetric The custom metric, or null for rows that
 *     describe the whole property.
 * @param {!Object} check The values of the result columns.
 * @return {!Array} The row.
 */
function buildCustomMetricCheckRow_(propertyColumns, customMetric, check) {
  const definition = customMetric || {};
  return [
    ...propertyColumns,
    definition.displayName || '',
    definition.parameterName || '',
    definition.scope || '',
    definition.measurementUnit || '',
    getCheckerCellValue_(check.eventCount),
    getCheckerCellValue_(check.totalValue),
    check.status,
    check.topEvents || '',
    check.note || ''
  ];
}

/**
 * Formats the event names and event counts for the "Top Events" column.
 * @param {!Array<!Array>} events Pairs of event name and event count, sorted
 *     by event count.
 * @return {string} For example "page_view (120), scroll (40), +3 more".
 */
function formatCheckerTopEvents_(events) {
  const listed = events.slice(0, CHECKER_TOP_EVENTS_LIMIT)
    .map(([eventName, eventCount]) => `${eventName} (${eventCount})`);
  if (events.length > listed.length) {
    listed.push(`+${events.length - listed.length} more`);
  }
  return listed.join(', ');
}

/**
 * Returns the status for a number of events (or items, or event names).
 * @param {number} count
 * @return {string} The status.
 */
function getCheckerStatus_(count) {
  return count > 0 ? CHECKER_STATUS.COLLECTED : CHECKER_STATUS.NOT_COLLECTED;
}

/**
 * Converts a Data API metric value, which is a string, to a number.
 * @param {string|undefined} value
 * @return {number}
 */
function toCheckerNumber_(value) {
  return Number(value) || 0;
}

/**
 * Returns the value for a cell, keeping 0 but leaving undefined values empty.
 * @param {number|undefined} value
 * @return {number|string}
 */
function getCheckerCellValue_(value) {
  return value === undefined ? '' : value;
}

/**
 * Returns a readable error message without the Apps Script API call prefix.
 * @param {!Object} error The error thrown by an API call.
 * @return {string} The error message.
 */
function getCheckerErrorMessage_(error) {
  const message = error && error.message ? error.message : String(error);
  return message.replace(/^.*?API call to \S+ failed with error:\s*/, '');
}
