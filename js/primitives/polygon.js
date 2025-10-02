import Segment from "./segment.js";
import Point from "./point.js";
import {average, getIntersection, getRandomColor} from "../math/utils.js";

export default class Polygon {
    constructor(points) {
        this.points = points;
        this.segments = [];
        for (let i = 1; i <= this.points.length; i++) {
            this.segments.push(
                new Segment(points[i - 1], points[i % points.length])
            )
        }
    }

    static load(data) {
        return new Polygon(
            data.points.map(point => new Point(point.x, point.y))
        );
    }

    static union(polys) {
        Polygon.multiBreak(polys);
        const keptSegments = [];
        for (let i = 0; i < polys.length; i++) {
            for (const segment of polys[i].segments) {
                let keep = true;
                for (let j = 0; j < polys.length; j++) {
                    if (i !== j) {
                        if (polys[j].containsSegment(segment)) {
                            keep = false;
                            break;
                        }
                    }
                }
                if (keep) {
                    keptSegments.push(segment);
                }
            }
        }
        return keptSegments;
    }

    static multiBreak(polys) {
        for (let i = 0; i < polys.length; i++) {
            for (let j = i + 1; j < polys.length; j++) {
                Polygon.break(polys[i], polys[j]);
            }
        }
    }

    static break(poly1, poly2) {
        const segments1 = poly1.segments;
        const segments2 = poly2.segments;
        for (let i = 0; i < segments1.length; i++) {
            for (let j = 0; j < segments2.length; j++) {
                const intersection = getIntersection(
                  segments1[i].p1, segments1[i].p2, segments2[j].p1, segments2[j].p2
                );

                if (intersection && intersection.offset !== 1 && intersection.offset !== 0) {
                    const point = new Point(intersection.x, intersection.y);

                    let aux = segments1[i].p2;
                    segments1[i].p2 = point;
                    segments1.splice(i + 1, 0, new Segment(point, aux));

                    aux = segments2[j].p2;
                    segments2[j].p2 = point;
                    segments2.splice(j + 1, 0, new Segment(point, aux));
                }
            }
        }
    }

    distanceToPoint(point) {
        return Math.min(...this.segments.map(segment => segment.distanceToPoint(point)));
    }

    distanceToPoly(poly) {
        return Math.min(...this.points.map(p => poly.distanceToPoint(p)));
    }

    intersectsPoly(poly) {
        for (const segment1 of this.segments) {
            for (const segment2 of poly.segments) {
                if (getIntersection(segment1.p1, segment1.p2, segment2.p1, segment2.p2)) {
                    return true;
                }
            }
        }
        return false;
    }

    containsSegment(segment) {
        const midpoint = average(segment.p1, segment.p2);
        return this.containsPoint(midpoint);
    }

    containsPoint(point) {
        const outerPoint = new Point(-1000, -1000);
        let intersectionCount = 0;
        for (const segment of this.segments) {
            const intersection = getIntersection(outerPoint, point, segment.p1, segment.p2);
            if (intersection)
                intersectionCount++;
        }
        return intersectionCount % 2 === 1;
    }

    drawSegments(ctx) {
        for (const segment of this.segments) {
            segment.draw(ctx, { color: getRandomColor(), width: 5 });
        }
    }

    draw(ctx, { stroke = "blue", lineWidth = 2, fill = "rgba(0,0,255,0.3)"} = {}) {
        ctx.beginPath();
        ctx.fillStyle = fill;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lineWidth;
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
}