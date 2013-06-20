/*************
 * Marker Creation Interface code
 */
function setupMarkerCreation(markupBuilder) {
   var enabled = true,
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
         if (mouseDownEvent) {
            var dragDist = distance(mouseDownEvent, event.e);
            if (dragDist > 10) {
               startDragging(mouseDownEvent, dragDist);
               // console.log(mouseDownEvent);
            }
         }
      } else {
         
         var radius = distance(mouseDownEvent, event.e);

         currentShape.scaleToWidth(radius * 2);
         canvas.renderAll();
      }
   }, 'mouse:up': function() {
      if (dragging)
         stopDragging();
   }});

   function startDragging(e, radius) {
      dragging = true;
      console.log('start dragging');
      currentShape = markupBuilder.addCircle({
         x: x(e),
         y: y(e),
         radius: radius
      });
   }

   function stopDragging() {
      dragging = false;
      mouseDownEvent = null;
      console.log('stop dragging');
      currentShape = null;
   }

   function distance(e1, e2) {
      var xdiff = x(e1) - x(e2);
      var ydiff = y(e1) - y(e2);
      return Math.sqrt(xdiff * xdiff + ydiff * ydiff);
   }

   function x(e) {
      return e.offsetX == undefined ? e.layerX : e.offsetX;
   }
   function y(e) {
      return e.offsetY == undefined ? e.layerY : e.offsetY;
   }
}

/**
 * Create an uber-simple enum with the given set of values (strings or
 * numbers)
 *
 * The returned object has one method per possible value that sets the enum
 * to that specific value.
 *
 * It also sports a get() that returns the current value.
 */
function Enum(values) {
   var value = null;
   var publicInterface = {
      get: function() {
         return value;
      }
   };
   values.forEach(function(valueName) {
      publicInterface[valueName] = function() {
         value = valueName;
      };
   });
   return publicInterface;
}

exports.setup = setupMarkerCreation;
