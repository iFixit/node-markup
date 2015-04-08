module.exports = {
   _withSizeLimitations: function(callback) {
      this._limitSize = true;
      callback.apply(this);
      this._limitSize = false;
   },

   _set: function(key, value) {
      var newValue = value;
      if (key === 'scaleX') {
         if (this._limitByDiagonal) {
            if (this._exceedsDiagonalLimit(value, this.scaleY)) {
               return this;
            }
         } else {
            var newWidth = this.width * value;
            newValue = this._limitDimension(newWidth) / this.width;
         }
      } else if (key === 'scaleY') {
         if (this._limitByDiagonal) {
            if (this._exceedsDiagonalLimit(this.scaleX, value)) {
               return this;
            }
         } else {
            var newHeight = this.height * value;
            newValue = this._limitDimension(newHeight) / this.height;
         }
      }

      return this.callParent(key, newValue);
   },

   /**
    * Returns true if the given scale values would cause this shape to exceed
    * the min/max diagonal size.
    *
    * When this returns true, the shape will have already been scaled to the
    * min / max size and attempted _set() call should not be passed on to the
    * parent class.
    */
   _exceedsDiagonalLimit: function(scaleX, scaleY) {
      if (!this._shouldLimit()) {
         return;
      }
      var w = this.width * scaleX;
      var h = this.height * scaleY;
      var rad = Math.sqrt(w * w + h * h);
      var clampedRad = this._limitDimension(rad);
      if (rad !== clampedRad) {
         var ratio = clampedRad / rad;
         this.callParent('scaleX', scaleX * ratio);
         this.callParent('scaleY', scaleY * ratio);
         return true;
      }
   },

   _limitDimension: function(x) {
      if (!this._shouldLimit()) {
         return x;
      }

      if (this.minSize !== false) {
         // Sometimes we have to limit negative values too (see: scaleX)
         if (Math.abs(x) < this.minSize)
            return x >= 0 ? this.minSize : -this.minSize;
      }

      if (this.maxSize !== false) {
         if (Math.abs(x) > this.maxSize)
            return x >= 0 ? this.maxSize : -this.maxSize;
      }
      return x;
   },

   _shouldLimit: function() {
      // The _isMoving condition seems backwards. It's because fabric has it
      // on during scaling *and* moving but fires this a few times with
      // isMoving off during an actual move.
      return this._limitSize || this.isMoving;
   }
};

