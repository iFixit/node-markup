var { Int, cleanJSON } = require("./src/utils");
var { convertMarkupToJSON } = require("./src/markup_to_json");
var ImageMarkupBuilder = require("./ImageMarkupBuilder").Builder;
var Fabric = require("fabric").fabric;
var argv = require("yargs").argv;

var stroke = null;

function usage(err) {
  var filename = __filename.replace(/^.*[\\/]/, "");
  console.log("Example Usage:");
  console.log("node " + filename + " [--help|-h] - Show this information");
  console.log(
    "node " +
      filename +
      " --input infile.jpg --output outfile.jpg --markup '[markup_string]'"
  );
  console.log("node " + filename + " --json '[json_string]'");
  //TODO: "See README file for specification"
  if (err) process.exit(err);
  else process.exit(0);
}

function processArgs() {
  if (argv.help || argv.h) {
    usage();
  }

  if (argv.json) {
    if (argv.markup) {
      console.error("Invalid usage: Processing JSON and Markup at once.");
      usage(-1);
    } else if (argv.stroke) {
      console.log("Invalid usage: 'stroke' with JSON in command line.");
      usage(-1);
    }

    var parsed = JSON.parse(argv.json);
    processJSON(parsed);
  } else if (argv.markup) {
    if (!argv.input || !argv.output) {
      console.error("Invalid usage. Input or output path missing.");
      usage(-1);
    }

    if (argv.stroke) {
      stroke = Int(argv.stroke);
    }

    convertMarkupToJSON(processJSON, argv.markup, argv.input, argv.output);
  } else {
    console.error("Invalid uage.");
    usage(-1);
  }
}

function processJSON(json) {
  cleanJSON(json);

  var finalSize = json["finalDimensions"];
  var canvas = Fabric.createCanvasForNode(
    finalSize["width"],
    finalSize["height"]
  );
  var builder = ImageMarkupBuilder(canvas);

  builder.processJSON(json, function () {
    if (argv.debug) {
      console.log(builder.getMarkupString());
    }
  });
}

processArgs();
