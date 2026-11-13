/**
 * Copyright 2023 Google LLC
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
 * Alpha Analytics Data API requests.
 */

/**
 * Sends audience list list requests to the API and combines all pagineated 
 * results.
 * @param {string} propertyName The resource name for the property.
 * @return {!Object} The audience list response.
 */
function listAudienceListsRequest(propertyName) {
  try {
    const options = {pageSize: 1000};
    const response = AnalyticsDataAlpha.Properties.AudienceLists.list(
      propertyName, options);
    Utilities.sleep(ga4RequestDelay);
    let nextPageToken = response.nextPageToken;
    while (nextPageToken) {
      options.pageToken = nextPageToken;
      const newResponse = AnalyticsDataAlpha.Properties.AudienceLists.list(
        propertyName, options);
      response.audienceLists = response.audienceLists.concat(
        newResponse.audienceLists);
      nextPageToken = newResponse.nextPageToken;
      Utilities.sleep(ga4RequestDelay);
    }
    return response;
  } catch(e) {
    Logger.log(e);
    SpreadsheetApp.getUi().alert(e.message);
  }
}

/**
 * Returns the audience list object for a given audience.
 * @param {string} audienceName The resource name for an audience list.
 * @return {!Object} The audience list object.
 */
function getAudienceListsRequest(audienceListName) {
  try {
    const response = AnalyticsDataAlpha.Properties.AudienceLists.get(
      audienceListName);
    Utilities.sleep(ga4RequestDelay);
    return response;
  } catch(e) {
    Logger.log(e);
    SpreadsheetApp.getUi().alert(e.message);
  }
}

/**
 * Creates a new audience list.
 * @param {string} propertyName The property name where the audience list will 
 * be created.
 * @param {!Object} payload The settings for the new audience list to be create.
 * @return {!Object} The newly created audience list object.
 */
function createAudienceListsRequest(propertyName, payload) {
  try {
    const response = AnalyticsDataAlpha.Properties.AudienceLists.create(
      payload, propertyName);
    Utilities.sleep(ga4RequestDelay);
    return response;
  } catch(e) {
    Logger.log(e);
    SpreadsheetApp.getUi().alert(e.message);
  }
}

/**
 * Queries an audience list and returns an object containing the audience list
 * row data.
 * @param {string} audienceListName The audience list name of the audience list
 * to be queried.
 */
function queryAudienceListsRequest(audienceListName) {
  try {
    const options = {
      offset: 0,
      limit: 250000
    };
    const response = AnalyticsDataAlpha.Properties.AudienceLists.query(
      options, audienceListName);
    Utilities.sleep(ga4RequestDelay);
    while (response.rowCount > response.audienceRows.length) {
      options.offset = response.audienceRows.length;
      const newResponse = AnalyticsDataAlpha.Properties.AudienceLists.query(
        options, audienceListName);
      response.audienceRows = response.audienceRows.concat(
        newResponse.audienceRows);
      Utilities.sleep(ga4RequestDelay);
    }
    return response;
  } catch(e) {
    Logger.log(e);
    SpreadsheetApp.getUi().alert(e.message);
  }
}

/**
 * Helper functions.
 */

/**
 * Loops through the dimension names in the dimension object and returns the
 * names as a comma delimited string intended to be written to the spreadsheet.
 * @param {!Array<!Object>} dimensions An array of dimension name objects.
 * @return {string} The dimension name string.
 */
function parseAudienceListDimensionNames(dimensions) {
  let dimensionNames = [];
  dimensions.forEach(dimension => {
    dimensionNames.push(dimension.dimensionName);
  });
  return dimensionNames.join(', ');
}

/**
 * Splits the dimensions name string into an array and creates an array of
 * dimension name objects.
 * @param {string} dimensionsString A comma delimited string of dimension names.
 * @return {!Array<!Object>} An array of dimension names.
 */
