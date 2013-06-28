var ImageMarkupBuilder = require('./ImageMarkupBuilder').Builder;
var Fabric = require('fabric').fabric;
var argv = require('optimist').argv;

var colorValues = {
   'red': 'rgb(193,40,11)',
   'orange': 'rgb(255,144,36)',
   'yellow': 'rgb(243,224,14)',
   'green': 'rgb(22,220,129)',
   'lightblue': 'rgb(27, 177, 233)',
   'blue': 'rgb(35,67,232)',
   'violet': 'rgb(220,84,183)',
   'black': 'rgb(0,0,0)'
};

var stroke = null;

function usage(err) {
   var filename = __filename.replace(/^.*[\\\/]/, '');
   console.log('Example Usage:');
   console.log('node ' + filename + ' [--help|-h] - Show this information');
   console.log('node ' + filename + ' --input infile.jpg --output outfile.jpg --markup \'[markup_string]\'');
   console.log('node ' + filename + ' --json \'[json_string]\'');
   //TODO: "See README file for specification"
   if (err)
      process.exit(err);
   else
      process.exit(0);
}

function processArgs() {
   if (argv.help || argv.h) {
      usage();
   }

   shadows = 
      typeof(argv.shadows) == 'undefined'
      ? false
      : argv.shadows == 'true' || argv.shadows == true;

   if (shadows) {
      if (argv.step) {
         shadowStep = parseInt(argv.step);
      }
   }

   var json;
   if (argv.json) {
      if (argv.markup) {
         console.error('Invalid usage: Processing JSON and Markup at once.');
         usage(-1);
      } else if (argv.stroke) {
         console.log('Invalid usage: \'stroke\' with JSON in command line.');
         usage(-1);
      }

      var json = JSON.parse(argv.json);
      processJSON(json);
   } else if (argv.markup) {
      if (!argv.input || !argv.output) {
         console.error('Invalid usage. Input or output path missing.');
         usage(-1);
      }

      if (argv.stroke) {
         stroke = parseInt(argv.stroke);
      }

      convertMarkupToJSON(processJSON, argv.markup, argv.input, argv.output);
   } else {
      console.error('Invalid uage.');
      usage(-1);
   }
}

function convertMarkupToJSON(callback, markup, infile, outfile) {
   var json = {};

   var GM = require('gm');
   GM(infile).size(function (err, size) {
      if (err) throw err;

      json['dimensions'] = size;
      json['finalDimensions'] = size;

      json['instructions'] = {};

      var instructions = markup.split(";");
      for (var i = 0; i < instructions.length; ++i) {
      if (instructions[i] == '') continue;

      var args = instructions[i].split(",");
      var command = args[0];
      switch (command) {
         case 'crop':
            var position = args[1].split("x");
            position[0] = parseInt(position[0]);
            position[1] = parseInt(position[1]);
            var from = {
               'x': position[0],
               'y': position[1]
            };

            var dimensions = args[2].split("x");
            dimensions[0] = parseInt(dimensions[0]);
            dimensions[1] = parseInt(dimensions[1]);
            var size = {
               'width': dimensions[0],
               'height': dimensions[1]
            };

            var crop = {};
            crop['from'] = from;
            crop['size'] = size;

            json['instructions']['crop'] = crop;
            json['finalDimensions'] = crop['size'];
            break;
         case 'circle':
            if (!json['instructions']['draw'])
               json['instructions']['draw'] = new Array();

            var position = args[1].split("x");
            position[0] = parseInt(position[0]);
            position[1] = parseInt(position[1]);
            var from = {
               'x': position[0],
               'y': position[1]
            };

            var radius = parseInt(args[2]);
            var color = args[3];

            var circle = {};
            circle['from'] = from;
            circle['radius'] = radius;
            circle['color'] = color;

            json['instructions']['draw'].push({'circle': circle});
            break;
         case 'rectangle':
            if (!json['instructions']['draw']) json['instructions']['draw'] = new Array();

            var position = args[1].split("x");
            position[0] = parseInt(position[0]);
            position[1] = parseInt(position[1]);
            var from = {
               'x': position[0],
               'y': position[1]
            };

            var dimensions = args[2].split("x");
            dimensions[0] = parseInt(dimensions[0]);
            dimensions[1] = parseInt(dimensions[1]);
            var size = {
               'width': dimensions[0],
               'height': dimensions[1]
            };

            var color = args[3];

            var rectangle = {
               'from': from,
               'size': size,
               'color': color
            };

            json['instructions']['draw'].push({'rectangle': rectangle});
            break;
         default:
      }
      }

      json['sourceFile'] = infile;
      json['destinationFile'] = outfile;

      if (stroke != null) {
         json.instructions.strokeWidth = stroke;
      }

      callback(json);
   });
}

function processJSON(json) {
   cleanJSON(json);

   var size = json['finalDimensions'];
   var canvas = Fabric.createCanvasForNode(size['width'], size['height']);
   var builder = ImageMarkupBuilder(canvas);

   builder.processJSON(json, function() {
      if (argv.debug) {
         console.log(builder.getMarkupString());
      }
   });
}

/**
 * Pretty-prints a JSON object to the console. The first invocation not set the
 * 'level' parameter.
 */
function printJSON(json, level) {
   String.prototype.repeat = function (num) {
      return new Array(num+1).join(this);
   }
   if (!level) {
      console.log("{");
      printJSON(json, 1);
      console.log("}");
   } else {
      for (property in json) {
         console.log("\t".repeat(level) + property + ": " + json[property] +
          " [" + typeof(json[property]) + "]");
         if (typeof(json[property]) == 'object') {
            console.log("\t".repeat(level) + "{");
            printJSON(json[property], level+1);
            console.log("\t".repeat(level) + "}");
         }
      }
   }
}

/**
 * Cycles through an object and changes all numeric fields to ints
 * where necessary. 'context' is used for exception reporting and can be
 * left unset upon invocation.
 */
function cleanJSON(json, context) {
   if (!context)
      context = "root";

   var integerProperties = [
      'x'
     ,'y'
     ,'width'
     ,'height'
     ,'radius'
     ,'strokeWidth'
   ];

   for (property in json) {

      if (typeof(json[property]) == 'object') {
         cleanJSON(json[property], context + '.' + property);
      } else if (integerProperties.indexOf(property) != -1) {
         if (typeof(json[property]) == 'string') {
            json[property] = parseInt(json[property]);
            if (isNaN(json[property])) {
               var msg = "In '" + context + "': property '" + property
                + "' is not a number.";
               throw msg;
            }
         }
      }
   }
}

processArgs();
