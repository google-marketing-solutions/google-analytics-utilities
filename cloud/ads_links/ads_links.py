# Copyright 2024 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Performs various methods for Google Analytics Ads links.

Creates, updates, deletes, or lists Google Ads links for Google Analytics based
on the action and settings values in the pub/sub message.

"""

import base64
import enum
import json
import os
import re
from typing import Any, Dict, List
import uuid
from cloudevents.http import CloudEvent
import functions_framework
from google.analytics.admin import AnalyticsAdminServiceClient
from google.analytics.admin_v1alpha.types import GoogleAdsLink
import google.oauth2.credentials

try:
  from tadau import Tadau  # pylint: disable=g-import-not-at-top
except ImportError:
  Tadau = None

_TELEMETRY_MEASUREMENT_ID = 'G-Z2TKLQZ79K'
_TELEMETRY_API_SECRET = 'S7toNnNZQPWzViq44q_8gg'
_TELEMETRY_APP_NAME = 'GA4 Toolkit'


class Action(enum.Enum):
  CREATE = 'create'
  DELETE = 'delete'
  UPDATE = 'update'
  LIST = 'list'


class RequiredKeys(enum.Enum):
  REFRESH_TOKEN = 'refresh_token'
  TOKEN_URI = 'token_uri'
  CLIENT_ID = 'client_id'
  CLIENT_SECRET = 'client_secret'
  SCOPES = 'scopes'
  CUSTOMER_ID = 'customer_id'
  ADS_PERSONALIZATION_ENABLED = 'ads_personalization_enabled'
  PROPERTY_ID = 'property_id'
  NAME = 'name'
  ENABLE_LOGGING = 'enable_logging'
  ACTION = 'action'


@functions_framework.cloud_event
def main(cloud_event: CloudEvent) -> None:
  """Cloud Function that creates, updates, deletes, or lists Google Ads links.

  Args:
      cloud_event: The cloud event data containing values that will be used
      to perform various Google Ads links methods.

  Returns:
      The response or error object.
  """
  data = cloud_event
  try:
    data = json.loads(base64.b64decode(
        cloud_event.data['message']['data']).decode())
  except KeyError as e:
    print(e)
    return 'Invalid message. Missing "data" key.'
  if find_missing_keys(data):
    missing_keys = ','.join(find_missing_keys(data))
    error_message = f'Missing keys: {missing_keys}'
    print(error_message)
    return error_message
  ga_client = get_ga_client(
      data['refresh_token'],
      data['token_uri'],
      data['client_id'],
      data['client_secret'],
      data['scopes'])
  response = {}
  action = data['action'].lower()
  if action == Action.CREATE.value:
    ads_link = GoogleAdsLink(
        customer_id=str(data['customer_id']),
        ads_personalization_enabled=data['ads_personalization_enabled'])
    parent = f"properties/{data['property_id']}"
    response = ga_client.create_google_ads_link(
        parent=parent,
        google_ads_link=ads_link)
  elif action == Action.UPDATE.value:
    ads_link = GoogleAdsLink(
        name=data['name'],
        ads_personalization_enabled=data['ads_personalization_enabled'])
    response = ga_client.update_google_ads_link(
        google_ads_link=ads_link,
        update_mask='*')
  elif action == Action.DELETE.value:
    response = ga_client.delete_google_ads_link(name=data['name'])
  elif action == Action.LIST.value:
    parent = f"properties/{data['property_id']}"
    response = ga_client.list_google_ads_links(parent=parent)
  if action in (Action.CREATE.value, Action.UPDATE.value, Action.DELETE.value):
    _log_telemetry(data, action)
  if data['enable_logging']:
    print(response or f"{data['name']} deleted")
  return response


def _extract_numeric_id(raw_value: str) -> str:
  """Extracts a bare numeric identifier from a resource name or ID string."""
  if not raw_value:
    return ''
  raw_str = str(raw_value).strip()
  match = re.search(r'properties/(\d+)', raw_str)
  if match:
    return match.group(1)
  return re.sub(r'\D+', '', raw_str)


def _format_external_ads_customer_id(raw_value: str) -> str:
  """Formats a 10-digit external Google Ads Customer ID as XXX-XXX-XXXX."""
  digits = _extract_numeric_id(raw_value)
  if len(digits) == 10:
    return f'{digits[:3]}-{digits[3:6]}-{digits[6:]}'
  return digits


def _is_telemetry_opt_in(data: Dict[str, Any]) -> bool:
  """Returns whether usage telemetry is enabled via message payload or env."""
  if 'opt_in' in data and data['opt_in'] is not None:
    if isinstance(data['opt_in'], bool):
      return data['opt_in']
    return str(data['opt_in']).strip().lower() not in ('false', '0', 'no')
  return os.environ.get('TELEMETRY_OPT_IN', 'true').strip().lower() not in (
      'false',
      '0',
      'no',
  )


def _log_telemetry(data: Dict[str, str], action: str) -> None:
  """Fails open to emit a SOLUTION_USAGE event via Tadau."""
  try:
    if Tadau is None:
      return
    opt_in = _is_telemetry_opt_in(data)
    if not opt_in:
      return
    property_id = _extract_numeric_id(
        data.get('property_id') or data.get('name', '')
    )
    customer_id = _format_external_ads_customer_id(data.get('customer_id', ''))
    if not property_id and not customer_id:
      return
    event = {
        'name': 'SOLUTION_USAGE',
        'external_event_id': str(uuid.uuid4()),
        'label': f'cloud_ads_links_{action}',
    }
    if property_id:
      event['th_analytics_property_id'] = property_id
    if customer_id:
      event['th_google_ads_customer_id'] = customer_id
    if data.get('opportunity_id'):
      opp_id = _extract_numeric_id(data['opportunity_id'])
      if opp_id:
        event['th_opportunity_id'] = opp_id
    tadau_client = Tadau(
        api_secret=_TELEMETRY_API_SECRET,
        measurement_id=_TELEMETRY_MEASUREMENT_ID,
        opt_in=opt_in,
        fixed_dimensions={
            'app': _TELEMETRY_APP_NAME,
            'is_agent_event': False,
            'non_personalized_ads': False,
        },
    )
    tadau_client.send_events([event])
  except Exception:  # pylint: disable=broad-exception-caught
    pass


def find_missing_keys(data: Dict[str, str]) -> List[str]:
  """Checks if  required keys are missing.

  Args:
      data: The dictionary passed into the function that should have specific
      keys.

  Returns:
      A list that is either empty or contains the missing keys.
  """
  missing_keys = []
  for required_key in RequiredKeys:
    if required_key.value not in data:
      missing_keys.append(required_key.value)
  return missing_keys


def get_ga_client(
    refresh_token: str,
    token_uri: str,
    client_id: str,
    client_secret: str,
    scopes: List[str]) -> type[AnalyticsAdminServiceClient]:
  """Creates the Google Analytics Admin API client.

  Args:
      refresh_token: The OAuth 2.0 refresh token.
      token_uri: The OAuth 2.0 authorization server’s token endpoint URI.
      client_id: The OAuth 2.0 client ID.
      client_secret: The OAuth 2.0 client secret.
      scopes: The OAuth 2.0 permission scopes.

  Returns:
      The Google Analytics Admin API client.
  """
  credentials = google.oauth2.credentials.Credentials(
      token=None,
      refresh_token=refresh_token,
      token_uri=token_uri,
      client_id=client_id,
      client_secret=client_secret,
      scopes=scopes)
  return AnalyticsAdminServiceClient(credentials=credentials)
