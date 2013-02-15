var FS = require('fs');
var Fabric = require('fabric').fabric;
var GM = require('gm');

var canvas = Fabric.createCanvasForNode(3260,2445);

var imagePath = __dirname + "/testimage.jpg";
var imageURL = "http://localhost/test.jpg";
console.log("Setting background image to " + imagePath);

function applyBackground(canvas) {
  FS.readFile(imagePath, function (err, blob) {
    if (err) throw err;

    var dimensions;
    GM(imagePath).size(function (err, size) {
      if (err) throw err;
      dimensions = size;

      img = {'width': dimensions['width'], 'height': dimensions['height'], 'src':blob};

      Fabric.Image.fromObject(img, function(fimg) {
        canvas.add(fimg.set('top', img.height/2).set('left',img.width/2));

        writeCanvas(canvas);
      });

    });
  });
}

function writeCanvas(canvas) {
  var outstream = FS.createWriteStream('out.jpg'),
      stream = canvas.createJPEGStream({
        quality: 93
      });

  stream.on('data', function(chunk) {
    outstream.write(chunk);
  });
}

applyBackground(canvas);
