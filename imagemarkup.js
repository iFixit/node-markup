var FS = require('fs');
var GM = require('gm');
var Fabric = require('fabric').fabric;
var Cloner = require('cloneextend');
var argv = require('optimist').argv;

var colorValues = {
  'red': 'rgb(193,40,11)',
  'orange': 'rgb(355,144,36)',
  'yellow': 'rgb(243,224,14)',
  'green': 'rgb(22,220,129)',
  'blue': 'rgb(35,67,232)',
  'violet': 'rgb(220,84,183)',
  'black': 'rgb(0,0,0)'
};

function usage(err) {
  console.log('Example Usage:');
  console.log('node imagemarkup.js [--help|-h] - Show this information');
  console.log('node imagemarkup.js --input infile.jpg --output outfile.jpg --markup \'[markup_string]\'');
  console.log('node imagemarkup.js --json \'[json_string]\'');
  //TODO: "See README file for specification"
  if (err)
    process.exit(err);
  else
    process.exit(0);
}

var shadows;

function processArgs() {
  if (argv.help || argv.h) {
    usage();
  }

  shadows = typeof(argv.shadows) == 'undefined' ? false : argv.shadows == 'true' || argv.shadows == true;

  var json;
  if (argv.json && argv.markup) {
    console.error('Invalid usage.');
    usage(-1);
  } else if (argv.json) {
    json = JSON.parse(argv.json);
    cleanJSON(json);
    processImage(json);
  } else if (argv.markup) {
    if (!argv.input || !argv.output) {
      console.error('Invalid usage. Input or output path missing.');
      usage(-1);
    }
    convertMarkupToJSON(argv.markup, argv.input, argv.output);
  } else {
    console.error('Invalid uage.');
    usage(-1);
  }
}

function validateJSON(json, level) {
  String.prototype.repeat = function (num) {
    return new Array(num+1).join(this);
  }
  if (!level) {
    console.log("{");
    validateJSON(json, 1);
    console.log("}");
  } else {
    for (property in json) {
      console.log("\t".repeat(level) + property + ": " + json[property] + " [" + typeof(json[property]) + "]");
      if (typeof(json[property]) == 'object') {
        console.log("\t".repeat(level) + "{");
        validateJSON(json[property], level+1);
        console.log("\t".repeat(level) + "}");
      }
    }
  }
}

/**
 * Cycles through an object and changes all numeric fields to ints
 * where necessary.
 */
function cleanJSON(json) {
  for (property in json) {

    if (typeof(json[property]) == 'object') {
      cleanJSON(json[property]);
    }
    else if (property == 'x' || property == 'y' ||
             property == 'width' || property == 'height' ||
             property == 'radius') {
      if (typeof(json[property]) == 'string') {
        json[property] = parseInt(json[property]);
      }
    }
  }
}

function convertMarkupToJSON(markup, infile, outfile) {
  var json = {};

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
          if (!json['instructions']['draw']) json['instructions']['draw'] = new Array();

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

    processImage(json);
  });
}

function processImage(json) {
  var canvas = Fabric.createCanvasForNode(json['finalDimensions']['width'],json['finalDimensions']['height']);

  var imagePath = json['sourceFile'];

  var crop = json['instructions']['crop'];
  var imageOffset = (typeof crop != "undefined") ?
   {'x':crop['from']['x'],
    'y':crop['from']['y']} :
   {'x':0,'y':0};

  function applyBackground(canvas) {
    FS.readFile(imagePath, function (err, blob) {
      if (err) throw err;

      var dimensions = json['dimensions'];
      var finalDimensions = json['finalDimensions'];
      img = {'width': dimensions['width'], 'height': dimensions['height'], 'src':blob};

      Fabric.Image.fromObject(img, function(fimg) {
        top = img.height/2 - imageOffset['y'];
        if (top % 1 != 0) {
          top -= 0.5;
        }
        left = img.width / 2 - imageOffset['x'];
        if (left % 1 != 0) {
          left -= 0.5;
        }

        canvas.add(fimg.set('top', top).set('left', left));

        applyMarkup(canvas);
      });
    });
  }

  function applyMarkup(canvas) {
    var size = json['dimensions'];

    for (instruction in json['instructions']) {
      switch (instruction) {
        case 'draw':
          json['instructions']['draw'].forEach(function (e) {
            for (shapeName in e) {
              shape = e[shapeName];
              shape['shapeName'] = shapeName;

              switch (shapeName) {
                case 'rectangle':
                  drawRectangle(json, canvas, shape, imageOffset);
                  break;
                case 'circle':
                  drawCircle(json, canvas,shape, imageOffset);
                  break;
                default:
                  console.error('Unsupported Shape: ' + shapeName);
              }
            }
          });
          break;
        case 'crop':
          //もう処理していたから無視する
          break;
        default:
          console.error('Unsupported Instruction: ' + instruction);
      }
    }

    writeCanvas(canvas);
  }

  function writeCanvas(canvas) {
    var outstream = FS.createWriteStream(json['destinationFile']),
        stream = canvas.createJPEGStream({
          quality: 93
        });

    stream.on('data', function(chunk) {
      outstream.write(chunk);
    });
  }

  applyBackground(canvas);
}

