var isNode = typeof module != 'undefined' && module.exports;


/**
 * Expects a Fabric.js Canvas
 */
function ImageMarkupBuilder(canvas) {
   if (isNode) {
      var FS = require('fs');
      var Fabric = require('fabric').fabric;
   } else {
      var Fabric = fabric;
   }

   var colorValues = {
      'red': 'rgb(193,40,11)',
      'orange': 'rgb(355,144,36)',
      'yellow': 'rgb(243,224,14)',
      'green': 'rgb(22,220,129)',
      'blue': 'rgb(35,67,232)',
      'violet': 'rgb(220,84,183)',
      'black': 'rgb(0,0,0)'
   };

   var imageOffset;
   var resizeRatio = 1;
   var finalWidth = 0;

   var markupObjects = new Array();

   var whiteStroke = 2;
   var crop = null;

   function clone(obj) {
      var newobj = {};
      for (property in obj) {
         if (typeof obj[property] == 'object') {
            newobj[property] = clone(property);
         } else {
            newobj[property] = obj[property];
         }
      }
      return newobj;
   }

   /**
    * Cycles through an object and changes all numeric fields to ints
    * where necessary. 'context' is used for exception reporting and can be
    * left unset upon invocation.
    */
   function cleanJSON(json, context) {
      if (!context)
         context = "root";

      for (property in json) {
         if (typeof(json[property]) == 'object') {
            cleanJSON(json[property], context + '.' + property);
         }
         else if (property == 'x' || property == 'y' ||
          property == 'width' || property == 'height' ||
          property == 'radius') {
            if (typeof(json[property]) == 'string') {
             json[property] = parseInt(json[property]);
               if (isNaN(json[property])) {
                  var msg = "In '" + context + "': property '" + property +
                   "' is not a number.";
                  throw msg;
               }
            }
         }
      }
   }

   function applyBackground(json, canvas, callback) {
      //Listen for shape resizes and reset strokeWidth accordingly
      canvas.on({
         'object:scaling': function (e) {
            var target = e.target;
            var shape = e.target.objects[0];
            var border = e.target.objects[1];
            var inline = e.target.objects[2];

            switch (shape.shapeName) {
               case 'rectangle':
                  shape.width *= e.target.scaleX;
                  shape.height *= e.target.scaleY;
                  e.target.width = border.width;
                  e.target.height = border.height;
                  break;
               case 'circle':
                  shape.radius *= e.target.scaleX;
                  e.target.width = border.radius * 2;
                  e.target.height = border.radius * 2;
                  break;
            }

            resizeBorder(shape, border, whiteStroke);
            resizeInline(shape, inline, whiteStroke);

            e.target.scaleX = 1;
            e.target.scaleY = 1;
         }
      });

      if (!json['sourceFile']) {
         if (!json['finalDimensions']) {
            var msg = "Need source file or final dimensions to create canvas";
            throw Exception(msg);
         }

         //Apply markup to blank canvas
         applyMarkup(json, canvas, callback);
      } else {
         finalWidth = json['finalDimensions']['width'];
         if (isNode) {
            FS.readFile(json['sourceFile'], function (err, blob) {
               if (err) throw err;

               var dimensions = json['dimensions'];
               var finalDimensions = json['finalDimensions'];
               img = {
                  'width': dimensions['width'],
                  'height': dimensions['height'],
                  'src':blob
               };

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

                  applyMarkup(json, canvas, callback);
               });
            });
         } else {
            throw Exception('Source files not supported on frontend');
         }
      }
   }

   function applyMarkup(json, canvas, callback) {
      for (instruction in json['instructions']) {
         switch (instruction) {
            case 'draw':
               json['instructions']['draw'].forEach(function (e) {
               for (shapeName in e) {
                  shape = e[shapeName];
                  shape['shapeName'] = shapeName;

                  switch (shapeName) {
                     case 'rectangle':
                        drawRectangle(finalWidth,
                         canvas, shape, imageOffset);
                        break;
                     case 'circle':
                        drawCircle(finalWidth, canvas,
                         shape, imageOffset);
                        break;
                     default:
                        console.error('Unsupported Shape: ' + shapeName);
                  }
               }
            });
            break;
            case 'crop':
               //This should already be taken care of in the canvas size
               break;
            default:
               console.error('Unsupported Instruction: ' + instruction);
         }
      }

      if (isNode) {
         writeCanvas(json, canvas, callback);
      } else {
         callback(canvas);
      }
   }

   function writeCanvas(json, canvas, callback) {
      canvas.renderAll();
      var outstream = FS.createWriteStream(json['destinationFile']),
      stream = canvas.createJPEGStream({
         quality: 93
      });

      stream.on('data', function(chunk) {
         outstream.write(chunk);
      });
      stream.on('end', function () {
         callback(canvas);
      });
   }

   function getStrokeWidth(finalWidth) {
      return Math.max(Math.round(finalWidth / 300 * 2), 4);
   }

   function resizeBorder(shape, shapeBorder, whiteStroke) {
      switch (shapeBorder.shapeName) {
         case 'rectangle':
            shapeBorder.width = shape.width + shape.strokeWidth +
             whiteStroke;
            shapeBorder.height = shape.height + shape.strokeWidth +
             whiteStroke;
            break;
         case 'circle':
            shapeBorder.radius = shape.radius + shape.strokeWidth / 2;
      }
   }

   function resizeInline(shape, shapeInline, whiteStroke) {
      switch (shapeInline.shapeName) {
         case 'rectangle':
            shapeInline.width = shape.width - shape.strokeWidth + whiteStroke;
            shapeInline.height = shape.height - shape.strokeWidth + whiteStroke;
            break;
         case 'circle':
            shapeInline.radius = shape.radius - shape.strokeWidth / 2;
            break;
      }
   }

   function drawRectangle(finalWidth, canvas, shape, imageOffset) {
      shape['stroke'] = getStrokeWidth(finalWidth);

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
      rect['top'] = rect['top'] + rect['height'] / 2
       + rect['strokeWidth'] / 2;
      rect['top'] *= resizeRatio;
      rect['left'] = rect['left'] + rect['width'] / 2
       + rect['strokeWidth'] / 2;
      rect['left'] *= resizeRatio;
      rect['width'] *= resizeRatio;
      rect['height'] *= resizeRatio;

      rect.shapeFunction = "shape";

      var rectBorder = clone(rect);
      resizeBorder(rect, rectBorder, whiteStroke);
      rectBorder['rx'] = rect['strokeWidth'] - whiteStroke;
      rectBorder['ry'] = rect['strokeWidth'] - whiteStroke;
      rectBorder['strokeWidth'] = whiteStroke;
      rectBorder['stroke'] = 'white';

      rectBorder.shapeFunction = "border";

      var rectInline = clone(rect);
      resizeInline(rect, rectInline, whiteStroke);
      rectInline['rx'] = Math.max(shape['stroke'] - rectBorder['rx'],4);
      rectInline['ry'] = Math.max(shape['stroke'] - rectBorder['ry'],4);
      rectInline['strokeWidth'] = whiteStroke;
      rectInline['stroke'] = 'white';

      rectInline.shapeFunction = "inline";

      if (isNode && shadows == true) {
         drawShadow(canvas, rect, shadowStep);
      }

      var fabricRect = new Fabric.Rect(rect),
      fabricBorder = new Fabric.Rect(rectBorder),
      fabricInline = new Fabric.Rect(rectInline);

      var group = new Fabric.Group([fabricRect, fabricBorder, fabricInline],
       {left: rect['left'], top: rect['top']});

      group.shapeName = 'rectangle';

      group.lockRotation = true;

      markupObjects.push(group);
      canvas.add(group);
   }

   function drawCircle(finalWidth, canvas, shape, imageOffset) {
      shape['stroke'] = getStrokeWidth(finalWidth);

      var circle = {
         shapeName: shape['shapeName'],
         left: shape['from']['x']-imageOffset['x'],
         top: shape['from']['y']-imageOffset['y'],
         radius: shape['radius'],
         strokeWidth: shape['stroke'],
         stroke: colorValues[shape['color']],
         fill: 'transparent'
      };
      circle.left *= resizeRatio;
      circle.top *= resizeRatio;
      circle.radius *= resizeRatio;
      circle.shapeFunction = 'shape';

      var circleBorder = clone(circle);
      resizeBorder(circle, circleBorder, whiteStroke);
      circleBorder['strokeWidth'] = whiteStroke;
      circleBorder['stroke'] = 'white';
      circleBorder.shapeFunction = 'border';

      var circleInline = clone(circleBorder);
      resizeInline(circle, circleInline, whiteStroke);
      circleInline.shapeFunction = 'inline';

      if (isNode && shadows == true) {
         drawShadow(canvas, circle, shadowStep);
      }

      var fabricCircle = new Fabric.Circle(circle),
      fabricBorder = new Fabric.Circle(circleBorder),
      fabricInline = new Fabric.Circle(circleInline);

      var group = new Fabric.Group([fabricCircle, fabricBorder, fabricInline],
       {left: fabricCircle['left'], top: fabricCircle['top']});

      group.shapeName = 'circle';

      group.lockRotation = true;
      group.lockUniScaling = true;

      markupObjects.push(group);
      canvas.add(group);
   }

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
      shadow['rx'] = 5;
      shadow['ry'] = 5;
      shadow['stroke'] = 'rgba(0,0,0,0.5)';
      shadow['strokeWidth'] = shadow['strokeWidth'] / step;
      var stepWidth = shadow['strokeWidth'];

      //Empirically-derived pixel tweaks to line up shadow sizes with their
      //parents. TODO: Base these numbers on something real.
      var circleTweak = 0.6875;
      var rectangleTweak = 1.3125;

      //Adjust shadow outlines to outer edge, to work towards inside later.
      switch (shape['shapeName']) {
         case 'circle':
            shadow['radius'] += shape['strokeWidth'] * circleTweak;
            shadow['strokeWidth'] *= 2;
            break;
         case 'rectangle':
            shadow['width'] += shape['strokeWidth'] * rectangleTweak;
            shadow['height'] += shape['strokeWidth'] * rectangleTweak;
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

   return {
      addCircle: function addCircle(data) {
         if (!data.x || !data.y) {
            data.x = canvas.width / resizeRatio / 2;
            data.y = canvas.height / resizeRatio / 2;
         }
         if (!data.radius) {
            data.radius = 16 / resizeRatio;
         }
         if (!data.color) {
            data.color = "red";
         }

         var circle = {
            from: {
               x: data.x,
               y: data.y
            },
            radius: data.radius,
            color: data.color,
            shapeName: "circle"
         };

         drawCircle(finalWidth, canvas, circle, imageOffset);
      },

      addRectangle: function addRectangle(data) {
         if (!data.x || !data.y) {
            data.x = canvas.width / resizeRatio / 2;
            data.y = canvas.height / resizeRatio / 2;
         }
         if (!data.width || !data.height) {
            data.width = 24 / resizeRatio;
            data.height = 24 / resizeRatio;
         }
         if (!data.color) {
            data.color = "red";
         }

         var rect = {
            from: {
               x: data.x,
               y: data.y
            },
            size: {
               width: data.width,
               height: data.height
            },
            color: data.color,
            shapeName: "rectangle"
         };

         drawRectangle(finalWidth, canvas, rect, imageOffset);
      },

      processJSON: function processJSON(json, callback) {
         //Make sure not to render every addition on server end
         canvas.renderOnAddition = !isNode;

         cleanJSON(json);

         var imagePath = json['sourceFile'];

         crop = json['instructions']['crop'];
         imageOffset = (typeof crop != "undefined") ?
            {
               'x': crop['from']['x'],
               'y': crop['from']['y']
            } : {'x': 0,'y': 0};

            if (json['previewInstructions']) {
               imageOffset.x = json.previewInstructions.left;
               imageOffset.y = json.previewInstructions.top;
               resizeRatio = 1 / json.previewInstructions.ratio;
            }

            applyBackground(json, canvas, callback);
      },

      getMarkupObjects: function getMarkupObjects(callback) {
         return markupObjects;
      },

      getMarkupString: function getMarkupString() {
         /**
          * Translate RGB value to applicable color string. Unknown
          * RGB values will will become black and a console.error message
          * will be written.
          */
         function translateRGBtoColorString(rgb) {
            for (colorString in colorValues) {
               if (rgb == colorValues[colorString]) {
                  return colorString;
               }
            }
            console.error("No mapping from RGB to Color String Found: " + rgb);
            return 'black';
         }

         var markupString = ";"

         if (typeof crop != "undefined") {
            markupString += "crop," + crop.from.x + "x" +
             crop.from.y + "," + crop.size.width + "x" +
             crop.size.height + ";";
         }

         for (var i = 0; i < markupObjects.length; ++i) {
            var group = markupObjects[i];

            switch (group.shapeName) {
               case 'circle':
                  var circle = group.objects[0]; //main shape
                  var outline = group.objects[1];
                  var from = {
                     'x': Math.round(group.left / resizeRatio),
                     'y': Math.round(group.top / resizeRatio)
                  };
                  var radius = Math.round((circle.radius) / resizeRatio);
                  var color = translateRGBtoColorString(circle.stroke);

                  markupString += "circle," + from.x + "x" + from.y + ","
                   + radius + "," + color + ";";
                  break;
               case 'rectangle':
                  var rectangle = group.objects[0]; //main shape
                  var from = {
                     'x': Math.round((group.left - rectangle.width / 2)
                      / resizeRatio),
                     'y': Math.round((group.top - rectangle.height / 2)
                      / resizeRatio)
                  };
                  var size = {
                     'width': Math.round(rectangle.width / resizeRatio),
                     'height': Math.round(rectangle.height / resizeRatio)
                  };
                  var color = translateRGBtoColorString(rectangle.stroke);

                  markupString += "rectangle," + from.x + "x" + from.y + ","
                   + size.width + "x" + size.height + "," + color +  ";";
                  break;
               default:
                  console.error("Unexpected group name: " + group.shapeName);
            }
         }

         return markupString;
      }
   };
}

if (isNode)
   module.exports = ImageMarkupBuilder;
else
   var createImageFromMarkup = ImageMarkupBuilder;
