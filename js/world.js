import {add, distance, getNearestPoint, lerp, scale} from "./math/utils.js";
import Marking from "./markings/marking.js";
import Graph from "./math/graph.js";
import Envelope from "./primitives/envelope.js";
import Point from "./primitives/point.js";
import Segment from "./primitives/segment.js";
import Polygon from "./primitives/polygon.js";
import Light from "./markings/light.js";
import Building from "./items/building.js";
import Tree from "./items/tree.js";
import Crossing from "./markings/crossing.js";
import Parking from "./markings/parking.js";
import Spawn from "./markings/spawn.js";
import Stop from "./markings/stop.js";
import Target from "./markings/target.js";
import Yield from "./markings/yield.js";

export default class World {
    constructor(
        graph,
        roadWidth = 100,
        roadRoundness = 10,
        buildingWidth = 150,
        buildingMinLength = 150,
        spacing = 50,
        treeSize = 160
    ) {
        this.graph = graph;
        this.roadWidth = roadWidth;
        this.roadRoundness = roadRoundness;
        this.buildingWidth = buildingWidth;
        this.buildingMinLength = buildingMinLength;
        this.spacing = spacing;
        this.treeSize = treeSize;

        this.envelopes = [];
        this.roadBorders = [];
        this.buildings = [];
        this.trees = [];
        this.laneGuides = [];

        this.markings = [];

        this.cars = [];
        this.bestCar = null;

        this.frameCount = 0;

        this.generate();
    }

    static load(data) {
        const world = new World(new Graph());
        world.graph = Graph.load(data.graph);
        world.roadWidth = data.roadWidth;
        world.roadRoundness = data.roadRoundness;
        world.buildingWidth = data.buildingWidth;
        world.buildingMinLength = data.buildingMinLength;
        world.spacing = data.spacing;
        world.treeSize = data.treeSize;
        world.envelopes = data.envelopes.map(envelopeData => Envelope.load(envelopeData));
        world.roadBorders = data.roadBorders.map(border => new Segment(border.p1, border.p2)); // TODO: consider adding load function in Segment and Point classes
        world.buildings = data.buildings.map(buildingData => Building.load(buildingData));
        world.trees = data.trees.map(tree => new Tree(tree.center, data.treeSize));
        world.laneGuides = data.laneGuides.map(guide => new Segment(guide.p1, guide.p2));
        world.markings = data.markings.map(markingData =>  {
            const point = new Point(markingData.center.x, markingData.center.y);
            const dir = new Point(markingData.directionVector.x, markingData.directionVector.y);
            switch (markingData.type) {
                case "crossing":
                    return new Crossing(point, dir, markingData.width, markingData.height);
                case "light":
                    return new Light(point, dir, markingData.width, markingData.height);
                case "marking":
                    return new Marking(point, dir, markingData.width, markingData.height);
                case "parking":
                    return new Parking(point, dir, markingData.width, markingData.height);
                case "spawn":
                    return new Spawn(point, dir, markingData.width, markingData.height);
                case "stop":
                    return new Stop(point, dir, markingData.width, markingData.height);
                case "target":
                    return new Target(point, dir, markingData.width, markingData.height);
                case "yield":
                    return new Yield(point, dir, markingData.width, markingData.height);
            }
        });
        world.zoom = data.zoom;
        world.offset = data.offset;
        return world;
    }

    generate() {
        this.envelopes.length = 0;
        for (const segment of this.graph.segments) {
            this.envelopes.push(
                new Envelope(segment, this.roadWidth, this.roadRoundness)
            );
        }

        this.roadBorders = Polygon.union(this.envelopes.map(envelope => envelope.poly));
        this.buildings = this._generateBuildings();
        this.trees = this._generateTrees();

        this.laneGuides.length = 0;
        this.laneGuides.push(...this._generateLaneGuides());
    }

    _generateLaneGuides() {
        const tmpEnvelopes = [];
        for (const segment of this.graph.segments) {
            tmpEnvelopes.push(
                new Envelope(
                    segment,
                    this.roadWidth / 2,
                    this.roadRoundness
                )
            );
        }
        return Polygon.union(tmpEnvelopes.map(envelope => envelope.poly));
    }

    _generateTrees() {
        let points = [
            ...this.roadBorders.map(segment => [segment.p1, segment.p2]).flat(),
            ...this.buildings.map(building => building.base.points).flat()
        ];
        const left = Math.min(...points.map(point => point.x));
        const right = Math.max(...points.map(point => point.x));
        const top = Math.min(...points.map(point => point.y));
        const bottom = Math.max(...points.map(point => point.y));

        const illegalPolys = [
            ...this.buildings.map(building => building.base),
            ...this.envelopes.map(envelope => envelope.poly)
        ];

        const trees = [];
        let tryCount = 0;
        while (tryCount < 100) {
            const point = new Point(
                lerp(left, right, Math.random()),
                lerp(bottom, top, Math.random())
            )

            // checks if it's not inside a building or road
            let keep = true;
            for (const poly of illegalPolys) {
                if (poly.containsPoint(point) || poly.distanceToPoint(point) < this.treeSize / 2) {
                    keep = false;
                    break;
                }
            }

            // checks if trees don't overlap
            if (keep) {
                for (const tree of trees) {
                    if (distance(tree.center, point) < this.treeSize) {
                        keep = false;
                        break;
                    }
                }
            }

            // checks if tree is not too distance to some object
            if (keep) {
                let closeToSomething = false;
                for (const poly of illegalPolys) {
                    if (poly.distanceToPoint(point) < this.treeSize * 2) {
                        closeToSomething = true;
                        break;
                    }
                }
                keep = closeToSomething;
            }

            if (keep) {
                trees.push(new Tree(point, this.treeSize));
                tryCount = 0;
            }
            tryCount++;
        }
        return trees;
    }

