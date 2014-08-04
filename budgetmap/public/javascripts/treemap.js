var TreeMap = function(){
	
};

TreeMap.prototype.generate = function(settings){
	var margin = settings.margin,
		color = d3.scale.category20c(),
	    root,
	    node;

    var w = this.w = settings.size.width - margin.left - margin.right;
	var h = this.h = settings.size.height - margin.top - margin.bottom;
	var x = this.x = d3.scale.linear().range([0, w]);
	var y = this.y = d3.scale.linear().range([0, h]);
	
	this.selected = null; 
	/*
   	var color = d3.scale.threshold()
	    .domain([-0.25, -0.05, 0, .25, .05, 1])
	    //.domain([5, 10, 15, 20, 25, 100])
	    .range(["rgb(216, 75, 42)", "rgb(238, 149, 134)", "rgb(228, 183, 178)", "rgb(190, 204, 174)", "rgb(156, 175, 132)", "rgb(122, 162, 92)"]);
	*/
	var treemap = d3.layout.treemap()
	    .round(false)
	    .size([w, h])
	    .sticky(true)
	    .value(function(d) { return d.size; });

	var svg = this.svg = d3.select(settings.container).append("div")
	    .attr("class", "treemap")
	    .style("width", w + "px")
	    .style("height", h + "px")
	.append("svg:svg")
	    .attr("width", w)
	    .attr("height", h)
  	.append("svg:g")
	    .attr("transform", "translate(.5,.5)");

	node = root = settings.data;

	var nodes = treemap.nodes(root)
	  	.filter(function(d) { return !d.children; });
	var self = this;
	var cell = svg.selectAll("g")
	  	.data(nodes)
		.enter().append("svg:g")
	  	.attr("class", "treemap-cell")
	  	.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
	  	.on("click", function(d) { 
	  		d3.event.stopPropagation();
	  		
	  		//return self.zoom(node == d.parent ? root : d.parent); 
	  		if (self.selected==this) return;
			if (self.selected) {
				d3.select(self.selected).select("rect").style("stroke", "");
				d3.select(self.selected).select("text").style("fill", "aliceblue");
				self.selected = null;			
			}
	  		self.selected = this;
	  		d3.select(self.selected).select("rect").style("stroke", "steelblue");
	  		d3.select(self.selected).select("text").style("fill", "steelblue");

	  		settings.onSelect(d); // call selection callback

	  		
	  	});

	cell.append("svg:rect")
		.attr("class", "treemap-rect")
	  	.attr("width", function(d) { 	return (d.dx-1)<0? 0 : (d.dx-1); })
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




}
TreeMap.prototype.size = function(d) {
  return d.size;
}

TreeMap.prototype.count = function(d) {
  return 1;
}

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
