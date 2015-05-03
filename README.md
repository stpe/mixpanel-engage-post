Command-line tool to post data to the Mixpanel Engage API for People Data. Example usage are batch delete Mixpanel profiles, set people properties, remove properties, create new profiles, etc. See Mixpanel's [HTTP API reference](https://mixpanel.com/help/reference/http#people-analytics-updates) for the `/engage` endpoint for all possibilities of use.

Simply pipe in the data and the tool will automatically take care of updating it in batches to conform to Mixpanel's limit of 50 updates per API call.

This script is especially powerful in combination with [mixpanel-engage-query](https://github.com/stpe/mixpanel-engage-query) that allow you to query the Mixpanel Engage API and export people profiles.

## Installation

Clone the repository:
``git clone https://github.com/stpe/mixpanel-engage-post.git``

Install [Node.js](http://nodejs.org/).

Type ``npm install`` in the directory. That's it!

Run using `node engagepost.js` or make it an executable script by doing `chmod +x engagepost.js`, then run it simply using `./engagepost.js`.

## Example

...