    _generateBuildings() {
        const tmpEnvelopes = [];
        for (const segment of this.graph.segments) {
            tmpEnvelopes.push(
                new Envelope(
                    segment,
                    this.roadWidth + this.buildingWidth + this.spacing * 2,
                    this.roadRoundness
                )
            );
        }

        const guides = Polygon.union(tmpEnvelopes.map(envelope => envelope.poly));

        for (let i = 0; i < guides.length; i++) {
            const segment = guides[i];
            if (segment.length() < this.buildingMinLength) {
                guides.splice(i, 1);
                i--;
            }
        }

        const supports = [];
        for (const segment of guides) {
            const length = segment.length() + this.spacing;
            const buildingCount = Math.floor(
                length / (this.buildingMinLength + this.spacing)
            );
            const buildingLength = length / buildingCount - this.spacing;

            const direction = segment.directionVector();

            let q1 = segment.p1;
            let q2 = add(q1, scale(direction, buildingLength));
            supports.push(new Segment(q1, q2));

            for (let i = 2; i <= buildingCount; i++) {
                q1 = add(q2, scale(direction, this.spacing));
                q2 = add(q1, scale(direction, buildingLength));
                supports.push(new Segment(q1, q2));
            }
        }

        const bases = [];
        for (const segment of supports) {
            bases.push(new Envelope(segment, this.buildingWidth).poly);
        }

        const epsilon = 0.001;
        for (let i = 0; i < bases.length - 1; i++) {
            for (let j = i + 1; j < bases.length; j++) {
                if (
                    bases[i].intersectsPoly(bases[j]) ||
                    bases[i].distanceToPoly(bases[j]) < this.spacing - epsilon
                ) {
                    bases.splice(j, 1);
                    j--;
                }
            }
        }

        return bases.map(building => new Building(building));
    }

    _getIntersections() {
        const subset = [];
        for (const point of this.graph.points) {
            let degree = 0;
            for (const seg of this.graph.segments) {
                if (seg.includes(point)) {
                    degree++;
                }
            }

            if (degree > 2) {
                subset.push(point);
            }
        }
        return subset;
    }

    _updateLights() {
        const lights = this.markings.filter((m) => m instanceof Light);
        const controlCenters = [];
        for (const light of lights) {
            const point = getNearestPoint(light.center, this._getIntersections());
            let controlCenter = controlCenters.find((c) => c.equals(point));
            if (!controlCenter) {
                controlCenter = new Point(point.x, point.y);
                controlCenter.lights = [light];
                controlCenters.push(controlCenter);
            } else {
                controlCenter.lights.push(light);
            }
        }
        const greenDuration = 2,
            yellowDuration = 1;
        for (const center of controlCenters) {
            center.ticks = center.lights.length * (greenDuration + yellowDuration);
        }
        const tick = Math.floor(this.frameCount / 60);
        for (const center of controlCenters) {
            const cTick = tick % center.ticks;
            const greenYellowIndex = Math.floor(
                cTick / (greenDuration + yellowDuration)
            );
            const greenYellowState =
                cTick % (greenDuration + yellowDuration) < greenDuration
                    ? "green"
                    : "yellow";
            for (let i = 0; i < center.lights.length; i++) {
                if (i === greenYellowIndex) {
                    center.lights[i].state = greenYellowState;
                } else {
                    center.lights[i].state = "red";
                }
            }
        }
        this.frameCount++;
    }

    draw(ctx, viewPoint, showSpawnMarkings = true, renderRadius = 3000) {
        this._updateLights();

        for (const envelope of this.envelopes) {
            envelope.draw(ctx, { fill: "#BBB", stroke: "#BBB", lineWidth: 15 });
        }
        for (const marking of this.markings) {
            if (!(marking instanceof Spawn) || showSpawnMarkings) {
                marking.draw(ctx);
            }
        }
        for (const segment of this.graph.segments) {
            segment.draw(ctx, { color: "white", width: 4, dash: [10, 10] })
        }
        for (const segment of this.roadBorders) {
            segment.draw(ctx, { color: "white", width: 4 });
        }

        ctx.globalAlpha = 0.2;
        for (const car of this.cars) {
            car.draw(ctx);
        }
        ctx.globalAlpha = 1;
        if (this.bestCar) {
            this.bestCar.draw(ctx, true);
        }

        const items = [...this.buildings, ...this.trees].filter(
            item => item.base.distanceToPoint(viewPoint) < renderRadius
        )
        items.sort(
            (a, b) => b.base.distanceToPoint(viewPoint) - a.base.distanceToPoint(viewPoint)
        );
        for (const item of items) {
            item.draw(ctx, viewPoint);
        }
    }
}