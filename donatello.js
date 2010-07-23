var Donatello = {
  defaultColor: 'blue'
};

Donatello.Color = function(r,g,b) {
  this.r = r;
  this.g = g;
  this.b = b;
};

Donatello.Color.hex = function(r,g,b) {
  function toHex(i)
  {
    var h = i.toString(16);

    if (i < 16)
    {
      h = '0' + h;
    }

    return h;
  }

  return '#' + toHex(r) + toHex(g) + toHex(b);
};

Donatello.Color.prototype = {
  hex: function() {
    return Donatello.Color.hex(this.r, this.g, this.b);
  }
};

Donatello.Gradient = function(angle,start,stop) {
  this.angle = angle;
  this.start = start;
  this.stop = stop;
};

Donatello.Gradient.prototype = {
  color: function(ratio) {
    var r = Math.floor(this.start.r + ((this.stop.r - this.start.r) * ratio));
    var g = Math.floor(this.start.g + ((this.stop.g - this.start.g) * ratio));
    var b = Math.floor(this.start.b + ((this.stop.b - this.start.b) * ratio));

    return new Donatello.Color(r,g,b);
  },

  scale: function(ratio) {
    var r = Math.floor(this.start.r + ((this.stop.r - this.start.r) * ratio));
    var g = Math.floor(this.start.g + ((this.stop.g - this.start.g) * ratio));
    var b = Math.floor(this.start.b + ((this.stop.b - this.start.b) * ratio));

    return new Donatello.Gradient(this.angle,this.start,new Donatello.Color(r,g,b));
  },

  hex: function() {
    return this.angle.toString() + '-' +
           Donatello.Color.hex(this.start.r, this.start.g, this.start.b) + '-' + 
           Donatello.Color.hex(this.stop.r, this.stop.g, this.stop.b);
  }
};

Donatello.Element = function(value) {
  this.value = value;
  this.node = null;
};

Donatello.Element.prototype = {
  node: function() { return this.node; },

  color: function(color) {
    this.node.attr({fill: color, stroke: color});
  },

  opacity: function(opacity) {
    this.node.attr({opacity: opacity, 'fill-opacity': opacity, 'stroke-opacity': opacity});
  },

  scale: function(ratio) {
    this.node.scale(ratio);
  },

  highlight: function(color,stroke_width) {
    this.node.attr('stroke', color);

    if (stroke_width)
    {
      this.node.attr('stroke-width', stroke_width);
    }
  },

  unhighlight: function() { this.node.attr('stroke', this.node.attr('fill')); },

  click: function(callback) {
    var element = this;
    jQuery(this.node.node).click(function() { callback(element); });
    return this;
  },

  hover: function(in_callback,out_callback) {
    var element = this;
    jQuery(this.node.node).hover(
      function() { in_callback(element); },
      function() { out_callback(element); }
    );
  }
};

Donatello.Graph = function() {
  this.elements = [];
};

Donatello.Graph.prototype.click = function(callback) {
  for (var i=0; i<this.elements.length; i++)
  {
    this.elements[i].click(callback);
  }
};

Donatello.Graph.prototype.hover = function(in_callback,out_callback) {
  for (var i=0; i<this.elements.length; i++)
  {
    this.elements[i].hover(in_callback,out_callback);
  }
};

Donatello.BarGraph = function(data,options) {
  Donatello.Graph.call(this);

  if (options == null)
  {
    options = {};
  }

  this.type = options['type'];
  this.width = options['width'];
  this.height = options['height'];

  this.bar_min = (options['bar_min'] || 0);
  this.bar_width = options['bar_width'];
  this.bar_height = options['bar_height'];
  this.bar_padding = options['bar_padding'];

  if (this.type == null)
  {
    throw "Must specify the 'type' option";
  }
  else if (this.type == 'vertical')
  {
    if (!(this.height))
    {
      throw "Must specify the 'height' option when creating a horizontal Bar Graph";
    }

    if (!(this.width))
    {
      if (!(this.bar_padding) && !(this.bar_width))
      {
        throw "Must specify the 'bar_padding' and 'bar_width' options when the 'width' option is not given";
      }

      this.width = ((this.bar_padding * (data.length + 1)) + (this.bar_width * data.length));
    }
    else if (!(this.bar_padding))
    {
      if (!(this.bar_width))
      {
        this.bar_padding = ((this.width / (data.length + 1)) / 2);
        this.bar_width = this.bar_padding;
      }
      else
      {
        this.bar_padding = ((this.width - (data.length * this.bar_width)) / (data.length + 1));
      }
    }
  }
  else if (this.type == 'horizontal')
  {
    if (!(this.width))
    {
      throw "Must specify the 'width' option when creating a horizontal Bar Graph";
    }

    if (!(this.height))
    {
      if (!(this.bar_padding) && !(this.bar_height))
      {
        throw "Must specify the 'bar_padding' and 'bar_height' options when the 'height' option is not given";
      }

      this.height = ((this.bar_padding * (data.length + 1)) + (this.bar_height * data.length));
    }
    else if (!(this.bar_padding))
    {
      if (!(this.bar_height))
      {
        this.bar_padding = ((this.height / (data.length + 1)) / 2);
        this.bar_height = this.bar_padding;
      }
      else
      {
        this.bar_padding = ((this.height - (data.length * this.bar_height)) / (data.length + 1));
      }
    }
  }
  else
  {
    throw "Unknown Bar Graph type: " + this.type;
  }

  if (options['gradient'])
  {
    var angle;

    if (this.type == 'vertical')
    {
      angle = 90;
    }
    else if (this.type == 'horizontal')
    {
      angle = 0;
    }

    this.gradient = new Donatello.Gradient(
      angle,
      Raphael.getRGB(options['gradient'][0]),
      Raphael.getRGB(options['gradient'][1])
    );
  }
  else
  {
    this.color = Raphael.getRGB(options['color'] || Donatello.defaultColor);
  }

  this.min = 0;
  this.max = 0;

  for (var i=0; i<data.length; i++)
  {
    if (data[i] < this.min)
    {
      this.min = data[i];
    }

    if (data[i] > this.max)
    {
      this.max = data[i];
    }
  }

  this.paper = Raphael(jQuery(options['container'])[0], this.width, this.height);

  for (var i=0; i<data.length; i++)
  {
    this.addBar(i,data[i],options);
  }
};

