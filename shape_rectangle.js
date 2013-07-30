var Fabric = require('fabric').fabric || fabric;
var isNode = typeof window == 'undefined';

module.exports.klass = Fabric.util.createClass(Fabric.Rect, {
   shapeName: 'rectangle',
   type: 'rectangle',
   strokeWidth: 0,
   borderWidth: 4,
   originX: 'left',
   originY: 'top',

   // Min and Max size to enforce (false == no enforcement)
   minSize: false,
   maxSize: false,

   outlineWidth: 1,
   outlineStyle: '#FFF',

   /**
    * Provide a custom stroke function that draws a fat white line THEN a
    * narrower colored line on top.
    */
   _stroke: function(ctx) {
      var myScale = this.scaleX;
      function scale(x) { return (x / myScale); }
      ctx.lineWidth = scale(this.borderWidth + this.outlineWidth);
      ctx.strokeStyle = this.outlineStyle;
      ctx.stroke();

      ctx.lineWidth = scale(this.borderWidth - this.outlineWidth);
      ctx.strokeStyle = this.stroke;
      ctx.stroke();
   },

   /**
    * Wrap the underlying render function to do two things.
    *
    * 1. Apply the scaling to the width and height and set scale to 1 so
    *    that stroke width is independent of scale
    * 2. If the edges of any borders land on between-a-pixel, round them to
    *    the nearest one. This was quite tricky, so don't go messing with it
    *    willy nilly and let's talk about it - Danny.
    */
   render: function(ctx) {
      this._resetScale();
      var _this = this;
      this._fixAndRestoreSubPixelPositioning(function() {
         _this.callSuper('render', ctx);
      });
   },

   /**
    * If the outside / inside edges of the borders of this rect are not lined
    * up with the pixels exactly, canvas will antialias them which looks bad
    * for perfectly vertical and horizontal lines.
    *
    * To prevent this, we calculate if the borders will be splitting pixels,
    * adjust the positioning, call the callback and restore the position.
    */
   _fixAndRestoreSubPixelPositioning: function(callback) {
      // In-browser we care more about fluidity than pixel-perfection, and
      // having the outlines jump back and forth by one pixel as you resize it
      // can be annoying.
      if (!isNode) {
         callback();
         return;
      }

      var old = {
         w: this.width,
         h: this.height,
         t: this.top,
         l: this.left
      };

      // Preconditions: left, top, width, height, borderWidth are all ints
      // left, top represent the middle of the border width.

      // If the left-most edge of the border is not directly on a pixel
      // then niether is the right-most border, 
      var borderWidth = this.borderWidth + this.outlineWidth;
      var partialX = (this.left + borderWidth / 2) % 1;
      var partialY = (this.top + borderWidth / 2) % 1;
      if (partialX != 0) {
         this.left -= partialX;
         this.width += partialX * 2;
      }
      if (partialY != 0) {
         this.top -= partialY
         this.height += partialY * 2;
      }

      callback();

      this.width  = old.w;
      this.height = old.h;
      this.top    = old.t;
      this.left   = old.l;
   },

   /**
    * Apply the scaling to the width and height and set scale to 1 so
    * that stroke width is independent of scale
    */
   _resetScale: function() {
      this.width = this.width * this.scaleX;
      this.height = this.height * this.scaleY;
      this.scaleX = this.scaleY = 1;
   },


   /**
    * Resizes this rectangle to make the most sense given the two points (they
    * will determine two opposite corners.
    */
   sizeByMousePos: function(x1, y1, x2, y2) {
      var xdiff = x2 - x1;
      var ydiff = y2 - y1;
      if (xdiff < 0) {
         this.width = this._limitDimension(-xdiff)
         this.left = x2 - (this.width - -xdiff);
      } else {
         this.width = this._limitDimension(xdiff);
         this.left = x1;
      }
      if (ydiff < 0) {
         this.height = this._limitDimension(-ydiff);
         this.top = y2 - (this.height - -ydiff);
      } else {
         this.height = this._limitDimension(ydiff);
         this.top = y1;
      }
      this.setCoords();
   },

   /**
    * Catch the alteration of 'scaleX' and 'scaleY' properties (happens during
    * mouse resize) and limit them so the shape doesn't exceed it's allowed
    * dimensions.
    */
   _set: function(key, value) {
      var newValue = value;
      if (key === 'scaleX') {
         var newWidth = this.width * value;
         newValue = this._limitDimension(newWidth) / this.width;
      } else if (key === 'scaleY') {
         var newHeight = this.height * value;
         newValue = this._limitDimension(newHeight) / this.height;
      }

      return this.callSuper('_set', key, newValue);
   },

   /**
    * Enforce the min / max size on the given value if they are set for this
    * object.
    */
   _limitDimension: function(x) {
      if (this.minSize !== false) {
         if (Math.abs(x) < this.minSize)
            return x >= 0 ? this.minSize : -this.minSize;
      }

      if (this.maxSize !== false) {
         if (Math.abs(x) > this.maxSize)
            return x >= 0 ? this.maxSize : -this.maxSize;
      }
      return x;
   }
});

