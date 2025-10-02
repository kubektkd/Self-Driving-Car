import Graph from "./math/graph.js";
import GraphEditor from "./editors/graphEditor.js";
import Viewport from "./viewport.js";
import World from "./world.js";
import StopEditor from "./editors/stopEditor.js";
import CrossingEditor from "./editors/crossingEditor.js";
import SpawnEditor from "./editors/spawnEditor.js";
import YieldEditor from "./editors/yieldEditor.js";
import LightEditor from "./editors/lightEditor.js";
import ParkingEditor from "./editors/parkingEditor.js";
import TargetEditor from "./editors/targetEditor.js";
import {scale} from "./math/utils.js";
import {Osm} from "./math/osm.js";

const myCanvas = window.document.getElementById("myCanvas");

const disposeBtn = document.getElementById("disposeBtn");
const saveBtn = document.getElementById("saveBtn");
const loadIpt = document.getElementById("fileInput");

const osmPanelBtn = document.getElementById("osmPanelBtn");
const parseOsmDataBtn = document.getElementById("parseOsmDataBtn");
const closeOsmPanelBtn = document.getElementById("closeOsmPanelBtn");

const graphBtn = document.getElementById("graphBtn");
const crossingBtn = document.getElementById("crossingBtn");
const yieldBtn = document.getElementById("yieldBtn");
const stopBtn = document.getElementById("stopBtn");
const lightBtn = document.getElementById("lightBtn");
const parkingBtn = document.getElementById("parkingBtn");
const spawnBtn = document.getElementById("spawnBtn");
const targetBtn = document.getElementById("targetBtn");

myCanvas.width = 1440;
myCanvas.height = 700;

const ctx = myCanvas.getContext("2d");

const worldString = localStorage.getItem("world");
const worldData = worldString ? JSON.parse(worldString) : null;
let world = worldData
    ? World.load(worldData)
    : new World(new Graph());
const graph = world.graph;

const viewport = new Viewport(myCanvas, world.zoom, world.offset);

const tools = {
    graph: { button: graphBtn, editor: new GraphEditor(viewport, graph) },
    crossing: { button: crossingBtn, editor: new CrossingEditor(viewport, world) },
    stop: { button: stopBtn, editor: new StopEditor(viewport, world) },
    yield: { button: yieldBtn, editor: new YieldEditor(viewport, world) },
    light: { button: lightBtn, editor: new LightEditor(viewport, world) },
    parking: { button: parkingBtn, editor: new ParkingEditor(viewport, world) },
    spawn: { button: spawnBtn, editor: new SpawnEditor(viewport, world) },
    target: { button: targetBtn, editor: new TargetEditor(viewport, world) },
};

let oldGraphHash = graph.hash();

setMode("graph");

animate();

function animate() {
    viewport.reset();
    if (graph.hash() !== oldGraphHash) {
        world.generate();
        oldGraphHash = graph.hash();
    }
    const viewPoint = scale(viewport.getOffset(), -1)
    world.draw(ctx, viewPoint);
    ctx.globalAlpha = 0.3;
    for (const tool of Object.values(tools)) {
        tool.editor.display();
    }
    requestAnimationFrame(animate);
}

function dispose() {
    tools["graph"].editor.dispose();
    world.markings.length = 0;
}

function save() {
    world.zoom = viewport.zoom;
    world.offset = viewport.offset;

    const element = document.createElement("a");
    element.setAttribute(
        "href",
        "data:application/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(world))
    );

    const fileName = "name.world";
    element.setAttribute("download", fileName);

    element.click();

    localStorage.setItem("world", JSON.stringify(world));
}

function load(event) {
    const file = event.target.files[0];

    if (!file) {
        alert("No file selected.");
        return;
    }

    const reader = new FileReader();
    reader.readAsText(file);

    reader.onload = evt => {
        const fileContent = evt.target.result;
        const jsonData = JSON.parse(fileContent);
        world = World.load(jsonData);
        localStorage.setItem("world", JSON.stringify(world));
        location.reload();
    }
}

function setMode(mode) {
    disableEditors();
    tools[mode].button.classList.remove("not-active");
    tools[mode].editor.enable();
}

function disableEditors() {
    for (const tool of Object.values(tools)) {
        tool.button.classList.add("not-active");
        tool.editor.disable();
    }
}

function toggleOsmPanel() {
    document.getElementById("osmPanel").classList.toggle("hidden");
    document.getElementById("osmDataContainer").value = "";
}

function parseOsmData() {
    const dataContainer = document.getElementById("osmDataContainer");
    if (dataContainer.value === "") {
        alert("Paste data first");
        return;
    }
    const result = Osm.parseRoads(JSON.parse(dataContainer.value));
    graph.points = result.points;
    graph.segments = result.segments;
    viewport.offset.x = - result.points[0].x;
    viewport.offset.y = - result.points[0].y;
    toggleOsmPanel();
}


disposeBtn.addEventListener("click", () => dispose());
saveBtn.addEventListener("click", () => save());
loadIpt.addEventListener("change", () => load(event));

osmPanelBtn.addEventListener("click", () => toggleOsmPanel());
parseOsmDataBtn.addEventListener("click", () => parseOsmData());
closeOsmPanelBtn.addEventListener("click", () => toggleOsmPanel());

graphBtn.addEventListener("click", () => setMode("graph"));
crossingBtn.addEventListener("click", () => setMode("crossing"));
yieldBtn.addEventListener("click", () => setMode("yield"));
stopBtn.addEventListener("click", () => setMode("stop"));
lightBtn.addEventListener("click", () => setMode("light"));
parkingBtn.addEventListener("click", () => setMode("parking"));
spawnBtn.addEventListener("click", () => setMode("spawn"));
targetBtn.addEventListener("click", () => setMode("target"));