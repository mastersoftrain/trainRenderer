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
        return d3.randomUniform()();
    }

    static rangeInt(min, max) {
        return Math.floor(d3.randomUniform(min, max)());
    }

    static range(min, max) {
        return d3.randomUniform(min, max)();
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

class Renderer {
    static instance;

    constructor() {
        if (Renderer.instance) return Renderer.instance;
        let self = this;
        this._gridSize = 50;
        this._nodes = [];
        this._gridData = [];
        this._isEditMode = false;
        this._isPathMode = false;
        this._onClick = null;
        this._currentSelection = null;
        this._neighborsOfNodes = [];
        this._zoom = d3.zoom().scaleExtent([0.3, 4]).translateExtent([[0, 0], [5000, 3500]]);
        this._lineGenerator = d3
            .line()
            .x(function (d) { return d.x * self._gridSize; })
            .y(function (d) { return d.y * self._gridSize; })
            .curve(d3.curveBundle.beta(1));
        this._congestionColors = d3.scaleLinear()
            .range(["#247BA0", "#70C1B3", "#B2DBBF", "#F3FFBD", "#FF1654"])
            .domain([0.0, 0.1, 0.2, 0.4, 1.0])
        this._svgContainer = d3
            .select("#metro")
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .call(this._zoom.transform, d3.zoomIdentity.translate(0, 0).scale(0.4))
            .call(this._zoom.on("zoom", function () { self._svgContainer.attr("transform", d3.event.transform) }))
            .on("contextmenu", function (d) { d3.event.preventDefault(); })
            .append("g")

        this._svgContainer.call(this._zoom.transform, d3.zoomIdentity.translate(0, 0).scale(0.4))

        this._svgBackgroundGroup = this._svgContainer.append("g");
        this._svgGridGroup = this._svgContainer.append("g");
        this._svgLineJamGroup = this._svgContainer.append("g");
        this._svgLineGroup = this._svgContainer.append("g");
        this._svgNodeGroup = this._svgContainer.append("g");
        this._svgInsideNodeGroup = this._svgContainer.append("g");
        this._svgNodeNameBackgroundGroup = this._svgContainer.append("g");
        this._svgNodeNameGroup = this._svgContainer.append("g");

        this._svgBackgroundGroup
            .append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 100 * self._gridSize)
            .attr("height", 70 * self._gridSize)
            .attr("fill-opacity", "0")
            .on("click", function (d) {
                self._currentSelection = null;
                if (self._onClick && typeof (self._onClick) === "function")
                    self._onClick(self._currentSelection);
            })

        this.setSelectionCallback(function callback(selection) { console.log(selection); })

        Renderer.instance = this;
    }

    get nodes() {
        return this._nodes;
    }

    set nodes(newNodes) {
        this._nodes = newNodes;
        this._neighborsOfNodes = [];
        for (let i = 0; i < newNodes.length; i++) {
            for (let j = 0; j < newNodes[i].neighbors.length; j++) {

                if (this._neighborsOfNodes.find(pair => pair[0] === newNodes[i].neighbors[j].node && pair[1] === newNodes[i]))
                    continue;

                if (newNodes[i].name == newNodes[i].neighbors[j].node.name)
                    continue;

                if (!this._nodes.find(node => node === newNodes[i].neighbors[j].node))
                    continue;

                this._neighborsOfNodes.push({
                    "pair": [newNodes[i], newNodes[i].neighbors[j].node],
                    "congestion": newNodes[i].neighbors[j].congestion
                });
            }
        }
    }

    get gridSize() {
        return this._gridSize;
    }

    set gridSize(newGridSize) {
        this._gridSize = newGridSize;
    }

    renderGrid(width, height) {
        let self = this;

        if (!this._gridData.length) {
            this._gridData = [];
            for (let x = 0; x < width; x += 1) {
                this._gridData.push([
                    { x: x, y: 0 },
                    { x: x, y: height }
                ]);
            }
            for (let y = 0; y < height; y += 1) {
                this._gridData.push([
                    { x: 0, y: y },
                    { x: width, y: y }
                ]);
            }
        }

        let svgGrids = this._svgGridGroup
            .selectAll("path")
            .data(this._gridData)

        svgGrids.exit().remove();

        svgGrids
            .enter()
            .append("path")
            .attr("d", function (grid) { return self._lineGenerator([grid[0], grid[1]]); })
            .classed("grid", true)
    }

    renderMetroLines() {
        let self = this;
        let svgLines = this._svgLineGroup
            .selectAll("path")
            .data(this._neighborsOfNodes)

        svgLines
            .exit()
            .style("opacity", 1)
            .transition()
            .duration(500)
            .delay(function (d, i) { return 3 * i })
            .attr("d", function (neighbor) {
                let lineCoords = JSON.parse(JSON.stringify([neighbor.pair[0].coord, neighbor.pair[0].pathCoord, neighbor.pair[1].coord]));
                for (let i = 0; i < lineCoords.length; i++) {
                    lineCoords[i].y = lineCoords[i].y + 1;
                }
                return self._lineGenerator(lineCoords);
            })
            .style("opacity", 0)
            .remove();

        svgLines
            .transition()
            .duration(500)
            .attr("d", function (neighbor) { return self._lineGenerator([neighbor.pair[0].coord, neighbor.pair[0].pathCoord, neighbor.pair[1].coord]); })
            .attr("stroke", function (neighbor) { return neighbor.pair[0].metroColor; })

        svgLines
            .enter()
            .append("path")
            .classed("line", true)
            .attr("stroke", function (neighbor) { return neighbor.pair[0].metroColor; })
            .attr("d", function (neighbor) {
                let lineCoords = JSON.parse(JSON.stringify([neighbor.pair[0].coord, neighbor.pair[0].pathCoord, neighbor.pair[1].coord]));
                for (let i = 0; i < lineCoords.length; i++) {
                    lineCoords[i].y = lineCoords[i].y - 1;
                }
                return self._lineGenerator(lineCoords);
            })
            .style("opacity", 0)
            .transition()
            .duration(500)
            .delay(function (d, i) { return 3 * i })
            .attr("d", function (neighbor) { return self._lineGenerator([neighbor.pair[0].coord, neighbor.pair[0].pathCoord, neighbor.pair[1].coord]); })
            .style("opacity", 1)
    }

    renderMetroNodes() {
        let self = this;
        let svgNodes = this._svgNodeGroup
            .selectAll("circle")
            .data(this._nodes)

        svgNodes
            .exit()
            .style("opacity", 1)
            .transition()
            .duration(500)
            .delay(function (d, i) { return 3 * i })
            .attr("cx", function (node) { return node.coord.x * self._gridSize; })
            .attr("cy", function (node) { return (node.coord.y + 1) * self._gridSize; })
            .style("opacity", 0)
            .remove();

        svgNodes
            .transition()
            .duration(500)
            .attr("cx", function (node) { return node.coord.x * self._gridSize; })
            .attr("cy", function (node) { return node.coord.y * self._gridSize; })
            .attr("fill", function (node) { return node.metroColor; })

        svgNodes
            .enter()
            .append("circle")
            .classed("node", true)
            .attr("cx", function (node) { return node.coord.x * self._gridSize; })
            .attr("cy", function (node) { return (node.coord.y - 1) * self._gridSize; })
            .transition()
            .duration(500)
            .delay(function (d, i) { return 3 * i })
            .attr("cx", function (node) { return node.coord.x * self._gridSize; })
            .attr("cy", function (node) { return node.coord.y * self._gridSize; })
            .attr("fill", function (node) { return node.metroColor; })

        let svgInsideNodes = this._svgInsideNodeGroup
            .selectAll("circle")
            .data(this._nodes)

        svgInsideNodes
            .exit()
            .style("opacity", 0)
            .transition()
            .duration(500)
            .delay(function (d, i) { return 3 * i })
            .attr("cx", function (node) { return node.coord.x * self._gridSize; })
            .attr("cy", function (node) { return (node.coord.y + 1) * self._gridSize; })
            .style("opacity", 1)
            .remove();

        svgInsideNodes
            .classed("node-inside", true)
            .classed("node-select", false)
            .transition()
            .duration(500)
            .attr("cx", function (node) { return node.coord.x * self._gridSize; })
            .attr("cy", function (node) { return node.coord.y * self._gridSize; })

        svgInsideNodes
            .enter()
            .append("circle")
            .classed("node-inside", true)
            .on("click", function (d) {
                self._currentSelection = d;
                if (self._onClick && typeof (self._onClick) === "function")
                    self._onClick(self._currentSelection);
            })
            .attr("cx", function (node) { return node.coord.x * self._gridSize; })
            .attr("cy", function (node) { return (node.coord.y - 1) * self._gridSize; })
            .style("opacity", 0)
            .transition()
            .duration(500)
            .delay(function (d, i) { return 3 * i })
            .attr("cx", function (node) { return node.coord.x * self._gridSize; })
            .attr("cy", function (node) { return node.coord.y * self._gridSize; })
            .style("opacity", 1)
    }

    renderMetroNames() {
        let self = this;

        let svgNodeNames = this._svgNodeNameGroup
            .selectAll("text")
            .data(this._nodes)

        svgNodeNames
            .exit()
            .style("opacity", 1)
            .transition()
            .duration(500)
            .delay(function (d, i) { return 3 * i })
            .attr("x", function (node) { return node.coord.x * self._gridSize; })
            .attr("y", function (node) { return (node.coord.y + 1.4) * self._gridSize; })
            .style("opacity", 0)
            .remove();

        svgNodeNames
            .transition()
            .duration(500)
            .text(function (node) { return node.name; })
            .attr("x", function (node) { return node.coord.x * self._gridSize; })
            .attr("y", function (node) { return (node.coord.y - 0.4) * self._gridSize; })
            .attr("fill", function (node) { return node.metroColor; })

        svgNodeNames
            .enter()
            .append("text")
            .attr("class", "node-name")
            .text(function (node) { return node.name; })
            .attr("fill", function (node) { return node.metroColor; })
            .attr("x", function (node) { return node.coord.x * self._gridSize; })
            .attr("y", function (node) { return (node.coord.y - 1.4) * self._gridSize; })
            .style("opacity", 0)
            .transition()
            .duration(500)
            .delay(function (d, i) { return 3 * i })
            .attr("x", function (node) { return node.coord.x * self._gridSize; })
            .attr("y", function (node) { return (node.coord.y - 0.4) * self._gridSize; })
            .style("opacity", 1)

        let svgNodeNameBackgrounds = self._svgNodeNameBackgroundGroup
            .selectAll("rect")
            .data(self._svgNodeNameGroup.selectAll("text").nodes())

        svgNodeNameBackgrounds
            .exit()
            .transition()
            .duration(500)
            .delay(function (d, i) { return 3 * i })
            .attr("x", function (node) { return node.__data__.coord.x * self._gridSize - node.getBBox().width / 2 - 3; })
            .attr("y", function (node) { return (node.__data__.coord.y + 1.4) * self._gridSize - node.getBBox().height + 1; })
            .remove();

        svgNodeNameBackgrounds
            .transition()
            .duration(500)
            .attr("x", function (node) { return node.__data__.coord.x * self._gridSize - node.getBBox().width / 2 - 3; })
            .attr("y", function (node) { return (node.__data__.coord.y - 0.4) * self._gridSize - node.getBBox().height + 1; })
            .attr("width", function (node) { return node.getBBox().width + 6; })
            .attr("height", function (node) { return node.getBBox().height + 2; })
            .attr("stroke", function (node) { return node.__data__.metroColor; })

        svgNodeNameBackgrounds
            .enter()
            .append("rect")
            .classed("node-name-background", true)
            .attr("width", 0)
            .attr("height", 0)
            .attr("x", function (node) { return node.__data__.coord.x * self._gridSize - node.getBBox().width / 2; })
            .attr("y", function (node) { return (node.__data__.coord.y - 1.4) * self._gridSize - node.getBBox().height; })
            .transition()
            .duration(500)
            .delay(function (d, i) { return 3 * i })
            .attr("x", function (node) { return node.__data__.coord.x * self._gridSize - node.getBBox().width / 2 - 3; })
            .attr("y", function (node) { return (node.__data__.coord.y - 0.4) * self._gridSize - node.getBBox().height + 1; })
            .attr("width", function (node) { return node.getBBox().width + 6; })
            .attr("height", function (node) { return node.getBBox().height + 2; })
            .attr("stroke", function (node) { return node.__data__.metroColor; })
    }

    renderPath(startNode, endNode) {
        let self = this;
        let rawPaths = findPath(startNode, endNode)
        let paths = [];

        for (let i = 1; i < rawPaths.length; i++) {
            let previousNode = rawPaths[i - 1];
            let currentNode = rawPaths[i];

            let neighbor = currentNode.neighbors.find(n => { return n.node === previousNode; })
            let congestionMultiplier = 100;
            for (let congestion = 0; congestion < neighbor.congestion * congestionMultiplier; congestion++) {
                paths.push({
                    "pair": [previousNode, currentNode],
                    "congestion": neighbor.congestion
                });
            }
        }

        let svgJams = this._svgLineJamGroup
            .selectAll("path")
            .data(paths)

        svgJams.exit().remove()

        svgJams
            .attr("d", function (neighbor) {
                let reversePath;
                let originalLine = self._svgLineGroup.selectAll("path").filter(d => {
                    if ((d.pair[0] === neighbor.pair[0] && d.pair[1] === neighbor.pair[1])) {
                        reversePath = true;
                        return true;
                    }
                    else if (d.pair[1] === neighbor.pair[0] && d.pair[0] === neighbor.pair[1]) {
                        reversePath = false;
                        return true;
                    }
                    else return false;
                }).nodes()[0]

                if (!originalLine)
                    return;

                let distance = Math.hypot(neighbor.pair[0].coord.x - neighbor.pair[1].coord.x, neighbor.pair[0].coord.y - neighbor.pair[1].coord.y);
                let noiseAmount = distance * 3;

                let lineLength = originalLine.getTotalLength();
                let interval = lineLength / (noiseAmount - 1);
                let lineData = d3.range(noiseAmount).map(function (d) {
                    let point = originalLine.getPointAtLength(reversePath ? (noiseAmount - d) * interval : d * interval);
                    point.x = Math.round(point.x / self._gridSize)
                    point.y = Math.round(point.y / self._gridSize)
                    if (d == 0 || d == noiseAmount - 1)
                        return point;

                    point.x += Random.range(-0.3, 0.3);
                    point.y += Random.range(-0.3, 0.3);
                    return point;
                });;
                return self._lineGenerator(lineData);
            })
            .attr("stroke-width", 0.8)
            .attr("stroke", function (neighbor) { return self._congestionColors(neighbor.congestion); })
            .attr("fill", "none")
            .transition()
            .ease(d3.easePolyIn)
            .duration(0)
            .attrTween("stroke-dashoffset", tweenDashOffset)
            .attrTween("stroke-dasharray", tweenDash)
            .on("end", function repeat() {
                d3.active(this)
                    .transition()
                    .duration(Random.rangeInt(750, 3000))
                    .delay(Random.range(0, 5))
                    .attrTween("stroke-dasharray", tweenDash)
                    .on("end", repeat);
            })

        svgJams
            .enter()
            .append("path")
            .attr("d", function (neighbor) {
                let reversePath;
                let originalLine = self._svgLineGroup.selectAll("path").filter(d => {
                    if ((d.pair[0] === neighbor.pair[0] && d.pair[1] === neighbor.pair[1])) {
                        reversePath = true;
                        return true;
                    }
                    else if (d.pair[1] === neighbor.pair[0] && d.pair[0] === neighbor.pair[1]) {
                        reversePath = false;
                        return true;
                    }
                    else return false;
                }).nodes()[0]

                if (!originalLine)
                    return;

                let distance = Math.hypot(neighbor.pair[0].coord.x - neighbor.pair[1].coord.x, neighbor.pair[0].coord.y - neighbor.pair[1].coord.y);
                let noiseAmount = distance * 3;

                let lineLength = originalLine.getTotalLength();
                let interval = lineLength / (noiseAmount - 1);
                let lineData = d3.range(noiseAmount).map(function (d) {
                    let point = originalLine.getPointAtLength(reversePath ? (noiseAmount - d) * interval : d * interval);
                    point.x = Math.round(point.x / self._gridSize)
                    point.y = Math.round(point.y / self._gridSize)
                    if (d == 0 || d == noiseAmount - 1)
                        return point;

                    point.x += Random.range(-0.3, 0.3);
                    point.y += Random.range(-0.3, 0.3);
                    return point;
                });;
                return self._lineGenerator(lineData);
            })
            .attr("stroke-width", 0.8)
            .attr("stroke", function (neighbor) { return self._congestionColors(neighbor.congestion); })
            .attr("fill", "none")
            .transition()
            .ease(d3.easePolyIn)
            .duration(0)
            .attrTween("stroke-dashoffset", tweenDashOffset)
            .attrTween("stroke-dasharray", tweenDash)
            .on("end", function repeat() {
                d3.active(this)
                    .transition()
                    .duration(Random.rangeInt(750, 3000))
                    .delay(Random.range(0, 5))
                    .attrTween("stroke-dasharray", tweenDash)
                    .on("end", repeat);
            })

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

        focusNodes(rawPaths);
    }

    disablePath() {
        this._svgLineJamGroup
            .selectAll("path")
            .remove()
        disableFocus();
    }

    renderCongestion() {
        let self = this;

        this._svgLineGroup
            .selectAll("path")
            .transition()
            .duration(500)
            .attr("stroke", function (neighbor) { return self._congestionColors(neighbor.congestion); });
    }

    disableCongestion() {
        let self = this;

        this._svgLineGroup
            .selectAll("path")
            .transition()
            .duration(500)
            .attr("stroke", function (neighbor) { return neighbor.pair[0].metroColor; })
    }

    focusNodes(nodes) {
        let svgPathNotInNodes = this._svgLineGroup.selectAll("path").filter(function (neighbor) { return !nodes.includes(neighbor.pair[0]) || !nodes.includes(neighbor.pair[1]) });
        let svgNodeNotInNodes = this._svgNodeGroup.selectAll("circle").filter(function (node) { return !nodes.includes(node) });
        let svgNameNotInNodes = this._svgNodeNameGroup.selectAll("text").filter(function (node) { return !nodes.includes(node) });

        svgPathNotInNodes.classed("fade-out", true).classed("fade-in", false);
        svgNodeNotInNodes.classed("fade-out", true).classed("fade-in", false);
        svgNameNotInNodes.classed("fade-out", true).classed("fade-in", false);
    }

    disableFocus() {
        this._svgLineGroup.selectAll("path").classed("fade-out", false).classed("fade-in", true);
        this._svgNodeGroup.selectAll("circle").classed("fade-out", false).classed("fade-in", true);
        this._svgNodeNameGroup.selectAll("text").classed("fade-out", false).classed("fade-in", true);
    }

    setSelectionCallback(callBack) {
        this._onClick = callBack;
    }
}

function setSelectionCallback(callBack) {
    let renderer = new Renderer();

    renderer.setSelectionCallback(callBack);
}

function render(nodes) {
    let renderer = new Renderer();

    renderer.nodes = nodes;
    renderer.renderGrid(100, 70);
    renderer.renderMetroLines();
    renderer.renderMetroNodes();
    renderer.renderMetroNames();
}

function focusNodes(nodes) {
    let renderer = new Renderer();
    renderer.focusNodes(nodes);
}

function disableFocus() {
    let renderer = new Renderer();
    renderer.disableFocus();
}

function renderCongestion() {
    let renderer = new Renderer();
    renderer.renderCongestion();
}

function disableCongestion() {
    let renderer = new Renderer();
    renderer.disableCongestion();
}

function renderPath(startNode, endNode) {
    let renderer = new Renderer();

    renderer.renderPath(startNode, endNode);
}

function disablePath() {
    let renderer = new Renderer();

    renderer.disablePath();
}

function findPath(startNode, endNode) {

    function manhattanDistance(coord0, coord1) {
        var d1 = Math.abs(coord1.x - coord0.x);
        var d2 = Math.abs(coord1.y - coord0.x);
        return d1 + d2;
    }

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
            let neighborcost = neighbors[i].cost * 10;

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