module.exports = {
   /**
    * Grows the given shape in the given direction by the given number of
    * pixels relative to its current position.
    *
    * @param directionMap A key-value object with the keys {up, down, left,
    *  right} each with a true/false value.
    * @param distance The number of pixels to move the shape.
    */
   grow: function nudge(directionMap, distance) {
      var shape = this;
      if (directionMap.left) {
         shape.left -= distance/2;
         shape.incrementSize(distance, 'X');
      }
      if (directionMap.right) {
         shape.left += distance/2;
         shape.incrementSize(distance, 'X');
      }
      if (directionMap.up) {
         shape.top -= distance/2;
         shape.incrementSize(distance, 'Y');
      }
      if (directionMap.down) {
         shape.top += distance/2;
         shape.incrementSize(distance, 'Y');
      }
      shape.setCoords();
   },

   /**
    * Moves the given shape in the given direction by the given number of
    * pixels relative to its current position.
    *
    * @param directionMap A key-value object with the keys {up, down, left,
    *  right} each with a true/false value.
    * @param distance The number of pixels to move the shape.
    */
   nudge: function nudge(directionMap, distance) {
      var shape = this;

      if (directionMap.left) {
         shape.left -= distance;
         shape.setCoords();
         if (isOffScreen(shape)) {
            shape.left += distance;
         }
      }
      if (directionMap.right) {
         shape.left += distance;
         shape.setCoords();
         if (isOffScreen(shape)) {
            shape.left -= distance;
         }
      }
      if (directionMap.up) {
         shape.top -= distance;
         shape.setCoords();
         if (isOffScreen(shape)) {
            shape.top += distance;
         }
      }
      if (directionMap.down) {
         shape.top += distance;
         shape.setCoords();
         if (isOffScreen(shape)) {
            shape.top -= distance;
         }
      }
      shape.setCoords();
   }
};

function isOffScreen(object) {
   return object.canvas.isOffScreen(object);
}
