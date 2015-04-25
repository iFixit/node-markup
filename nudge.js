module.exports = {
   /**
    * Increment the size of the rectangle about its center.
    */
   incrementSize: function(increment, axis) {
      var portionW = this.width / (this.width + this.height);
      if (axis == 'X') {
         portionW = 1;
      } else if (axis == 'Y') {
         portionW = 0;
      }
      var deltaX = increment * portionW;
      var deltaY = increment * (1 - portionW);
      deltaX = this._limitDimension(this.width  + deltaX) - this.width;
      deltaY = this._limitDimension(this.height + deltaY) - this.height;
      var newWidth  = this.width + deltaX;
      var newHeight = this.height + deltaY;

      // Checks to see if the new size will be too big/small.
      this.width = newWidth;
      this.height = newHeight;
      if (this.originX !== 'center') {
         this.left -= deltaX / 2;
         this.top -= deltaY / 2;
      }
      this.setCoords();
   },

   /**
    * Grows the given shape in the given direction by the given number of
    * pixels relative to its current position.
    *
    * @param directionMap A key-value object with the keys {up, down, left,
    *  right} each with a true/false value.
    * @param distance The number of pixels to move the shape.
    */
   grow: function(directionMap, distance) {
      var shape = this;
      if (directionMap.left) {
         shape.left -= distance / 2;
         shape.incrementSize(distance, 'X');
      }
      if (directionMap.right) {
         shape.left += distance / 2;
         shape.incrementSize(distance, 'X');
      }
      if (directionMap.up) {
         shape.top -= distance / 2;
         shape.incrementSize(distance, 'Y');
      }
      if (directionMap.down) {
         shape.top += distance / 2;
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
   nudge: function(directionMap, distance) {
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