function formatAudienceListDimensions(dimensionsString) {
  dimensionsArray = dimensionsString.split(',');
  return dimensionsArray.reduce((arr, dimension) => {
    arr.push({
      dimensionName: dimension.trim()
    });
    return arr;
  }, []);
}

/**
 * Formats audience list row data into a double array so that it can be written
 * to a sheet.
 * @param {!Array<!Object>} data The row data array from an audience list query.
 * @return {!Array<!Array>} A double array containing the audience list row
 * values to be written to a sheet.
 */
function formatAudienceListData(data) {
  const finalArray = [];
  let index = 0, dataLength = data.length;
  while (index < dataLength) {
    let secondIndex = 0;
    const tempArray = [];
    const dimensionValueLength = data[index].dimensionValues.length;
    while (secondIndex < dimensionValueLength) {
      tempArray.push(data[index].dimensionValues[secondIndex].value);
      ++secondIndex;
    }
    finalArray.push(tempArray);
    ++index;
  }
  return finalArray;
}

/**
 * Formats the audience list row data into a CSV string so that it can be
 * uploaded to a BigQuery table.
 * @param {!Array<!Object>} data The row data array from an audience list query.
 * @return {string} A string of the row data.
 */
function formatAudienceListCSV(data) {
  return data.audienceRows.reduce((str, dimensions) => {
    for (let i = 0; i < dimensions.dimensionValues.length; i++) {
      const currentDimensionValue = dimensions.dimensionValues[i];
      if (i == dimensions.dimensionValues.length - 1) {
        str += `"${currentDimensionValue.value.toString()}"\n`;
      } else {
        str += `"${currentDimensionValue.value.toString()}",`;
      }
    }
    return str;
  }, '');
}

/**
 * Creates the BigQuery table schema fields array based on the dimension names
 * returned when querying an audience list.
 * @param {!Array<!Object>} An array of dimension names.
 * @return {!Array<!Object>} An array of BigQuery table fields.
 */
function constructTableSchemaFields(dimensionNames) {
  return dimensionNames.reduce((arr, dimension) => {
    arr.push({
      name: dimension.dimensionName,
      type: 'STRING'
    });
    return arr;
  }, []);
}

/**
 * Formats the audiences lists for a given set of properties so that they can
 * be saved to a sheet.
 * @param {!Array<!Array>} A double array containing property names.
 * @return {!Array<!Array>} A double array of audience list metadata.
 */
function listAudienceLists(properties) {
  let sheetValuesArray = [];
  properties.forEach(property => {
    const propertyName = `properties/${property[3]}`;
    const audienceLists = listAudienceListsRequest(propertyName).audienceLists;
    if (audienceLists) {
      audienceLists.forEach(audienceList => {
        sheetValuesArray.push([
        property[0],
        property[1],
        property[2],
        property[3],
        audienceList.audienceDisplayName,
        audienceList.audience,
        audienceList.name,
        parseAudienceListDimensionNames(audienceList.dimensions),
        audienceList.beginCreatingTime,
        audienceList.state,
        audienceList.rowCount]);
      });
    }
  });
  return sheetValuesArray;
}

/**
 * Menu functions.
 */

/**
 * Writes existing account, property, and audience names for for the selected 
 * properties to the audience lists sheet.
 */
function writeGA4AudiencesToAudiencesListsSheet() {
  const selectedProperties = getSelectedGa4Properties();
  const audiences = listSelectedGA4Audiences(selectedProperties);
  let formattedValues = [];
  if (audiences) {
    formattedValues = audiences.reduce((arr, audience) => {
      arr.push([
        audience[0], // Account Name
        audience[1], // Account ID
        audience[2], // Property Name
        audience[3], // Property Name
        audience[4], // Audience Name
        audience[5], // Audience ID
        '', '', '', '', '']);
      return arr;
    }, []);
  }
  clearSheetContent(sheetsMeta.ga4.audienceLists);
  writeToSheet(formattedValues, sheetsMeta.ga4.audienceLists.sheetName);
}

