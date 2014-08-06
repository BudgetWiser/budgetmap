var TreeMap = function(){
	
};
d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
  this.parentNode.appendChild(this);
  });
};
TreeMap.prototype.generate = function(settings){
	var legendSize = {width: settings.size.width, height: 70};
	var margin = settings.margin,
		//color = d3.scale.category10(),
		color = d3.scale.ordinal().range(['#80cdc1','#33a02c', 
			'#fb9a99','#a6cee3', '#e31a1c','#1f78b4' , '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a', '#ef6548']),//colorbrewer.Paired[12]),
	    root,
	    node;

    var w = settings.size.width - margin.left - margin.right;
	var h = settings.size.height - margin.top - margin.bottom;
	var x = d3.scale.linear().range([0, w]);
	var y = d3.scale.linear().range([0, h]);
	
	var self = this;	

	this.selected = null; 

	var treemap = d3.layout.treemap()
	    .round(false)
	    .size([w, h-legendSize.height]) //save space for legend
	    .sticky(true)
	    .value(function(d) { return d.size; });

	var svg = d3.select(settings.container).append("div")
	    .attr("class", "treemap")
	    .style("width", w + "px")
	    .style("height", h + "px")
	.append("svg:svg")
	    .attr("width", w)
	    .attr("height", h)
  	.append("svg:g")
	    .attr("transform", "translate(.5,.5)");	

	// Add tooltip
	var tip = d3.tip()
	  .attr('class', 'treemap-d3-tip')
	  .offset([-10, 0])
	  .html(function(d) {
	    return "<span style='color:lightsteelblue;font-size:12px'>"+d.parent.name+" 전체예산: " + self.format(d.parent.size) + "</span><br/><br/>" +
	    		"<span style='color:lightgray'>" + d.name + ": "+self.format(d.size)+" ("+d3.format('.2%')(d.size/d.parent.size)+")</span>";
	  })
	svg.call(tip);

	// Add drop shadow for selection
	/*
	var defs = svg.append("svg:defs");

	var filter = defs.append("filter")
	    .attr("id", "drop-shadow")
	    .attr("height", "130%");
	filter.append("feGaussianBlur")
	    .attr("in", "SourceAlpha")
	    .attr("stdDeviation", 5)
	    .attr("result", "blur");
	filter.append("feOffset")
	    .attr("in", "blur")
	    .attr("dx", 2)
	    .attr("dy", 2)
	    .attr("result", "offsetBlur");
	var feMerge = filter.append("feMerge");

	feMerge.append("feMergeNode")
	    .attr("in", "offsetBlur")
	feMerge.append("feMergeNode")
	    .attr("in", "SourceGraphic");
	*/
	node = root = settings.data;

	var nodes = treemap.nodes(root)
	  	.filter(function(d) { return !d.children; });

	var parents = [];
	nodes.forEach(function(d){
		if (parents.indexOf(d.parent)==-1) parents.push(d.parent);
	});
	parents.sort(function(a,b){ return d3.ascending(a.name, b.name); })
   	color.domain(parents.map(function(d){ return d.name; }));

   	// Draw Tree Nodes

	var cell = svg.selectAll("g")
	  	.data(nodes)
		.enter().append("svg:g")
	  	.attr("class", "treemap-cell")
	  	.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
   
	var rects = cell.append("svg:rect")
		.attr("class", "treemap-rect")
		.attr("width", 0)
		.attr("height", 0);
	var transition = rects.transition().duration(1000);

  	transition.attr("width", function(d) { 	return (d.dx-1)<0? 0 : (d.dx-1); })
	  	.attr("height", function(d) { 	return (d.dy-1)<0? 0 : (d.dy-1); })
	  	.style("fill", function(d) {	return color(d.parent.name); });

	cell.append("svg:text")
		.attr("class", "treemap-text")
	  	.attr("x", function(d) { return d.dx / 2; })
	  	.attr("y", function(d) { return d.dy / 2; })
	  	.attr("dy", ".35em")
	  	.attr("text-anchor", "middle")
	  	.text(function(d) { return d.name; })
	  	.style("opacity", function(d) { d.w = this.getComputedTextLength(); return d.dx > d.w ? 1 : 0; });
	
	//Add Legend
	//Add Legend Tooltip
	var legendTip = d3.tip()
	  	.attr('class', 'treemap-d3-tip')
	  	.offset([-10, 0])
	  	.html(function(d) {
	    	var html =  "<span style='color:lightsteelblue;font-size:12px'>"+d.name+" 전체예산: " + self.format(d.size) + "</span><br/><br/>";
	    	for (var i in d.children){
	    		var c = d.children[i];
	    		html += "<span style='color:lightgray'>" + c.name + ": "+self.format(c.size)+" ("+d3.format('.2%')(c.size/d.parent.size)+")</span><br/><br/>";
	    	}
	    	return html;
	  	})
	svg.call(legendTip);

	//Add Legend Elements
	var treemapHeight = h-legendSize.height;
	var legendWidth = w/4;
	var legendHeight = 20;
	var legendElemSize = 20;
	var legend = svg.selectAll(".treemap-legend")
		.data(parents)
		.enter().append("g")
		.attr("class", "treemap-legend")
		.attr("transform", function(d, i) { return "translate(" + (i%4*legendWidth) + "," + (treemapHeight+Math.floor(i/4)*legendHeight) + ")"; });


	rects = legend.append("rect")
		.attr("class","treemap-legend-rect")
		.attr("width", 0)
		.attr("height", 0);	
		
	transition = rects.transition().duration(1000);
	transition.attr("width", legendElemSize)
		.attr("height", legendElemSize)
		.style("fill", function(d){ return color(d.name);});

	var texts = legend.append("text")
	    .attr("class", "treemap-legend-text")
	    .text(function(d) { return d.name; })
	    .attr("dx", legendElemSize+4)
	    .attr("dy", "1em")
	    .attr("opacity", 0.0);

	transition = texts.transition().duration(1000);
	transition.attr("opacity", 1.0);

	// Add Event Handler At the End of transition
	setTimeout(function(){
		cell.on("click", function(d) { 
	  		d3.event.stopPropagation();
	  		
			if (self.selected) {
				self.disableHighlight(self.selected);
			}
			if (self.selected==this) { //no selection if click the existing selection
				self.selected = null;			
				tip.hide(d, this);
				settings.onDeselect(d); // call de-selection callback
			}else{
				self.selected = this;	  		
				self.enableHighlight(self.selected);
				tip.show(d, this);
				settings.onSelect(d); // call selection callback
			}
	  		
	  	})	  	
	  	.on('mouseover', function (d){
	  		if (this!= self.selected) self.enableHighlight(this);		  		
	  		tip.show(d, this);
	  	})
      	.on('mouseout', function (d){
      		if (this!= self.selected) self.disableHighlight(this);
      		tip.hide(d, this);
      	});

		legend.on('mouseover', function (d){
	  		self.enableHighlight(this);		  		
	  		legendTip.show(d, this);
	  	})
      	.on('mouseout', function (d){
      		self.disableHighlight(this);
      		legendTip.hide(d, this);
      	});
	}, 1000);


}
TreeMap.prototype.enableHighlight = function(elem) {
	var g = d3.select(elem);
	var trs = g.transition().duration(100);
	trs.select("rect").style("stroke", "black");
	trs.select("rect").style("opacity", 0.9);
	trs.select("rect").style("stroke-width", "2px");
	//trs.select("rect").style("filter", "url(#drop-shadow)");
	//trs.select("text").style("font-weight", "bold");
	//trs.select("text").style("fill", "#2e3436");
	d3.select(elem).moveToFront();	
}
TreeMap.prototype.disableHighlight = function(elem) {
	var g = d3.select(elem);
	var trs = g.transition().duration(100);
	trs.select("rect").style("stroke", "");
	trs.select("rect").style("opacity", 0.7);
	trs.select("rect").style("stroke-width", "");
	//trs.select("rect").style("filter", "");
	//trs.select("text").style("font-weight", "");
	//trs.select("text").style("fill", "aliceblue");
}

TreeMap.prototype.format = function(budget){
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
/*
TreeMap.prototype.zoom = function(d) {
	var w = this.w, h = this.h, x = this.x, y = this.y;
	var kx = w / d.dx, ky = h / d.dy;
	x.domain([d.x, d.x + d.dx]);
	y.domain([d.y, d.y + d.dy]);

	var t = this.svg.selectAll("g.cell").transition()
	  	.duration(d3.event.altKey ? 7500 : 750)
	  	.attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

	t.select("rect")
	  	.attr("width", function(d) { return kx * d.dx - 1; })
	  	.attr("height", function(d) { return ky * d.dy - 1; })

	t.select("text")
	  	.attr("x", function(d) { return kx * d.dx / 2; })
	  	.attr("y", function(d) { return ky * d.dy / 2; })
	  	.style("opacity", function(d) { return kx * d.dx > d.w ? 1 : 0; });

	node = d;
	d3.event.stopPropagation();
}
*/