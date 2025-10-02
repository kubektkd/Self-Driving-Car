import {angle} from "../math/utils.js";
import Marking from "./marking.js";
import Point from "../primitives/point.js";

export default class Stop extends Marking {
    constructor(center, directionVector, width, height) {
        super(center, directionVector, width, height);

        this.border = this.poly.segments[2];
        this.type = "stop";
    }

    static load(data) {
        const point = new Point(data.center.x, data.center.y);
        const direction = new Point(data.directionVector.x, data.directionVector.y);
        return new Stop(point, direction, data.width, data.height);
    }

    draw(ctx) {
        this.border.draw(ctx, { width: 5, color: "white" });
        ctx.save();
        ctx.translate(this.center.x, this.center.y);
        ctx.rotate(angle(this.directionVector) - Math.PI / 2);
        ctx.scale(1, 2.5);

        ctx.beginPath();
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillStyle = "white";
        ctx.font = "bold " + this.height * 0.3 + "px Arial";
        ctx.fillText("STOP", 0, 1);

        ctx.restore();
    }
}