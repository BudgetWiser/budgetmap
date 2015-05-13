var BarChart = function(config){
  //define private variables
  var margin = config.margin, //{top: 10, right: 10, bottom: 100, left: 40},
      height = config.size.height - margin.top - margin.bottom,
      width = config.size.width - margin.left - margin.right;

  var selected = null, emList=null;

  var transPeriod = 750;

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
        var html =  "<span style='color:lightsteelblue;font-size:12px'>"+d.name+"<br/><br/>" + chart.format(d.size) + "</span>";
          //html += "<span style='color:lightgray'>" + d.name + ": "+format(d.size)+" ("+d3.format('.2%')(d.size/d.parent.size)+")</span><br/><br/>";
        return html;
      })
  focus.call(tip);

  function chart(){
  }
  chart.create = function(){
    this.update(data, width, height);    
  }

  var curPage = [];
  var pages = [];
  var pageIdx = 0;
  var MAX_PAGE = 500;
  chart.update = function(d, w, h){
    console.log("update barchart");
    data = d;
    if (emList!=null){
      newData = [];
      emList.forEach(function(d){ //emphasized elements first
        if (data.indexOf(d)!=-1){
          newData.push(d); 
        }  
      });
      data.forEach(function(d){   if (emList.indexOf(d)==-1)  newData.push(d); }); // and the rest follows
      data = newData;
    }else{
      data.sort(function(a, b){
          return b.size - a.size;
      });
    }
    pages = [];
    var page = [];
    for (var i in data){
      page.push(data[i]);
      if (page.length>=MAX_PAGE){
        pages.push(page);
        page = [];
      }
    }
    if (data.length%MAX_PAGE!=0)  pages.push(page);
    console.log(emList);
    console.log(pages);
    pageIdx = 0;
    curPage = pages[pageIdx]; //draw page 1 first

    //
    //update emphasize items
    /*
    if (emList!=null){
      var newList = [];
      emList.forEach(function(d){ 
        if (data.indexOf(d)!=-1){
          newList.push(d)
        }  
      });
      emList = newList;
    }*/

    h = config.size.height - margin.top - margin.bottom;
    w = config.size.width - margin.left - margin.right;

    fullHeight  = outerPadding*2 + (barPadding + barSize)*data.length;
    x.rangeRoundBands([0, fullHeight], .2); //range update
    x.domain(data.map(function(d) { return d.name; }));
    y.domain([0, d3.max(data.map(function(d) { return d.size; }))]);
    //console.log(x(data[0].name));
    // Canvas Size update
    var pageHeight = outerPadding*2 + (barPadding + barSize)*curPage.length;
    d3.select(config.container).select(".barchart").style("height", pageHeight + "px");
    d3.select(config.container).select("svg").attr("height", pageHeight);

    // Join new data with old elements, if any.
    var bars = focus.selectAll(".barchart-bar")
      .data(curPage, function(d) { return d._id; });

    bars.on("mouseover", chart.mouseOver)
          .on("mouseout", chart.mouseOut)
          .on("click", chart.mouseClick)
   
    // Remove old elements as needed.
    bars.exit()
      .attr("pointer-events", "none")
      .transition()
      .duration(transPeriod)
      .attr("transform", function(d, i) { 
        var t = d3.transform(d3.select(this).attr("transform")),
          y = t.translate[1];
        return "translate("+width+","+y+")"; 
      })
      .remove();
    //console.log(bars)
    //Update old elements as needed
    bars.attr("pointer-events", "none")// Remove interaction while constructing and transitioning
      .transition()
      .duration(transPeriod)
      .attr("transform", function(d, i) { return "translate(0," + x(d.name) + ")"; })//((barSize+barPadding)*i)
      .attr("opacity", function(d){ return emList==null? 1.0: (emList.indexOf(d)!=-1? 1.0 : 0.1); })
      .each("end", function() { d3.select(this).attr("pointer-events", null); });

    bars.select(".barchart-rect").transition().duration(transPeriod)
      .attr("width", function(d) { return y(d.size); })


    // Create new elements as needed.  
    var entered = bars.enter().append("g")
      .attr("class", "barchart-bar")
      .attr("transform", "translate(0,0)")

    entered.on("mouseover", chart.mouseOver)
          .on("mouseout", chart.mouseOut)
          .on("click", chart.mouseClick);

    entered.attr("pointer-events", "none")
      .transition()
      .duration(transPeriod)
      .attr("transform", function(d, i) { return "translate(0," + x(d.name) + ")"; }) //((barSize+barPadding)*i)
      .attr("opacity", function(d){ return emList==null? 1.0: (emList.indexOf(d)!=-1? 1.0 : 0.1); })
      .each("end", function() { d3.select(this).attr("pointer-events", null); });

    entered.append("rect")
      .attr("class", "barchart-rect")
      .attr("width", function(d) { return y(d.size); })
      .attr("height", barSize)
    
    entered.append("text")
      .attr("class", "barchart-text")
      .attr("x", 0)
      .attr("y", barSize/2)
      .attr("dx", "0.25em")
      .attr("dy", "0.25em")
      .attr("text-anchor", "start")
      .text(function(d){      
        return d.name;
      });

    d3.select(config.container).select(".barchart").select(".more").remove();
    if (pages.length>1){//add 'load more...'       
      
      d3.select(config.container).select(".barchart")
        .append("xhtml:a")
        .attr("class", "more")
        .text(pages[1].length+" 개 사업 더 불러오기...")
        .on("click", chart.loadMorePage);
    }
    //setTimeout(function(){
      // recover previously emphasized elements
      //var period = 0;
      //if (emList!=null){
      //  chart.emphasize(emList);
      //  period = 300;
      //}
      /*setTimeout(function(){
        console.log("attach callbacks")
        bars.on("mouseover", chart.mouseOver)
          .on("mouseout", chart.mouseOut)
          .on("click", chart.mouseClick);
        entered.on("mouseover", chart.mouseOver)
          .on("mouseout", chart.mouseOut)
          .on("click", chart.mouseClick);
      }, period);*/
    //}, transPeriod);    
  }  
  chart.loadMorePage = function(){
    console.log('loadMorePage');
    pageIdx++;
    if (pageIdx>=pages.length) return;

    curPage = pages[pageIdx];
    var pageHeight = outerPadding*2 + (barPadding + barSize)*curPage.length;
    var chartHeight = parseInt(d3.select(config.container).select(".barchart").style("height")) + pageHeight;
    var svgHeight = parseInt(d3.select(config.container).select("svg").attr("height")) + pageHeight;
    console.log(chartHeight);
    console.log(svgHeight)
    d3.select(config.container).select(".barchart").style("height", chartHeight + "px");
    d3.select(config.container).select("svg").attr("height", svgHeight);

    // Join new data with old elements, if any.

    var bars = focus.selectAll(".barchart-bar")
      .data(curPage, function(d) { return d._id; });

    // Create new elements as needed.  
    var entered = bars.enter().append("g")
      .attr("class", "barchart-bar")
      .attr("transform", "translate(0,0)")

    entered.on("mouseover", chart.mouseOver)
          .on("mouseout", chart.mouseOut)
          .on("click", chart.mouseClick);

    entered.attr("pointer-events", "none")
      .transition()
      .duration(transPeriod)
      .attr("transform", function(d, i) { return "translate(0," + x(d.name) + ")"; }) //((barSize+barPadding)*i)
      .attr("opacity", function(d){ return emList==null? 1.0: (emList.indexOf(d)!=-1? 1.0 : 0.1); })
      .each("end", function() { d3.select(this).attr("pointer-events", null); });

    entered.append("rect")
      .attr("class", "barchart-rect")
      .attr("width", function(d) { return y(d.size); })
      .attr("height", barSize)
    
    entered.append("text")
      .attr("class", "barchart-text")
      .attr("x", 0)
      .attr("y", barSize/2)
      .attr("dx", "0.25em")
      .attr("dy", "0.25em")
      .attr("text-anchor", "start")
      .text(function(d){      
        return d.name;
      });    

    //reached the end of pages. remove 'more' button.    
    if ((pageIdx+1)<pages.length){
      d3.select(config.container).select(".barchart").select(".more").text(pages[pageIdx+1].length+" 개 사업 더 불러오기...");
    }else{
      d3.select(config.container).select(".barchart").select(".more").remove();
    }
  }
  chart.emphasize = function(dl){
    if (!arguments.length) {
      effetive = [];
      data.forEach(function(d){
        if (emList&& emList.indexOf(d)!=-1)
          effetive.push(d);
      });
      return effetive;
    }

    if (dl==null) return;
    emList = dl;

    chart.update(data, width, height);

    /*
    x.domain(newData.map(function(d) { return d.name; }));
    focus.selectAll(".barchart-bar")
      .attr("pointer-events", "none")
      .transition()
      .duration(250)
      .attr("transform", function(d, i) { console.log(x(d.name)); return "translate(0," + x(d.name) + ")"; })
      .attr("opacity", function(d){ return dl.indexOf(d)!=-1? 1.0 : 0.6; })
      .each("end", function() { d3.select(this).attr("pointer-events", null); });
    */
  }

  chart.deemphasize = function(){
    if (emList==null) return;
    emList = null;
    chart.update(data, width, height);
    /*
    x.domain(data.map(function(d) { return d.name; }));
    focus.selectAll(".barchart-bar")
      .attr("pointer-events", "none")
      .transition()
      .duration(250)
      .attr("transform", function(d, i) { return "translate(0," + x(d.name) + ")"; })
      .attr("opacity", 1.0)
      .each("end", function() { d3.select(this).attr("pointer-events", null); });
    */
  }
  chart.mouseOver = function(d){             
    if (this!= selected) chart.enableHighlight(this); 
    tip.show(d, this);       
    config.onMouseOver.call(this, d); 
  }
  chart.mouseOut = function(d){
    if (this!= selected) chart.disableHighlight(this); 
    tip.hide(d, this);    
    config.onMouseOut.call(this, d);            
  }
  chart.mouseClick = function(d){
    if (d3.event!=null) d3.event.stopPropagation();

    if (selected) {
      chart.disableHighlight(selected);
    }
    console.log(selected);

    if (selected==this) { //no selection if click the existing selection
      if (config.onDeselect(d)){ // call de-selection callback)
        chart.disableHighlight(selected);
        selected = null;     
        // $("#name-functions").css({"display": "none"});
        // $("#selected_name").removeAttr("id");        
      }
    }else{
      if (config.onSelect(d)){ // call selection callback)
        //chart.disableHighlight(selected);
        selected = this;       
        // $("#name-functions").css({"display": "inline-block"});
        // $(this).attr("id", "selected_name");
        chart.enableHighlight(selected);
      }
    }
  }
  chart.select = function(selectData){
    var selectItem = focus.selectAll(".barchart-bar")
      .filter(function(d){  return (d.name == selectData.name); });
    console.log(selectItem);
    var selectElem = selectItem[0][0];
    chart.mouseClick.call(selectElem, selectData);
  }
  chart.enableHighlight = function(elem) {
    if (elem==null) return;
    var g = d3.select(elem);
    //var trs = g.transition().duration(100);
    g.select("rect")
      .style("fill", "#addd8e")
    g.select("text")
      .style("fill", "#d95f0e")
      .style("font-weight", "bold");
  }
  chart.disableHighlight = function(elem) {
    if (elem==null) return;
    var g = d3.select(elem);
    //var trs = g.transition().duration(100);
    g.select("rect")
      .style("fill", "#7fcdbb")
    g.select("text")
      .style("fill", "#555753")
      .style("font-weight", "normal");  
  }
  chart.format = function(budget, depth){
    if (arguments.length==1)  depth = 2;
    depth--;
    if (depth<0)  return "원";
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
        return format(val) + "천만 " + chart.format(rest, depth);
    }
    return budget==0? "0 원": format(Math.floor(budget/10000)) + "만원";; 

  } 
  return chart;

};
