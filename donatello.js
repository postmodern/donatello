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

Donatello.Element.node_attr = function(name) {
  return function() {
    return this.node.attr(name);
  };
};

Donatello.Element.prototype.node = function() { return this.node; };

Donatello.Element.prototype.color = function(color) {
  this.node.attr({fill: color, stroke: color});
};

Donatello.Element.prototype.opacity = function(opacity) {
  this.node.attr({opacity: opacity, 'fill-opacity': opacity, 'stroke-opacity': opacity});
};

Donatello.Element.prototype.highlight = function(color,width) {
  options = {'stroke-opacity': 1, stroke: color};

  if (width != null)
  {
    options['stroke-width'] = width;
  }

  this.node.attr(options);
};

Donatello.Element.prototype.unhighlight = function() {
  var opacity = (this.node.attr('fill-opacity') || 1);

  this.node.attr({
    'stroke': this.node.attr('fill'),
    'stroke-width': 1,
    'stroke-opacity': opacity
  });
};

Donatello.Element.prototype.scale = function(ratio) {
  this.node.scale(ratio);
};

Donatello.Element.prototype.raise = function(ratio,ms) {
  if (ms != null && ms > 0)
  {
    this.node.animate({scale: ratio}, ms);
  }
  else
  {
    this.node.scale(ratio);
  }
};

Donatello.Element.prototype.lower = function(ms) {
  if (ms != null && ms > 0)
  {
    this.node.animate({scale: 1.0}, ms);
  }
  else
  {
    this.node.scale(1.0);
  }
};

Donatello.Element.prototype.click = function(callback) {
  var element = this;
  jQuery(this.node.node).click(function() { callback(element); });
  return this;
};

Donatello.Element.prototype.hover = function(in_callback,out_callback) {
  var element = this;

  jQuery(this.node.node).hover(
    function() { in_callback(element); },
    function() { out_callback(element); }
  );
};

Donatello.Collection = function() {
};

Donatello.Collection.prototype = new Array();
Donatello.Collection.constructor = Donatello.Collection;

Donatello.Collection.prototype.click = function(callback) {
  for (var i=0; i<this.length; i++)
  {
    this[i].click(callback);
  }
};

Donatello.Collection.prototype.hover = function(in_callback,out_callback) {
  for (var i=0; i<this.length; i++)
  {
    this[i].hover(in_callback,out_callback);
  }
};

Donatello.Point = function(value,paper,x,y,options) {
  Donatello.Element.call(this, value);

  this.node = paper.circle(x,y,options.radius);
  this.color(options.color);

  if (options.opacity)
  {
    this.opacity(options.opacity);
  }
};

Donatello.Point.prototype = new Donatello.Element();
Donatello.Point.constructor = Donatello.Point;

Donatello.Point.prototype.x = Donatello.Element.node_attr('x');
Donatello.Point.prototype.y = Donatello.Element.node_attr('y');
Donatello.Point.prototype.radius = Donatello.Element.node_attr('r');

Donatello.Graph = function() {
  this.elements = new Donatello.Collection();
};

Donatello.Graph.prototype.init = function(options) {
  this.paper = Raphael(jQuery(options['container'])[0], this.width, this.height);

  if (options['background'])
  {
    this.background = this.paper.rect(0, 0, this.width, this.height);
    this.background.attr('fill', options['background']);
  }
};

Donatello.Graph.prototype.click = function(callback) {
  this.elements.click(callback);
};

Donatello.Graph.prototype.hover = function(in_callback,out_callback) {
  this.elements.hover(in_callback,out_callback);
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

  this.bar = (options['bar'] || {});

  if (this.bar.min == null)
  {
    this.bar.min = 0;
  }

  if (this.bar.gradient)
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

    this.bar.gradient = new Donatello.Gradient(
      angle,
      Raphael.getRGB(this.bar.gradient[0]),
      Raphael.getRGB(this.bar.gradient[1])
    );
  }
  else
  {
    this.bar.color = Raphael.getRGB(this.bar.color || Donatello.defaultColor);
  }

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
      if (!(this.bar.padding) && !(this.bar.width))
      {
        throw "Must specify the bar 'padding' and bar 'width' options when the 'width' option is not given";
      }

      this.width = ((this.bar.padding * (data.length + 1)) + (this.bar.width * data.length));
    }
    else if (!(this.bar.padding))
    {
      if (!(this.bar.width))
      {
        this.bar.padding = ((this.width / (data.length + 1)) / 2);
        this.bar.width = this.bar.padding;
      }
      else
      {
        this.bar.padding = ((this.width - (data.length * this.bar.width)) / (data.length + 1));
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
      if (!(this.bar.padding) && !(this.bar.height))
      {
        throw "Must specify the bar 'padding' and bar 'height' options when the 'height' option is not given";
      }

      this.height = ((this.bar.padding * (data.length + 1)) + (this.bar.height * data.length));
    }
    else if (!(this.bar.padding))
    {
      if (!(this.bar.height))
      {
        this.bar.padding = ((this.height / (data.length + 1)) / 2);
        this.bar.height = this.bar.padding;
      }
      else
      {
        this.bar.padding = ((this.height - (data.length * this.bar.height)) / (data.length + 1));
      }
    }
  }
  else
  {
    throw "Unknown Bar Graph type: " + this.type;
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

  this.init(options);

  for (var i=0; i<data.length; i++)
  {
    this.addBar(i,data[i],options);
  }
};

