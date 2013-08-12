var barSpec = {spacing: 2, h: 20, fill: '#5777C0', moFill: '#A2B6E5'};
var chartSpec = {w: 600, insideOffset: 30, label:{size: 14, color: "#000"}};
//todo: replace with something dynamic
var svgTemp = {w: 2000};
var transitionSpeed = 500;

var travelPath = ["National"];

function loadData(){
	//fill list of DRGs
	d3.csv('./data/diagnoses.csv', function(error, csv){
		var dropDown = d3.select('#drgSelect');

		csv.unshift({code: "All", description: "All DRGs"});

		dropDown.selectAll('option')
		.data(csv).enter().append('option')
		.attr("value", function(d){ return d.code;})
		.text(function(d){return d.code + " - " + d.description;});
	});

    //this can just be hardcoded, will always init at drg all 
	d3.csv('./data/national/DRG-All.csv', function(error, csv){
		var chartMain = d3.select("#chartMain")
		.attr({
			width: svgTemp.w
		});
		
		chartMain.append("g")
		.classed("barChart", true);

        chartMain.append("g")
        .classed("keyLabels", true);

		chartMain.call(drawChart, csv);
	});
}

//return the directory to go to by the travelPath and the drg passed in
function getFilePath(drgCode){
    var pathOut = './data/national/';

    switch (travelPath.length){
        case 1 : break; //national level
        case 2 : pathOut = pathOut + travelPath[1] + "/"; //state level
                 break;
        case 3 : pathOut = pathOut + travelPath[1] + "/" + travelPath[2] + "/"; //city level
                 break;
        case 4 : pathOut = pathOut + travelPath[1] + "/" + travelPath[2] + "/providers/" + travelPath[3].id + "-DRGs.csv"; //provider level
                 break;
    }

    //fileName part - provider level does not seperate by DRG
    if(travelPath.length < 4){
        pathOut = pathOut + "DRG-" + drgCode + ".csv";
    }
    console.log("path: " + pathOut);
    return pathOut;
}

//redrawChart is ran with drill downs, the initial load, and drg changes.
//it appends onto travelLevel and then goes to that level
function redrawChart(drgCode, travelLevel){
    if (travelLevel !== undefined){
        travelPath.push(travelLevel);
    }
    
	d3.csv(getFilePath(drgCode), function(error, csv){
		d3.select("#chartMain").call(drawChart, csv);
	});
}

//goBack is ran with build ups to return to a previous path
//it removes items out of travel path and then goes to that level
function goBack(backLabel){
    //this isn't a foolproof way to do this, but I checked and all providers have different citys and states and names
    var drgCode = $("#drgSelect").children(':selected').val();

    //find the travel path level with the label, remove everything after it
    var selectedIdx = travelPath.indexOf(backLabel);
    travelPath = travelPath.slice(0, selectedIdx+1);

    d3.csv(getFilePath(drgCode), function(error, csv){
        d3.select("#chartMain").call(drawChart, csv);
    });
}

//this generates the HTML that makes up the travel path
function travelPathToString(){
    var strOut = "";
    for (var i = 0; i < travelPath.length; i++) {
        //turn all previous path entries into links to go back, otherwise it's just text
        if (i < travelPath.length - 1) {
            strOut = strOut + " > <a href=\"javascript:void(0)\" onclick=\"goBack('" + travelPath[i] + "');\">" + travelPath[i] + "</a>";
        }
        else {
            strOut = strOut + " > " + (typeof(travelPath[i]) == "object" ?  travelPath[i].name : travelPath[i]);
        }
    }

    return strOut.substring(3);
}

