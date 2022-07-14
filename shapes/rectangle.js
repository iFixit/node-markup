var Fabric = require('fabric').fabric;
var isNode = typeof window == 'undefined';
var mixin = require('../src/mixin');

var Rectangle = Fabric.util.createClass(Fabric.Rect, {
   // Inherited fields with new values.
   type: 'rectangle',
   originX: 'left',
   originY: 'top',
   lockRotation: true,
   transparentCorners: true,
   hasRotatingPoint: false,
   hasBorders: false,
   fill: 'transparent',
   strokeLineJoin: 'round',

   // New fields.
   shapeName: 'rectangle',

   // Min and Max size to enforce (false == no enforcement)
   sizeLimits: [0.03, 0.6],

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
      this._fixAndRestoreSubPixelPositioning(function() {
         this.callSuper('render', ctx);
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
         callback.call(this);
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
      var self = this;
      function scale(x) { return Math.round(x / self.scaleX); }
      var borderWidth = scale(this.borderWidth + this._outlineWidth());
      var partialX = (this.left + borderWidth / 2) % 1;
      var partialY = (this.top + borderWidth / 2) % 1;
      if (partialX != 0) {
         this.left -= partialX;
         this.width += partialX * 2;
      }
      if (partialY != 0) {
         this.top -= partialY;
         this.height += partialY * 2;
      }

      callback.call(this);

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
         this.width = this._limitDimension(-xdiff);
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

   center: function() {
      this.callSuper('center');
      this.top    = Math.round(this.top);
      this.left   = Math.round(this.left);
      this.width  = Math.round(this.width);
      this.height = Math.round(this.height);
   },

   /**
    * Override the parent function so we can explictly use fillRect without
    * it calling 'clearRect' as well.
    */
   _drawControl: function(control, ctx, methodName, left, top) {
      return this.callSuper('_drawControl', control, ctx, 'fillRect', left, top);
   }
});

var proto = Rectangle.prototype;
mixin(proto, require('../mixins/clone.mixin'));
mixin(proto, require('../mixins/highlighted_stroke.mixin'));
mixin(proto, require('../mixins/limit_size'));
mixin(proto, require('../mixins/nudge'));

module.exports.klass = Rectangle;
