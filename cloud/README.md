## Google Analytics Utilities for Cloud

Google Analytics Utilities for Cloud uses Cloud Functions to accomplish specific tasks. Please follow the steps below to implement the utilities you want.

All of these utilities require that the [Analytics Admin API](https://console.cloud.google.com/apis/library/analyticsadmin.googleapis.com) be enabled in your Cloud project.

### Linker

The linker utility addresses the following use cases:
- Linking Google Ads
- Linking DV360
- Sending DV360 link proposals

The linker utility relies on a single Google Cloud Function to loop through a list of link settings. These settings must be uploaded to a Google Cloud Storage bucket as a CSV file of your choosing. Upon completion, the function will write a results CSV file to an output storage bucket of your choosing.

If it takes longer than one hour for the function to complete, it will upload a CSV file with the remaining settings to the input bucket automatically to kick off another function until all of the requests have been attempted.

The following steps describe how to set up the linker utility.

#### Service Account and Credentials

1. Create a service account in Google Cloud by navigating to [IAM & Admin > Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
2. Give the service account a name and grant it the following access:
   - Storage Admin
   - Eventarc Event Receiver
   - Cloud Run Invoker
3. Save the service account.
4. Navigate to [APIs & Services > OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent).
5. Create an internal OAuth consent screen.
    - Enter an app name. For the purposes of this guide, we will use GA Utilities.
    - Enter a support email.
    - Enter developer contact information.
    - Add the following scope:
      - https://www.googleapis.com/auth/analytics.edit
    - Save the consent screen settings.
6. Navigate to [APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials).
7. Create an OAuth Client ID credential.
8. Select a Web Application type.
9. Give it a recognizable name.
10. Add https://developers.google.com as an authorized JavaScript origin.
11. Add https://developers.google.com/oauthplayground as an authorized redirect URI.
12. Make note of your client ID and client secret.
13. Navigate to https://developers.google.com/oauthplayground. NOTE: Please make sure that the user with the correct access to Google Analytics, Google Ads, and DV360 completes the following steps.
14. From the list of APIs, select Google Analytics Admin API v1Beta and select https://www.googleapis.com/auth/analytics.edit.
15. In the upper righthand corner, click on the gear icon, and enter the following settings:
    - OAuth flow: server-side
    - Oath endpoints: Google
    - Authorization endpoint: https://accounts.google.com/o/oauth2/v2/auth
    - Token endpoint: https://oauth2.googleapis.com/token
    - Access token location: Authorization header w/ Bearer prefix
    - Access type: Offline
    - Check "Use your own OAuth Credentials"
    - Enter your OAuth client ID and client secret
16. After entering the OAuth 2.0 configuration information, click "Authorize APIs".
17. Click through the consent screen and then click "Exchange authorization code for tockens".
18. Make note of your refresh token and access token.
19. At the end of this process, you should have the following that will be used in future steps:
    - A service account
    - A client ID
    - A client secret
    - An access token
    - A refresh token

#### Storage Buckets
1. Create two storage buckets. One for input files and one for output files.

#### Cloud Function
Please be sure to enable whatever services are required as you create the cloud function.

1. Navigate to [Cloud Functions](https://console.cloud.google.com/functions/list) and create a new function.
2. Set the environment to 2nd gen.
3. Enter a name for your function.
4. Set the region to whatever you would like or use the default.
5. Add a "Cloud Storage" trigger and set the bucket to the input bucket you created earlier.
6. Change the service account to the service account you previously created.
7. Expand the Runtime, build, connections and security settings area and enter the following settings:
    - Set the memory allocated to whatever you would like, though I suggest 1 GiB.
    - Set the timeout to 3600s (1 hour)
    - Set the runtime service account to the service account you created earlier.
    - Add the following runtime variables:
      - Name: OUTPUT_BUCKET, value: The name of the output bucket you created earlier
      - Name: CLIENT_ID, value: The client ID
      - Name: CLIENT_SECRET, value: The client secret
      - Name: ACCESS_TOKEN, value: The access token
      - Name: REFRESH_TOKEN, value: The refresh token
      - Name: TOKEN_URI, value: https://oauth2.googleapis.com/token
8. Click next and set the runtime to 3.11.
9. Set the entry point to "main" and copy the linker cloud function code into the editor.
10. Copy the setting for requirements.txt into the editor.
11. Deploy the function.

#### Linker Input CSV
The input CSV file must follow [this format](https://docs.google.com/spreadsheets/d/1b_uPFH2-rXavT5BD_V8nETLgedJ_dhYOjovFtpW2s2s/copy).

The request type column accepts the following values:
- ads
- dv360
- dv360\_link\_proposal

The ads\_customer\_id values should not contain dashes.

The ads\_personalization\_enabled, dv360\_campaign\_data\_sharing\_enabled, and dv360\_cost\_data\_sharing\_enabled columns should only be set to true or false.

### Privacy & Usage Telemetry

The Cloud Functions (`ads_links`, `dv360_links`, and `linker`) use [`tadau`](https://github.com/google-marketing-solutions/tadau) (`fixed_dimensions.app = "GA4 Toolkit"`) to emit fail-open `SOLUTION_USAGE` events with no customer PII:

- **No Customer PII:** Never sends user emails, OAuth tokens, or account names. Only sends a random `external_event_id` UUID, `th_analytics_property_id`, and (for Google Ads links) the 10-digit external Google Ads Customer ID in `th_google_ads_customer_id` with hyphens preserved (`XXX-XXX-XXXX`, e.g., `123-456-7890`).
- **Opt-In / Opt-Out Flag:** Passed to `Tadau(..., opt_in=...)`. Enabled by default (`TELEMETRY_OPT_IN=true`); set the environment variable `TELEMETRY_OPT_IN=false` on the Cloud Function (or pass `"opt_in": false` in the message payload) to disable telemetry.


