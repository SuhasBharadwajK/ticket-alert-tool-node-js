const curl = require("curl");
const jsdom = require("jsdom");
const { exec } = require('child_process');

var Venue = function (args) {
    this.name = args.name;
    this.code = args.code;
    this.regionName = args.regionName;
    this.regionCode = args.regionCode;
}

const cinemaName = "Prasads";
const ticketsFoundMessage = "Tickets in {0} are available on {1}";

const SparkPost = require('sparkpost')
const client = new SparkPost('1bf61ad112df4370a3eefbe51d93ee8124976240')

const movieName = "avengers-infinity-war-3d";
const movieCode = "ET00053419";
const cityFullName = "hyderabad";
const cityCode = "hyd";
const movieDate = "20180427";

const moviePageURL = "https://in.bookmyshow.com/buytickets/" + movieName + "-" + cityFullName + "/movie-" + cityCode + "-" + movieCode + "-MT/" + movieDate;
var venues = [];
var interval = null;

function init() {
    interval = setInterval(() => {
        getVenueList(moviePageURL);
    }, 2000);
}

function getVenueList(url) {
    curl.get(url, null, (err, resp, body) => {
        console.log("\n\nTrying to fetch available venues...\n");
        if (resp.statusCode == 200) {
            updateVenues(body);
            console.log(venues.length + " venues fetched sucessfully!\n\n");
            if (doesVenueExist(cinemaName)) {
                alertOpening(cinemaName);
                clearInterval(interval);
            }
        }
        else {
            console.log("An error occured while getting the data.");
        }
    });
}

function updateVenues(html) {
    const { JSDOM } = jsdom;
    const dom = new JSDOM(html);
    const $ = (require('jquery'))(dom.window);
    var currentVenues = $("#venuelist").children('li');
    for (i = 0; i < currentVenues.length; i++) {
        var venue = currentVenues[i];
        var name = $(venue).attr('data-name');
        var code = $(venue).attr('data-id');
        var regionName = $(venue).attr('data-sub-region-name');
        var regionCode = $(venue).attr('data-sub-region-id');
        if (venues.map(v => v.code).indexOf(code) < 0) {
            venues.push(new Venue({ name: name, code: code, regionName: regionName, regionCode: regionCode }));
        }

    }
}

function doesVenueExist(venueName) {
    return venues.map(v => v.name).some(name => name.indexOf(venueName) > -1);
}

function alertOpening(venueName) {
    console.log('TICKETS ARE AVAILABLE IN ' + venueName);
    client.transmissions.send({
        content: {
            from: '',
            template_id: 'venue-alert'
        },
        substitution_data: {
            "VenueName": venueName
        },
        recipients: [
            { address: 'suhas.five@gmail.com' },
            { address: 'suhas@keka.com' },
            { address: 'shivakrishna.c@keka.com' },
            { address: 'venkat@keka.com' }
        ]
    }).then(data => {
        console.log('Email has been sent to all the recipients!');
    }).catch(error => {
        console.log('An error occurred while sending emails.');
        console.log(error);
    });

    exec('mpg123\\mpg123 buzzer.mp3', (err, stdout, stderr) => {
        if(err) {
            throw err;
        }
    });
}

init();