Donatello.BarGraph.prototype = new Donatello.Graph();
Donatello.BarGraph.constructor = Donatello.BarGraph;

Donatello.BarGraph.prototype.addBar = function(i,value,options) {
  var padding = ((i + 1) * this.bar.padding);
  var ratio = (value / this.max);
  var x,y,h,w;

  if (this.type == 'vertical')
  {
    w = this.bar.width;
    h = this.bar.min + ((this.height - (this.bar.padding * 2)) * ratio);
    x = padding + (this.bar.width * i);
    y = this.height - this.bar.padding - h;
  }
  else if (this.type == 'horizontal')
  {
    w = this.bar.min + ((this.width - (this.bar.padding * 2)) * ratio);
    h = this.bar.height;
    x = this.bar.padding;
    y = padding + (i * this.bar.height);
  }

  var c;

  if (this.bar.gradient)
  {
    c = this.bar.gradient.scale(ratio);
  }
  else
  {
    c = this.bar.color;
  }

  var new_bar = new Donatello.BarGraph.Bar(i,value,this.paper,x,y,w,h,c.hex());

  this.elements.push(new_bar);
  return new_bar;
};

Donatello.BarGraph.Bar = function(index,value,paper,x,y,width,height,color) {
  Donatello.Element.call(this, value);

  this.index = index;

  this.node = paper.rect(x, y, width, height);
  this.color(color);
};

Donatello.BarGraph.Bar.prototype = new Donatello.Element();
Donatello.BarGraph.Bar.constructor = Donatello.BarGraph.Bar;

Donatello.BarGraph.Bar.prototype.x = Donatello.Element.node_attr('x');
Donatello.BarGraph.Bar.prototype.y = Donatello.Element.node_attr('y');
Donatello.BarGraph.Bar.prototype.width = Donatello.Element.node_attr('width');
Donatello.BarGraph.Bar.prototype.height = Donatello.Element.node_attr('height');

Donatello.LineGraph = function(data,options) {
  Donatello.Graph.call(this);

  if (options == null)
  {
    options = {};
  }

  this.width = options['width'];
  this.height = options['height'];

  if (!(this.width))
  {
    throw "Must specify the 'width' option when creating a LineGraph";
  }

  if (!(this.height))
  {
    throw "Must specify the 'height' option when creating a LineGraph";
  }

  this.point = (options['point'] || {});
  this.slice = (options['slice'] || {});
  this.edge = (options['edge'] || {});

  var sorted_data = data.sort(function(value1,value2) {
    return value1[0] - value2[0];
  });

  this.min = [sorted_data[0][0], 0];
  this.max = [sorted_data[sorted_data.length - 1][0], 0];

  for (var i=0; i<sorted_data.length; i++)
  {
    if (sorted_data[i][1] < this.min[1])
    {
      this.min[1] = sorted_data[i][1];
    }

    if (sorted_data[i][1] > this.max[1])
    {
      this.max[1] = sorted_data[i][1];
    }
  }

  this.init(options);

  this.slices = new Donatello.Collection();
  this.edges = new Donatello.Collection();

  var last_point = sorted_data[0];

  for (var i=1; i<sorted_data.length; i++)
  {
    var start = last_point;
    var stop = sorted_data[i];

    var point1 = [
      (((start[0] - this.min[0]) / this.max[0]) * this.width),
      (((start[1] - this.min[1]) / this.max[1]) * this.height)
    ];

    var point2 = [
      (((stop[0] - this.min[0]) / this.max[0]) * this.width),
      (((stop[1] - this.min[1]) / this.max[1]) * this.height)
    ];

    this.addSlice(start,stop,point1,point2);

    last_point = sorted_data[i];
  }

  for (var i=0; i<sorted_data.length; i++)
  {
    this.addPoint(sorted_data[i]);
  }

  if (options.baseline)
  {
    var baseline_value = options.baseline.min;

    if (baseline_value == null)
    {
      baseline_value = this.min[1];
    }

    var y = (((this.max[1] - baseline_value) / this.max[1]) * this.height);

    this.baseline = new Donatello.LineGraph.BaseLine(baseline_value,this.paper,y,this.width,options.baseline);
  }
};

Donatello.LineGraph.prototype = new Donatello.Graph();
Donatello.LineGraph.constructor = Donatello.LineGraph;

