/*************
 * Marker Creation Interface code
 */
function setupMarkerCreation(markupBuilder) {
   var enabled = false,
       dragging = false,
       canvas = markupBuilder.fabricCanvas,
       mouseDownEvent,
       color,
       currentShape,
       shapeMode = Enum(['circle', 'rectangle']);

   canvas.on({
   'mouse:down': function(event) {
      if (!enabled) return;
      mouseDownEvent = event.e;
   },'mouse:move': function(event) {
      if (!enabled) return;
      if (!dragging) {
         if (mouseDownEvent && !canvas.getActiveObject()) {
            var dragDist = distance(mouseDownEvent, event.e);
            if (dragDist > 10) {
               startDragging(mouseDownEvent, event.e);
            }
         }
      } else {
         
         currentShape.sizeByMousePos(x(mouseDownEvent), y(mouseDownEvent), x(event.e), y(event.e));
         canvas.renderAll();
      }
   }, 'mouse:up': function() {
      if (mouseDownEvent)
         stopDragging();
   }});

   function startDragging(mouseStart, mouseCurrent) {
      dragging = true;

      var config = shapeCreators[shapeMode.get()](mouseStart, mouseCurrent);
      config.color = color;
      currentShape = markupBuilder.addShape(config)
      currentShape.perPixelTargetFind = true;
   }

   function stopDragging() {
      dragging = false;
      mouseDownEvent = null;
      currentShape = null;
   }

   var shapeCreators = {
      'circle': function(e1, e2) {
         return {
            type: 'circle',
            from: {
               x: x(e1),
               y: y(e1),
            },
            radius: distance(e1, e2)
         };
      },
      'rectangle': function(mouseStart, mouseCurrent) {
         var x1 = x(mouseStart), y1 = y(mouseStart);
         return {
            type: 'rectangle',
            from: {
               x: x1,
               y: y1
            },
            size: {
               width: x(mouseCurrent) - x1,
               height: y(mouseCurrent) - y1
            }
         };
      }
   }

   markupBuilder.shapeCreator = {
      setShapeMode: function(inShapeMode) {
         shapeMode.set(inShapeMode);
         enabled = inShapeMode != 'select';
      },
      setColor: function(inColor) {
         color = inColor;
      }
   };
}

function distance(e1, e2) {
   var xdiff = x(e1) - x(e2);
   var ydiff = y(e1) - y(e2);
   return Math.sqrt(xdiff * xdiff + ydiff * ydiff);
}

/**
 * Extracts the X coord from a mouse event in a cross-browser way
 */
function x(e) {
   return e.offsetX == undefined ? e.layerX : e.offsetX;
}

/**
 * Extracts the Y coord from a mouse event in a cross-browser way
 */
function y(e) {
   return e.offsetY == undefined ? e.layerY : e.offsetY;
}

/**
 * Create an uber-simple enum with the given set of values
 *
 * The returned object has get() and set(value) to retrieve and alter the
 * current value.
 */
function Enum(values) {
   var value = null;
   return {
      get: function() {
         return value;
      },
      set: function(inValue) {
         if (values.indexOf(inValue) === -1) {
            throw inValue + " is not one of: " + values.join(', ');
         }
         value = inValue;
      }
   };
}

exports.setup = setupMarkerCreation;
