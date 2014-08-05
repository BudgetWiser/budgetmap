var BarChart = function(){
  
};

BarChart.prototype.generate = function(settings){
  var margin = settings.margin, //{top: 10, right: 10, bottom: 100, left: 40},
      margin2 = settings.margin2, //{top: 430, right: 10, bottom: 20, left: 40},
      height = settings.size.height - margin.top - margin.bottom,
      width = settings.size.width - margin.left - margin.right,
      width2 = settings.size.width - margin2.left - margin2.right;

  var data = settings.data;
  //var parseDate = d3.time.format("%b %Y").parse;
  var format = d3.format("s");

  var fullHeight = 30*data.length;
  var x   = d3.scale.ordinal().rangeRoundBands([0, fullHeight], .2),
      x2  = this.x2 = d3.scale.ordinal().rangeRoundBands([0, height], .5),
      y   = d3.scale.linear().range([0, width]),
      y2  = d3.scale.linear().range([0, width2]);

  var xAxis   = d3.svg.axis().scale(x).orient("left").tickValues([]),
      xAxis2  = d3.svg.axis().scale(x2).orient("left").tickValues([]),
      yAxis   = d3.svg.axis().scale(y).orient("top").tickFormat(format);


  var svg = d3.select(settings.container).append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

  svg.append("defs").append("clipPath")
      .attr("id", "clip")
    .append("rect")
      .attr("width", width)
      .attr("height", height);

  var focus = this.focus = svg.append("g")
      .attr("class", "focus")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var context = svg.append("g")
      .attr("class", "context")
      .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

 

  x.domain(data.map(function(d) { return d.service; }));
  y.domain([0, d3.max(data.map(function(d) { return d.budget_assigned; }))]);
  x2.domain(x.domain());
  y2.domain(y.domain());

  this.selected = null;
  var self = this;
  var bars = focus.selectAll(".bar")
    .data(data)    
    .enter().append("g")
    .attr("class", "bar")
    .attr("transform", function(d, i) { return "translate(0," + x(d.service) + ")"; })
    .on("mouseover", function(d){
      d3.select(this).select("rect")
        .style("fill", "greenyellow")
      d3.select(this).select("text")
        .style("font-weight", "bold");
    })
    .on("mouseout", function(d){
      if (self.selected==this) return;
      d3.select(this).select("rect")
        .style("fill", "steelblue")
      d3.select(this).select("text")
        .style("font-weight", "normal");
    })
    .on("click", function(d){
      d3.event.stopPropagation();

      if (self.selected){
        d3.select(self.selected).select("rect")
          .style("fill", "steelblue")
        d3.select(self.selected).select("text")
          .style("font-weight", "normal");        
      }
      self.selected = this;
      d3.select(this).select("rect")
        .style("fill", "greenyellow")
      d3.select(this).select("text")
        .style("font-weight", "bold");
      settings.onSelect(d);
    });

  bars.append("rect")
    .attr("class", "rect")
    .attr("width", function(d) { return y(d.budget_assigned); })
    .attr("height", x.rangeBand())
  
  bars.append("text")
    .attr("class", "text")
    .attr("x", 0)
    .attr("y", x.rangeBand()/2)
    .attr("dx", "0.25em")
    .attr("text-anchor", "start")
    .text(function(d){ return d.service; })


  focus.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0,0)")
      .call(xAxis);
/*
  focus.append("g")
      .attr("class", "y axis")
      .call(yAxis);

*/
  var brush = d3.svg.brush()
      .y(x2)
      .extent([0, (height/fullHeight)*height])
      .on("brush", function() {
        var range = brush.extent();
        //var domain = data.filter(function(d){ return range[0]<=(val = x2(d.service)) && val<=range[1]})
        //var domain = domain.map(function(d){ return d.service;});
     
        console.log(range[0])
        focus.selectAll(".bar")
          .attr("transform", function(d, i) { return "translate(0," + (x(d.service)-range[0]) + ")"; });

        //focus.select(".x.axis").call(xAxis);
        
      });

  var cbars = context.selectAll(".bar")
    .data(data)
    .enter().append("g")
    .attr("transform", function(d, i) { return "translate(0," + x2(d.service) + ")"; });

  cbars.append("rect")
    .attr("class", "rect")
    .attr("width", function(d) { return y2(d.budget_assigned); })
    .attr("height",x2.rangeBand());


  context.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate("+width+",0)")
      .call(xAxis2);

  context.append("g")
      .attr("class", "x brush")
      .call(brush)
    .selectAll("rect")
      .attr("width", width2 + 7);


}


BarChart.prototype.type = function(d) {
  //d.date = parseDate(d.date);
  //d.price = +d.price;
  return d;
}