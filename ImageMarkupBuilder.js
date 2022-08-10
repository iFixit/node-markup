const { isNode, cleanJSON } = require("./src/utils");
const Shapes = require("./shapes");
const path = require("path");

/**
 * Expects a Fabric.js Canvas
 */
function ImageMarkupBuilder(fabricCanvas) {
  var Fabric = require("fabric").fabric;

  var colorValues = {
    red: "#C1280B",
    orange: "#FF9024",
    yellow: "#F3E00E",
    green: "#16DC81",
    lightBlue: "#1BB1E9",
    blue: "#2343E8",
    darkBlue: "#2343E8",
    violet: "#DC54B7",
    pink: "#DC54B7",
    black: "#000000",
  };

  // Reference to the json object from processJSON
  var innerJSON;

  var imageOffset;
  var resizeRatio = 1;
  var finalWidth = 0;
  var markupObjects = [];

  var strokeWidth = null;
  var crop = null;

  /**
   * Array of delegate functions to draw a proper shape.
   */
  var addShapeDelegate = {
    arrow: function (data) {
      return drawLineBasedShape(Shapes.Arrow, data);
    },
    gap: function (data) {
      return drawLineBasedShape(Shapes.Gap, data);
    },
    line: function (data) {
      return drawLineBasedShape(Shapes.Line, data);
    },
    circle: drawCircle,
    rectangle: function (data) {
      // Because fabric considers top/left as the center of the rectangle.
      data.from.x -= data.size.width / 2;
      data.from.y -= data.size.height / 2;

      return drawRectangle(data);
    },
  };

  /**
   * Returns true if the given object is off the edge of the fabric canvas.
   * This is defined as whether the color stroke would be the only part of
   * the shape still visible at those coordinates.
   */
  fabricCanvas.isOffScreen = function (object) {
    var rect = object.getBoundingRect();
    return (
      rect.left + rect.width - strokeWidth * 2 < 0 ||
      rect.left + strokeWidth * 2 > this.width ||
      rect.top + rect.height - strokeWidth * 2 < 0 ||
      rect.top + strokeWidth * 2 > this.height
    );
  };

  function applyBackground(callback) {
    if (!isNode) {
      //Listen for shapes falling off the edge and delete
      fabricCanvas.on({
        "object:modified": function (e) {
          var shape = e.target;

          if (fabricCanvas.isOffScreen(shape)) remove(shape);
        }.bind(this),
      });
    }

    //Disable drag selection on canvas
    fabricCanvas.selection = false;

    if (!innerJSON.sourceFile) {
      if (!innerJSON.finalDimensions) {
        var msg = "Need source file or final dimensions to create canvas";
        throw new Error(msg);
      }

      //Apply markup to blank canvas
      applyMarkup(callback);
    } else {
      finalWidth = innerJSON.finalDimensions.width;
      if (isNode) {
        fabricCanvas.setBackgroundColor("#FFFFFF");
        var dimensions = innerJSON.dimensions;
        var img = {
          width: dimensions.width,
          height: dimensions.height,
          originX: "left",
          originY: "top",
          src: "file://" + path.resolve(innerJSON.sourceFile),
        };

        Fabric.Image.fromObject(img, function (fimg, err) {
          if (!fimg || err) throw err;
          var top = -imageOffset.y;
          if (top % 1 != 0) {
            top -= 0.5;
          }
          var left = -imageOffset.x;
          if (left % 1 != 0) {
            left -= 0.5;
          }

          fabricCanvas.add(fimg.set("top", top).set("left", left));
          applyMarkup(callback);
        });
      } else {
        throw new Error("Source files not supported on frontend");
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

    for (var instruction in innerJSON.instructions) {
      switch (instruction) {
        case "draw":
          innerJSON.instructions.draw.forEach(function (e) {
            for (var shapeName in e) {
              var shape = e[shapeName];
              shape.shapeName = shapeName;

              switch (shapeName) {
                case "rectangle":
                  drawRectangle(shape);
                  break;
                case "circle":
                  drawCircle(shape);
                  break;
                case "line":
                  drawLineBasedShape(Shapes.Line, shape);
                  break;
                case "gap":
                  drawLineBasedShape(Shapes.Gap, shape);
                  break;
                case "arrow":
                  drawLineBasedShape(Shapes.Arrow, shape);
                  break;
                default:
                  console.error("Unsupported Shape: " + shapeName);
              }
            }
          });
          break;

        //These should already be taken care of
        case "crop":
        case "strokeWidth":
          break;
        default:
          console.error("Unsupported Instruction: " + instruction);
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
    var outstream = require("fs").createWriteStream(innerJSON.destinationFile),
      stream = fabricCanvas.createJPEGStream({
        quality: 93,
        progressive: true,
      });

    stream.on("data", function (chunk) {
      outstream.write(chunk);
    });
    stream.on("end", function () {
      callback(fabricCanvas);
    });
  }

  /**
   * Returns a strokeWidth calculated based on the dimensions of the canvas.
   */
  function getStrokeWidth(finalWidth) {
    return strokeWidth != null
      ? strokeWidth
      : Math.max(Math.round((finalWidth / 300) * 2), 4);
  }

  function drawRectangle(shape) {
    shape.stroke = getStrokeWidth(finalWidth);

    var rect = {
      left: shape.from.x - imageOffset.x,
      top: shape.from.y - imageOffset.y,
      width: shape.size.width,
      height: shape.size.height,
      borderWidth: shape.stroke,
      stroke: colorValues[shape.color],
      color: shape.color,
    };

    //Fabric調整
    rect.top *= resizeRatio;
    rect.left *= resizeRatio;
    rect.width *= resizeRatio;
    rect.height *= resizeRatio;

    var fabricRect = new Shapes.Rectangle(rect);

    markupObjects.push(fabricRect);
    fabricCanvas.add(fabricRect);

    if (!isNode) {
      // Set this as the active object
      fabricCanvas.setActiveObject(fabricRect);
    }

    return fabricRect;
  }

  function drawLineBasedShape(klass, shape) {
    shape.stroke = getStrokeWidth(finalWidth);

    var line = {
      borderWidth: shape.stroke,
      stroke: colorValues[shape.color],
      color: shape.color,
    };

    var points = [
      (shape.from.x - imageOffset.x) * resizeRatio,
      (shape.from.y - imageOffset.y) * resizeRatio,
      (shape.to.x - imageOffset.x) * resizeRatio,
      (shape.to.y - imageOffset.y) * resizeRatio,
    ];

    var fabricLine = new klass(points, line);
    fabricLine.color = shape.color;

    markupObjects.push(fabricLine);
    fabricCanvas.add(fabricLine);

    if (!isNode) {
      // Set this as the active object
      fabricCanvas.setActiveObject(fabricLine);
    }

    return fabricLine;
  }

  function drawCircle(shape) {
    shape.stroke = getStrokeWidth(finalWidth);

    var circle = {
      left: shape.from.x - imageOffset.x,
      top: shape.from.y - imageOffset.y,
      radius: shape.radius,
      borderWidth: shape.stroke,
      stroke: colorValues[shape.color],
      color: shape.color,
    };
    circle.left *= resizeRatio;
    circle.top *= resizeRatio;
    circle.radius *= resizeRatio;

    var fabricCircle = new Shapes.Circle(circle);
    markupObjects.push(fabricCircle);
    fabricCanvas.add(fabricCircle);

    if (!isNode) {
      // Set this as the active object
      fabricCanvas.setActiveObject(fabricCircle);
    }

    return fabricCircle;
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
      markupObjects.splice(index, 1);
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
    data.from.x /= resizeRatio;
    data.from.y /= resizeRatio;
    data.from.x += imageOffset.x;
    data.from.y += imageOffset.y;

    if (data.to) {
      data.to.x /= resizeRatio;
      data.to.y /= resizeRatio;
      data.to.x += imageOffset.x;
      data.to.y += imageOffset.y;
    }

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
      if (!data.type) throw "ShapeData.type is not defined.";

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
      console.warn("Deprecated function: addCircle(). Use addShape() instead.");

      if (data.type !== "circle") data.type = "circle";
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
        "Deprecated function: addRectangle(). Use addShape() instead."
      );

      if (data.type !== "rectangle") data.type = "rectangle";
      return this.addShape(data);
    },

    /**
     * Sets the color of a tracked shape.
     */
    setColor: function setColor(shape, colorName) {
      shape.stroke = colorValues[colorName];
      shape.color = colorName;

      if (!isNode) fabricCanvas.renderAll();
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
     * Grows or shrinks the given shape depending on the given key
     * by the given number of pixels.
     *
     * @param shape The fabric shape to resize.
     * @param increment The number of pixels (negative or positive) to
     *  resize the shape.
     */
    incrementSize: function incrementSize(shape, increment) {
      if (!(typeof increment === "number")) {
        console.error("increment must be a number");
        return;
      }

      shape._withSizeLimitations(function () {
        shape.incrementSize(increment);
        if (fabricCanvas.isOffScreen(shape)) {
          shape.incrementSize(increment * -1);
        }
      }, true);

      shape.setCoords();
      fabricCanvas.renderAll();
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

      crop = innerJSON.instructions.crop;
      imageOffset =
        typeof crop != "undefined"
          ? {
              x: crop.from.x,
              y: crop.from.y,
            }
          : {
              x: 0,
              y: 0,
            };

      if (innerJSON.resizeRatio) {
        resizeRatio = innerJSON.resizeRatio;
      }

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
        for (var colorString in colorValues) {
          if (rgb == colorValues[colorString]) {
            return colorString;
          }
        }
        console.error("No mapping from RGB to Color String Found: " + rgb);
        return "black";
      }

      var markupString = ";";

      if (crop) {
        // Cut out cases where crop is used to offset non-4:3
        // images
        markupString +=
          "crop," +
          crop.from.x +
          "x" +
          crop.from.y +
          "," +
          crop.size.width +
          "x" +
          crop.size.height +
          ";";
      }

      for (var i = 0; i < markupObjects.length; ++i) {
        var object = markupObjects[i];

        switch (object.shapeName) {
          case "circle":
            var circleFrom = {
              x: Math.round(object.left / resizeRatio) + imageOffset.x,
              y: Math.round(object.top / resizeRatio) + imageOffset.y,
            };
            var radius = Math.round(object.getRadiusX() / resizeRatio);
            var circleColor = translateRGBtoColorString(object.stroke);

            markupString +=
              "circle," +
              circleFrom.x +
              "x" +
              circleFrom.y +
              "," +
              radius +
              "," +
              circleColor +
              ";";
            break;
          case "rectangle":
            var rectFrom = {
              x: Math.round(object.left / resizeRatio) + imageOffset.x,
              y: Math.round(object.top / resizeRatio) + imageOffset.y,
            };
            var size = {
              width: Math.round(object.width / resizeRatio),
              height: Math.round(object.height / resizeRatio),
            };
            var rectColor = translateRGBtoColorString(object.stroke);

            markupString +=
              "rectangle," +
              rectFrom.x +
              "x" +
              rectFrom.y +
              "," +
              size.width +
              "x" +
              size.height +
              "," +
              rectColor +
              ";";
            break;
          case "gap":
          case "arrow":
          case "line":
            markupString += object.toMarkup(resizeRatio, imageOffset);
            break;
          default:
            console.error("Unexpected object name: " + object.shapeName);
        }
      }

      return markupString;
    },
  };

  // Setup drag-to-draw for this canvas
  require("./src/drag_to_create").setup(publicInterface);

  return publicInterface;
}

module.exports.Builder = ImageMarkupBuilder;
