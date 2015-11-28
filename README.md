Command-line tool to post data to the Mixpanel Engage API for People Data. Example usage are batch delete Mixpanel profiles, set people properties, remove properties, create new profiles, etc. See Mixpanel's [HTTP API reference](https://mixpanel.com/help/reference/http#people-analytics-updates) for the `/engage` endpoint for all possibilities of use.

Simply pipe in the data and the tool will automatically take care of updating it in batches to conform to Mixpanel's limit of 50 updates per API call.

This script is especially powerful in combination with [mixpanel-engage-query](https://github.com/stpe/mixpanel-engage-query) that allow you to query the Mixpanel Engage API and export people profiles.

## Installation

Install [Node.js](http://nodejs.org/).

Type `npm install --global mixpanel-engage-post`

That's it! Run it by typing `engagepost` in your terminal.

## Usage

To run the script you must specify your Mixpanel API key, secret and your token either as parameters, as environment variables `MIXPANEL_API_KEY`, `MIXPANEL_API_SECRET` and `MIXPANEL_API_TOKEN` or in a [.env](https://github.com/motdotla/dotenv) file.

Typically you will put together a JSON-formatted file with an array of updates/deletions/changes/etc to perform on profiles. See the [HTTP API reference](https://mixpanel.com/help/reference/http#people-analytics-updates) for details.

Using [mixpanel-engage-query](https://github.com/stpe/mixpanel-engage-query) you may query your existing profiles using a condition (e.g. `$last_seen` is older than a certain date or a special property is not set) and export a list. Protip: Use [jq](http://stedolan.github.io/jq) to process the result into a desired format.

Note: For your convenince the script will automatically add the `$token` property to each entry in the array.

When done, pipe this file to the script to have it perform the changes.

## Example

### Batch delete people profiles

`cat profiles-to-delete.json | engagepost`

Where `profiles-to-delete.json` is:
```
[
  {
    "$distinct_id": "12391",
    "$delete": ""
  },
  {
    "$distinct_id": "12408",
    "$delete": ""
  }
]
```

This will delete the profiles of users with id 12391 and 12408.

Example using [mixpanel-engage-query](https://github.com/stpe/mixpanel-engage-query) and [jq](http://stedolan.github.io/jq) to produce file in same format:

`engage. -q 'properties["$last_seen"] < "2015-04-24T22:00:00"' | jq '[.[] | { "$distinct_id", "$delete": "" }]'`

This will result in a JSON file that when used with `engagepost` will delete the profiles of all users last seen prior to 24th of April, 2015.
