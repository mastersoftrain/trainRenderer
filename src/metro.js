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
    constructor(name, id = undefined, metroLine = undefined, coord = { x: 0, y: 0 }, pathCoord = {x: 0, y: 0}) {
        this._name = name;
        this._coord = coord;
        this._pathCoord = pathCoord;
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

    get pathCoord(){
        return this._pathCoord;
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

var transform = null;

function render(nodes) {
    var isEditMode = false;
    let neighborsOfNodes = [];
    for (let i = 0; i < nodes.length; i++) {
        for (let j = 0; j < nodes[i].neighbors.length; j++) {

            if (neighborsOfNodes.find(pair => pair[0] === nodes[i].neighbors[j] && pair[1] === nodes[i]))
                continue;
            neighborsOfNodes.push([nodes[i], nodes[i].neighbors[j]]);
        }
    }

    let gridData = [];
    for (let x = 0; x < 1500; x += 15) {
        gridData.push([
            { x: x, y: 0 },
            { x: x, y: 1000 }
        ]);
    }
    for (let y = 0; y < 1000; y += 15) {
        gridData.push([
            { x: 0, y: y },
            { x: 1500, y: y }
        ]);
    }

    let lineGenerator = d3
        .line()
        .x(function (d) {
            return d.x;
        })
        .y(function (d) {
            return d.y;
        })
        .curve(d3.curveBundle.beta(1));

    let svgContainer = d3
        .select("#metro")
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .call(d3.zoom().on("zoom", function () {
            svgContainer.attr("transform", d3.event.transform)
            transform = d3.event.transform;
        }))
        .append("g")
        .on("contextmenu", function (d) {
            d3.event.preventDefault();
        })

    if (transform) {
        svgContainer.attr("transform", transform)
    }

    let svgGrids = svgContainer
        .selectAll("grids")
        .data(gridData)
        .enter()

    let gridAttributes = svgGrids
        .append("path")
        .attr("d", function (grid) {
            return lineGenerator([grid[0], grid[1]]);
        })
        .attr("stroke-width", 1)
        .attr("stroke", "black")
        .style("stroke-opacity", 0.1)

    let svgLines = svgContainer
        .selectAll("lines")
        .data(neighborsOfNodes)
        .enter()

    let lineAttributes = svgLines
        .append("path")
        .attr("d", function (neighborsOfNode) {
            return lineGenerator([neighborsOfNode[0].coord, neighborsOfNode[0].pathCoord, neighborsOfNode[1].coord]);
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

    let svgCoordSelector = svgContainer
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 1500)
        .attr("height", 1000)
        .attr("fill-opacity", "0")
        .on("contextmenu", function (d) {
            if (isEditMode) {
                let mouseCoord = d3.mouse(this);
                let gridCoord = {
                    x: Math.round(mouseCoord[0] / 15) * 15,
                    y: Math.round(mouseCoord[1] / 15) * 15
                }

                let param_xy = {};
                let currentConfig = selected[selected.length - 1];

                if (selected[selected.length - 1]) {
                    param_xy.id = currentConfig.id;
                    param_xy.coord_x = gridCoord.x;
                    param_xy.coord_y = gridCoord.y;
                    axios.post("http://ec2-54-180-115-171.ap-northeast-2.compute.amazonaws.com:3000/editor", param_xy)
                        .then(function (response) {
                            if (response.status === 200) {
                                currentConfig.coord.x = gridCoord.x;
                                currentConfig.coord.y = gridCoord.y;
                                displayConfig(currentConfig);
                                let msvg = document.querySelector("#metro > svg");
                                if (msvg) {
                                    msvg.remove();
                                }
                                selected = []
                                render(selectedAll)
                                console.log(response);
                            }
                        })
                        .catch(function (error) {
                            console.log(error);
                        });
                }
            } else {
                isEditMode = false;
                displayConfig(null);
            }
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
        .on("click", function (d, i) {
            if (isEditMode) {
                isEditMode = false;
                selected = []
                displayConfig(null);
            } else {
                selected = []
                selected.push(nodes[i])
                let lastSelected = selected[selected.length - 1];
                displayConfig(lastSelected);
                isEditMode = true;
            }
        })
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