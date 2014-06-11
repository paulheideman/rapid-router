'use strict';

var PAPER_WIDTH = 1000;
var PAPER_HEIGHT = 800;
var GRID_WIDTH = 10;
var GRID_HEIGHT = 8;
var GRID_SPACE_SIZE = 100;

var VAN_WIDTH = 40;
var VAN_HEIGHT = 20;

var MOVE_DISTANCE = GRID_SPACE_SIZE;
var TURN_DISTANCE = MOVE_DISTANCE / 2;
var INITIAL_OFFSET_X = 10;
var INITIAL_OFFSET_Y = 32;
var INITIAL_X = GRID_SPACE_SIZE - INITIAL_OFFSET_X;
var INITIAL_Y = 450 - INITIAL_OFFSET_Y;
var ROTATION_OFFSET_X = 22;
var ROTATION_OFFSET_Y = VAN_WIDTH - 20;

var ROAD_WIDTH = GRID_SPACE_SIZE / 2;
var EDGE_GAP = (GRID_SPACE_SIZE - ROAD_WIDTH) / 2;
var ROAD_COLOUR = '#222';
var ROAD_ATTR = {
    fill: ROAD_COLOUR,
    'stroke': '#aaa',
};

var ROAD_ATTR_JUNCTION = {
    fill: ROAD_COLOUR,
    'stroke': 'none'
};

var ROAD_MARKER_ATTR = {
    'stroke': 'white'
};

var DASH = '10';

//TODO: Remove weight point when we alter the level editor to not need it
var WEIGHT_POINT_ATTR = {
    fill: '#FFF',
    'fill-opacity': 0,
    stroke: 'none'
};

var paper = new Raphael('paper', PAPER_WIDTH, PAPER_HEIGHT);

function createRotationTransformation(degrees, rotationPointX, rotationPointY) {
    var transformation = '... r' + degrees;
    if (rotationPointX !== undefined && rotationPointY !== undefined) {
        transformation += ',' + rotationPointX;
        transformation += ',' + rotationPointY;
    }
    return transformation;
}

function createVan(paper) {
    return paper.image(
        '/static/game/image/ocadoVan_big.svg', INITIAL_X, INITIAL_Y, VAN_HEIGHT, VAN_WIDTH)
        .transform('r90');
}

function getGridSpace(x, y) {
    return [Math.floor((x + GRID_SPACE_SIZE / 2) / GRID_SPACE_SIZE),
        Math.floor((y + GRID_SPACE_SIZE / 2) / GRID_SPACE_SIZE)];
}

function identifyInstruction(roadSet) {
    var weightPointBox = roadSet[2].getBBox();
    var roadBox = roadSet[0].getBBox();
    var diffX = Math.abs(weightPointBox.x - roadBox.x);
    var diffY = Math.abs(weightPointBox.y - roadBox.y);
    var instruction = '';

    if (diffX === 0 && diffY === 0) {
        instruction = 'UL';
    }
    if (diffX === 0 && diffY === EDGE_GAP) {
        instruction = 'DL';
    }
    if (diffX === EDGE_GAP && diffY === EDGE_GAP) {
        instruction = 'DR';
    }
    if (diffX === EDGE_GAP && diffY === 0) {
        instruction = 'UR';
    }
    if (roadBox.width === 50 && roadBox.height === 100) {
        instruction = 'V';
    }
    if (roadBox.width === 100 && roadBox.height === 50) {
        instruction = 'H';
    }

    return instruction;
}

function createHorizontalRoad(paper, i, j, drawLines) {
    var x = i * GRID_SPACE_SIZE;
    var y = j * GRID_SPACE_SIZE + (GRID_SPACE_SIZE - ROAD_WIDTH) / 2;

    var road = paper.rect(x, y, GRID_SPACE_SIZE, ROAD_WIDTH);

    var markerSet = paper.set();
    if (drawLines) {
        var marker = paper.path(['M', x, j * GRID_SPACE_SIZE + GRID_SPACE_SIZE / 2,
                'l', GRID_SPACE_SIZE, 0]);
        marker.attr(ROAD_MARKER_ATTR);
        marker.node.setAttribute('stroke-dasharray', DASH);
        markerSet.push(marker);
        road.attr(ROAD_ATTR);
    } else {
        road.attr(ROAD_ATTR_JUNCTION);
    }
    
    var weightPoint = paper.rect(x, y, GRID_SPACE_SIZE, GRID_SPACE_SIZE);
    weightPoint.attr(WEIGHT_POINT_ATTR);

    var roadSet = paper.set();
    roadSet.push(road, markerSet, weightPoint);

    return roadSet;
}

