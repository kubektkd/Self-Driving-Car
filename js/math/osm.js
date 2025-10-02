import Point from "../primitives/point.js";
import {degreeToRadius, invLerp} from "./utils.js";
import Segment from "../primitives/segment.js";

export const Osm = {
    parseRoads: (data) => {
        const nodes = data.elements.filter(node => node.type === "node");
        const ways = data.elements.filter(way => way.type === "way");
        const numberOfSegments = ways.reduce((acc, curr) => acc + curr.nodes.length-1, 0);
        console.info(`Info: ${nodes.length} nodes, ${ways.length} ways and ${numberOfSegments} segments imported.`);

        const lats = nodes.map(node => node.lat);
        const lons = nodes.map(node => node.lon);

        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLon = Math.min(...lons);
        const maxLon = Math.max(...lons);

        const deltaLat = maxLat - minLat;
        const deltaLon = maxLon - minLon;
        const aspectRatio = deltaLon / deltaLat;
        const mapHeight = deltaLat * 111_000 * 10;
        const mapWidth = mapHeight * aspectRatio * Math.cos(degreeToRadius(maxLat));

        const points = [];
        const segments = [];

        for (const node of nodes) {
            const y = invLerp(maxLat, minLat, node.lat) * mapHeight;
            const x = invLerp(minLon, maxLon, node.lon) * mapWidth;
            const point = new Point(x, y);
            point.id = node.id;
            points.push(point);
        }

        for (const way of ways) {
            const ids = way.nodes;
            for (let i = 1; i < ids.length; i++) {
                const prev = points.find(point => point.id === ids[i - 1]);
                const curr = points.find(point => point.id === ids[i]);
                const oneWay = way.tags.oneway || way.tags.lanes === 1;
                segments.push(new Segment(prev, curr, oneWay));
            }
        }

        return { points, segments };
    }
}