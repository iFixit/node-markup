module.exports = {
   borderWidth: 5,
   strokeWidth: 0.1,
   // in percentage of borderWidth
   outlineWidth: 0.20,
   outlineStyle: '#FFF',

   /**
    * Provide a custom stroke function that draws a fat white line THEN a
    * narrower colored line on top.
    */
   _stroke: function(ctx) {
      var myScale = this.scaleX;
      var outline = this._outlineWidth();
      function scale(x) { return Math.round(x) / myScale; }
      ctx.lineWidth = scale(this.borderWidth + outline);
      ctx.strokeStyle = this.outlineStyle;
      ctx.stroke();

      ctx.lineWidth = scale(this.borderWidth - outline);
      ctx.strokeStyle = this.stroke;
      ctx.stroke();
   },

   _outlineWidth: function() {
      return Math.max(1,Math.round(this.borderWidth * this.outlineWidth));
   }
};
