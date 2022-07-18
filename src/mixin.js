module.exports = function (proto, properties) {
  for (name in properties) {
    var val = properties[name];
    if (proto[name] && typeof val == "function") {
      inherit(proto, name, val);
    } else {
      proto[name] = val;
    }
  }
};

function inherit(proto, name, func) {
  var parentFunc = proto[name];
  proto[name] = function () {
    var old = this.callParent;
    this.callParent = parentFunc;
    var ret = func.apply(this, arguments);
    if (old) {
      this.callParent = old;
    }
    return ret;
  };
}
