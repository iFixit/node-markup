var Fabric = require('fabric').fabric || fabric;

module.exports.klass = Fabric.util.createClass(Fabric.Rect, {
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
      // Apply the scaling to the width and height and set scale to 1 so
      // that stroke width is independent of scale
      this.width = this.width * this.scaleX;
      this.height = this.height * this.scaleY;
      this.scaleX = this.scaleY = 1;

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
      this._limitSize();

      this.callSuper('render', ctx);
   },

   /**
    * Enforce the min / max size if they are set for this object
    */
   _limitSize: function() {
      if (this.minSize !== false) {
         if (this.width < this.minSize)
            this.width = this.minSize;
         if (this.height < this.minSize)
            this.height = this.minSize;
      }

      if (this.maxSize !== false) {
         if (this.width > this.maxSize)
            this.width = this.maxSize;
         if (this.height > this.maxSize)
            this.height = this.maxSize;
      }
   }
});