function createVerticalRoad(paper, i, j, drawLines) {
    var x = i * GRID_SPACE_SIZE + (GRID_SPACE_SIZE - ROAD_WIDTH) / 2;
    var y = j * GRID_SPACE_SIZE;

    var road = paper.rect(x, y, ROAD_WIDTH, GRID_SPACE_SIZE);
    road.attr(ROAD_ATTR);

    var markerSet = paper.set();
    if (drawLines) {
        var marker = paper.path(['M', i * GRID_SPACE_SIZE + GRID_SPACE_SIZE / 2, y,
            'l', 0, GRID_SPACE_SIZE]);
        marker.attr(ROAD_MARKER_ATTR);
        marker.node.setAttribute('stroke-dasharray', DASH);
        markerSet.push(marker);
        road.attr(ROAD_ATTR);
    } else {
        road.attr(ROAD_ATTR_JUNCTION);
    }

    var weightPoint = paper.rect(x, y, GRID_SPACE_SIZE, GRID_SPACE_SIZE);
    weightPoint.attr(WEIGHT_POINT_ATTR);

    var roadSet = paper.set();
    roadSet.push(road, markerSet, weightPoint);

    return roadSet;
}

function createTurn(paper, i, j, direction, drawLines) {
    var baseX = i * GRID_SPACE_SIZE;
    var baseY = j * GRID_SPACE_SIZE;
    var turnAndMarker = [];
    
    switch (direction) {
        case 'UL':
            turnAndMarker = createTurnUL(baseX, baseY, drawLines);
            break;

        case 'UR':
            turnAndMarker = createTurnUR(baseX, baseY, drawLines);
            break;

        case 'DR':
            turnAndMarker = createTurnDR(baseX, baseY, drawLines);
            break;

        case 'DL':
            turnAndMarker = createTurnDL(baseX, baseY, drawLines);
            break;
    }

    var turn = turnAndMarker[0];
    var marker = turnAndMarker[1];
    var weightPoint = paper.rect(baseX, baseY, GRID_SPACE_SIZE, GRID_SPACE_SIZE);

    if (drawLines) {
        marker.attr(ROAD_MARKER_ATTR);
        marker.node.setAttribute('stroke-dasharray', DASH);
        turn.attr(ROAD_ATTR);
    } else {
        turn.attr(ROAD_ATTR_JUNCTION);
    }
    weightPoint.attr(WEIGHT_POINT_ATTR);

    var roadSet = paper.set();
    roadSet.push(turn, marker, weightPoint);

    return roadSet;
}

function createTurnUL(baseX, baseY, drawLines) {
    var turn = paper.path([
        'M', baseX, baseY + EDGE_GAP,
        'Q', baseX + EDGE_GAP, baseY + EDGE_GAP, baseX + EDGE_GAP, baseY,
        'H', baseX + EDGE_GAP + ROAD_WIDTH,
        'Q', baseX + EDGE_GAP + ROAD_WIDTH, baseY + EDGE_GAP + ROAD_WIDTH, baseX,
            baseY + EDGE_GAP + ROAD_WIDTH,
        'V', baseY + EDGE_GAP
    ]);

    var marker;
    if (drawLines) {
        marker = paper.path([
            'M', baseX, baseY + GRID_SPACE_SIZE / 2,
            'Q', baseX + GRID_SPACE_SIZE / 2, baseY + GRID_SPACE_SIZE / 2,
                baseX + GRID_SPACE_SIZE / 2, baseY
        ]);
    }

    return [turn, marker];
}

