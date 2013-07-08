#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

//check an html file given its path
var processFile = function(htmlfile, processChecks) {
    console.log('Processing file: %s', htmlfile);
    //start reading from file...
    fs.readFile(htmlfile, function(err, data) {
        if (err) throw err;
        //...once done, proceed to checks
        processChecks(data);
    });
};

//check online html given its url
var processURL = function(url, processChecks) {
    console.log('Processing URL: %s', url);
    //request the online document...
    rest.get(url).on('complete', function(result, response){
        if (result instanceof Error) {
            console.error('Error: ' + util.format(response.message));
            process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
        }
        //...once done, proceed to checks
        processChecks(result); 
    });
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

//function builder (parameterise function with tag file)
var processChecks = function(checksfile) {
    //define the actual function
    var fn_instance = function(html) {
        console.log('Processing checks from %s (html length = %s)', checksfile, html.length);
        $ = cheerio.load(html);
        var checks = loadChecks(checksfile).sort();
        var out = {};
        for(var ii in checks) {
            var present = $(checks[ii]).length > 0;
            out[checks[ii]] = present;
        }
        printChecks(out);
    }
    return fn_instance;
};

var printChecks = function(text) {
    console.log('Printing results');
    var outJson = JSON.stringify(text, null, 4);
    console.log(outJson);
};

//@html - either url or path to a file
//@mode - either 'url' or 'file'
var checkHtmlFile = function(path, checksfile, mode) {
    console.log('Checking %s: %s against %s', mode, path, checksfile);
    if (mode == 'file') {
        processFile(path, processChecks(checksfile));
    } else if (mode == 'url') {
        processURL(path, processChecks(checksfile));
    } else {
        console.log("Unknown mode: %s. Exiting.", mode);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists))
        .option('-u, --url <html_url>', 'URL of index.html')
        .parse(process.argv);
    
    //if file is set, read the file into variable
    if (program.file) {
        var path = program.file;
        var mode = 'file';
    //else if the url is set download the file and put it into the variable
    } else if (program.url) {
        var path = program.url;
        var mode = 'url';
    //else write an error message and exit
    } else {
        console.log("Neither file nor URL is set. Exiting.");
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    
    checkHtmlFile(path, program.checks, mode); 

} else {
    exports.checkHtmlFile = checkHtmlFile; 
}
