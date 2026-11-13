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
 * Gets the user report settings from the "User Access Report Settings" sheet.
 * @return {!Array<!Array<Date|string|boolean>>} A double array of settings
 * data.
 */
function getUserAccessReportRequestSettingsFromSheet() {
  const sheetName = sheetsMeta.ga4.userAccessReportSettings.sheetName;
  const values = ss.getSheetByName(sheetName).getRange(1, 2, 12, 1).getValues();
  return new UserAccessReportRequestSettings(values.flat());
}

/**
 * Send user access report request.
 * @param {!UserAccessReportRequest} requestSettings
 * @param {string} entityString
 * @return {!Object} A user access report response object.
 */
function sendUserAccessReportRequest(requestSettings, entityString) {
  delete requestSettings.accountLevelReport;
  if (/accounts/.test(entityString)) {
    return AnalyticsAdmin.Accounts.runAccessReport(
      requestSettings, entityString);
  } else {
    return AnalyticsAdmin.Properties.runAccessReport(
      requestSettings, entityString);
  }
}

/**
 * Requests account or property user access reports for the for the specified
 * entities and returns a double array where each inner array contains a user
 * access record.
 * @param {!Array<!Entities>} entities An array of entity objects.
 * @param {!UserAccessReportRequestSettings} requestSettings The request
 * settings from the user access report settings sheet.
 * @param {!Array<!Array<string>>} A double array representing the user access
 * records.
 */
function getAllUserAccessRecords(entities, requestSettings) {
  const records = [];
  // Loop through the selected entities.
  for (const currentEntity of entities) {
    let response = {};
    // Send account level user access report request if the settings indicate
    // that the request is to be made at the account level.
    if (requestSettings.accountLevelReport) {
      response = sendUserAccessReportRequest(
        requestSettings, `${ENTITY_PREFIX.ACCOUNTS}${currentEntity.accountId}`);
    } else {
      response = sendUserAccessReportRequest(
        requestSettings,
        `${ENTITY_PREFIX.PROPERTIES}${currentEntity.propertyId}`);
    }
    // If the there are rows in the response, then loop through them and push
    // the dimension and metric values of each row to the records array while
    // adding the current entity values.
    if (response.rowCount > 0) {
      for (const row of response.rows) {
        records.push([
          currentEntity.accountName,
          currentEntity.accountId,
          currentEntity.propertyName,
          currentEntity.propertyId,
          ...row.dimensionValues.map(dimension => dimension.value),
          ...row.metricValues.map(metric => metric.value),
        ]);
      }
    }
  }
  return records;
}

/**
 * Generates a array of selected entities based on the data in the account
 * summaries sheet.
 * @param {!Array<!Array<string|number>>} sheetRows A double array of data from
 * the account summaries array.
 * @param {!UserAccessReportRequestSettings} requestSettings The request
 * settings from the user access report settings sheet.
 * @return {!Array<!Entities>} An array of entity objects.
 */
function createUserAccessReportSelectedEntitiesArray(
  sheetRows, requestSettings) {
    const previouslyExistingIds = [];
    const entities = [];
    // Loop through each row of the sheet data.
    for (const row of sheetRows) {
      const accountId = row[1];
      // If the access report will be run at the account level, then only set
      // the account name and ID for a selected entity once. If the access
      // report will be run at the property level, then create an entity that
      // includes the account name, account ID, property name, and property ID.
      if (requestSettings.accountLevelReport) {
        if (previouslyExistingIds.indexOf(accountId) == -1) {
          row.splice(2, 3);
          entities.push(new Entity(row));
          previouslyExistingIds.push(accountId);
        }
      } else {
        row.splice(4, 1);
        entities.push(new Entity(row));
      }
    }
  return entities;
}

/**
 * Creates user access report headers based on the selected dimensions and
 * metrics.
 * @param {!Array<!Object<string>>} dimensions An array of objects containing
 * the dimension names.
 * @param {!Array<!Object<string>>} metrics An array of objects containing
 * the metric names.
 * @param {number} numberOfDateRanges The number of date ranges.
 * @return {!Array<string>} An array of header values.
 */
function createUserAccessReportHeaders(
  dimensions, metrics, numberOfDateRanges) {
  const dimensionNameArray = dimensions.map((value) => value.dimensionName);
  const metricNameArray = metrics.map((value) => value.metricName);
  if (numberOfDateRanges == 1) {
    return [
      'Report Account',
      'Report Account ID',
      'Report Property',
      'Report Property ID',
      ...dimensionNameArray,
      ...metricNameArray,
    ];
  } else {
    return [
      'Report Account',
      'Report Account ID',
      'Report Property',
      'Report Property ID',
      ...dimensionNameArray,
      'Date Range Data Accessed',
      ...metricNameArray,
    ];
  }
}

/**
 * Gets the user access reports and writes the access records to the "User
 * Access Report" sheet after first clearing the contents of that sheet.
 */
function writeUserAccessReportDataToSheet() {
  const requestSettings = getUserAccessReportRequestSettingsFromSheet();
  const entities = createUserAccessReportSelectedEntitiesArray(
    getSelectedGa4Properties(), requestSettings);
  const records = getAllUserAccessRecords(entities, requestSettings);
  const headers = createUserAccessReportHeaders(
    requestSettings.dimensions,
    requestSettings.metrics,
    requestSettings.dateRanges.length);
  const data = [headers, ...records];
  const sheet = ss.getSheetByName(sheetsMeta.ga4.userAccessReport.sheetName);
  sheet.clearContents();
  sheet.getRange(1, 1, data.length, data[0].length)
    .setValues(neutralizeFormulas(data));
}