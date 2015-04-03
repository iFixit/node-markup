var Fabric = require('fabric').fabric || fabric;
var isNode = typeof window == 'undefined';
var mixin = require('./mixin');

var Line = Fabric.util.createClass(Fabric.Line, {
   type: 'line',
   lockRotation: true,
   transparentCorners: false,
   hasRotatingPoint: false,
   fill: 'transparent',

   // New fields.
   shapeName: 'line',

   // Min and Max size to enforce (false == no enforcement)
   minSize: false,
   maxSize: false,

   /**
    * Resizes this rectangle to make the most sense given the two points (they
    * will determine two opposite corners.
    */
   sizeByMousePos: function(x1, y1, x2, y2) {
      this.x1 = x1;
      this.y1 = y1;
      this.x2 = x2;
      this.y2 = y2;
      this._setWidthHeight();
      this.setCoords();
   },

   render: function(ctx) {
      var _this = this;
      this._fixAndRestoreSubPixelPositioning(function() {
         _this.callSuper('render', ctx, /* noTransform */ false);
      });
   },

   /**
    * If a line is perfectly vertical or horizontal and the outside edges of
    * the borders are not lined up with pixels exactly, canvas will antialias
    * them which looks bad.
    *
    * To prevent this, we calculate if the borders will be splitting pixels,
    * adjust the positioning, call the callback and restore the position.
    */
   _fixAndRestoreSubPixelPositioning: function(callback) {
      // In-browser we care more about fluidity than pixel-perfection, and
      // having the outlines jump back and forth by one pixel as you resize it
      // can be annoying.
      // Also, this below logic only makes sense for perfectly vertical /
      // horizontal lines so bail if that's not the case.
      if (!isNode || (this.width > 1 && this.height > 1)) {
         callback();
         return;
      }

      var oldT = this.top,
          oldL = this.left;

      // Preconditions: width, height, borderWidth are all ints
      // left, top represent the middle of the line
      // Note x % 1 effectively does x - (int)x
      var borderWidth = this.borderWidth + this.outlineWidth;
      if (this.width <= 1) {
         this.left -= (this.left + borderWidth / 2) % 1;
      }
      if (this.height <= 1) {
         this.top -= (this.top + borderWidth / 2) % 1;
      }

      callback();

      this.top  = oldT;
      this.left = oldL;
   },
});

var proto = Line.prototype;
mixin(proto, require('./highlighted_stroke.mixin'));
mixin(proto, require('./limit_size'));
mixin(proto, require('./nudge'));
mixin(proto, require('./two_point_interactivity'));


Line.fromObject = function(object) {
   return new Line(object);
};

module.exports.klass = Line;