//the main draw function - handles enter, update and delete
function drawChart(svg, data) {
    d3.select("#naviPath").html(travelPathToString());

    svg.attr("height", (data.length * (barSpec.spacing + barSpec.h)) + chartSpec.insideOffset);

    data.map(function(d){
        d.avgCoveredCharges = Number(d.avgCoveredCharges);
        d.averagePayments = Number(d.averagePayments);
    });

    var maxValue = d3.max(data, function(d){return d.avgCoveredCharges;});
    var avgValue = d3.mean(data, function(d){return d.avgCoveredCharges;});
    var xScale = d3.scale.linear().range([0, chartSpec.w]).domain([0, maxValue]);

	//chart encompasses the bars, bar value labels, and lines of the chart, everything that starts at value 0
	//the key labels are to the left of that so they do not count
	var chart = svg.selectAll("g.barChart").attr("transform", "translate(0, " + chartSpec.insideOffset + ")");
    var keyLabels = svg.selectAll("g.keyLabels").attr("transform", "translate(0, " + chartSpec.insideOffset + ")");

    //this varies depending on where we are data-wise
    var keyName;

    switch (travelPath.length){
        case 1 : keyName = 'state'; break;
        case 2 : keyName = 'city'; break;
        case 3 : keyName = 'providerName'; break;
        case 4 : keyName = 'description'; break;
    }

	var rects = chart.selectAll("rect.bar").data(data, function(d){return d[keyName];});
    var barValLabel = chart.selectAll("text.barValueLabel").data(data, function(d){return d[keyName];});
	var labels = keyLabels.selectAll("text.barLabel").data(data, function(d){ return d[keyName];});

    //add/edit max and avg lines
    //if the two are the same, insert empty array so everything is removed
    var avgArr = maxValue == avgValue ? [] : [avgValue];
    var maxArr = maxValue == avgValue ? [] : [maxValue];
    var avgLine = chart.selectAll("#avgLine").data(avgArr);
    var avgLineLabel = svg.selectAll("#avgLineLabel").data(avgArr);
    var maxLine = chart.selectAll("#maxLine").data(maxArr);
    var maxLineLabel = svg.selectAll("#maxLineLabel").data(maxArr);

	//remove old data
	rects.exit()
		.transition()
		.duration(transitionSpeed)
		.attr({
			width: 0
		}).remove();

	//just remove it, no need for fanciness
    barValLabel.exit().remove();

	labels.exit()
		.transition()
		.duration(transitionSpeed)
		.attr({
			opacity: 0
		}).remove();

	//maxLine and avgLine do not show if maxValue and avgValue are the same (data is only one element)
    avgLine.exit().remove();
    avgLineLabel.exit().remove();
    maxLine.exit().remove();
    maxLineLabel.exit().remove();

	//add/edit new labels - write them first as non visible to get the height and length, then position them based on their size
	var newLabels = labels.enter().append("text")
		.classed('barLabel', true)
        .attr({
          "font-size": chartSpec.label.size,
          "dominant-baseline": "central",
          "text-anchor": "end",
          id : function(d,i){ return "lbl" + i;},
          "fill" : chartSpec.label.color,
          opacity: 0
        })
        .text(function(d){return d[keyName];});

	var chartStart = d3.max(labels[0], function(d){return d.getComputedTextLength();}) + 8;
        
    labels.transition()
    .duration(transitionSpeed)
    .delay(transitionSpeed)
    .attr({
      x: chartStart - 4,
      y: function (d, i) {return (i * (barSpec.h + barSpec.spacing)) + (barSpec.h/2);}
    });
     
    newLabels.transition()
    .duration(transitionSpeed)
    .delay(transitionSpeed)
    .attr({
		opacity: 1
    });

    //add/update rectangles
	rects.enter().append("rect")
		.classed('bar', true)
		.attr({
			x: chartStart,
			y: function(d,i){ return i*(barSpec.h + barSpec.spacing); },
			width: 0,
			height : barSpec.h,
			fill: barSpec.fill
		})        
        .on('mouseover', function(d, i){
          d3.select(this)
            .attr("fill", barSpec.moFill);

          d3.select("#lbl" + i)
            .attr("font-weight", "bold");
        })
        .on('mouseout', function(d, i){
          d3.select(this)
            .attr("fill", barSpec.fill);

           d3.select("#lbl" + i)
            .attr("font-weight", "normal");
        })
        .on('click', function(d){
            if (travelPath.length < 4) {
                redrawChart($("#drgSelect").children(':selected').val(), keyName == "providerName" ? {id: d.providerNationalID, name: d.providerName }  : d[keyName]);
            }
        });

	//update data
	//grows the bar out to the width (inits to 0)
	rects.transition()
		.duration(transitionSpeed)
		.delay(transitionSpeed)
		.attr({
			y: function(d,i){ return i*(barSpec.h + barSpec.spacing); },
			width : function(d) { return xScale(d.avgCoveredCharges);}
		});

    //bar value labels
    barValLabel.enter()
        .append('text')
        .classed('barValueLabel', true)
        .attr({
          "font-size": chartSpec.label.size,
          "dominant-baseline": "middle",
          "text-anchor": "end",
          id : function(d,i){ return "vLbl" + i;},
          "fill" : '#000',
          'opacity': 1,
          x: chartStart,
          y: function (d, i) {return (barSpec.h/2) + (i * (barSpec.h + barSpec.spacing)) + 1;}
        }).text("$0");

    barValLabel.transition().duration(transitionSpeed).delay(transitionSpeed)
         .tween("text", function(d) {
            var i = d3.interpolate(this.textContent.replace(/\D/g,''), d.avgCoveredCharges);
            return function(t) {
                this.textContent = '$' + commaSeparateNumber(Math.round(i(t)));
            };
        })
        .attr({
          x: function (d) { 
            //if you try to get the size of this, it will only return the initial $0 and there is no way to calculate string length without drawing it
            //so we draw it secretly, get the size then remove it
            var tempSizeGetter = svg.append("text").attr({ "font-size": chartSpec.label.size}).text('$' + commaSeparateNumber(d.avgCoveredCharges));
            var endSize = tempSizeGetter[0][0].getComputedTextLength() + 5;
            tempSizeGetter.remove();

            if (endSize > xScale(d.avgCoveredCharges)){
                return chartStart + (xScale(d.avgCoveredCharges) * 2) + (endSize - xScale(d.avgCoveredCharges));
            }
            else {
                return chartStart + xScale(d.avgCoveredCharges) - 5;
            }
          },
          y: function (d, i) {return (barSpec.h/2) + (i * (barSpec.h + barSpec.spacing)) + 1;}
        });

    //avgLine add and update
    avgLine.enter().append("line")
      .attr({
        x1: chartStart,
        y1: 0,
        x2: chartStart,
        y2: (data.length * (barSpec.h + barSpec.spacing)) - barSpec.spacing,
        id: 'avgLine',
        opacity: 1
      })
      .style({
        stroke: "#F3AF00",
        'stroke-width': 1,
        'stroke-dasharray': ("6, 5")
      });

    avgLine.transition().duration(transitionSpeed).delay(transitionSpeed)
      .attr({
        x1: function(d){return chartStart + xScale(d);},
        y1: 0,
        x2: function(d){return chartStart + xScale(d);},
        y2: (data.length * (barSpec.h + barSpec.spacing)) - barSpec.spacing 
      });

    avgLine.moveToFront();

    //avgLineLabel add and update
    avgLineLabel.enter().append("text")
        .attr({
            x: chartStart,
            y:  20,
            id: "avgLineLabel",
            'text-anchor' : "middle"
        })
        .text("$0");

    avgLineLabel.transition().duration(transitionSpeed).delay(transitionSpeed)
         .tween("text", function(d) {
            var i = d3.interpolate(this.textContent.replace(/\D/g,''), avgValue);
            return function(t) {
                this.textContent = 'Average: $' + commaSeparateNumber(Math.round(i(t)));
            };
        })
        .attr({
          x: function (d, i) {return chartStart + xScale(avgValue);}
        });

    //maxLine add and update
    maxLine.enter().append("line")
      .attr({
        x1: chartStart,
        y1: 0,
        x2: chartStart,
        y2: (data.length * (barSpec.h + barSpec.spacing)) - barSpec.spacing,
        id: 'maxLine',
        opacity: 1
      })
      .style({
        stroke: "#000000",
        'stroke-width': 1
      });

    maxLine.transition().duration(transitionSpeed).delay(transitionSpeed)
      .attr({
        x1: function(d){return chartStart + xScale(d);},
        y1: 0,
        x2: function(d){return chartStart + xScale(d);},
        y2: (data.length * (barSpec.h + barSpec.spacing)) - barSpec.spacing 
      });

    //maxLineLabel add and update
    maxLineLabel.enter().append("text")
        .attr({
            x: chartStart,
            y:  20,
            id: "maxLineLabel",
            'text-anchor' : "middle"
        })
        .text("$0");

    maxLineLabel.transition().duration(transitionSpeed).delay(transitionSpeed)
         .tween("text", function(d) {
            var i = d3.interpolate(this.textContent.replace(/\D/g,''), maxValue);
            return function(t) {
                this.textContent = 'Max: $' + commaSeparateNumber(Math.round(i(t)));
            };
        })
        .attr({
          x: function (d, i) {return chartStart + xScale(maxValue);}
        });
}

//utility functions
d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

function commaSeparateNumber(val){
  return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}