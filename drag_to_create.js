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
       shapeMode = Enum(['circle', 'rectangle', 'line', 'arrow', 'gap']);

   canvas.on({
   'mouse:down': function(event) {
      if (!enabled) return;
      mouseDownEvent = canvas.getPointer(event.e);
      mouseDownEvent.pageX = event.e.pageX;
      mouseDownEvent.pageY = event.e.pageY;
   },'mouse:move': function(event) {
      if (!enabled) return;
      var moveEvent = event.e;
      function updateShape() {
         currentShape._withSizeLimitations(function() {
            var x1 = mouseDownEvent.x,
                y1 = mouseDownEvent.y,
                x2 = x1 + xOff(mouseDownEvent, moveEvent),
                y2 = y1 + yOff(mouseDownEvent, moveEvent);
            currentShape.sizeByMousePos(x1, y1, x2, y2);
         });
         canvas.renderAll();
      }
      if (!dragging) {
         if (mouseDownEvent && !canvas.getActiveObject()) {
            var xdiff = xOff(mouseDownEvent, moveEvent);
            var ydiff = yOff(mouseDownEvent, moveEvent);
            var dragDist = distance(xdiff, ydiff);
            if (dragDist > 10) {
               var offset = {
                  x: xdiff,
                  y: ydiff
               }, p1 = {
                  x: mouseDownEvent.x,
                  y: mouseDownEvent.y
               };
               startDragging(p1, offset);
               updateShape();
            }
         }
      } else {
         updateShape();
      }
   }, 'mouse:up': function() {
      if (mouseDownEvent)
         stopDragging();
   }});

   function startDragging(p1, offset) {
      dragging = true;
      var config = shapeCreators[shapeMode.get()](p1, offset);
      config.color = color;
      currentShape = markupBuilder.addShape(config);
      currentShape.perPixelTargetFind = true;
   }

   function stopDragging() {
      dragging = false;
      mouseDownEvent = null;
      currentShape = null;
   }

   function lineCreator(type) {
      return function(p1, offset) {
         return {
            type: type,
            from: {
               x: p1.x,
               y: p1.y
            },
            to: {
               x: p1.x + offset.x,
               y: p1.y + offset.y
            }
         };
      };
   }

   var shapeCreators = {
      'circle': function(p1, offset) {
         return {
            type: 'circle',
            from: {
               x: p1.x,
               y: p1.y
            },
            radius: distance(offset.x, offset.y)
         };
      },
      'rectangle': function(p1, offset) {
         return {
            type: 'rectangle',
            from: {
               x: p1.x,
               y: p1.y
            },
            size: {
               width: offset.x,
               height: offset.y
            }
         };
      },
      'line':  lineCreator('line'),
      'arrow': lineCreator('arrow'),
      'gap':   lineCreator('gap')
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

function distance(xdiff, ydiff) {
   return Math.sqrt(xdiff * xdiff + ydiff * ydiff);
}

function xOff(p1, p2) {
   return p2.pageX - p1.pageX;
}

function yOff(p1, p2) {
   return p2.pageY - p1.pageY;
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
