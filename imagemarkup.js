var FS = require('fs');
var Fabric = require('fabric').fabric;

var json = JSON.parse(process.argv[2]);
var canvas = Fabric.createCanvasForNode(json['dimensions']['width'],json['dimensions']['height']);

var imagePath = json['sourceFile'];
console.log("Setting background image to " + imagePath);

function applyBackground(canvas) {
  FS.readFile(imagePath, function (err, blob) {
    if (err) throw err;

    var dimensions = json['dimensions'];
    img = {'width': dimensions['width'], 'height': dimensions['height'], 'src':blob};

    Fabric.Image.fromObject(img, function(fimg) {
      canvas.add(fimg.set('top', img.height/2).set('left',img.width/2));

      applyMarkup(canvas);
    });
  });
}

function applyMarkup(canvas) {
  var size = json['dimensions'];

  json['instructions'].forEach(function (e) {
    for (shapeName in e) {
      switch (shapeName) {
        case 'rectangle':
          console.log(e[shapeName]);
          shape = e[shapeName];
          shape['stroke'] = Math.max(Math.round(json['finalDimensions']['width'] / 300 * 2), 2);

          var rect = {
            left: parseInt(shape['from']['x']),
            top: parseInt(shape['from']['y']),
            width: parseInt(shape['size']['width']),
            height: parseInt(shape['size']['height']),
            strokeWidth: parseInt(shape['stroke']),
            stroke: shape['color'],
            fill: 'transparent'
          }

          canvas.add(new Fabric.Rect(rect));
          break;
        case 'circle':
          console.log('サークル：実装されていない動作');
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