Donatello.LineGraph.prototype.addSlice = function(start,stop,point1,point2,options) {
  if (options == null)
  {
    options = {};
  }

  var new_slice = new Donatello.LineGraph.Slice(start, stop, this.paper, point1, point2, this.height, jQuery.extend(this.slice,options));

  new_slice.edge = this.addEdge(start,stop,point1,point2);

  this.slices.push(new_slice);
  return new_slice;
};

Donatello.LineGraph.prototype.addEdge = function(start,stop,point1,point2,options) {
  if (options == null)
  {
    options = {};
  }

  var new_edge = new Donatello.LineGraph.Edge(start,stop,this.paper,point1,point2,jQuery.extend(this.edge,options));

  this.edges.push(new_edge);
  return new_edge;
};

Donatello.LineGraph.prototype.addPoint = function(value,options) {
  if (options == null)
  {
    options = {};
  }

  var x = (((value[0] - this.min[0]) / this.max[0]) * this.width);
  var y = (((value[1] - this.min[1]) / this.max[1]) * this.height);

  var new_point = new Donatello.Point(value,this.paper,x,y,jQuery.extend(this.point,options));

  this.elements.push(new_point);
  return new_point;
};

Donatello.LineGraph.Slice = function(value1,value2,paper,start,stop,height,options) {
  Donatello.Element.call(this, [value1, value2]);

  this.start = start;
  this.stop = stop;
  this.height = height;

  var edge_path = ('M' + this.start[0] + ',' + this.start[1] + 'L' + this.stop[0] + ',' + this.stop[1]);
  var full_path = (edge_path + 
    ('M' + this.stop[0] + ',' + this.stop[1] + 'V' + this.height) + 
    ('M' + this.stop[0] + ',' + this.height + 'H' + this.start[0]) +
    ('M' + this.start[0] + ',' + this.height + 'V' + this.start[1]) + 'Z'
  );

  this.node = paper.path(full_path).attr({stroke: options.color, fill: options.color});

  if (options.opacity)
  {
    this.opacity(options.opacity);
  }
};

Donatello.LineGraph.Slice.prototype = new Donatello.Element();
Donatello.LineGraph.Slice.constructor = Donatello.LineGraph.Slice;

Donatello.LineGraph.Edge = function(value1,value2,paper,start,stop,options) {
  Donatello.Element.call(this, [value1, value2]);

  this.start = start;
  this.stop = stop;

  this.node = paper.path('M' + start[0] + ',' + start[1] + 'L' + stop[0] + ',' + stop[1]);
  this.color(options.color);

  if (options.width != null)
  {
    this.node.attr('stroke-width', options.width);
  }
};

Donatello.LineGraph.Edge.prototype = new Donatello.Element();
Donatello.LineGraph.Edge.constructor = Donatello.LineGraph.Edge;

Donatello.LineGraph.BaseLine = function(value,paper,y,length,options) {
  Donatello.Element.call(this, value);

  if (options == null)
  {
    options = {};
  }

  this.length = length;
  this.node = paper.path('M0,' + y + 'L' + this.length + ',' + y);

  if (options.width != null)
  {
    this.node.attr('stroke-width', options.width);
  }

  this.color(options.color || Donatello.defaultColor);

  if (options.opacity != null)
  {
    this.opacity(options.opacity);
  }
};

Donatello.LineGraph.BaseLine.prototype.y = Donatello.Element.node_attr('y');
Donatello.LineGraph.BaseLine.prototype.opacity = Donatello.Element.node_attr('stroke-opacity');
Donatello.LineGraph.BaseLine.prototype.width = Donatello.Element.node_attr('stroke-width');

Donatello.LineGraph.BaseLine.prototype = new Donatello.Element();
Donatello.LineGraph.BaseLine.constructor = Donatello.LineGraph.BaseLine;

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

  this.dot = (options['dot'] || {});

  if (!(this.dot['radius']))
  {
    throw "Must specify the dot 'radius' option when creating a DotPlot";
  }

  if (!(this.dot['color']))
  {
    this.dot['color'] = Donatello.defaultColor;
  }

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

  this.init(options);

  for (var i=0; i<data.length; i++)
  {
    this.addDot(data[i]);
  }
};

Donatello.DotPlot.prototype = new Donatello.Graph();
Donatello.DotPlot.constructor = Donatello.DotPlot;

Donatello.DotPlot.prototype.addDot = function(value,options) {
  if (options == null)
  {
    options = {};
  }

  var x = (((value[0] / this.max[0]) * (this.width - (this.dot.radius * 2))) + this.dot.radius);
  var y = (this.height - (((value[1] / this.max[1]) * (this.height - (this.dot.radius * 2))) + this.dot.radius));

  var new_dot = new Donatello.Point(value, this.paper, x, y, jQuery.extend(this.dot,options));

  this.elements.push(new_dot);
  return new_dot;
};
