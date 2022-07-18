module.exports = function (proto, properties) {
  for (const property in properties) {
    const value = properties[property];
    if (proto[property] && typeof value == "function") {
      inherit(proto, property, value);
    } else {
      proto[property] = value;
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
