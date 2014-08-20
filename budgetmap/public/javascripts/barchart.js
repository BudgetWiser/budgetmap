var BarChart = function(){
  
};

BarChart.prototype.generate = function(settings){
  var margin = settings.margin, //{top: 10, right: 10, bottom: 100, left: 40},
      margin2 = settings.margin2, //{top: 430, right: 10, bottom: 20, left: 40},
      height = settings.size.height - margin.top - margin.bottom,
      width = settings.size.width - margin.left - margin.right,
      width2 = settings.size.width - margin2.left - margin2.right;

  this.selected = null;
  var self = this;

  var data = settings.data;
  
  var format = d3.format("s");

  var barSize     = 24;
  var barPadding  = 4;
  var fullHeight  = barSize*data.length;

  var x   = d3.scale.ordinal().rangeRoundBands([0, fullHeight], .2),
      y   = d3.scale.linear().range([0, width]);

  var xAxis   = d3.svg.axis().scale(x).orient("left").tickValues([]).tickSize(0),
      yAxis   = d3.svg.axis().scale(y).orient("top").tickFormat(format);


  var svg = d3.select(settings.container).append("div")
      .attr("class", "barchart")
      .style("width", width + "px")
      .style("height", fullHeight + "px")
      .append("div")
      .style("display", "block")
      .style("width", "100%")
      .style("height", "100%")
      .append("svg:svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", fullHeight);
/*
  svg.append("defs").append("clipPath")
      .attr("id", "clip")
    .append("rect")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", width)
      .attr("height", height);
*/

  var focus = svg.append("g")
      .attr("class", "barchart-focus")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  x.domain(data.map(function(d) { return d.service; }));
  y.domain([0, d3.max(data.map(function(d) { return d.budget_assigned; }))]);

  //Add Legend Tooltip
  var tip = d3.tip()
      .attr('class', 'barchart-d3-tip')
      .offset([-10, 0])
      .html(function(d) {
        var html =  "<span style='color:lightsteelblue;font-size:12px'>"+d.service+"<br/><br/>" + self.format(d.budget_assigned) + "</span>";
          //html += "<span style='color:lightgray'>" + d.name + ": "+self.format(d.size)+" ("+d3.format('.2%')(d.size/d.parent.size)+")</span><br/><br/>";
        return html;
      })
  focus.call(tip);

  // Focus Bar Chart
  var bars = focus.selectAll(".barchart-bar")
    .data(data)    
    .enter().append("g")
    .attr("class", "barchart-bar")
    .attr("transform", "translate(0,0)")
    
  var transition = bars.transition().duration(1000);
  transition.attr("transform", function(d, i) { return "translate(0," + ((barSize+barPadding)*i) + ")"; })

  bars.append("rect")
    .attr("class", "barchart-rect")
    .attr("width", function(d) { return y(d.budget_assigned); })
    .attr("height", barSize)
  
  bars.append("text")
    .attr("class", "barchart-text")
    .attr("x", 0)
    .attr("y", barSize/2)
    .attr("dx", "0.25em")
    .attr("dy", "0.25em")
    .attr("text-anchor", "start")
    .text(function(d){ return d.service; })

  setTimeout(function(){
    bars.on("mouseover", function(d){             
        if (this!= self.selected) self.enableHighlight(this); 
        tip.show(d, this);        
      })
      .on("mouseout", function(d){
        if (this!= self.selected) self.disableHighlight(this); 
        tip.hide(d, this);                
      })
      .on("click", function(d){
        d3.event.stopPropagation();

        if (self.selected) {
          self.disableHighlight(self.selected);
          $("#selected_service").removeAttr("id");
        }
        if (self.selected==this) { //no selection if click the existing selection
            $("#service-functions").css({"display": "none"});
          self.selected = null;     
          $("#selected_service").removeAttr("id");
          tip.hide(d, this);
          settings.onDeselect(d); // call de-selection callback
        }else{
            $("#service-functions").css({"display": "inline-block"});
          self.selected = this;       
          self.enableHighlight(self.selected);
          $(this).attr("id", "selected_service");
          tip.show(d, this);
          settings.onSelect(d); // call selection callback
        }
      });
  }, 1000);
}

BarChart.prototype.enableHighlight = function(elem) {
  var g = d3.select(elem);
  var trs = g.transition().duration(100);
  trs.select("rect")
    .style("fill", "#addd8e")
  trs.select("text")
    .style("fill", "#d95f0e")
    .style("font-weight", "bold");
}
BarChart.prototype.disableHighlight = function(elem) {
  var g = d3.select(elem);
  var trs = g.transition().duration(100);
  trs.select("rect")
    .style("fill", "#7fcdbb")
  trs.select("text")
    .style("fill", "#555753")
    .style("font-weight", "normal");  
}

BarChart.prototype.format = function(budget){
  var val;
  var format = d3.format(",");
  if ((val = Math.floor(budget/1000000000000))>0){ //1조
    var rest = budget-val*1000000000000;
    return format(val) + "조 " + format(Math.floor(rest/100000000)) + "억원";

  }
  val = Math.floor(budget/100000000);
  var rest = budget-val*100000000;
  return format(val) + "억 " + format(Math.floor(rest/10000)) + "만원";;
}
