graphOutputBinding = new Shiny.OutputBinding();
graphOutputBinding.find = function(scope) {
    return $(scope).find(".graph-output");
};

graphOutputBinding.renderValue = function(el, data) {
    initContainer(el);
    loadGraph(el, data);
}

Shiny.outputBindings.register(graphOutputBinding, "alserg.graphOutputBinding");


jsOutputBinding = new Shiny.OutputBinding();
jsOutputBinding.find = function(scope) {
    return $(scope).find(".js-output");
};

jsOutputBinding.renderValue = function(el, data) {
    eval(data);
}

Shiny.outputBindings.register(jsOutputBinding, "alserg.jsOutputBinding");


positiveFCScale = d3.scale.linear().clamp(true).domain([0,2]).range(["#cccccc","#ff0000"]);
negativeFCScale = d3.scale.linear().clamp(true).domain([0,-2]).range(["#cccccc","#00ff00"]);
function getColor(d) {
    if (d.logFC === parseFloat(d.logFC)) {
        if (d.logFC >= 0) {
            return positiveFCScale(d.logFC);
        } else {
            return negativeFCScale(d.logFC);
        }
    }
    return "#00acad";
}

pvalScale = d3.scale.linear().clamp(true).domain([0, -100]).range([8, 20]);
function getSize(d) {
    if (d.logPval === parseFloat(d.logPval)) {
        return pvalScale(d.logPval);
    }
    return pvalScale(0);
}

function initContainer(container) {
    container.innerHTML = "";
    var width = $(container).width(),
        height = $(window).height();



    container.svg = d3.select(container).append("svg")
        .append("g");


    container.svg
        .append("rect")
        .attr("class", "overlay")
        .attr("width", "1000")
        .attr("height", "1000");

    function sizeChange() {
        var width = container.width(),
            height = width.height();
        d3.select("svg")
            .attr("width", width)
            .attr("height", height);
        d3.select("rect")
            .attr("width", width)
            .attr("height", height);
    }
    // $(container).resize(sizeChange);

    function zoomed() {
        container.svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }

    container.zoom = d3.behavior.zoom().scaleExtent([1/8, 8]).on("zoom", zoomed);

    container.svg = container.svg.call(container.zoom)
      .append("g");

}

$(".graph-output").each(function(i) { 
    this.onload = function() { 
        initContainer(this);
    };
})

if (typeof String.prototype.startsWith != 'function') {
  String.prototype.startsWith = function (str){
    return this.slice(0, str.length) == str;
  };
}

$(document).ready(function() {
    var hash = document.location.hash;
    var prefix="#tab-";
    if (hash) {
        if (hash.startsWith(prefix)) {
            hash = hash.replace(prefix, "#");
        }
    } else {
        hash = "#home";
    }
    document.location.hash = hash;
    $('.nav-tabs a[href='+hash.replace("#", prefix)+']').tab('show') ;

    // Change hash for page-reload
    $('.nav-tabs a').on('shown', function (e) {
        window.location.hash = e.target.hash.replace(prefix, "#");
    })
})

$(window).on("popstate", function() {
    var hash = document.location.hash;
    var prefix="#tab-";
    if (hash) {
        if (hash.startsWith(prefix)) {
            hash = hash.replace(prefix, "#");
        }
        $('.nav-tabs a[href='+hash.replace("#", prefix)+']').tab('show') ;
    } else {
        $('.nav-tabs a[href="#tab-home"]').tab('show') ;

    }
})

window.onload = function() {

    // d3.select(window).on("resize", sizeChange);

    // sizeChange();

    $(".graph-output").each(function(i) { initContainer(this) })
    // initContainer($(container));

    // $('.help-popover').popover();
    $('.help-tooltip').tooltip({
        placement: "right",
        delay: { show: 0, hide: 0 }
    });
}

function loadGraph(container, graph) {

    var width = $(container).width(),
        height = $(container).height();

    container.zoo


    container.force = d3.layout.force()
        .nodes(graph.nodes)
        .links(graph.links)
        .charge(-300)
        .linkDistance(100)
        .size([width, height])
        .start();

    container.drag = container.force.drag()
        .on("dragstart", function(d) { d3.event.sourceEvent.stopPropagation(); } );

    container.svg.text(null);

    var svg = container.svg;

    var link = svg.selectAll(".link")
        .data(graph.links)
        .enter().append("line")
        .attr("class", "link")
        .style("stroke", getColor)
        .style("stroke-width", getSize)
        .style("stroke-dasharray", function(d) { if (d.rptype == "trans") return "5,5"; else return ""; });  


    var edgepaths = svg.selectAll(".edgepath")
        .data(graph.links)
        .enter()
        .append('path')
        .attr({'d': function(d) {return 'M '+d.source.x+' '+d.source.y+' L '+ d.target.x +' '+d.target.y},
               'class':'edgepath',
               'fill-opacity':0,
               'stroke-opacity':0,
               'fill':'blue',
               'stroke':'red',
               'id':function(d,i) {return 'edgepath'+i}})
        .style("pointer-events", "none");

    var edgelabels = svg.selectAll(".edgelabel")
        .data(graph.links)
        .enter()
        .append('text')
        .style("pointer-events", "none")
        .attr('class', 'edgelabel')
        .style('fill', 'black')
        .style("font-size", getSize);

    edgelabels.append('textPath')
        .attr('xlink:href',function(d,i) {return '#edgepath'+i})
        .style("pointer-events", "none")
        .attr('text-anchor', 'middle')
        .attr('startOffset', '50%')
        .attr('alignment-baseline', 'central')
        .text(function(d,i){return d.label});

    var node = svg.selectAll(".node")
        .data(graph.nodes)
        .enter()
        .append("g")
        .attr("class", "node")
        .call(container.drag);

    node.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", getSize)
        .style("fill", getColor);

    node.append("text")
        .attr("x", 0)
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .style("font-size", getSize)
        .text(function(d) { return d.label });

    container.force.on("tick", function() {
        link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

        edgepaths.attr('d', function(d) { var path='M '+d.source.x+' '+d.source.y+' L '+ d.target.x +' '+d.target.y;
                                           //console.log(d)
                                           return path});       

        edgelabels.attr('transform',function(d,i){
            if (d.target.x<d.source.x){
                bbox = this.getBBox();
                rx = bbox.x+bbox.width/2;
                ry = bbox.y+bbox.height/2;
                return 'rotate(180 '+rx+' '+ry+')';
                }
            else {
                return 'rotate(0)';
                }
        });
    });
}

function showFastHeinzAndMWCS(shouldShow) {
    if (shouldShow) {
        $("option[value='fastHeinz']").removeAttr("disabled");
        $("option[value='mwcs']").removeAttr("disabled");
    } else {
        $("option[value='fastHeinz']").attr("disabled", "disabled");
        $("option[value='mwcs']").attr("disabled", "disabled");
        if ($("#solver").val() == "fastHeinz" || 
            $("#solver").val() == "mwcs") {
            $("#solver").val("heinz");
        }
    }
}
