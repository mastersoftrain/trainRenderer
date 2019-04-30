const MetroLines = Object.freeze({
    "1호선": Symbol("1호선"),
    "2호선": Symbol("2호선"),
    "3호선": Symbol("3호선"),
    "4호선": Symbol("4호선"),
    "5호선": Symbol("5호선"),
    "6호선": Symbol("6호선"),
    "7호선": Symbol("7호선"),
    "8호선": Symbol("8호선"),
    "9호선": Symbol("9호선")
});

const MetroColors = Object.freeze({
    [MetroLines["1호선"]]: "#0D3692",
    [MetroLines["2호선"]]: "#33A23D",
    [MetroLines["3호선"]]: "#FE5B10",
    [MetroLines["4호선"]]: "#32A1C8",
    [MetroLines["5호선"]]: "#8B50A4",
    [MetroLines["6호선"]]: "#C55C1D",
    [MetroLines["7호선"]]: "#54640D",
    [MetroLines["8호선"]]: "#F51361",
    [MetroLines["9호선"]]: "#AA9872"
});

class Random {
    static generate() {
        return Math.random();
    }

    static range(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

class Index {
    static convert1DTo2D(index, width) {
        return [parseInt(index % width), parseInt(index / width)]
    }

    static convert2Dto1D(x, y, width) {
        return y * width + x;
    }

    static isInBound(x, y, height, width) {
        return x >= 0 && y >= 0 && y < height && x < width;
    }
}

class Node {
    constructor(name) {
        this._name = name;
        this._coord = {
            x: 0,
            y: 0
        }
        this._id;
        this._metroLine;
        this._jam;
        this._neighbors = [];
    }

    get name() {
        return this._name;
    }

    set name(newName) {
        this._name = newName;
    }

    get id() {
        return this._id;
    }

    set id(newId) {
        this._id = newId;
    }

    get coord() {
        return this._coord;
    }

    set coord(newCoord) {
        this._coord.x = newCoord[0];
        this._coord.y = newCoord[1];
    }

    get metroLine() {
        return this._metroLine;
    }

    set metroLine(newMetroLine) {
        this._metroLine = newMetroLine;
    }

    get metroColor() {
        return MetroColors[this._metroLine];
    }

    get jam() {
        return this._jam;
    }

    set jam(newJam) {
        this._jam = newJam;
    }

    get neighbors() {
        return this._neighbors;
    }

    addNeighbor(newNode) {
        this._neighbors.push(newNode);
    }
}

var nodes = [];
var width = 10;
var height = 9;

for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
        var index = Index.convert2Dto1D(x, y, width);
        var node = new Node();
        node.name = (y + 1) + "호선" + " - " + index;
        node.metroLine = MetroLines[(y + 1) + "호선"];
        node.coord = [(x + 1) * 100, (y + 1) * 100];
        node.jam = Random.range(1, 10);
        nodes.push(node);
    }
}

for (var i = 0; i < nodes.length; i++) {
    var coord = Index.convert1DTo2D(i, width);
    var x = coord[0];
    var y = coord[1];

    var neighbors = [];

    var neighborIndex = Index.convert2Dto1D(x + 1, y, width);
    if (Index.isInBound(x + 1, y, height, width)) {
        neighbors.push(nodes[neighborIndex]);
    }

    neighborIndex = Index.convert2Dto1D(x + 1, y - 1, width);
    if (Index.isInBound(x + 1, y - 1, height, width)) {
        neighbors.push(nodes[neighborIndex]);
    }

    neighborIndex = Index.convert2Dto1D(x + 1, y + 1, width);
    if (Index.isInBound(x + 1, y + 1, height, width)) {
        neighbors.push(nodes[neighborIndex]);
    }

    neighborIndex = Index.convert2Dto1D(x - 1, y, width);
    if (Index.isInBound(x - 1, y, height, width)) {
        neighbors.push(nodes[neighborIndex]);
    }

    neighborIndex = Index.convert2Dto1D(x - 1, y - 1, width);
    if (Index.isInBound(x - 1, y - 1, height, width)) {
        neighbors.push(nodes[neighborIndex]);
    }

    neighborIndex = Index.convert2Dto1D(x - 1, y + 1, width);
    if (Index.isInBound(x - 1, y + 1, height, width)) {
        neighbors.push(nodes[neighborIndex]);
    }

    neighborIndex = Index.convert2Dto1D(x, y - 1, width);
    if (Index.isInBound(x, y - 1, height, width)) {
        neighbors.push(nodes[neighborIndex]);
    }

    neighborIndex = Index.convert2Dto1D(x, y + 1, width);
    if (Index.isInBound(x, y + 1, height, width)) {
        neighbors.push(nodes[neighborIndex]);
    }

    var randomNeighborNode = neighbors[Random.range(0, neighbors.length - 1)];
    nodes[i].addNeighbor(randomNeighborNode);
}