function drawRectangle(json, canvas, shape, imageOffset) {
  shape['stroke'] = Math.max(Math.round(json['finalDimensions']['width'] / 300 * 2), 2);
  whiteStroke = Math.max(Math.round(shape['stroke'] / 4), 1);

  var rect = {
    shapeName: shape['shapeName'],
    left: shape['from']['x']-imageOffset['x'],
    top: shape['from']['y']-imageOffset['y'],
    width: shape['size']['width'],
    height: shape['size']['height'],
    rx: 1,
    ry: 1,
    strokeWidth: shape['stroke'],
    stroke: colorValues[shape['color']],
    fill: 'transparent'
  }

  //Fabric調整
  rect['top'] = rect['top'] + rect['height'] / 2 + rect['strokeWidth'] / 2;
  rect['left'] = rect['left'] + rect['width'] / 2 + rect['strokeWidth'] / 2;

  var rectBorder = Cloner.clone(rect);
  rectBorder['width'] += rect['strokeWidth'] / 2 + whiteStroke / 2 + 4;
  rectBorder['height'] += rect['strokeWidth'] / 2 + whiteStroke / 2 + 4;
  rectBorder['rx'] = 5;
  rectBorder['ry'] = 5;
  rectBorder['strokeWidth'] = whiteStroke;
  rectBorder['stroke'] = 'white';

  var rectInline = Cloner.clone(rect);
  rectInline['width'] -= rect['strokeWidth'] / 2 + whiteStroke / 2 + 4;
  rectInline['height'] -= rect['strokeWidth'] / 2 + whiteStroke / 2 + 4;
  rectInline['rx'] = 5;
  rectInline['ry'] = 5;
  rectInline['strokeWidth'] = whiteStroke;
  rectInline['stroke'] = 'white';

  if (shadows == true) {
    drawShadow(canvas, rect, shadowStep);
  }

  canvas.add(new Fabric.Rect(rect));
  canvas.add(new Fabric.Rect(rectBorder));
  canvas.add(new Fabric.Rect(rectInline));
}

function drawCircle(json, canvas, shape, imageOffset) {
  shape['stroke'] = Math.max(Math.round(json['finalDimensions']['width'] / 300 * 2), 2);
  whiteStroke = 1;

  var circle = {
    shapeName: shape['shapeName'],
    left: shape['from']['x']-imageOffset['x'],
    top: shape['from']['y']-imageOffset['y'],
    radius: shape['radius'],
    strokeWidth: shape['stroke'],
    stroke: colorValues[shape['color']],
    fill: 'transparent'
  };
  var circleBorder = Cloner.clone(circle);
  circleBorder['radius'] = circle['radius'] + circle['strokeWidth'] / 2;
  circleBorder['strokeWidth'] = whiteStroke;
  circleBorder['stroke'] = 'white';

  var circleInline = Cloner.clone(circleBorder);
  circleInline['radius'] = circle['radius'] - circle['strokeWidth'] / 2;

  if (shadows == true) {
    drawShadow(canvas, circle, shadowStep);
  }

  canvas.add(new Fabric.Circle(circle));
  canvas.add(new Fabric.Circle(circleBorder));
  canvas.add(new Fabric.Circle(circleInline));
}

var shadowStep = 30;

/**
 * Draw a fuzzy shadow for the shape given.
 * Take care to draw the shadow before the shape.
 */
function drawShadow(canvas, shape, step) {
  if (step < 1) {
    step = 1;
  }
  var shadow = Cloner.clone(shape);
  if (step > shadow['strokeWidth']) {
    step = shadow['strokeWidth'];
  }

  var offsetX = 8;
  var offsetY = offsetX;

  var shadow = Cloner.clone(shape);
  shadow['left'] += offsetX;
  shadow['top'] += offsetY;
  shadow['stroke'] = 'rgba(0,0,0,0.5)';
  shadow['strokeWidth'] = shadow['strokeWidth'] / step;
  var stepWidth = shadow['strokeWidth'];

  //Adjust shadow outlines to outer edge, to work towards inside later.
  switch (shape['shapeName']) {
    case 'circle':
      shadow['radius'] += shape['strokeWidth'] / 2;
      shadow['strokeWidth'] *= 2;
      break;
    case 'rectangle':
      shadow['width'] += shape['strokeWidth'];
      shadow['height'] += shape['strokeWidth'];
      shadow['strokeWidth'] *= 2;
      break;
    default:
      console.error('実装されていない機能：' + shape['shapeName']);
      return;
  }

  var alpha;
  for (var i = 0; i < step; ++i) {
    if (i < (step / 2)) {
      alpha = (((i + 1) * 2) / (step));
    }
    else if (i == step / 2) {
      //Math ain't working to my likings
      alpha = 1;
    }
    else {
      alpha = (((step - (i + 1)) * 2) / (step));
    }

    shadow['stroke'] = 'rgba(0,0,0,' + alpha + ')';

    switch (shape['shapeName']) {
      case 'circle':
        canvas.add(new Fabric.Circle(shadow));
        shadow['radius'] = shadow['radius'] - stepWidth * 2 * 0.8;
        break;
      case 'rectangle':
        canvas.add(new Fabric.Rect(shadow));
        shadow['width'] = shadow['width'] - stepWidth * 4 * 0.8;
        shadow['height'] = shadow['height'] - stepWidth * 4 * 0.8;
        break;
      default:
        console.error('実装されてない機能：' + shape['shapeName']);
        return;
    }
  }
}

processArgs();
