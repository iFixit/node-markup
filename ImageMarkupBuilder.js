var isNode = typeof window == 'undefined';


/**
 * Expects a Fabric.js Canvas
 */
function ImageMarkupBuilder(fabricCanvas) {
   var Fabric = require('fabric').fabric || fabric;

   var Shapes = {
      Rectangle:  require("./shape_rectangle").klass,
      Circle:     require("./shape_circle").klass
   };

   var colorValues = {
      'red':       "#C1280B",
      'orange':    "#FF9024",
      'yellow':    "#F3E00E",
      'green':     "#16DC81",
      'lightBlue': "#1BB1E9",
      'blue':      "#2343E8",
      'darkBlue':  "#2343E8",
      'violet':    "#DC54B7",
      'pink':      "#DC54B7",
      'black':     "#000000"
   };

   // Reference to the json object from processJSON
   var innerJSON;

   // Expected group indexes
   var borderIndex = 0;
   var inlineIndex = 1;
   var shapeIndex = 2;

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

   var whiteStroke = isNode ? 1 : 0.5;
   var strokeWidth = null;
   var crop = null;

   /**
    * Array of delegate functions to draw a proper shape.
    */
   var addShapeDelegate = [];
   addShapeDelegate['circle'] = function (data) {
      if (!data.radius) {
         data.radius = initialSize.circle / resizeRatio;
      }

      var circle = {
         from: {
            x: data.x,
            y: data.y
         },
         radius: data.radius,
         color: data.color,
         shapeName: data.type
      };

      return drawCircle(finalWidth, circle, imageOffset);
   };

   addShapeDelegate['rectangle'] = function (data) {
      if (!data.width || !data.height) {
         data.width = initialSize.rectangle / resizeRatio;
         data.height = initialSize.rectangle / resizeRatio;
      }

      data.x -= data.width / 2;
      data.y -= data.height / 2;

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
   }

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

         $(document).addEvent('keydown', function (e) {
            var markerObject;

            if ((markerObject = fabricCanvas.getActiveObject()) !== null) {
               switch(e.key) {
                  case 'left':
                     if (markerObject.left <= 0)
                        markerObject.left = 0;
                     else
                        markerObject.left -= 1;
                     break;
                  case 'right':
                     if (markerObject.left >= fabricCanvas.width)
                        markerObject.left = fabricCanvas.width;
                     else
                        markerObject.left += 1;
                     break;
                  case 'up':
                     if (markerObject.top <= 0)
                        markerObject.top = 0;
                     else
                        markerObject.top -= 1;
                     break;
                  case 'down':
                     if (markerObject.top >= fabricCanvas.height)
                        markerObject.top = fabricCanvas.height;
                     else
                        markerObject.top += 1;
                     break;
               }

               fabricCanvas.renderAll();
            }
         }.bind(this));

         // Setup drag-to-draw for this canvas
         require('./drag_to_create').setup(publicInterface);
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

   function drawRectangle(finalWidth, shape, imageOffset) {
      shape.stroke = getStrokeWidth(finalWidth);

      var rect = {
         shapeName: shape.shapeName,
         left: shape.from.x - imageOffset.x,
         top: shape.from.y - imageOffset.y,
         width: shape.size.width,
         height: shape.size.height,
         minSize: minimumSize.rectangle,
         maxSize: maximumSize.rectangle,
         rx: 1,
         ry: 1,
         borderWidth: shape.stroke,
         stroke: colorValues[shape.color],
         fill: 'transparent'
      }

      //Fabric調整
      rect.top *= resizeRatio;
      rect.left *= resizeRatio;
      rect.width *= resizeRatio;
      rect.height *= resizeRatio;

      if (isNode) {
         rect.minSize = rect.maxSize = false;
      }

      if (isNode && shadows == true) {
         drawShadow(rect, shadowStep);
      }

      var fabricRect = new Shapes.Rectangle(rect);

      fabricRect.lockRotation = true;
      fabricRect.transparentCorners = false;
      fabricRect.hasRotatingPoint = false;

      markupObjects.push(fabricRect);
      fabricCanvas.add(fabricRect);

      if (!isNode) {
         // Set this as the active object
         fabricCanvas.setActiveObject(fabricRect);
      }

      return fabricRect;
   }

   function drawCircle(finalWidth, shape, imageOffset) {
      shape.stroke = getStrokeWidth(finalWidth);

      var circle = {
         shapeName: shape.shapeName,
         left: shape.from.x - imageOffset.x,
         top: shape.from.y - imageOffset.y,
         radius: shape.radius,
         minSize: minimumSize.circle,
         maxSize: maximumSize.circle,
         borderWidth: shape.stroke,
         stroke: colorValues[shape.color],
         fill: 'transparent',

         // Resizing Controls
         lockRotation:        true,
         lockUniScaling:      true,
         transparentCorners:  false,
         hasRotatingPoint:    false,
         lockUniScaling:      true,
      };
      circle.left    *= resizeRatio;
      circle.top     *= resizeRatio;
      circle.radius  *= resizeRatio;

      if (isNode) {
         circle.minSize = circle.maxSize = false;
      }

      if (isNode && shadows == true) {
         drawShadow(circle, shadowStep);
      }

      var fabricCircle = new Shapes.Circle(circle);
      markupObjects.push(fabricCircle);
      fabricCanvas.add(fabricCircle);

      if (!isNode) {
         // Set this as the active object
         fabricCanvas.setActiveObject(fabricCircle);
      }

      return fabricCircle;
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
            console.error('Shape not implemented: ' + shape.shapeName);
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
               console.error('Shape not implemented: ' + shape.shapeName);
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

   /**
    * Performs ShapeData.type-agnostic attribute checks to ensure that the
    * necessary attributes are set in the given ShapeData object. Specifically,
    * the following operations are performed:
    *
    * - If data.x or data.y are not present, both are set to the center of
    *   the canvas. If both are present, they are scaled to the preview size
    *   of the canvas (if given).
    * - if data.color is not present, it is set to "red".
    */
   function normalizeShapeData(data) {
      if (!data.x || !data.y) {
         data.x = fabricCanvas.width / resizeRatio / 2;
         data.y = fabricCanvas.height / resizeRatio / 2;
      } else {
         data.x /= resizeRatio;
         data.y /= resizeRatio;
      }

      data.x += imageOffset.x;
      data.y += imageOffset.y;

      if (!data.color) {
         data.color = "red";
      }
   }

   var publicInterface = {
      fabricCanvas: fabricCanvas,

      /**
       * Adds and tracks a given data object following the ShapeData schema
       * to the fabric canvas. The act of drawing is delegated to the proper
       * draw method based on its "type" attribute.
       */
      addShape: function addShape(data) {
         if (!data.type)
            throw 'ShapeData.type is not defined.';

         normalizeShapeData(data);
         return addShapeDelegate[data.type](data);
      },

      /**
       * Adds and tracks a given data object following the ShapeData schema
       * to the fabric canvas. This ignores the "type" attribute of the object
       * and just adds a circle. To be deprecated by addShape().
       *
       * @return a reference to the tracked shape.
       */
      addCircle: function addCircle(data) {
         console.warn(
          "Deprecated function: addCircle(). Use addShape() instead.");

         if (data.type !== 'circle') data.type = 'circle';
         return this.addShape(data);
      },

      /**
       * Adds and tracks a given data object following the ShapeData schema
       * to the fabric canvas. This ignores the "type" attribute of the object
       * and just adds a rectangle. To be deprecated by addShape().
       *
       * @return a reference to the tracked shape.
       */
      addRectangle: function addRectangle(data) {
         console.warn(
          "Deprecated function: addRectangle(). Use addShape() instead.");

         if (data.type !== 'rectangle') data.type = 'rectangle';
         return this.addShape(data);
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
       * Returns a reference to the currently selected shape.
       *
       * @return a reference to the currently selected shape.
       */
      getActiveShape: function getActiveShape() {
         return fabricCanvas.getActiveObject();
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
            resizeRatio = json.previewInstructions.width / crop.size.width;
         }

         var finalSize = innerJSON.finalDimensions;
         maximumSize.rectangle = Math.min(finalSize.height, finalSize.width)
                                 * maximumSizeRatio.rectangle;

         maximumSize.circle = Math.min(finalSize.height, finalSize.width)
                              * maximumSizeRatio.circle;

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
            var object = markupObjects[i];

            switch (object.shapeName) {
               case 'circle':
                  var from = {
                     'x': Math.round(object.left / resizeRatio) + imageOffset.x,
                     'y': Math.round(object.top / resizeRatio) + imageOffset.y
                  };
                  var radius = Math.round((object.radius) / resizeRatio);
                  var color = translateRGBtoColorString(object.stroke);

                  markupString += "circle," + from.x + "x" + from.y + ","
                   + radius + "," + color + ";";
                  break;
               case 'rectangle':
                  var from = {
                     'x': Math.round((object.left - object.width / 2)
                      / resizeRatio) + imageOffset.x,
                     'y': Math.round((object.top - object.height / 2)
                      / resizeRatio) + imageOffset.y
                  };
                  var size = {
                     'width': Math.round(object.width / resizeRatio),
                     'height': Math.round(object.height / resizeRatio)
                  };
                  var color = translateRGBtoColorString(object.stroke);

                  markupString += "rectangle," + from.x + "x" + from.y + ","
                   + size.width + "x" + size.height + "," + color +  ";";
                  break;
               default:
                  console.error("Unexpected object name: " + object.shapeName);
            }
         }

         return markupString;
      }
   };
   return publicInterface;
}

module.exports.Builder = ImageMarkupBuilder;