/**
 * Writes audience lists metadata to the sheet based on the selected properties.
 */
function writeAudienceListsToSheet() {
  const selectedProperties = getSelectedGa4Properties();
  const audienceLists = listAudienceLists(selectedProperties);
  clearSheetContent(sheetsMeta.ga4.audienceLists);
  writeToSheet(audienceLists, sheetsMeta.ga4.audienceLists.sheetName);
}

/**
 * Uses the audience list get method to check the status of selected audience
 * lists and writes the response to the sheet.
 */
function checkAudienceListsState() {
  const audienceListsSheet = ss.getSheetByName(
    sheetsMeta.ga4.audienceLists.sheetName);
  const audienceLists = getDataFromSheet(
    sheetsMeta.ga4.audienceLists.sheetName);
  if (audienceLists.length > 0) {
    audienceLists.forEach((audienceList, index) => {
      if (audienceList[audienceList.length - 3]) {
        const newAudienceListState = getAudienceListsRequest(audienceList[6]);
        audienceListsSheet.getRange(index + 2, 8, 1, 4).setValues(
          neutralizeFormulas([[
            parseAudienceListDimensionNames(newAudienceListState.dimensions),
            newAudienceListState.beginCreatingTime,
            newAudienceListState.state,
            newAudienceListState.rowCount
          ]]));
        audienceListsSheet
        .getRange(index + 2, audienceListsSheet.getLastColumn())
        .setValue(`State Check Completed`);
      }
    });
  }
}

/**
 * Creates new audience lists based on the information in the sheet.
 */
function createAudienceLists() {
  const audienceListsSheet = ss.getSheetByName(
    sheetsMeta.ga4.audienceLists.sheetName);
  const audienceLists = getDataFromSheet(
    sheetsMeta.ga4.audienceLists.sheetName);
  if (audienceLists.length > 0) {
    audienceLists.forEach((audienceList, index) => {
      if (audienceList[audienceList.length - 4]) {
        const payload = {
          audience: audienceList[5],
          dimensions: formatAudienceListDimensions(audienceList[7])
        }
        const newAudienceList = createAudienceListsRequest(
          `properties/${audienceList[3]}`, payload);
        audienceListsSheet.getRange(index + 2, 7, 1, 5).setValues(
          neutralizeFormulas([[
            newAudienceList.response.name,
            parseAudienceListDimensionNames(
              newAudienceList.response.dimensions),
            newAudienceList.response.beginCreatingTime,
            newAudienceList.response.state,
            newAudienceList.response.rowCount
          ]]));
        audienceListsSheet
          .getRange(index + 2, audienceListsSheet.getLastColumn())
          .setValue(`${newAudienceList.response.name}: Created`);
      }
    });
  }
}

/**
 * Exports audience list row data either to a spreadsheet or BigQuery table
 * based on the information in the sheet.
 */
