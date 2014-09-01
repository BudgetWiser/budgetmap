var BarChart = function(config){
  //define private variables
  var margin = config.margin, //{top: 10, right: 10, bottom: 100, left: 40},
      height = config.size.height - margin.top - margin.bottom,
      width = config.size.width - margin.left - margin.right;

  var selected = null, emList=null;

  var transPeriod = 1000;

  var data = config.data;

  var format = d3.format("s");

  var barSize     = 24;
  var barPadding  = 4;
  var outerPadding = 4;
  var fullHeight  = outerPadding*2 + (barPadding + barSize)*data.length; //manually set the chart height

  var x   = d3.scale.ordinal().rangeRoundBands([0, fullHeight]),
      y   = d3.scale.linear().range([0, width]);

  var xAxis   = d3.svg.axis().scale(x).orient("left").tickValues([]).tickSize(0),
      yAxis   = d3.svg.axis().scale(y).orient("top").tickFormat(format);


  var svg = d3.select(config.container).append("div")
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

  var focus = svg.append("g")
      .attr("class", "barchart-focus")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var tip = d3.tip()
      .attr('class', 'barchart-d3-tip')
      .offset([-10, 0])
      .html(function(d) {
        var html =  "<span style='color:lightsteelblue;font-size:12px'>"+d.service+"<br/><br/>" + chart.format(d.budget_assigned) + "</span>";
          //html += "<span style='color:lightgray'>" + d.name + ": "+format(d.size)+" ("+d3.format('.2%')(d.size/d.parent.size)+")</span><br/><br/>";
        return html;
      })
  focus.call(tip);

  function chart(){
  }
  chart.create = function(){
    this.update(data, width, height);    
  }
  chart.update = function(d, w, h){
    data = d;
    //update emphasize items
    if (emList!=null){
      var newList = [];
      emList.forEach(function(d){ 
        if (data.indexOf(d)!=-1){
          newList.push(d)
        }  
      });
      emList = newList;
    }

    h = config.size.height - margin.top - margin.bottom;
    w = config.size.width - margin.left - margin.right;

    fullHeight  = outerPadding*2 + (barPadding + barSize)*data.length;
    x.rangeRoundBands([0, fullHeight], .2); //range update
    x.domain(data.map(function(d) { return d.service; }));
    y.domain([0, d3.max(data.map(function(d) { return d.budget_assigned; }))]);
    //console.log(x(data[0].service));
    // Canvas Size update
    d3.select(config.container).select(".barchart").style("height", fullHeight + "px");
    d3.select(config.container).select("svg").attr("height", fullHeight);

    // Join new data with old elements, if any.
    var bars = focus.selectAll(".barchart-bar")
      .data(data, function(d) { return d._id; });

    // Remove interaction while constructing and transitioning
    bars.on("mouseover", null)
        .on("mouseout", null)
        .on("click", null);

    // Remove old elements as needed.
    bars.exit()
      .transition()
      .duration(transPeriod)
      .attr("transform", function(d, i) { 
        var t = d3.transform(d3.select(this).attr("transform")),
          y = t.translate[1];
        return "translate("+width+","+y+")"; 
      })
      .remove();
      
    //Update old elements as needed
    bars.transition()
      .duration(transPeriod)
      .attr("transform", function(d, i) { return "translate(0," + x(d.service) + ")"; }); //((barSize+barPadding)*i)

    bars.select(".barchart-rect").transition().duration(transPeriod)
      .attr("width", function(d) { return y(d.budget_assigned); })

    // Create new elements as needed.  
    var entered = bars.enter().append("g")
      .attr("class", "barchart-bar")
      .attr("transform", "translate(0,0)")

    entered.transition()
      .duration(transPeriod)
      .attr("transform", function(d, i) { return "translate(0," + x(d.service) + ")"; }) //((barSize+barPadding)*i)

    entered.append("rect")
      .attr("class", "barchart-rect")
      .attr("width", function(d) { return y(d.budget_assigned); })
      .attr("height", barSize)
    
    entered.append("text")
      .attr("class", "barchart-text")
      .attr("x", 0)
      .attr("y", barSize/2)
      .attr("dx", "0.25em")
      .attr("dy", "0.25em")
      .attr("text-anchor", "start")
      .text(function(d){      
        return d.service;
      });


    setTimeout(function(){
      // recover previously emphasized elements
      var period = 0;
      if (emList!=null){
        chart.emphasize(emList);
        period = 300;
      }
      setTimeout(function(){
        bars.on("mouseover", chart.mouseOver)
          .on("mouseout", chart.mouseOut)
          .on("click", chart.mouseClick);
        entered.on("mouseover", chart.mouseOver)
          .on("mouseout", chart.mouseOut)
          .on("click", chart.mouseClick);
      }, period);
    }, transPeriod);    
  }  
  chart.emphasize = function(dl){
    if (!arguments.length) return emList;
    if (dl==null) return;
    emList = [];
    var newData = [];
    dl.forEach(function(d){ 
      if (data.indexOf(d)!=-1){
        newData.push(d); 
        emList.push(d)
      }  
    });
    data.forEach(function(d){   if (dl.indexOf(d)==-1)  newData.push(d); });
    x.domain(newData.map(function(d) { return d.service; }));
    focus.selectAll(".barchart-bar")
      .transition()
      .duration(250)
      .attr("transform", function(d, i) { return "translate(0," + x(d.service) + ")"; })
      .attr("opacity", function(d){ return dl.indexOf(d)!=-1? 1.0 : 0.6; });

  }
  chart.deemphasize = function(){
    emList = null;
    x.domain(data.map(function(d) { return d.service; }));
    focus.selectAll(".barchart-bar")
      .transition()
      .duration(250)
      .attr("transform", function(d, i) { return "translate(0," + x(d.service) + ")"; })
      .attr("opacity", 1.0);

  }
  chart.mouseOver = function(d){             
    if (this!= selected) chart.enableHighlight(this); 
    tip.show(d, this);        
  }
  chart.mouseOut = function(d){
    if (this!= selected) chart.disableHighlight(this); 
    tip.hide(d, this);                
  }
  chart.mouseClick = function(d){
    if (d3.event!=null) d3.event.stopPropagation();

    if (selected) {
      chart.disableHighlight(selected);
    }

    if (selected==this) { //no selection if click the existing selection
      if (config.onDeselect(d)){ // call de-selection callback)
        chart.disableHighlight(selected);
        selected = null;     
        $("#service-functions").css({"display": "none"});
        $("#selected_service").removeAttr("id");        
      }
    }else{
      if (config.onSelect(d)){ // call selection callback)
        chart.disableHighlight(selected);
        selected = this;       
        $("#service-functions").css({"display": "inline-block"});
        $(this).attr("id", "selected_service");
        chart.enableHighlight(selected);
      }
    }
  }
  chart.select = function(selectData){
    var selectItem = focus.selectAll(".barchart-bar")
      .filter(function(d){  return (d.service == selectData.service); });
    console.log(selectItem);
    var selectElem = selectItem[0][0];
    chart.mouseClick.call(selectElem, selectData);
  }
  chart.enableHighlight = function(elem) {
    if (elem==null) return;
    var g = d3.select(elem);
    var trs = g.transition().duration(100);
    trs.select("rect")
      .style("fill", "#addd8e")
    trs.select("text")
      .style("fill", "#d95f0e")
      .style("font-weight", "bold");
  }
  chart.disableHighlight = function(elem) {
    if (elem==null) return;
    var g = d3.select(elem);
    var trs = g.transition().duration(100);
    trs.select("rect")
      .style("fill", "#7fcdbb")
    trs.select("text")
      .style("fill", "#555753")
      .style("font-weight", "normal");  
  }
  chart.format = function(budget, depth){
    if (arguments.length==1)  depth = 2;
    depth--;
    if (depth<0)  return "만원";
    var val;
    var format = d3.format(",");
    if ((val = Math.floor(budget/1000000000000))>0){ //1조
        var rest = budget-val*1000000000000;
        return format(val) + "조 " + chart.format(rest, depth);

    }else if ((val = Math.floor(budget/100000000))>0){ //1억
        var rest = budget-val*100000000; 
        //console.log(val + ", " + rest)
        return format(val) + "억 " + chart.format(rest, depth);
    }else if ((val = Math.floor(budget/10000000))>0){//1천
        var rest = budget-val*10000000; 
        return format(val) + "천 " + chart.format(rest, depth);
    }
    return budget==0? "": format(Math.floor(budget/10000)) + "만원";; 

  } 
  return chart;

};