Donatello.BarGraph.prototype = new Donatello.Graph();
Donatello.BarGraph.constructor = Donatello.BarGraph;

Donatello.BarGraph.prototype.addBar = function(i,value,options) {
  var padding = ((i + 1) * this.bar_padding);
  var ratio = (value / this.max);
  var x,y,h,w;

  if (this.type == 'vertical')
  {
    w = this.bar_width;
    h = this.bar_min + ((this.height - (this.bar_padding * 2)) * ratio);
    x = padding + (this.bar_width * i);
    y = this.height - this.bar_padding - h;
  }
  else if (this.type == 'horizontal')
  {
    w = this.bar_min + ((this.width - (this.bar_padding * 2)) * ratio);
    h = this.bar_height;
    x = this.bar_padding;
    y = padding + (i * this.bar_height);
  }

  var c;

  if (this.gradient)
  {
    c = this.gradient.scale(ratio);
  }
  else
  {
    c = this.color;
  }

  var bar = new Donatello.BarGraph.Bar(i,value,this.paper,x,y,w,h,c.hex());

  this.elements.push(bar);
  return bar;
};

Donatello.BarGraph.Bar = function(index,value,paper,x,y,width,height,color) {
  Donatello.Element.call(this, value);

  this.index = index;

  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;

  this.node = paper.rect(this.x, this.y, this.width, this.height);
  this.color(color);
};

Donatello.BarGraph.Bar.prototype = new Donatello.Element();
Donatello.BarGraph.Bar.constructor = Donatello.BarGraph.Bar;

Donatello.DotPlot = function(data,options) {
  Donatello.Graph.call(this);

  this.width = options['width'];
  this.height = options['height'];

  if (!(this.width))
  {
    throw "Must specify the 'width' option when creating a DotPlot";
  }

  if (!(this.height))
  {
    throw "Must specify the 'height' option when creating a DotPlot";
  }

  this.dot_radius = options['radius'];

  if (!(this.dot_radius))
  {
    throw "Must specify the 'radius' option when creating a DotPlot";
  }

  this.dot_color = Raphael.getRGB(options['color'] || Donatello.defaultColor);
  this.dot_opacity = options['opacity'];

  this.min = [0, 0];
  this.max = [0, 0];

  for (var i=0; i<data.length; i++)
  {
    if (data[i][0] < this.min[0])
    {
      this.min[0] = data[i][0];
    }

    if (data[i][1] < this.min[1])
    {
      this.min[1] = data[i][1];
    }

    if (data[i][0] > this.max[0])
    {
      this.max[0] = data[i][0];
    }

    if (data[i][1] > this.max[1])
    {
      this.max[1] = data[i][1];
    }
  }

  this.paper = Raphael(jQuery(options['container'])[0], this.width, this.height);

  for (var i=0; i<data.length; i++)
  {
    this.addDot(data[i],options);
  }
};

Donatello.DotPlot.prototype = new Donatello.Graph();
Donatello.DotPlot.constructor = Donatello.DotPlot;

Donatello.DotPlot.prototype.addDot = function(value,options) {
  var x = (((value[0] / this.max[0]) * (this.width - (this.dot_radius * 2))) + this.dot_radius);
  var y = (this.height - (((value[1] / this.max[1]) * (this.height - (this.dot_radius * 2))) + this.dot_radius));

  var dot = new Donatello.DotPlot.Dot(value,this.paper,x,y,this.dot_radius,this.dot_color,this.dot_opacity);

  this.elements.push(dot);
  return dot;
};

Donatello.DotPlot.Dot = function(value,paper,x,y,radius,color,opacity) {
  Donatello.Element.call(this, value);

  this.x = x;
  this.y = y;
  this.radius = radius;

  this.node = paper.circle(this.x, this.y, this.radius);
  this.color(color);
  this.opacity(opacity);
};

Donatello.DotPlot.Dot.prototype = new Donatello.Element();
Donatello.DotPlot.Dot.constructor = Donatello.DotPlot.Dot;
