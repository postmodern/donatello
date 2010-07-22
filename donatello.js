var Donatello = {};

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

Donatello.BarGraph = function(data,options) {
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
        this.bar_padding = (this.width / (data.length + 1));
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
    this.color = Raphael.getRGB(options['color'] || 'blue');
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
  this.bars = [];

  for (var i=0; i<data.length; i++)
  {
    this.bars.push(this.newBar(i,data[i],options));
  }
};

Donatello.BarGraph.prototype = {
  newBar: function(i,value,options) {
    var padding = ((i + 1) * this.bar_padding);
    var ratio = (value / this.max);
    var x,y,h,w;

    if (this.type == 'vertical')
    {
      x = padding + (this.bar_width * i);
      y = this.bar_padding;
      w = this.bar_width;
      h = this.bar_min + ((this.height - (this.bar_padding * 2)) * ratio);
    }
    else if (this.type == 'horizontal')
    {
      x = this.bar_padding;
      y = padding + (i * this.bar_height);
      w = this.bar_min + ((this.width - (this.bar_padding * 2)) * ratio);
      h = this.bar_height;
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
    var dom_node = bar.node();

    if (options['click'])
    {
      jQuery(dom_node).click(function() { options['click'](bar); });
    }

    if (options['hover'])
    {
      jQuery(dom_node).hover(
        function() { options['hover'][0](bar); },
        function() { options['hover'][1](bar); }
      );
    }

    return bar;
  }
};

Donatello.BarGraph.Bar = function(index,value,paper,x,y,width,height,color) {
  this.index = index;
  this.value = value;

  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;

  this.box = paper.rect(this.x, this.y, this.width, this.height);
  this.setColor(color);
};

Donatello.BarGraph.Bar.prototype = {
  node: function() { return this.box.node; },

  setColor: function(color)
  {
    this.box.attr({stroke: color, fill: color});
  }
};