function exportAudienceListsData() {
  const audienceListsMetaData = getDataFromSheet(
    sheetsMeta.ga4.audienceLists.sheetName);
  const audienceListSheet = 
    ss.getSheetByName(sheetsMeta.ga4.audienceLists.sheetName);
  if (audienceListsMetaData.length > 0) {
    audienceListsMetaData.forEach((audienceListMetaData, index) => {
      if (audienceListMetaData[audienceListMetaData.length - 2]) {
        // Export to sheet.
        const destinationType = audienceListMetaData[11];
        if (destinationType == 'Spreadsheet' && 
        audienceListMetaData[10] < 500000000) {
          // Query and format the data for sheets.
          let formattedData = [audienceListMetaData[7].split(',')];
          const audienceListData = queryAudienceListsRequest(
            audienceListMetaData[6]);
          formattedData = formattedData.concat(
            formatAudienceListData(audienceListData.audienceRows))
          const exportToNewSpreadsheet = audienceListMetaData[12];
          if (exportToNewSpreadsheet) {
            // Export to new spreadsheet.
            const newSpreadsheet = SpreadsheetApp.create(
              `Audience List Export - ${audienceListMetaData[4]}`);
            newSpreadsheet
              .getSheets()[0] // Gets first sheet of new Spreadsheet
              .getRange(1, 2, formattedData.length, formattedData[0].length)
              .setValues(neutralizeFormulas(formattedData))
              .setNumberFormat('#.##########')
            // Save link to new spreadsheet to sheet.
            audienceListSheet
            .getRange(index + 2, audienceListSheet.getLastColumn())
            .setValue(`=HYPERLINK("${newSpreadsheet.getUrl()}", "Export")`); 
          } else {
            // Export to existing spreadsheet as a new sheet.
            const existingSpreadsheet = SpreadsheetApp.openByUrl(
              audienceListMetaData[13]);
            // Create new sheet in existing spreadsheet.
            const originalNewSheetName = 
              `Audience List Export - ${audienceListMetaData[4]}`;
            let newSheetName = originalNewSheetName;
            // Check if the sheet name already exists.
            let copyCount = 0;
            while (existingSpreadsheet.getSheetByName(newSheetName)) {
              copyCount++;
              newSheetName = `${originalNewSheetName} - Copy ${copyCount}`;
            }
            const newSheet = existingSpreadsheet.insertSheet(newSheetName);
            newSheet
              .getRange(1, 1, formattedData.length, formattedData[0].length)
              .setValues(neutralizeFormulas(formattedData))
              .setNumberFormat('#.##########');
            // Save link to the spreadsheet.
            audienceListSheet
            .getRange(index + 2, audienceListSheet.getLastColumn())
            .setValue(
              `=HYPERLINK("${existingSpreadsheet.getUrl()}", "Export")`);
          }
        // Export to BigQuery.
        } else if (destinationType == 'BigQuery') {
          // Get data and format it as a CSV file to be uploaded.
          const data = queryAudienceListsRequest(audienceListMetaData[6]);
          const csvString = formatAudienceListCSV(data);
          //const csvString = '"12345678.123456"\n"123456778.1267"\n';
          const blob = Utilities.newBlob(csvString, 'text/csv');
          blob.setContentType('application/octet-stream');
          // BigQuery location information.
          const projectId = audienceListMetaData[14];
          const datasetId = audienceListMetaData[15];
          const tableId = audienceListMetaData[16];
          if (projectId && datasetId && tableId) {
              // Create the table settings.
              const tableSettings = {
                tableReference: {
                  projectId: projectId,
                  datasetId: datasetId,
                  tableId: tableId
                },
                schema: {
                  fields: constructTableSchemaFields(data.audienceList.dimensions)
                }
              };
              // Create new table.
              try {
                BigQuery.Tables.insert(tableSettings, projectId, datasetId);
              } catch(e) {
              }
              // Construct the insert job settings.
              const job = {
                configuration: {
                  load: {
                    destinationTable: {
                      projectId: projectId,
                      datasetId: datasetId,
                      tableId: tableId
                    }
                  },
                  dryRun: false
                }
              };
              // Insert data into the new table.
              try {
                BigQuery.Jobs.insert(job, projectId, blob);
              } catch(e) {
              }
              // Save link to BigQuery to sheet.
                audienceListSheet
                .getRange(index + 2, audienceListSheet.getLastColumn())
                .setValue(`=HYPERLINK("https://console.cloud.google.com/bigquery?project=${projectId}", "Export")`);
            }
          } else {
          SpreadsheetApp.getUi().alert(
            `Please enter a project ID, a dataset ID, and a table ID 
            for row ${index + 2}.
            
            The Google Cloud project and BigQuery dataset must already exist.

            The BigQuery table ID must not already exist under the specified
            dataset.`);
        }
      }
    });
  }
}