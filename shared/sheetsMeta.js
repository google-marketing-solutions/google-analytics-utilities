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

const sheetsMeta = {
  ga4: {
    accountSummaries: {
      sheetName: 'Account Summaries',
      write: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 4
      },
      read: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 5
      }
    },
    streams: {
      sheetName: 'Data Streams',
      write: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 27
      },
      read: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 31
      }
    },
    customDimensions: {
      sheetName: 'Custom Dimensions',
      write: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 10
      },
      read: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 14
      }
    },
    customMetrics: {
      sheetName: 'Custom Metrics',
      write: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 11
      },
      read: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 15
      }
    },
    customDimensionsChecker: {
      sheetName: 'Custom Dimensions Checker',
      write: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 11
      },
      read: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 11
      }
    },
    customMetricsChecker: {
      sheetName: 'Custom Metrics Checker',
      write: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 13
      },
      read: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 13
      }
    },
    keyEvents: {
      sheetName: 'Key Events',
      write: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 12
      },
      read: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 16
      }
    },
    googleAdsLinks: {
      sheetName: 'Google Ads Links',
      write: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 11
      },
      read: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 15
      }
    },
    firebaseLinks: {
      sheetName: 'Firebase Links',
      write: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 7
      },
      read: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 11
      }
    },
    displayVideo360AdvertiserLinks: {
      sheetName: 'DV360 Links',
      write: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 10
      },
      read: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 14
      }
    },
    copyProperties: {
      sheetName: 'Copy Properties',
      write: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 6
      },
      read: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 21
      }
    },
    properties: {
      sheetName: 'Property Details',
      write: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 26
      },
      read: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 30
      }
    },
    audiences: {
      sheetName: 'Audiences',
      write: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 13
      },
      read: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 17
      }
    },
    accessBindings: {
      sheetName: 'Users',
      write: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 9
      },
      read: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 13
      }
    },
    healthReport: {
      sheetName: 'Report Settings',
      read: {
        row: 4,
        column: 1,
        numRows: 1,
        numColumns: 4
      }
    },
    bigqueryLinks: {
      sheetName: 'BigQuery Links',
      read: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 18
      },
      write: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 14
      }
    },
    sa360Links: {
      sheetName: 'SA360 Links',
      read: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 14
      },
      write: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 10
      }
    },
    expandedDataSets: {
      sheetName: 'Expanded Data Sets',
      read: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 15
      },
      write: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 11
      }
    },
    fullPropertyDeployment: {
      sheetName: 'Easy Property Creation',
      read: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 25
      },
      write: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 20
      }
    },
    connectedSiteTags: {
      sheetName: 'UA Connected Site Tags',
      write: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 7
      },
      read: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 11
      }
    },
    channelGroups: {
      sheetName: 'Channel Groups',
      write: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 10
      },
      read: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 14
      }
    },
    dataStreamSelection: {
      sheetName: 'Data Stream Selection',
      write: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 6
      },
      read: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 7
      }
    },
    measurementProtocolSecrets: {
      sheetName: 'Measurement Protocol Secrets',
      write: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 9
      },
      read: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 13
      }
    },
    adSenseLinks: {
      sheetName: 'AdSense Links',
      write: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 6
      },
      read: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 10
      }
    },
    eventCreateRules: {
      sheetName: 'Event Create Rules',
      write: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 11
      },
      read: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 15
      }
    },
    eventEditRules: {
      sheetName: 'Event Edit Rules',
      write: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 11
      },
      read: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 15
      }
    },
    audienceLists: {
      sheetName: 'Audience Lists',
      write: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 11
      },
      read: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 21
      }
    },
    rollupPropertySourceLinks: {
      sheetName: 'Rollup Property Source Links',
      write: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 6
      },
      read: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 10
      }
    },
    subpropertyEventFilters: {
      sheetName: 'Subproperty Event Filters',
      write: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 7
      },
      read: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 11
      }
    },
    sKAdConversionSchemas: {
      sheetName: 'sKAd Conversion Schemas',
      write: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 11
      },
      read: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 15
      }
    },
    calculatedMetrics: {
      sheetName: 'Calculated Metrics',
      write: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 12
      },
      read: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 16
      }
    },
    userAccessReport: {
      sheetName: 'User Access Report',
      write: {
        row: 1,
        column: 1,
        numRows: 1,
        numColumns: 1
      },
      read: {
        row: 1,
        column: 1,
        numRows: 1,
        numColumns: 1
      }
    },
    userAccessReportSettings: {
      sheetName: 'User Access Report Settings',
      write: {
        row: 1,
        column: 1,
        numRows: 1,
        numColumns: 1
      },
      read: {
        row: 1,
        column: 1,
        numRows: 1,
        numColumns: 1
      }
    },
    reportingDataAnnotations: {
      sheetName: 'Annotations',
      write: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 11
      },
      read: {
        row: 2,
        column: 1,
        numRows: 1,
        numColumns: 15
      }
    },
    searchChangeHistoryEvents: {
      sheetName: 'Account Change History',
      write: {
        row: 7,
        column: 1,
        numRows: 1,
        numColumns: 7
      },
      read: {
        row: 7,
        column: 1,
        numRows: 1,
        numColumns: 7
      }
    }
  }
};