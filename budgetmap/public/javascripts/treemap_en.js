/** TreeMap functions and attributes defined */
var TreeMap = function(config){
	var legendSize = {width: config.size.width, height: 145};
	var margin = config.margin,
		//color = d3.scale.category10(),
		color = d3.scale.ordinal().range( ["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f","#ff7f00","#cab2d6","#6a3d9a","#ffff99","#b15928"]),// ['#b15928', '#6a3d9a', '#ff7f00', '#e31a1c', '#1f78b4','#ffff99', '#cab2d6', '#fdbf6f', '#fb9a99', '#a6cee3', '#4169E1', '#20B2AA', '#DB7093']),//)colorbrewer.Paired[12] //['#80cdc1','#33a02c', '#fb9a99','#a6cee3', '#e31a1c','#1f78b4' , '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a', '#ef6548'] 
	    root,
	    node;
	/** sets w and h as the width and height of treemap */
    	var w = config.size.width - margin.left - margin.right;
	var h = config.size.height - margin.top - margin.bottom;
	/** Given a value, x and y return the corresponding value
	 *  from the range w and h */
	var x = d3.scale.linear().range([0, w]);
	var y = d3.scale.linear().range([0, h]);

	var data = null;//, prevData = null;
	var selected = null, emList = null, emCategory = null;
	var period = 500;
	var treemap = d3.layout.treemap()
	    .round(false)
	    .size([w, h-legendSize.height]) //save space for legend
	    .sticky(true)
	    .value(function(d) { return d.size; });

	var svg = d3.select(config.container).append("div")
	    .attr("class", "treemap")
	    .style("width", w + "px")
	    .style("height", h + "px")
	.append("svg:svg")
	    .attr("width", w)
	    .attr("height", h)

	var treeSVG = svg.append("svg:g")
	    .attr("transform", "translate(.0,"+legendSize.height+")");	

	var legendSVG = svg.append("svg:g")
		    .attr("transform", "translate(.0,.0)");	
	// Add tooltip
	var tip = d3.tip()
	  .attr('class', 'treemap-d3-tip')
	  .offset([-10, 0])
	  .html(function(d) {
	    return "<span style='color:lightsteelblue;font-size:12px'>" + d.name + ": "+chart.format(d.size)+" ("+d3.format('.2%')(d.size/root.size)+")</span><br/><br/>" +
	    		"<span style='color:lightgray'>Category: "+d.parent.name+ "</span>";
	  })
	treeSVG.call(tip);	

	// Add Legend Tooltip
	var legendTip = d3.tip()
	  	.attr('class', 'treemap-d3-tip')
	  	.offset(function(){
	  		return [-10, 0];
	  	})
	  	.html(function(d) {
	    	var html =  "<span style='color:lightsteelblue;font-size:12px'>"+d.name+" Total Budget: " + chart.format(d.size) + "</span>";
	    	/*for (var i in d.children){
	    		var c = d.children[i];
	    		html += "<span style='color:lightgray'>" + c.name + ": "+chart.format(c.size)+" ("+d3.format('.2%')(c.size/d.parent.size)+")</span><br/><br/>";
	    	}*/
	    	return html;
	  	})
	legendSVG.call(legendTip);


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
	function chart(){

	}

	chart.create = function(){
		this.update(config.data, w, h)
	}	

	chart.update = function(d, nw, nh){
    	w = nw - margin.left - margin.right;
		h = nh - margin.top - margin.bottom;

		//prevData = data;
		node = root = data = d;

	   	// Update scales
	   	x = d3.scale.linear().range([0, w]);
		y = d3.scale.linear().range([0, h]);

	   	// Update canvas size
	   	d3.select(config.container).select(".treemap")
	   		.style("width", w + "px")
	    	.style("height", h + "px")
    	.select("svg")
	    	.attr("width", w)
	    	.attr("height", h)

		// Find leaf nodes
		var treemap = d3.layout.treemap()
		    .round(false)
		    .size([w, h-legendSize.height]) //save space for legend
		    .sticky(true)
		    .value(function(d) { return d.size; });

		var nodes = treemap.nodes(root)
		  	.filter(function(d) { return !d.children; });


	 	// Fine non-leaf nodes
		var parents = [];
		nodes.forEach(function(d){
			if (parents.indexOf(d.parent)==-1) parents.push(d.parent);
		});
		parents.sort(function(a,b){ return d3.ascending(a.name, b.name); })
	   	color.domain(parents.map(function(d){ return d.name; }));

	   	// *************** Draw Tree Nodes **************************************************************** //

	   	// Join new data with old elements, if any.
		var cell = treeSVG.selectAll(".treemap-cell")
		  	.data(nodes, function(d) { return d.id }); //return update selection

	    cell.on("click", chart.cellClick)	  	
		  	.on('mouseover', chart.cellMouseOver)
	      	.on('mouseout', chart.cellMouseOut);


	    // Remove old elements as needed.
		cell.exit()
			.attr("pointer-events", "none")
			.transition()
			.duration(period)
			.attr("transform", function(d, i) { 
				var t = d3.transform(d3.select(this).attr("transform")),
			  	x = t.translate[0];
				return "translate("+x+","+h+")"; 
			})
			.remove();	 

		//Update old elements as needed
		cell.attr("pointer-events", "none")
			.transition()
			.duration(period)
			.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
			.attr("opacity", function(d){
				// if (emCategory)	return emCategory==d.parent.name? 1.0:0.1;
				if (emList)		return emList.indexOf(d)!=-1? 1.0:0.1;
				return 1.0;
			})
			.each("end", function() { d3.select(this).attr("pointer-events", null); });

		cell.select(".treemap-rect")
			.attr("pointer-events", "none")
			.transition().duration(period)		
			.attr("width", function(d) { 	return (d.dx-1)<0? 0 : (d.dx-1); })
		  	.attr("height", function(d) { 	return (d.dy-1)<0? 0 : (d.dy-1); })
		  	.each("end", function() { d3.select(this).attr("pointer-events", null); });

		cell.select(".treemap-text").transition().duration(period)
		  	.attr("x", function(d) { return d.dx / 2; })
		  	.attr("y", function(d) { return d.dy / 2; })
		  	.style("opacity", function(d) { d.w = this.getComputedTextLength(); return d.dx > d.w ? (d.dy>24? 1:0) : 0; });
		
		cell.select(".treemap-sub-text").transition().duration(period)
			.attr("x", function(d) { return d.dx; })
			.attr("y", function(d) { return d.dy; })
			.style("opacity", function(d) { d.w = this.getComputedTextLength()+4; return d.dx > d.w ? (d.dy>24? 1:0) : 0; });

		// Create new elements as needed. 			
		var entered = cell.enter().append("svg:g")
		  	.attr("class", "treemap-cell")
		  	.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
			.attr("opacity", function(d){
				// if (emCategory)	return emCategory==d.parent.name? 1.0:0.1;
				if (emList)		return emList.indexOf(d)!=-1? 1.0:0.1;
				return 1.0;
			});

		entered.on("click", chart.cellClick)	  	
		  	.on('mouseover', chart.cellMouseOver)
	      	.on('mouseout', chart.cellMouseOut);

		entered.append("svg:rect")
			.attr("class", "treemap-rect")
			.attr("width", 0)
			.attr("height", 0)
			.attr("pointer-events", "none")
		.transition().duration(period)
			.attr("width", function(d) { 	return (d.dx-1)<0? 0 : (d.dx-1); })
		  	.attr("height", function(d) { 	return (d.dy-1)<0? 0 : (d.dy-1); })
		  	.style("fill", function(d) {	return color(d.parent.name); })
		  	.each("end", function() { d3.select(this).attr("pointer-events", null); });

		entered.append("svg:text")
			.attr("class", "treemap-text")
		  	.attr("x", function(d) { return d.dx / 2; })
		  	.attr("y", function(d) { return d.dy / 2; })
		  	.attr("dy", ".35em")
		  	.attr("text-anchor", "middle")
		  	.text(function(d) { return d.name; })
		  	.style("opacity", 0.0)
		.transition().duration(period)
		  	.style("opacity", function(d) { d.w = this.getComputedTextLength(); return d.dx > d.w ? (d.dy>24? 1:0) : 0; });
		//issue counts
		entered.append("svg:text")
			.attr("class", "treemap-sub-text")
			.attr("x", function(d) { return d.dx; })
			.attr("y", function(d) { return d.dy; })
			.attr("text-anchor", "end")
			.attr("dy", "-.35em")
			.attr("dx", "-.35em")
			.text(function(d) { return "Services:" + d.services.length; }) // "이슈:"+d.issue_size + "/사업:" + d.serv_size; })
			.style("opacity", 0.0)
		.transition().duration(period)
			.style("opacity", function(d) { d.w = this.getComputedTextLength()+4; return d.dx > d.w ? (d.dy>24? 1:0) : 0; });
		// *************** Draw Legends **************************************************************** //

		//Add Legend Elements
		var legendWidth = w/2;
		var legendHeight = 20;
		var legendElemSize = 20;

		// Join new data with old elements, if any.
		var legend = legendSVG.selectAll(".treemap-legend")
			.data(parents, function(d){ return d.name; });

		legend.on('mouseover', chart.legMouseOver)
	      	.on('mouseout', chart.legMouseOut)
	      	.on('click', chart.legClick);

		// Remove old elements as needed.
		legend.exit()		
			.attr("pointer-events", "none")
			.transition()
			.duration(period)
			.attr("transform", function(d, i) { 
				var t = d3.transform(d3.select(this).attr("transform")),
			  	x = t.translate[0];
				return "translate("+x+","+h+")"; 
			})
			.remove();

		// Update old elements as needed
		legend.attr("pointer-events", "none")
			.transition()
			.duration(period)
			.attr("transform", function(d, i) { return "translate(" + (i%2*legendWidth) + "," + (Math.floor(i/2)*legendHeight) + ")"; })
			.each("end", function() { d3.select(this).attr("pointer-events", null); });
		
		// Create new elements as needed.  

		var legEntered = legend.enter().append("g")
			.attr("class", "treemap-legend")
			.attr("transform", function(d, i) { return "translate(" + (i%2*legendWidth) + "," + (Math.floor(i/2)*legendHeight) + ")"; });
		
		legEntered.on('mouseover', chart.legMouseOver)
	      	.on('mouseout', chart.legMouseOut)
	      	.on('click', chart.legClick);	

		legEntered.append("rect")
			.attr("class","treemap-legend-rect")
			.attr("width", 0)
			.attr("height", 0)
			.attr("pointer-events", "none")
		.transition()
			.duration(period)
			.attr("width", legendElemSize)
			.attr("height", legendElemSize)
			.style("fill", function(d){ return color(d.name);})
			.each("end", function() { d3.select(this).attr("pointer-events", null); });

		legEntered.append("text")
		    .attr("class", "treemap-legend-text")
		    .text(function(d) { return d.name; })
		    .attr("dx", legendElemSize+4)
		    .attr("dy", "1em")
		    .attr("opacity", 0.0)
		    .attr("pointer-events", "none")
		.transition()
			.duration(period)
			.attr("opacity", 1.0)
			.each("end", function() { d3.select(this).attr("pointer-events", null); });

		// Add Event Handler At the End of transition
		/*setTimeout(function(){
			var period = 0;
			if (emList!=null){
				chart.emphasize(emList);
				period = 300;
			}
			console.log("update"+period);
			setTimeout(function(){
				cell.on("click", chart.cellClick)	  	
			  	.on('mouseover', chart.cellMouseOver)
		      	.on('mouseout', chart.cellMouseOut);

				entered.on("click", chart.cellClick)	  	
			  	.on('mouseover', chart.cellMouseOver)
		      	.on('mouseout', chart.cellMouseOut);

				legend.on('mouseover', chart.legMouseOver)
		      	.on('mouseout', chart.legMouseOut)
		      	.on('click', chart.legClick);


				legEntered.on('mouseover', chart.legMouseOver)
		      	.on('mouseout', chart.legMouseOut)
		      	.on('click', chart.legClick);				
			}, period)

		}, period);*/		
	}
	chart.data = function(){
		return data;
	}
	chart.emphasize = function(dl){
		// console.log("emphasize");
		if (!arguments.length) return emList;
		if (dl==null) return;
		emList = dl;
		treeSVG.selectAll(".treemap-cell")
		.transition(period)
		.attr("opacity", function(d){
			return emList.indexOf(d)!=-1? 1.0:0.1;
		});
		legendSVG.selectAll(".treemap-legend")
		.transition(period)
		.attr("opacity", function(d){
			return emList.indexOf(d)!=-1? 1.0:0.1;
		});
    	//chart.update(data, w, h);
	}
	chart.deemphasize = function(){
	    if (emList==null) return;
	    emList = null;
		treeSVG.selectAll(".treemap-cell")
		.transition(period)
		.attr("opacity", 1.0);
		legendSVG.selectAll(".treemap-legend")
		.transition(period)
		.attr("opacity", 1.0);
	    //chart.update(data, w, h);
	}
	var legendClicked = null;
	var rollbackData = null;
	chart.legClick = function (d){
		chart.disableHighlight(this);     
		legendTip.hide(d, this);
		// console.log("legClick: "+(legendClicked==null))
		//chart.legMouseOut.call(this, d);
		//filter data by selected category
		//get category name
		if (legendClicked==null){
			legendClicked = this;
			var catName = d3.select(this).select(".treemap-legend-text").text();
			newData = {};
			for (var attr in root){
				newData[attr] = root[attr];
			}
			//console.log(catName);
			newData.children = [];
			for (var i in root.children){
				//console.log(newData.children[i].name)
				if (root.children[i].name==catName){
					newData.children.push(root.children[i])
				}
			}
			rollbackData = data;
			chart.update(newData, w, h);

			legendSVG.append("text").attr("opacity", 0.0)
			.transition()
			.duration(period)
			.attr("opacity", 1.0)
			.attr("id", "help-text")
		    .text("↑ Click here to show all categories")
		    .attr("dy", "3em")
		}else{//if previously selected
			//release selection (TODO: create a new legend for seeing all)
			legendClicked 	= null;
			chart.update(rollbackData, w, h);	

			legendSVG.select("#help-text").remove();

			if (selected){
				var selID = d3.select(selected).data()[0].id;
				console.log(selID)
				selected  = treeSVG.selectAll(".treemap-cell")
				.filter(function(d){ return d.id == selID; })[0][0]
				chart.enableHighlight(selected);
			}


		}
	}
	chart.legMouseOver = function (d){
  		// console.log("legMouseOver");

  		//highlight budgets within this category
  		emCategory = d3.select(this).select(".treemap-legend-text").text();
  		//chart.update(config.data, w, h);

  		chart.enableHighlight(this);		  		
  		legendTip.show(d, this);

		// treeSVG.selectAll(".treemap-cell")
		// .filter(function(d) { return d.parent.name == emCategory; })
		// .attr("opacity", 1.0);
		

		// treeSVG.selectAll(".treemap-cell")
		// 	.filter(function(d) { return d.parent.name == emCategory; })
		// 	.select("rect")
		// 	.style("stroke", "black")
		// 	.style("stroke-width", "2px");

  	}
    chart.legMouseOut = function (d){
  		// console.log("legMouseOut:" + (emList==null));
  		// rollback to previous state
  		chart.disableHighlight(this);     
  		legendTip.hide(d, this);

		// treeSVG.selectAll(".treemap-cell")
		// .filter(function(d) { return d.parent.name == emCategory; })
		// .attr("opacity", function(d){
		// 	return emList? (emList.indexOf(d)!=-1? 1.0:0.1): 1.0;
		// });
		


		// treeSVG.selectAll(".treemap-cell")
		// 	.filter(function(d) { return (selected!=this) && (d.parent.name == emCategory); })
		// 	.select("rect")
		// 	.style("stroke", "black")
		// 	.style("stroke-width", "0px");

  		emCategory = null;
  		/*
  		treeSVG.selectAll(".treemap-cell")  		
		.attr("opacity",1.0)
		
		*/
  	}
	chart.cellMouseOver = function (d){
		// console.log("cellMouseOver");
  		if (this!= selected) chart.enableHighlight(this);		  		
  		tip.show(d, this);
  	}
	chart.cellMouseOut = function (d){
		// console.log("cellMouseOut");
  		if (this!= selected) chart.disableHighlight(this);
  		tip.hide(d, this);
  	}	  	 
	chart.cellClick = function(d) { 
		// console.log("cellClick");
  		//d3.event.stopPropagation();
  		
		if (selected) {
			chart.disableHighlight(selected);
		}
		
		if (selected==this) { //no selection if click the existing selection
			selected = null;			
			tip.hide(d, this);
			config.onDeselect(d); // call de-selection callback
		}else{
			selected = this;	  		
			chart.enableHighlight(selected);
			tip.show(d, this);
			config.onSelect(d); // call selection callback				
		}
  		
  	}
  	chart.selectMax = function(){
  		var maxNode = null;
  		var maxData = null;
  		var size    = 0;
  		//simulate selection
  		treeSVG.selectAll(".treemap-cell")
  			.each(function(d){ //there must be only one item
				if (d.size>size){
					size = d.size;
					maxNode = this;
					maxData = d;
				}
  			})
		selected = maxNode;	  		
		chart.enableHighlight(selected);
  		config.onSelect(maxData); // call selection callback
  	}
  	chart.increaseIssueCnt = function(budgetName){
		treeSVG.selectAll(".treemap-sub-text")
			.filter(function(d){	return (d.name == budgetName);	})
			.text(function(d) { 
				d.issue_size+=1;
			 	return "Services:" + d.services.length;//"이슈:"+d.issue_size + "/사업:" + d.serv_size; 
			})
  	}
  	chart.updateIssueCnt = function(){
 		treeSVG.selectAll(".treemap-sub-text")
			.text(function(d) { 
			 	return "Services:" + d.services.length;//"이슈:"+d.issue_size + "/사업:" + d.serv_size; 
			}) 		
  	}

	chart.enableHighlight = function(elem) {
		//console.log("enable")
		d3.select(elem).select("rect")
			.style("stroke", "black")
			.style("stroke-width", "2px")
		//trs.select("rect").style("filter", "url(#drop-shadow)");
		//trs.select("text").style("font-weight", "bold");
		//trs.select("text").style("fill", "#2e3436");
		// d3.select(elem).TreeMapMoveToFront();	
	}
	chart.disableHighlight = function(elem) {
		//console.log("disable")

		d3.select(elem).select("rect")
			.style("stroke", "black")
			.style("stroke-width", "0px")

		//trs.select("rect").style("filter", "");
		//trs.select("text").style("font-weight", "");
		//trs.select("text").style("fill", "aliceblue");
	}
	chart.enableHighlightByData = function(data){
		treeSVG.selectAll(".treemap-cell")
			.filter(function(d) { return d.name == data.name })
			.select("rect")
			.style("stroke", "black")
			.style("stroke-width", "2px");
	}
	chart.disableHighlightByData = function(data){
		treeSVG.selectAll(".treemap-cell")
			.filter(function(d) { return (selected!=this)&&(d.name == data.name) })
			.select("rect")
			.style("stroke", "black")
			.style("stroke-width", "0px");
	}

    chart.drawBorder = function(name) {
        if (name) {
            chart.drawBorder();
            var rect = treeSVG.selectAll(".treemap-cell")
                .filter(function(d) { return d.name == name }).select("rect");
            rect.style("stroke", "black")
                .style("stroke-width", "2px")
                .style("opacity", 1);
        } else {
            treeSVG.selectAll(".treemap-cell")
                .select("rect")
                .style("stroke", "black")
                .style("stroke-width", "0px")
                .style("opacity", 0.3);
        }
    };

	chart.format = function(budget, depth){
		var format = d3.format(",");
		return "₩ " + format(budget);
/*		if (arguments.length==1)	depth = 2;
		depth--;
		if (depth<0)	return "won";
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
		return budget==0? "0 won": format(Math.floor(budget/10000)) + "만원";; 
*/
	} 
	return chart;   
};
// d3.selection.prototype.TreeMapMoveToFront = function() {
//   return this.each(function(){
//   this.parentNode.appendChild(this);
//   });
// };