var nodeToNeighbors = [];

for (var i = 0; i < nodes.length; i++) {
    for (var j = 0; j < nodes[i].neighbors.length; j++) {

        if (nodeToNeighbors.find(pair => pair[1] === nodes[i]))
            continue;
        for (var k = 0; k < nodes[i].neighbors[j].jam; k++) {
            nodeToNeighbors.push([nodes[i], nodes[i].neighbors[j]]);
        }
    }
}

function render() {

    var lineGenerator = d3
        .line()
        .x(function (d) { return d.x; })
        .y(function (d) { return d.y; })
        .curve(d3.curveBasis)

    var svgContainer = d3
        .select("#metro")
        .append("svg")
        .attr("width", 1500)
        .attr("height", 900)

    var svgLines = svgContainer
        .selectAll("lines")
        .data(nodeToNeighbors)
        .enter()

    var lineAttributes = svgLines
        .append("path")
        .attr("d", function (nodeToNeighbor) { return lineGenerator([nodeToNeighbor[0].coord, nodeToNeighbor[1].coord]); })
        .attr("stroke-width", 4)
        .attr("stroke", function (nodeToNeighbor) { return nodeToNeighbor[0].metroColor; })
        .attr("fill", "none")


    var lineJamAttributes = svgLines
        .append("path")
        .attr("d", function (nodeToNeighbor) {
            var lineData = [];
            var startNode = nodeToNeighbor[0];
            var startCoord = startNode.coord;
            var endCoord = nodeToNeighbor[1].coord;

            var noiseAmount = 10;
            for (var i = noiseAmount; i >= 0; i--) {
                var newCoord = {};
                var theta = i / noiseAmount;
                newCoord["x"] = theta * startCoord.x + (1 - theta) * endCoord.x;
                newCoord["y"] = theta * startCoord.y + (1 - theta) * endCoord.y;

                if (i != 0 && i != noiseAmount) {
                    newCoord.x += Random.range(-8, 8);
                    newCoord.y += Random.range(-8, 8);
                }
                lineData.push(newCoord);
            }

            return lineGenerator(lineData);
        })
        .attr("stroke-width", 1)
        .attr("stroke", function (nodeToNeighbor) { return nodeToNeighbor[0].metroColor; })
        .attr("fill", "none")
        .style("stroke-opacity", 0.9)
        .transition()
        .duration(Random.range(750, 3000))
        .attrTween("stroke-dashoffset", tweenDashOffset)
        .attrTween("stroke-dasharray", tweenDash)
        .ease(d3.easePolyIn)
        .on("start", animateLineJam)

    var svgNodes = svgContainer
        .selectAll("nodes")
        .data(nodes)
        .enter()

    var nodeAttributes = svgNodes
        .append("circle")
        .attr("cx", function (node) { return node.coord.x; })
        .attr("cy", function (node) { return node.coord.y; })
        .attr("r", 10)
        .attr("fill", function (node) { return node.metroColor; })

    var nodeInsideCircleAttributes = svgNodes
        .append("circle")
        .attr("cx", function (node) { return node.coord.x; })
        .attr("cy", function (node) { return node.coord.y; })
        .attr("r", 6)
        .attr("fill", "white")

    var nodeNameAttributes = svgNodes
        .append("text")
        .text(function (node) { return node.name; })
        .attr("x", function (node) { return node.coord.x; })
        .attr("y", function (node) { return node.coord.y - 15; })
        .attr("font-family", "Andale Mono")
        .attr("font-size", "12px")
        .attr("fill", function (node) { return node.metroColor; })
        .attr("text-anchor", "middle")


}

function tweenDash() {
    var l = this.getTotalLength(),
        i = d3.interpolateString("0," + l, l + "," + l);
    return function (t) { return i(t); };
}

function tweenDashOffset() {
    var l = this.getTotalLength(),
        i = d3.interpolateString(0, l);
    return function (t) { return i(t); };
}

function tweenDashReverse() {
    var l = this.getTotalLength(),
        i = d3.interpolateString(l + "," + l, "0," + l);
    return function (t) { return i(t); };
}

function animateLineJam(path) {
    d3.active(this)
        .transition()
        .duration(Random.range(750, 3000))
        .attrTween("stroke-dasharray", tweenDash)
        .on("start", animateLineJam)
}