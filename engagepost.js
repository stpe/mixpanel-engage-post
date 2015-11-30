#!/usr/bin/env node --harmony

/*jshint node: true */

"use strict";

var needle      = require('needle'),
    crypto      = require('crypto'),
    exit        = require('exit'),
    stdin       = require('get-stdin'),
    dotenv      = require("dotenv"),
    osHomedir   = require('os-homedir'); // consider replacing with os.homedir() later

// mixpanel
var base_url    = "http://api.mixpanel.com/";

// add environment variables from .env if present, check (in prio order)
//  - .env in script directory
//  - .engagerc in home directory
dotenv.load({ silent: true }) || dotenv.load({ silent: true, path: osHomedir() + '/.engagerc' });

// options
var yargs = require('yargs')
    .usage('Usage: cat yourdata.json | $0 -k [string] -s [string] -t [string]')
    .options('k', {
        alias: 'key',
        describe: 'Mixpanel API key',
        nargs: 1,
        type: 'string'
    })
    .options('s', {
        alias: 'secret',
        describe: 'Mixpanel API secret',
        nargs: 1,
        type: 'string'
    })
    .options('t', {
        alias: 'token',
        describe: 'Mixpanel API token',
        nargs: 1,
        type: 'string'
    })
    .help('h')
    .options('h', {
        alias: 'help',
        describe: 'Help'
    })
    .epilogue('Note that Mixpanel API key/secret/token may also be set using environment variables. For more information, see https://github.com/stpe/mixpanel-engage-post');

if (!process.env.MIXPANEL_API_KEY) {
    yargs.demand(['k']);
}

if (!process.env.MIXPANEL_API_SECRET) {
    yargs.demand(['s']);
}

if (!process.env.MIXPANEL_API_TOKEN) {
    yargs.demand(['t']);
}

var argv = yargs.argv;

var MIXPANEL_API_KEY = process.env.MIXPANEL_API_KEY || argv.key;
var MIXPANEL_API_SECRET = process.env.MIXPANEL_API_SECRET || argv.secret;
var MIXPANEL_API_TOKEN = process.env.MIXPANEL_API_TOKEN || argv.token;

var BATCH_SIZE = 50;

stdin(function(input) {
    if (!input) {
        console.log(yargs.help());
        exit(0);
    }

    var data;
    try {
        data = JSON.parse(input);
        data = Array.isArray(data) ? data : [data];
    } catch(e) {
        console.log("Invalid JSON as input.");
        exit(1);
    }

    postEngageApi(data);
});

// ------------------------------------------

function postEngageApi(batch) {
    var sendBatch = function() {
        if (batch.length === 0) {
            // no more to send!
            exit(0);
        }

        // get new url for each request to avoid possible signature expiration
        var url = getUrl("engage", { verbose: 1, ignore_time: true, ip: 0 });

        // prepare chunk of data to send
        var chunk = batch.splice(0, BATCH_SIZE);

        // make sure it has a $token
        chunk.forEach(function(entry) {
            if (!entry.$token) {
                entry.$token = MIXPANEL_API_TOKEN;
            }
        });

        var data = {
            data: new Buffer(JSON.stringify(chunk)).toString('base64')
        };

        needle.post(url, data, function(err, resp, data) {
            // request error
            if (err) {
                console.log("Error: " + err);
                exit(1);
            }

            // Mixpanel API error
            if (data.error) {
                console.log('Mixpanel API error: ' + data.error);
                exit(1);
            }

            sendBatch();
        });
    };

    sendBatch();
}

function getUrl(endpoint, args) {
    // add api_key and expire in EXPIRE_IN_MINUTES
    var EXPIRE_IN_MINUTES = 10;
    args.api_key = MIXPANEL_API_KEY;
    args.expire = Math.round(Date.now() / 1000) + 60 * EXPIRE_IN_MINUTES;

    // see https://mixpanel.com/docs/api-documentation/data-export-api#auth-implementation
    var arg_keys = Object.keys(args),
        sorted_keys = arg_keys.sort(),
        concat_keys = "",
        params = [];

    for (var i = 0; i < sorted_keys.length; i++) {
        params.push(sorted_keys[i] + "=" + args[sorted_keys[i]]);
        concat_keys += params[params.length - 1];
    }

    // sign
    var sig = crypto.createHash('md5').update(concat_keys + MIXPANEL_API_SECRET).digest("hex");

    // return request url
    return base_url + endpoint + "/?" + params.join("&") + "&sig=" + sig;
}