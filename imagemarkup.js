var FS = require('fs');
var Fabric = require('fabric').fabric;

var json = JSON.parse(process.argv[2]);
var canvas = Fabric.createCanvasForNode(parseInt(json['finalDimensions']['width']),parseInt(json['finalDimensions']['height']));

var imagePath = json['sourceFile'];
console.log("Setting background image to " + imagePath);

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
      canvas.add(fimg.set('top', img.height/2 - imageOffset['y']).set('left',img.width/2 - imageOffset['x']));

      applyMarkup(canvas);
    });
  });
}

function applyMarkup(canvas) {
  var size = json['dimensions'];

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
            stroke: shape['color'],
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
            stroke: shape['color'],
            fill: 'transparent'
          };
          canvas.add(new Fabric.Circle(circle));
          //console.log('サークル：実装されていない動作');
          break;
        default:
          console.log('Invalid operation: ' . shapeName);
      }
    }

    writeCanvas(canvas);
  });
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
