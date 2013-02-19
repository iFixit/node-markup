var FS = require('fs');
var Fabric = require('fabric').fabric;
var Cloner = require('cloneextend');
var argv = require('optimist').argv;

function usage(err) {
  console.log('Example Usage:');
  console.log('node imagemarkup.js --input infile.jpg --output outfile.jpg --markup \'[markup_string]\'');
  console.log('node imagemarkup.js --json \'[json_string]\'');
  //TODO: "See README file for specification"
  if (err)
    process.exit(err);
  else
    process.exit(0);
}

if (argv.help || argv.h) {
  usage();
}

var json;
if (argv.json && argv.markup) {
  console.error('Invalid usage.');
  usage(-1);
} else if (argv.json) {
  var json = JSON.parse(argv.json);
} else if (argv.markup) {
  if (!argv.input || !argv.output) {
    console.error('Invalid usage. Input or output path missing.');
    usage(-1);
  }
  console.log(argv.markup);
  process.exit(0);
} else {
  console.error('Invalid uage.');
  usage(-1);
}

//Values obtained from contemporary image markup dialog, 2013-02-18
var colorValues = {
  'red': '#C1280B',
  'orange': '#FF9024',
  'yellow': '#F3E00E',
  'green': '#16DC81', //I contend this is cyan
  'blue': '#2343E8',
  'violet': '#DC54B7', //Fuscia?
  'black': '#000000'
};

//var json = JSON.parse(process.argv[2]);
var canvas = Fabric.createCanvasForNode(parseInt(json['finalDimensions']['width']),parseInt(json['finalDimensions']['height']));

var imagePath = json['sourceFile'];

var crop = json['instructions']['crop'];
var imageOffset = crop != "undefined" ?
 {'x':parseInt(crop['from']['x']),
  'y':parseInt(crop['from']['y'])} :
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
            switch (shapeName) {
              case 'rectangle':
                shape = e[shapeName];
                shape['stroke'] = Math.max(Math.round(json['finalDimensions']['width'] / 300 * 2), 2);

                var rect = {
                  left: parseInt(shape['from']['x'])-imageOffset['x'],
                  top: parseInt(shape['from']['y'])-imageOffset['y'],
                  width: parseInt(shape['size']['width']),
                  height: parseInt(shape['size']['height']),
                  strokeWidth: parseInt(shape['stroke']),
                  stroke: colorValues[shape['color']],
                  fill: 'transparent'
                }
                //Fabric調整
                rect['top'] = rect['top'] + rect['height'] / 2 + rect['strokeWidth'] / 2;
                rect['left'] = rect['left'] + rect['width'] / 2 + rect['strokeWidth'] / 2;

                canvas.add(new Fabric.Rect(rect));
                break;
              case 'circle':
                shape = e[shapeName];
                shape['stroke'] = Math.max(Math.round(shape['radius'] / 4), 5);

                var circle = {
                  left: parseInt(shape['from']['x'])-imageOffset['x'],
                  top: parseInt(shape['from']['y'])-imageOffset['y'],
                  radius: parseInt(shape['radius']),
                  strokeWidth: parseInt(shape['stroke']),
                  stroke: colorValues[shape['color']],
                  fill: 'transparent'
                };
                var circleBorder = Cloner.clone(circle);
                circleBorder['radius'] += 1;
                circleBorder['stroke'] = 'white';
                var circleShadow = Cloner.clone(circle);
                circleShadow['left'] += 10;
                circleShadow['top'] += 10;
                circleShadow['stroke'] = 'rgba(0,0,0,0.5)';

                canvas.add(new Fabric.Circle(circleBorder));
                canvas.add(new Fabric.Circle(circleShadow));
                canvas.add(new Fabric.Circle(circle));
                //console.log('サークル：実装されていない動作');
                break;
              default:
                console.log('予期しないシェープ：' + shapeName);
            }
          }

          writeCanvas(canvas);
        });
        break;
      case 'crop':
        //もう処理していたから無視する
        break;
      default:
        console.log('予期しない動作：' + instruction);
    }
  }
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
