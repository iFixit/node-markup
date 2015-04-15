module.exports = {
   borderWidth: 4,
   strokeWidth: 0.1,
   // in percentage of borderWidth
   outlineWidth: 0.25,
   outlineStyle: '#FFF',

   /**
    * Provide a custom stroke function that draws a fat white line THEN a
    * narrower colored line on top.
    */
   _stroke: function(ctx) {
      var myScale = this.scaleX;
      var outline = Math.floor(this.borderWidth * this.outlineWidth);
      function scale(x) { return (x / myScale); }
      ctx.lineWidth = scale(this.borderWidth + outline);
      ctx.strokeStyle = this.outlineStyle;
      ctx.stroke();

      ctx.lineWidth = scale(this.borderWidth - outline);
      ctx.strokeStyle = this.stroke;
      ctx.stroke();
   }
};
