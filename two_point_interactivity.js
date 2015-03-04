module.exports = (function(){

   var Fabric = require('fabric').fabric || fabric;

   return {

      /**
       * Intercept the set('scaleX') calls during resize so we can flip the
       * order of the points when the cursor crosses the origin. Also, we reset
       * the scale to 1 and apply it to the width and height so there isn't a
       * scale transform present when drawing the stroke.
       */
      _set: function(key, value) {
         if (key === 'scaleX' && value < 0) {
            var x1 = this.x1
            this.x1 = this.x2; this.x2 = x1;
         }
         else if (key === 'scaleY' && value < 0) {
            var y1 = this.y1
            this.y1 = this.y2; this.y2 = y1;
         }

         this.callSuper('_set', key, value);
         this._resetScale();
         return this;
      },

      /**
       * Apply the scaling to the width and height and set scale to 1 so
       * that stroke width is independent of the scale transform
       */
      _resetScale: function() {
         // There is a brief period (one frame) where the 
         this.width = this.width * Math.abs(this.scaleX);
         this.height = this.height * Math.abs(this.scaleY);
         this.scaleX = 1;
         this.scaleY = 1;
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
       * midpoints.
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
            ctx.arc(x, y, self.cornerSize/2, 0, 2 * Math.PI, false);
         }
   
         var flipX = self.x1 > self.x2 ? 1 : -1;
         var flipY = self.y1 > self.y2 ? 1 : -1;
         var halfWidth = self.width / 2;
         var halfHeight = self.height / 2;
         // In this context, 0,0 is the center of the line so we draw a handle
         // half of the line length away from the origin in both directions.
         circle(halfWidth * flipX, halfHeight * flipY);
         circle(-halfWidth * flipX, -halfHeight * flipY);
         ctx.fill();
   
         ctx.restore();
         return self;
      }
   }
})();
