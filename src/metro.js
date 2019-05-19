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
    constructor(name, id = undefined, metroLine = undefined, coord = { x: 0, y: 0 }, pathCoord = { x: 0, y: 0 }) {
        this._name = name;
        this._coord = coord;
        this._pathCoord = pathCoord;
        this._id = id;
        this._metroLine = metroLine;
        this._jam;
        this._neighbors = [];
        this._gScore = 0;
        this._hScore = 0;
        this._parent;
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

    get pathCoord() {
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

    addNeighbor(newNeighborObj) {
        this._neighbors.push(newNeighborObj);
    }

    get gScore() {
        return this._gScore;
    }

    set gScore(newGScore) {
        this._gScore = newGScore;
    }

    get hScore() {
        return this._hScore;
    }

    set hScore(newHScore) {
        this._hScore = newHScore;
    }

    get fScore() {
        return this._gScore + this._hScore;
    }

    get parent() {
        return this._parent;
    }

    set parent(newParent) {
        this._parent = newParent;
    }
}

function manhattanDistance(coord0, coord1) {
    var d1 = Math.abs(coord1.x - coord0.x);
    var d2 = Math.abs(coord1.y - coord0.x);
    return d1 + d2;
}

function findPath(startNode, endNode) {
    let openList = [];
    let closeList = []

    startNode.parent = null;
    openList.push(startNode);

    while (openList.length > 0) {

        let currentNode = openList[0];
        for (let i = 0; i < openList.length; i++) {
            let openNode = openList[i];
            if (openNode.fScore < currentNode.fScore)
                currentNode = openNode;
        }

        if (currentNode === endNode) {
            let pathCurrent = currentNode;
            let path = [];

            while (pathCurrent.parent) {
                path.push(pathCurrent);
                pathCurrent = pathCurrent.parent;
            }
            path.push(startNode);
            return path.reverse();
        }

        openList = openList.filter(node => node !== currentNode);
        closeList.push(currentNode);
        let neighbors = currentNode.neighbors;

        for (let i = 0; i < neighbors.length; i++) {
            let neighborNode = neighbors[i].node;
            let neighborcost = neighbors[i].cost;

            if (closeList.includes(neighborNode))
                continue;

            let gScore = currentNode.gScore + neighborcost;
            let gScoreIsBest = false;

            if (!openList.includes(neighborNode)) {
                gScoreIsBest = true;
                neighborNode.hScore = manhattanDistance(neighborNode.coord, endNode.coord);
                openList.push(neighborNode);
            }
            else if (gScore < neighborNode.gScore) {
                gScoreIsBest = true;
            }

            if (gScoreIsBest) {
                neighborNode.parent = currentNode;
                neighborNode.gScore = gScore;
            }
        }
    }
}

var transform = null;

function render(nodes) {
    var isEditMode = false;
    var isPathMode = false;
    let neighborsOfNodes = [];
    for (let i = 0; i < nodes.length; i++) {
        for (let j = 0; j < nodes[i].neighbors.length; j++) {

            if (neighborsOfNodes.find(pair => pair[0] === nodes[i].neighbors[j].node && pair[1] === nodes[i]))
                continue;

            if(nodes[i].name == nodes[i].neighbors[j].node.name)
                continue;

            neighborsOfNodes.push([nodes[i], nodes[i].neighbors[j].node]);
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

    let zoom = d3.zoom()

    let svgContainer = d3
        .select("#metro")
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .call(zoom.transform, d3.zoomIdentity.translate(transform ? transform.x : 0, transform ? transform.y : 0).scale(transform ? transform.k : 1))
        .call(zoom
            .on("zoom", function () {
                svgContainer.attr("transform", d3.event.transform)
                transform = d3.event.transform;
            }))
        .append("g")
        .on("contextmenu", function (d) {
            d3.event.preventDefault();
        })

    if (transform) {
        svgContainer.call(zoom.transform, d3.zoomIdentity.translate(transform.x, transform.y).scale(transform.k));
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
                    param_xy.column = "coord";
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
            }
            else if (isPathMode) {
                let mouseCoord = d3.mouse(this);
                let gridCoord = {
                    x: Math.round(mouseCoord[0] / 15) * 15,
                    y: Math.round(mouseCoord[1] / 15) * 15
                }

                let param_xy = {};
                let currentConfig = selected[selected.length - 1];

                if (selected[selected.length - 1]) {
                    param_xy.column = "coord2";
                    param_xy.id = currentConfig.id;
                    param_xy.coord_x = gridCoord.x;
                    param_xy.coord_y = gridCoord.y;
                    axios.post("http://ec2-54-180-115-171.ap-northeast-2.compute.amazonaws.com:3000/editor", param_xy)
                        .then(function (response) {
                            if (response.status === 200) {
                                currentConfig.pathCoord.x = gridCoord.x;
                                currentConfig.pathCoord.y = gridCoord.y;
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
            }
            else {
                isPathMode = false;
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
                isPathMode = false;
                selected = []
                displayConfig(null);
            } else {
                selected = []
                selected.push(nodes[i])
                let lastSelected = selected[selected.length - 1];
                displayConfig(lastSelected);
                isEditMode = true;
                isPathMode = false;
            }
        })
        .on("contextmenu", function (d, i) {
            if (isPathMode) {
                d3.select(this)
                    .attr("cx", function (node) {
                        return node.coord.x;
                    })
                    .attr("cy", function (node) {
                        return node.coord.y;
                    })
                    .attr("r", 1.3)
                    .attr("fill", "white")

                displayConfig(null);
                selected = []
                isPathMode = false;
                isEditMode = false;
            } else {
                d3.select(this)
                    .attr("cx", function (node) {
                        return node.pathCoord.x;
                    })
                    .attr("cy", function (node) {
                        return node.pathCoord.y;
                    })
                    .attr("r", 3)
                    .attr("fill", "red")

                selected = []
                selected.push(nodes[i])
                let lastSelected = selected[selected.length - 1];
                displayConfig(lastSelected);
                isEditMode = false;
                isPathMode = true;
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