function createTurnDL(baseX, baseY, drawLines) {
    var turn = paper.path([
        'M', baseX, baseY + EDGE_GAP + ROAD_WIDTH,
        'Q', baseX + EDGE_GAP, baseY + EDGE_GAP + ROAD_WIDTH, baseX + EDGE_GAP,
            baseY + GRID_SPACE_SIZE,
        'H', baseX + EDGE_GAP + ROAD_WIDTH,
        'Q', baseX + EDGE_GAP + ROAD_WIDTH, baseY + EDGE_GAP, baseX, baseY + EDGE_GAP,
        'V', baseY + EDGE_GAP + ROAD_WIDTH
    ]);

    var marker;
    if (drawLines) {
        marker = paper.path([
            'M', baseX, baseY + GRID_SPACE_SIZE / 2,
            'Q', baseX + GRID_SPACE_SIZE / 2, baseY + GRID_SPACE_SIZE / 2,
                baseX + GRID_SPACE_SIZE / 2, baseY + GRID_SPACE_SIZE
        ]);
    }

    return [turn, marker];
}

function createTurnDR(baseX, baseY, drawLines) {
    var turn = paper.path([
        'M', baseX + GRID_SPACE_SIZE, baseY + EDGE_GAP,
        'Q', baseX + EDGE_GAP, baseY + EDGE_GAP, baseX + EDGE_GAP, baseY + GRID_SPACE_SIZE,
        'H', baseX + EDGE_GAP + ROAD_WIDTH,
        'Q', baseX + EDGE_GAP + ROAD_WIDTH, baseY + EDGE_GAP + ROAD_WIDTH,
            baseX + GRID_SPACE_SIZE, baseY + EDGE_GAP + ROAD_WIDTH,
        'V', baseY + EDGE_GAP
    ]);

    var marker;
    if (drawLines) {
        marker = paper.path([
            'M', baseX + GRID_SPACE_SIZE / 2, baseY + GRID_SPACE_SIZE,
            'Q', baseX + GRID_SPACE_SIZE / 2, baseY + GRID_SPACE_SIZE / 2,
                baseX + GRID_SPACE_SIZE, baseY + GRID_SPACE_SIZE / 2
        ]);
    }

    return [turn, marker];
}

function createTurnUR(baseX, baseY, drawLines) {
    var turn = paper.path([
        'M', baseX + EDGE_GAP, baseY,
        'Q', baseX + EDGE_GAP, baseY + EDGE_GAP + ROAD_WIDTH, baseX + GRID_SPACE_SIZE, baseY +
            EDGE_GAP + ROAD_WIDTH,
        'V', baseY + EDGE_GAP,
        'Q', baseX + EDGE_GAP + ROAD_WIDTH, baseY + EDGE_GAP, baseX + EDGE_GAP + 
            ROAD_WIDTH, baseY,
        'H', baseX + EDGE_GAP
    ]);

    var marker;
    if (drawLines) {
        marker = paper.path([
            'M', baseX + GRID_SPACE_SIZE, baseY + GRID_SPACE_SIZE / 2,
            'Q', baseX + GRID_SPACE_SIZE / 2, baseY + GRID_SPACE_SIZE / 2,
                baseX + GRID_SPACE_SIZE / 2, baseY
        ]);
    }

    return [turn, marker];
}

function getRoadLetters(previous, node1, node2) {
    previous = transformY(previous);
    node1 = transformY(node1);
    node2 = transformY(node2);
    
    if (isHorizontal(node1, node2) &&
        (previous === null || isHorizontal(previous, node1))) {
        return 'H';

    } else if (isVertical(node1, node2) &&
        (previous === null || isVertical(previous, node1))) {
        return 'V';

    // Handle turns.
    } else { 
        if (isProgressive(previous.x, node1.x)) {
            return nextPointAbove(node1, node2) ? 'DL' : 'UL';
        }
        if (isProgressive(node1.x, previous.x)) {
            return nextPointAbove(node1, node2) ? 'DR' : 'UR';
        }
        if (isProgressive(previous.y, node1.y)) {
            return nextPointFurther(node1, node2) ? 'UR' : 'UL';
        }
        if (isProgressive(node1.y, previous.y)) {
            return nextPointFurther(node1, node2) ? 'DR' : 'DL';
        }
    }
}

function isHorizontal(prev, next) {
    return prev.y === next.y;
}

function isVertical(prev, next) {
    return prev.x === next.x;
}

function nextPointAbove(curr, next) {
    return curr.y < next.y;
}

