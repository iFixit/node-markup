var Fabric = require('fabric').fabric || fabric;
var extend = Fabric.util.object.extend;

module.exports = (function(){

   var Fabric = require('fabric').fabric || fabric;

   return {
      initialize: function() {
         // Disable all controls by default
         this._controlsVisibility = { };
         this._enableCorrectControls();
         this.callParent.apply(this, arguments);
      },

      render: function(ctx) {
         this._resetScale();
         this._fixAndRestoreSubPixelPositioning(function() {
            this.callParent(ctx);
         });
      },

      _limitByDiagonal: true,

      /**
       * Resizes this line to make the most sense given the two points (they
       * will determine two opposite corners.
       */
      sizeByMousePos: function(x1, y1, x2, y2) {
         var xd = x2 - x1;
         var yd = y2 - y1;
         var rad = Math.sqrt(xd * xd + yd * yd);
         if (!rad) {
            xd = yd = this._limitDimension(rad);
            var ratio = 1;
         } else {
            var ratio = this._limitDimension(rad) / rad;
         }
         this.x1 = x1;
         this.y1 = y1;
         this.x2 = x1 + ratio * xd;
         this.y2 = y1 + ratio * yd;
         this._setWidthHeight();
         this._resetScale();
         this.setCoords();
      },

      /**
       * Enable only the controls that make sense for the given direction of
       * the line. This prevents the user from clicking controls that we don't
       * draw.
       */
      _enableCorrectControls: function () {
         var px = this._signOfDeltaX();
         var py = this._signOfDeltaY();
         var sameSign = px === py;
         this.setControlsVisibility({
            tl: sameSign,
            br: sameSign,
            tr: !sameSign,
            bl: !sameSign
         });
      },

      /**
       * Intercept the set('scaleX') calls during resize so we can flip the
       * order of the points when the cursor crosses the origin. Also, we reset
       * the scale to 1 and apply it to the width and height so there isn't a
       * scale transform present when drawing the stroke.
       */
      _set: function(key, value) {
         this.callParent(key, value);
         this._resetScale();
         return this;
      },

      /**
       * Apply the scaling to the width and height and set scale to 1 so
       * that stroke width is independent of the scale transform
       */
      _resetScale: function() {
         // There is a brief period where scaleX == 0 and fabric.js disappears
         // objects that have width = 0 so we can't let that happen.
         if (this.scaleX == 0) {
            this.width = 1
         } else {
            this.width *= this.scaleX;
         }

         if (this.scaleY == 0) {
            this.height = 1;
         } else {
            this.height *= this.scaleY;
         }

         this.scaleX = 1;
         this.scaleY = 1;
         this._enableCorrectControls();
      },

      /**
       * We don't want line-based shapes to have a bounding box (it looks dumb
       * around lines.
       */
      drawBorders: function(ctx) {
         return this;
      },

      /**
       * Override the `drawControls` to only draw handles at endpoints of the
       * line (two corners of the bounding box) instead of all corners and all
       * midpoints. Also, draw pretty circles instead of squares.
       */
      drawControls: function(ctx) {
         var self = this;
         if (!this.hasControls) return self;
   
         ctx.save();
         ctx.lineWidth = 1 / Math.max(self.scaleX, self.scaleY);
         ctx.globalAlpha = 0.9;
         ctx.strokeStyle = ctx.fillStyle = self.cornerColor;
         ctx.beginPath();
 
         function circle(x,y) {
            ctx.arc(x, y, self.cornerSize/1.4, 0, 2 * Math.PI, false);
         }

         var flipX = self._signOfDeltaX();
         var flipY = self._signOfDeltaY();
         var halfWidth  = self.width  === 1 ? 0 : self.width / 2;
         var halfHeight = self.height === 1 ? 0 : self.height / 2;
         // In this context, 0,0 is the center of the line so we draw a handle
         // half of the line length away from the origin in both directions.
         circle(halfWidth * flipX, halfHeight * flipY);
         circle(-halfWidth * flipX, -halfHeight * flipY);
         ctx.fill();
   
         ctx.restore();
         return self;
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
         var oldT = this.top,
             oldL = this.left,
             oldW = this.width,
             oldH = this.height;

         // Preconditions: width, height, borderWidth are all ints
         // left, top represent the middle of the line
         // Note x % 1 effectively does x - (int)x
         var self = this;
         function scale(x) { return Math.round(x / self.scaleX); }
         var borderWidth = scale(this.borderWidth + this._outlineWidth());

         if (this.width <= 1) {
            this.left -= (this.left + borderWidth / 2) % 1;
            this.width = 0;
         }
         if (this.height <= 1) {
            this.top -= (this.top + borderWidth / 2) % 1;
            this.height = 0;
         }

         callback.call(this);

         this.top    = oldT;
         this.left   = oldL;
         this.width  = oldW;
         this.height = oldH;
      },

      getEndpoints: function() {
         var self = this;

         var flipX = self._signOfDeltaX();
         var flipY = self._signOfDeltaY();
         // Objects in fabric can't have 0-width, so a vertical line ends up
         // with witdth = 1 so we detect that and ensure the midpoint isn't on
         // a pixel boundary and the width actually ends up 0.
         var width  = self.width  === 1 ? 0 : self.width;
         var height = self.height === 1 ? 0 : self.height;
         var left   = self.width  === 1 ? Math.floor(self.left) : self.left;
         var top    = self.height === 1 ? Math.floor(self.top)  : self.top;
         var r = Math.round;
         var x1 = flipX == 1 ? left : left + width;
         var y1 = flipY == 1 ? top  : top + height;
         var x2 = flipX == 1 ? left + width : left;
         var y2 = flipY == 1 ? top + height : top;
         return {
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2
         };
      },

      _signOfDeltaX: function() {
         // During creation, These point values change
         var flip = (this.x1 > this.x2) ? -1 :  1;
         // During sizing, the this.flip? values change 
         return (this.flipX) ? -flip : flip;
      },

      _signOfDeltaY: function() {
         // During creation, These point values change
         var flip = (this.y1 > this.y2) ? -1 :  1;
         // During sizing, the this.flip? values change 
         return (this.flipY) ? -flip : flip;
      },

      toMarkup: function(scale, offset) {
         var p = this.getEndpoints();
         var ox = offset.x, oy = offset.y;
         return [
             this.type,
             (p.x1 / scale + ox) + 'x' + (p.y1 / scale + oy),
             (p.x2 / scale + ox) + 'x' + (p.y2 / scale + oy),
             this.color
         ].join(',') + ';';
      },

      toObject: function(propertiesToInclude) {
         var points = this.getEndpoints();
         return extend(this.callParent(propertiesToInclude), points);
      },

      /**
       * Returns the angle of this line in radians
       * where horizontal and x1 < x2 * y2 = 0
       */
      _getAngle: function() {
         return Math.atan2(this._getDeltaY(), this._getDeltaX());
      },

      /**
       * Get the deltaX of the given line.
       * Note: rounds to 0 if <= 1 cause Fabric never allows 0-width
       * objects.
       */
      _getDeltaX: function() {
         var delta = this.x1 <= this.x2 ? -this.width : this.width;
         return Math.abs(delta) <= 1 ? 0 : delta;
      },

      /**
       * Get the deltaY of the given line.
       * Note: rounds to 0 if <= 1 cause Fabric never allows
       * 0-width objects.
       */
      _getDeltaY: function() {
         var delta = this.y1 <= this.y2 ? -this.height : this.height;
         return Math.abs(delta) <= 1 ? 0 : delta;
      },

      _getLength: function() {
         return Math.sqrt(this.width * this.width +
                          this.height * this.height);
      }
   }
})();
