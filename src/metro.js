const MetroColors = Object.freeze({
    "1호선": "#0D3692",
    "2호선": "#33A23D",
    "3호선": "#FE5B10",
    "4호선": "#32A1C8",
    "5호선": "#8B50A4",
    "6호선": "#C55C1D",
    "7호선": "#54640D",
    "8호선": "#F51361",
    "9호선": "#AA9872"
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
    constructor(name, id = undefined, metroLine = undefined, coord = {
        x: 0,
        y: 0
    }) {
        this._name = name;
        this._coord = coord;
        this._id = id;
        this._metroLine = metroLine;
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

function render(nodes) {

    let neighborsOfNodes = [];
    for (let i = 0; i < nodes.length; i++) {
        for (let j = 0; j < nodes[i].neighbors.length; j++) {

            if (neighborsOfNodes.find(pair => pair[0] === nodes[i].neighbors[j] && pair[1] === nodes[i]))
                continue;
            neighborsOfNodes.push([nodes[i], nodes[i].neighbors[j]]);
        }
    }

    let lineGenerator = d3
        .line()
        .x(function (d) {
            return d.x;
        })
        .y(function (d) {
            return d.y;
        })
        .curve(d3.curveBasis)

    let svgContainer = d3
        .select("#metro")
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .call(d3.zoom().on("zoom", function () {
            svgContainer.attr("transform", d3.event.transform)
        }))
        .append("g")

    let svgLines = svgContainer
        .selectAll("lines")
        .data(neighborsOfNodes)
        .enter()

    let lineAttributes = svgLines
        .append("path")
        .attr("d", function (neighborsOfNode) {
            return lineGenerator([neighborsOfNode[0].coord, neighborsOfNode[1].coord]);
        })
        .attr("stroke-width", 3)
        .attr("stroke", function (neighborsOfNode) {
            return neighborsOfNode[0].metroColor;
        })
        .attr("fill", "none")


    let lineJamAttributes = svgLines
        .append("path")
        .attr("d", function (neighborsOfNode) {
            let lineData = [];
            let startNode = neighborsOfNode[0];
            let startCoord = startNode.coord;
            let endCoord = neighborsOfNode[1].coord;

            let noiseAmount = 10;
            for (let i = noiseAmount; i >= 0; i--) {
                let newCoord = {};
                let theta = i / noiseAmount;
                newCoord["x"] = theta * startCoord.x + (1 - theta) * endCoord.x;
                newCoord["y"] = theta * startCoord.y + (1 - theta) * endCoord.y;

                if (i != 0 && i != noiseAmount) {
                    newCoord.x += Random.range(-4, 4);
                    newCoord.y += Random.range(-4, 4);
                }
                lineData.push(newCoord);
            }

            return lineGenerator(lineData);
        })
        .attr("stroke-width", 0.6)
        .attr("stroke", function (neighborsOfNode) {
            return neighborsOfNode[0].metroColor;
        })
        .attr("fill", "none")
        .style("stroke-opacity", 0.9)
        .transition()
        .duration(Random.range(750, 3000))
        .attrTween("stroke-dashoffset", tweenDashOffset)
        .attrTween("stroke-dasharray", tweenDash)
        .ease(d3.easePolyIn)
        .on("start", animateLineJam)

    let svgNodes = svgContainer
        .selectAll("nodes")
        .data(nodes)
        .enter()

    let nodeAttributes = svgNodes
        .append("circle")
        .attr("cx", function (node) {
            return node.coord.x;
        })
        .attr("cy", function (node) {
            return node.coord.y;
        })
        .attr("r", 2)
        .attr("fill", function (node) {
            return node.metroColor;
        })

    let nodeInsideCircleAttributes = svgNodes
        .append("circle")
        .attr("cx", function (node) {
            return node.coord.x;
        })
        .attr("cy", function (node) {
            return node.coord.y;
        })
        .attr("r", 1.3)
        .attr("fill", "white")

    let nodeNameAttributes = svgNodes
        .append("text")
        .text(function (node) {
            return node.name;
        })
        .attr("x", function (node) {
            return node.coord.x;
        })
        .attr("y", function (node) {
            return node.coord.y - 15;
        })
        .attr("font-family", "Andale Mono")
        .attr("font-size", "9px")
        .attr("fill", function (node) {
            return node.metroColor;
        })
        .attr("text-anchor", "middle")
}

function tweenDash() {
    let l = this.getTotalLength(),
        i = d3.interpolateString("0," + l, l + "," + l);
    return function (t) {
        return i(t);
    };
}

function tweenDashOffset() {
    let l = this.getTotalLength(),
        i = d3.interpolateString(0, l);
    return function (t) {
        return i(t);
    };
}

function tweenDashReverse() {
    let l = this.getTotalLength(),
        i = d3.interpolateString(l + "," + l, "0," + l);
    return function (t) {
        return i(t);
    };
}

function animateLineJam(path) {
    d3.active(this)
        .transition()
        .duration(Random.range(750, 3000))
        .attrTween("stroke-dasharray", tweenDash)
        .on("start", animateLineJam)
}