function nextPointFurther(curr, next) {
    return curr.x < next.x;
}

function isProgressive(coord1, coord2) {
    return coord1 < coord2;
}

function transformY(coord) {
    return new ocargo.Coordinate(coord.x, GRID_HEIGHT - 1 - coord.y);
}

function drawSingleRoadSegment(previousNode, node, nextNode, drawLines) {
    var roadLetters = getRoadLetters(previousNode.coordinate, node.coordinate, nextNode.coordinate);

    var flipped = transformY(node.coordinate);

    switch (roadLetters) {
        case 'H':
            createHorizontalRoad(paper, flipped.x, flipped.y, drawLines);
            break;
        case 'V':
            createVerticalRoad(paper, flipped.x, flipped.y, drawLines);
            break;
        default:
            createTurn(paper, flipped.x, flipped.y, roadLetters, drawLines);
            break;
    }
}

function createRoad(nodes) {
    $.each(nodes, function(i, node) {
        var previousNode;
        if (node.connectedNodes.length === 1) {
            // Draw dead ends
            previousNode = node.connectedNodes[0];
            var nextNode = {};
            nextNode.coordinate = new ocargo.Coordinate(
                    node.coordinate.x + (node.coordinate.x - previousNode.coordinate.x),
                    node.coordinate.y + (node.coordinate.y - previousNode.coordinate.y));
            drawSingleRoadSegment(node.connectedNodes[0], node, nextNode, true);
        } else {
            var drawLines = node.connectedNodes.length === 2;
            for (i = 0; i < node.connectedNodes.length; i++) {
                previousNode = node.connectedNodes[i];
                for (var j = i + 1; j < node.connectedNodes.length; j++) {
                    drawSingleRoadSegment(previousNode, node, node.connectedNodes[j], drawLines);
                }
            }
        }
    });
}

var van;

function scrollToShowVan() {
    var point = getVanPosition();
    var element = document.getElementById('paper');

    if (point[0] > Math.floor(PAPER_WIDTH / 2)) {
        element.scrollLeft = PAPER_WIDTH / 2;
    } else {
        element.scrollLeft = 0;
    }

    if (point[1] > Math.floor(PAPER_HEIGHT / 2)) {
        element.scrollTop = PAPER_HEIGHT / 2;
    } else {
        element.scrollTop = 0;
    }
}

function moveVan(attr, callback) {
    var combinedCallback = function() {
        scrollToShowVan();
        callback();
    };

    van.animate(attr, 500, 'easeIn', combinedCallback);
}

function moveForward(callback) {
    var moveDistance = -MOVE_DISTANCE;
    var transformation = "... t 0, " + moveDistance;
    moveVan({
        transform: transformation
    }, callback);
}

function moveLeft(callback) {
    var rotationPointX = van.attrs.x - TURN_DISTANCE + ROTATION_OFFSET_X;
    var rotationPointY = van.attrs.y + ROTATION_OFFSET_Y;
    var transformation = createRotationTransformation(-90, rotationPointX, rotationPointY);
    moveVan({
        transform: transformation
    }, callback);
}

function moveRight(callback) {
    var rotationPointX = van.attrs.x + TURN_DISTANCE + ROTATION_OFFSET_X;
    var rotationPointY = van.attrs.y + ROTATION_OFFSET_Y;
    var transformation = createRotationTransformation(90, rotationPointX, rotationPointY);
    moveVan({
        transform: transformation
    }, callback);
}

function resetVan() {
    van.attr({
        x: INITIAL_X,
        y: INITIAL_Y,
        transform: 'r90'
    });
    van.toFront();
    scrollToShowVan();
}

function getVanPosition() {
    var box = van.getBBox();
    return [box.x, box.y];
}

function turnAround(callback) {
    var moveDistance = -GRID_SPACE_SIZE / 2;
    var moveTransformation = "... t 0, " + moveDistance;

    function moveBack() {
        moveVan({
            transform: moveTransformation
        }, callback);
    }

    function rotate() {
        var rotationPointX = van.attrs.x + 22;
        var rotationPointY = van.attrs.y + 20;

        moveVan({
            transform: createRotationTransformation(180, rotationPointX, rotationPointY)
        }, moveBack);
    }

    function moveForward() {
        moveVan({
            transform: moveTransformation
        }, rotate);
    }

    moveForward();
}

