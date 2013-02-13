var FS = require('fs');
var Fabric = require('fabric').fabric,
    canvas = Fabric.createCanvasForNode(800,600);

console.log(canvas);

var rect = new Fabric.Rect({
  top: 100,
  left: 100,
  width: 60,
  height: 70,
  fill: 'red'
});

canvas.add(rect);

var writeStream = FS.createWriteStream('out.jpg'),
    stream = canvas.createPNGStream();

stream.on('data', function(data) {
  writeStream.write(data);
});
