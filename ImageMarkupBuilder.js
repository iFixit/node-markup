var isNode = typeof module != 'undefined' && module.exports;


/**
 * Expects a Fabric.js Canvas
 */
function ImageMarkupBuilder(fabricCanvas) {
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

   // Reference to the json object from processJSON
   var innerJSON;

   // Expected group indexes
   var borderIndex = 0;
   var inlineIndex = 1;
   var shapeIndex = 2;

   // Holder for initial position of currently selected shape
   var initialPosition = {fresh: false, left: NaN, top: NaN};

   var imageOffset;
   var resizeRatio = 1;
   var finalWidth = 0;
   var minimumSize = {
      circle: 8,
      rectangle: 16
   };
   var maximumSize = {
      circle: 64,
      rectangle: 128
   };
   var maximumSizeRatio = {
      circle: 0.3, // Max size of radius
      rectangle: 0.8 // Max size of side
   };
   var initialSize = {
      circle: 12,
      rectangle: 24
   };

   var markupObjects = new Array();

   var whiteStroke = isNode ? 2 : 1;
   var strokeWidth = null;
   var crop = null;

   /**
    * Simple clone function for use in deep-copying objects containing
    * objects, arrays, and values. Does not support copying of functions.
    */
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

   function applyBackground(callback) {
      if (!isNode) {
         //Listen for shape resizes and reset strokeWidth accordingly
         fabricCanvas.on({
            'object:scaling': function (e) {
               //If no initial position is logged, log it
               if (!initialPosition.fresh) {
                  initialPosition = {
                     left: e.target.left,
                     top: e.target.top,
                     fresh: true
                  };
               }

               var target = e.target;
               var shape = e.target.objects[shapeIndex];
               var border = e.target.objects[borderIndex];
               var inline = e.target.objects[inlineIndex];

               switch (shape.shapeName) {
                  case 'rectangle':
                     var newSize = {
                        width: shape.width * e.target.scaleX,
                        height: shape.height * e.target.scaleY
                     };
                     if (newSize.width <= minimumSize.rectangle ||
                      newSize.height <= minimumSize.rectangle ||
                      newSize.width >= maximumSize.rectangle ||
                      newSize.height >= maximumSize.rectangle) {
                        if (newSize.width <= minimumSize.rectangle) {
                           newSize.width = minimumSize.rectangle;
                        } else if (newSize.width >= maximumSize.rectangle) {
                           newSize.width = maximumSize.rectangle;
                        }

                        if (newSize.height <= minimumSize.rectangle) {
                           newSize.height = minimumSize.rectangle;
                        } else if (newSize.height >= maximumSize.rectangle) {
                           newSize.height = maximumSize.rectangle;
                        }
                     }

                     shape.width = newSize.width;
                     shape.height = newSize.height;
                     e.target.width = border.width;
                     e.target.height = border.height;
                     break;
                  case 'circle':
                     var newRadius = shape.radius * e.target.scaleX;

                     if (newRadius <= minimumSize.circle) {
                        newRadius = minimumSize.circle;
                     } else if (newRadius >= maximumSize.circle) {
                        newRadius = maximumSize.circle;
                     }

                     shape.radius = newRadius;
                     e.target.width = border.radius * 2;
                     e.target.height = border.radius * 2;

                     break;
               }

               resizeBorder(shape, border, whiteStroke);
               resizeInline(shape, inline, whiteStroke);

               e.target.scaleX = 1;
               e.target.scaleY = 1;

               e.target.left = initialPosition.left;
               e.target.top = initialPosition.top;
            }.bind(this)
         });

         //Listen for shapes falling off the edge and delete
         fabricCanvas.on({
            'object:modified': function (e) {
               var shape = e.target;
               var w = shape.width / 2;
               var h = shape.height / 2;

               if (shape.left + w < 0 ||
                shape.left - w > fabricCanvas.width ||
                shape.top + h < 0 ||
                shape.top - h > fabricCanvas.height) {
                  remove(shape);
               }
            }.bind(this)
         });

         //Clear initial position on mouse up
         fabricCanvas.on({
            'mouse:up': function (e) {
               initialPosition.fresh = false;
            }.bind(this)
         });
      }

      //Disable drag selection on canvas
      fabricCanvas.selection = false;

      if (!innerJSON.sourceFile) {
         if (!innerJSON.finalDimensions) {
            var msg = "Need source file or final dimensions to create canvas";
            throw Exception(msg);
         }

         //Apply markup to blank canvas
         applyMarkup(callback);
      } else {
         finalWidth = innerJSON.finalDimensions.width;
         if (finalWidth <= 1800) {
            whiteStroke = 1;
         }
         if (isNode) {
            FS.readFile(innerJSON.sourceFile, function (err, blob) {
               if (err) throw err;

               var dimensions = innerJSON.dimensions;
               var finalDimensions = innerJSON.finalDimensions;
               img = {
                  'width': dimensions.width,
                  'height': dimensions.height,
                  'src': blob
               };

               Fabric.Image.fromObject(img, function(fimg) {
                  top = img.height/2 - imageOffset.y;
                  if (top % 1 != 0) {
                     top -= 0.5;
                  }
                  left = img.width / 2 - imageOffset.x;
                  if (left % 1 != 0) {
                     left -= 0.5;
                  }

                  fabricCanvas.add(fimg.set('top', top).set('left', left));

                  applyMarkup(callback);
               });
            });
         } else {
            throw Exception('Source files not supported on frontend');
         }
      }
   }

   /**
    * Applies the given markup instructions to the fabric canvas. If this is
    * server-side, call writeCanvas() to write the results to a file. If
    * client-side, call the client-provided callback directly.
    */
   function applyMarkup(callback) {
      // strokeWidth needs to be caught now, since if it's lower in the JSON
      // it will not get picked up until it's too late.
      if (innerJSON.instructions.strokeWidth) {
         strokeWidth = innerJSON.instructions.strokeWidth;
      }

      for (instruction in innerJSON.instructions) {
         switch (instruction) {
            case 'draw':
               innerJSON.instructions.draw.forEach(function (e) {
               for (shapeName in e) {
                  shape = e[shapeName];
                  shape.shapeName = shapeName;

                  switch (shapeName) {
                     case 'rectangle':
                        drawRectangle(finalWidth,
                         shape, imageOffset);
                        break;
                     case 'circle':
                        drawCircle(finalWidth,
                         shape, imageOffset);
                        break;
                     default:
                        console.error('Unsupported Shape: ' + shapeName);
                  }
               }
            });
            break;

            //These should already be taken care of
            case 'crop':
            case 'strokeWidth':
               break;
            default:
               console.error('Unsupported Instruction: ' + instruction);
         }
      }

      if (isNode) {
         writeCanvas(callback);
      } else {
         callback(fabricCanvas);
      }
   }

   /**
    * Writes the processed canvas to a file.
    */
   function writeCanvas(callback) {
      fabricCanvas.renderAll();
      var outstream = FS.createWriteStream(innerJSON.destinationFile),
      stream = fabricCanvas.createJPEGStream({
         quality: 93
      });

      stream.on('data', function(chunk) {
         outstream.write(chunk);
      });
      stream.on('end', function () {
         callback(fabricCanvas);
      });
   }

   /**
    * Returns a strokeWidth calculated based on the dimensions of the canvas.
    */
   function getStrokeWidth(finalWidth) {
      if (strokeWidth != null) {
         var width = strokeWidth;
      } else {
         var width = Math.max(Math.round(finalWidth / 300 * 2), 4);
      }

      return width;
   }

   /**
    * Resizes the border (outline) of the shape group to reflect correctly
    * the size of the shape.
    */
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

   /**
    * Resizes the inline of the shape group to reflect correctly the size of
    * the shape.
    */
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

   function drawRectangle(finalWidth, shape, imageOffset) {
      shape.stroke = getStrokeWidth(finalWidth);

      var rect = {
         shapeName: shape.shapeName,
         left: shape.from.x - imageOffset.x,
         top: shape.from.y - imageOffset.y,
         width: shape.size.width,
         height: shape.size.height,
         rx: 1,
         ry: 1,
         strokeWidth: shape.stroke,
         stroke: colorValues[shape.color],
         fill: 'transparent'
      }

      //Fabric調整
      rect.top = rect.top + rect.height / 2
       + rect.strokeWidth / 2;
      rect.top *= resizeRatio;
      rect.left = rect.left + rect.width / 2
       + rect.strokeWidth / 2;
      rect.left *= resizeRatio;
      rect.width *= resizeRatio;
      rect.height *= resizeRatio;

      rect.shapeFunction = "shape";

      var rectBorder = clone(rect);
      resizeBorder(rect, rectBorder, whiteStroke);
      rectBorder.rx = rect.strokeWidth - whiteStroke;
      rectBorder.ry = rect.strokeWidth - whiteStroke;
      rectBorder.strokeWidth = whiteStroke;
      rectBorder.stroke = 'white';

      rectBorder.shapeFunction = "border";

      var rectInline = clone(rect);
      resizeInline(rect, rectInline, whiteStroke);
      rectInline.rx = Math.max(shape.stroke - rectBorder.rx, 4);
      rectInline.ry = Math.max(shape.stroke - rectBorder.ry, 4);
      rectInline.strokeWidth = whiteStroke;
      rectInline.stroke = 'white';

      rectInline.shapeFunction = "inline";

      if (isNode && shadows == true) {
         drawShadow(rect, shadowStep);
      }

      var fabricRect = new Fabric.Rect(rect),
      fabricBorder = new Fabric.Rect(rectBorder),
      fabricInline = new Fabric.Rect(rectInline);

      var group = new Fabric.Group([fabricBorder, fabricInline, fabricRect],
       {left: rect.left, top: rect.top});

      group.shapeName = 'rectangle';

      group.lockRotation = true;
      group.transparentCorners = false;
      group.hasRotatingPoint = false;

      markupObjects.push(group);
      fabricCanvas.add(group);

      if (!isNode) {
         // Set this as the active object
         fabricCanvas.setActiveObject(group);
      }

      return group;
   }

   function drawCircle(finalWidth, shape, imageOffset) {
      shape.stroke = getStrokeWidth(finalWidth);

      var circle = {
         shapeName: shape.shapeName,
         left: shape.from.x - imageOffset.x,
         top: shape.from.y - imageOffset.y,
         radius: shape.radius,
         strokeWidth: shape.stroke,
         stroke: colorValues[shape.color],
         fill: 'transparent'
      };
      circle.left *= resizeRatio;
      circle.top *= resizeRatio;
      circle.radius *= resizeRatio;
      circle.shapeFunction = 'shape';

      var circleBorder = clone(circle);
      resizeBorder(circle, circleBorder, whiteStroke);
      circleBorder.strokeWidth = whiteStroke;
      circleBorder.stroke = 'white';
      circleBorder.shapeFunction = 'border';

      var circleInline = clone(circleBorder);
      resizeInline(circle, circleInline, whiteStroke);
      circleInline.shapeFunction = 'inline';

      if (isNode && shadows == true) {
         drawShadow(circle, shadowStep);
      }

      var fabricCircle = new Fabric.Circle(circle),
      fabricBorder = new Fabric.Circle(circleBorder),
      fabricInline = new Fabric.Circle(circleInline);

      var group = new Fabric.Group([fabricBorder, fabricInline, fabricCircle],
       {left: fabricCircle.left, top: fabricCircle.top});

      group.shapeName = 'circle';

      group.lockRotation = true;
      group.lockUniScaling = true;
      group.transparentCorners = false;
      group.hasRotatingPoint = false;

      markupObjects.push(group);
      fabricCanvas.add(group);

      if (!isNode) {
         // Set this as the active object
         fabricCanvas.setActiveObject(group);
      }

      return group;
   }

   /**
    * Draw a fuzzy shadow for the shape given.
    * Take care to draw the shadow before the shape.
    */
   function drawShadow(shape, step) {
      if (step < 1) {
         step = 1;
      }
      var shadow = Cloner.clone(shape);
      if (step > shadow.strokeWidth) {
         step = shadow.strokeWidth;
      }

      var offsetX = 8;
      var offsetY = offsetX;

      var shadow = Cloner.clone(shape);
      shadow.left += offsetX;
      shadow.top += offsetY;
      shadow.rx = 5;
      shadow.ry = 5;
      shadow.stroke = 'rgba(0,0,0,0.5)';
      shadow.strokeWidth = shadow.strokeWidth / step;
      var stepWidth = shadow.strokeWidth;

      //Empirically-derived pixel tweaks to line up shadow sizes with their
      //parents. TODO: Base these numbers on something real.
      var circleTweak = 0.6875;
      var rectangleTweak = 1.3125;

      //Adjust shadow outlines to outer edge, to work towards inside later.
      switch (shape.shapeName) {
         case 'circle':
            shadow.radius += shape.strokeWidth * circleTweak;
            shadow.strokeWidth *= 2;
            break;
         case 'rectangle':
            shadow.width += shape.strokeWidth * rectangleTweak;
            shadow.height += shape.strokeWidth * rectangleTweak;
            shadow.strokeWidth *= 2;
            break;
         default:
            console.error('実装されていない機能：' + shape.shapeName);
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

         shadow.stroke = 'rgba(0,0,0,' + alpha + ')';

         switch (shape.shapeName) {
            case 'circle':
               fabricCanvas.add(new Fabric.Circle(shadow));
               shadow.radius = shadow.radius - stepWidth * 2 * 0.8;
               break;
            case 'rectangle':
               fabricCanvas.add(new Fabric.Rect(shadow));
               shadow.width = shadow.width - stepWidth * 4 * 0.8;
               shadow.height = shadow.height - stepWidth * 4 * 0.8;
               break;
            default:
               console.error('実装されてない機能：' + shape.shapeName);
               return;
         }
      }
   }

   function locate(shape) {
      for (var i = 0; i < markupObjects.length; ++i) {
         if (markupObjects[i] === shape) {
            return i;
         }
      }

      return null;
   }

   function remove(shape) {
      var index = locate(shape);
      if (index != null) {
         fabricCanvas.remove(shape);
         markupObjects.splice(index,1);
      }
   }

   return {
      /**
       * Adds and tracks a given data object following the ShapeData schema
       * to the fabric canvas. This ignores the "type" attribute of the object
       * and just adds a circle. To be deprecated by addShape().
       *
       * @return a reference to the tracked shape.
       */
      addCircle: function addCircle(data) {
         if (!data.x || !data.y) {
            data.x = fabricCanvas.width / resizeRatio / 2;
            data.y = fabricCanvas.height / resizeRatio / 2;
            data.x += imageOffset.x;
            data.y += imageOffset.y;
         } else {
            data.x /= resizeRatio;
            data.y /= resizeRatio;
            data.x += imageOffset.x;
            data.y += imageOffset.y;
         }

         if (!data.radius) {
            data.radius = initialSize.circle / resizeRatio;
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

         return drawCircle(finalWidth, circle, imageOffset);
      },

      /**
       * Adds and tracks a given data object following the ShapeData schema
       * to the fabric canvas. This ignores the "type" attribute of the object
       * and just adds a rectangle. To be deprecated by addShape().
       *
       * @return a reference to the tracked shape.
       */
      addRectangle: function addRectangle(data) {
         if (!data.width || !data.height) {
            data.width = initialSize.rectangle / resizeRatio;
            data.height = initialSize.rectangle / resizeRatio;
         }
         if (!data.x || !data.y) {
            data.x = fabricCanvas.width / resizeRatio / 2;
            data.y = fabricCanvas.height / resizeRatio / 2;
            data.x -= data.width / 2;
            data.y -= data.height / 2;
            data.x += imageOffset.x;
            data.y += imageOffset.y;
         } else {
            data.x = data.x / resizeRatio;
            data.y = data.y / resizeRatio;
            data.x -= data.width / 2;
            data.y -= data.height / 2;
            data.x += imageOffset.x;
            data.y += imageOffset.y;
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

         return drawRectangle(finalWidth, rect, imageOffset);
      },

      /**
       * Sets the color of a tracked shape.
       */
      setColor: function setColor(shape, colorName) {
         shape.objects[shapeIndex].stroke = colorValues[colorName];

         if (!isNode)
            fabricCanvas.renderAll();
      },

      /**
       * Returns an array of all objects in the fabric canvas, whether
       * tracked by the Builder or not.
       */
      getShapes: function getShapes() {
         return fabricCanvas._objects;
      },

      /**
       * Removes a specific tracked shape from the fabric canvas.
       */
      removeShape: function removeShape(shape) {
         remove(shape);
      },

      /**
       * Removes all tracked shapes from the fabric canvas.
       */
      removeShapes: function removeShapes() {
         for (var i = 0; i < markupObjects.length; ++i) {
            var shape = markupObjects[i];
            fabricCanvas.remove(shape);
         }

         markupObjects = [];
      },

      /**
       * Takes a Builder-schema JSON object and performs the operations
       * listed therein, then calls the callback function.
       */
      processJSON: function processJSON(json, callback) {
         //Make sure not to render every addition on server end
         fabricCanvas.renderOnAddition = !isNode;
         fabricCanvas.uniScaleTransform = true;

         cleanJSON(json);

         innerJSON = json;

         var imagePath = innerJSON.sourceFile;

         crop = innerJSON.instructions.crop;
         imageOffset = (typeof crop != "undefined" &&
          crop.from.x >= 0 && crop.from.y >= 0) ? {
            'x': crop.from.x,
            'y': crop.from.y
         } : {
            'x': 0,
            'y': 0
         };

         if (innerJSON.previewInstructions) {
            resizeRatio = 1 / innerJSON.previewInstructions.ratio;
         }

         maximumSize.rectangle =
          innerJSON.finalDimensions.height < innerJSON.finalDimensions.width ?
          innerJSON.finalDimensions.height * maximumSizeRatio.rectangle :
          innerJSON.finalDimensions.width * maximumSizeRatio.rectangle;

         maximumSize.circle =
          innerJSON.finalDimensions.height < innerJSON.finalDimensions.width ?
          innerJSON.finalDimensions.height * maximumSizeRatio.circle :
          innerJSON.finalDimensions.width * maximumSizeRatio.circle;

         applyBackground(callback);
      },

      getMarkupObjects: function getMarkupObjects() {
         return markupObjects;
      },

      /**
       * Returns a markup string which can be used with ImageMarkupCall
       * to produce the same markup results as represented in this builder.
       */
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
            // Cut out cases where crop is used to offset non-4:3
            // images
            if (crop.from.x >= 0 && crop.from.y >= 0) {
               markupString += "crop," + crop.from.x + "x" +
                crop.from.y + "," + crop.size.width + "x" +
                crop.size.height + ";";
            }
         }

         for (var i = 0; i < markupObjects.length; ++i) {
            var group = markupObjects[i];

            switch (group.shapeName) {
               case 'circle':
                  var circle = group.objects[shapeIndex]; //main shape
                  var outline = group.objects[borderIndex];
                  var from = {
                     'x': Math.round(group.left / resizeRatio) + imageOffset.x,
                     'y': Math.round(group.top / resizeRatio) + imageOffset.y
                  };
                  var radius = Math.round((circle.radius) / resizeRatio);
                  var color = translateRGBtoColorString(circle.stroke);

                  markupString += "circle," + from.x + "x" + from.y + ","
                   + radius + "," + color + ";";
                  break;
               case 'rectangle':
                  var rectangle = group.objects[shapeIndex]; //main shape
                  var from = {
                     'x': Math.round((group.left - rectangle.width / 2)
                      / resizeRatio) + imageOffset.x,
                     'y': Math.round((group.top - rectangle.height / 2)
                      / resizeRatio) + imageOffset.y
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