function isMobile() {
    var mobileDetect = new MobileDetect(window.navigator.userAgent);
    return !!mobileDetect.mobile();
}

function drawBackground(paper) {
    if (!isMobile()) {
        paper.rect(0, 0, PAPER_WIDTH, PAPER_HEIGHT)
            .attr({fill: 'url(/static/game/image/grassTile1.svg)',
                'stroke': 'none'});
    }
}

function drawDecor(decor) {
    for (var i = 0; i < decor.length; i++) {
        var obj = decor[i];
        var coord = transformY(obj['coordinate']);
        paper.image(obj['url'], coord.x * GRID_SPACE_SIZE, coord.y * GRID_SPACE_SIZE, 100, 100);
    }
}

function createCFC() {
    return paper.image('/static/game/image/OcadoCFC_no_road.svg', INITIAL_X - 95, INITIAL_Y - 25, 100, 107)
        .transform('r90');
}

//find a side of the road
function getHousePosition(destination) {
    var roadLetters = [];

    //might be best to just use the coordinates rather than get road letters and then convert back to directions
    if (destination.connectedNodes.length === 1) {
        var previousNode = destination.connectedNodes[0];
        var nextNode = {};
        nextNode.coordinate = new ocargo.Coordinate(
                destination.coordinate.x + (destination.coordinate.x - previousNode.coordinate.x),
                destination.coordinate.y + (destination.coordinate.y - previousNode.coordinate.y));
        roadLetters.push(getRoadLetters(previousNode.coordinate, destination.coordinate,
                                        nextNode.coordinate));
    } else {
        for (var i = 0; i < destination.connectedNodes.length; i++) {
            var previousNode = destination.connectedNodes[i];
            for (var j = i + 1; j < destination.connectedNodes.length; j++) {
                roadLetters.push(getRoadLetters(previousNode.coordinate, destination.coordinate,
                                 destination.connectedNodes[j].coordinate));
            }
        }
    }
    var left = true;
    var right = true;
    var up = true;
    var down = true;
    
    if (roadLetters.indexOf('H') >= 0 ) {
        left = false;
        right = false;
    }
    if (roadLetters.indexOf('V') >= 0 ) {
        up = false;
        down = false;
    }
    if (roadLetters.indexOf('UL') >= 0 ) {
        left = false;
        up = false;
    }
    if (roadLetters.indexOf('DL') >= 0 ) {
        left = false;
        down = false;
    }
    if (roadLetters.indexOf('UR') >= 0 ) {
        right = false;
        up = false;
    }
    if (roadLetters.indexOf('DR') >= 0 ) {
        right = false;
        down = false;
    }

    //variation specifies x,y,rotation
    var variation = [25,25,90];
    if (down) {
        //prioritise current position for nostalgia, do nothing
    } else if (up) {
        variation = [25,125,270];
    } else if (left) {
        variation = [-25,75,180];
    } else if (right) {
        variation = [75,75,0];
    } else {
        //4-way junction, so hang it off to the bottom left
        variation = [-25,25,135];
    }
    return variation;
}

function createDestination(destination) {
    var variation = getHousePosition(destination);

    paper.rect(destination.coordinate.x * GRID_SPACE_SIZE, PAPER_HEIGHT - (destination.coordinate.y * GRID_SPACE_SIZE) - 100,
            100, 100).attr({'stroke': 'yellow'});

    paper.image('/static/game/image/house1_noGreen.svg',
        destination.coordinate.x * GRID_SPACE_SIZE + variation[0],
        PAPER_HEIGHT - (destination.coordinate.y * GRID_SPACE_SIZE) - variation[1],
        50, 50).transform('r' + variation[2]);
}

function renderTheMap(map) {
    paper.clear();
    drawBackground(paper);
    drawDecor(map.decor);
    createRoad(map.nodes);
    van = createVan(paper);
    createDestination(map.destination);
    createCFC(paper);
    scrollToShowVan();
}

// This is the function that starts the pop-up.
function startPopup(title, subtitle, message) {
    $('#myModal').foundation('reveal', 'open');
    $('.title').html(title);
    $('.lead').html(subtitle);
    $('.mainText').html(message);
}
