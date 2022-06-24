"use strict";

import gHelp from './util/graphHelpers';
import help, { ModalFormRow } from './util/genericHelpers';
import randomColor from 'randomcolor';
import GraphState, { AddNodeI, GraphStateHistory } from './graphState';
import GraphImmut from "./classes/GraphImmut/GraphImmut";
import { NodeImmutPlain } from "./classes/GraphImmut/NodeImmut";
import { EdgeImmutPlain } from "./classes/GraphImmut/EdgeImmut";
import { GraphPlain } from "./util/predefinedGraphs";
import { Network, Node as VisNode, Edge } from "vis-network";
import { DataSet } from "vis-data";

export interface MainI {
    graphState: typeof GraphState;
    container: HTMLElement;
    visWeightEdgeEdit: (data: VisEditEdgeInternal, callback: Function) => void;
    visOptions: {
        interaction: { hover: boolean };
        manipulation: {
            addNode: (data: AddNodeI, callback: Function) => void;
            editNode: (data: AddNodeI, callback: Function) => void;
            addEdge: (data: VisEdgeInternal, callback?: Function) => void;
            editEdge: (data: VisEdgeInternal, callback: Function) => void;
            deleteEdge: (data: { edges: string[] }, callback?: Function) => void;
            deleteNode: (data: { nodes: string[] }, callback: Function) => void
        }
    };
    cancelEdit: (callback: Function) => void;
    saveData: (data: any, callback: Function, operation: string, label: string, color: number) => Promise<void>;
    nodeLabelIDValidator: (v: string) => (boolean | string);
    applyColors: () => Promise<void>;
    setData: (data: GraphPlain, recalcProps?: boolean, graphChanged?: boolean, rearrangeGraph?: boolean) => void;
    saveState: () => void;
    getStateForSaving: () => GraphStateHistory;
    undo: () => void;
    redo: () => void;
    applyState: (undo?: boolean, newState?: any) => void;
    saveStateLocalStorage: () => void;
    shuffleNetworkLayout: () => void;
    randomizeNetworkLayoutSeed: (network: VisNetworkInternals) => void;
    addNetworkListeners: (network: Network) => void
}

interface VisNetworkEvent {
    edges: DataSet<Edge>;
    nodes: DataSet<VisNode>;
}

interface VisNetworkInternals extends Network {
    layoutEngine: {
        randomSeed: number,
        initialRandomSeed: number
    }
}

interface VisEditEdgeInternal {
    from: { id: string | number };
    to: { id: string | number };
    label?: string
}

interface VisEdgeInternal {
    from: string | number;
    to: string | number;
    id: string;
    label?: string
}

/*const customColorPallete = {
    "Default": "DEFAULT",
    "Red": "red",
    "Maroon": "maroon",
    "Yellow": "yellow",
    "Olive": "olive",
    "Lime": "lime",
    "Green": "green",
    "Aqua": "aqua",
    "Teal": "teal",
    "Blue": "blue",
    "Navy": "navy",
    "Fuchsia": "fuchsia",
    "Purple": "purple",
};*/

const basicColors = ["white", '#ff3f3f ', '#ffbf64', '#ffff00', '#00ff80', '#00a0ff', '#f964ff'];
const basicColorsLabel = ["white","red", "orange", "yellow", "green", "blue", "violet"];
const basicColorsNum = basicColors.length;
const basicColorsIndices = Array.from(Array(basicColorsNum).keys());



const self: MainI = {
    graphState: GraphState,
    container: document.getElementById('network')!,
    // Function used to overwrite the edge edit functionality when weights are active
    visWeightEdgeEdit: (data: VisEditEdgeInternal, callback) => {
        help.showFormModal(($modal, vals) => {
            callback(null);
            $modal.modal("hide");
            const value = parseFloat(vals[0]);
            GraphState.editEdge(data.from.id, data.to.id, value, parseFloat(data.label!));
        }, "Edit Edge", "Save", [
            {
                type: "numeric",
                label: "Weight/Capacity",
                initialValue: parseFloat(data.label!)
            }
        ]);
    },
    visOptions: {
        interaction: { hover: true },
        manipulation: {
            addNode: async (data, callback) => {
                const options: ModalFormRow[] = [
                    {
                        type: "html",
                        initialValue: `<p>Node ID: ${await GraphState.getProperty("vertices")}</p>`
                    },
                 //   { type: "text", label: "Label", initialValue: gHelp.generateLabelFromNumber(await GraphState.getProperty("vertices")) }
                //]);
                    { type: "text", label: "Label", initialValue: gHelp.generateLabelFromNumber(await GraphState.getProperty("vertices")) },
                    { type: "select", label: "Color", optionText: basicColorsLabel, optionValues: basicColorsIndices}
                ];
                
                const $popup = help.makeFormModal("Add Node", "Save", options);

                $popup.on("click", ".btn-success", () => {
                    $popup.modal("hide");
                    self.saveData(data, callback, "add", $popup.find("input").first().val() as string, $popup.find("select").first().val() as number);
                }).on("click", ".btn-cancel", () => {
                    $popup.modal("hide");
                    self.cancelEdit(callback);
                }).on("hidden.bs.modal", () => {
                    $popup.remove();
                    self.cancelEdit(callback);
                }).modal("show");
            },
            editNode: (data, callback) => {
                
                //const initialColor = Object.getOwnPropertyNames(data.color).includes("background") ? (data.color as any).background : "DEFAULT";
                const initialColor = data.color;

                const options: ModalFormRow[] = [
                    {
                        type: "html",
                        initialValue: `<p>Node ID: ${data.id}</p>`
                    },
                    { type: "text", label: "Label", initialValue: data.label },
                    { type: "select", label: "Color", optionText: basicColorsLabel, optionValues: basicColorsIndices, initialValue: initialColor }
                // MY SOLUTION
                //{ type: "select", label: "Color", optionValues: [0, 1, 2, 3, 4, 5], optionText: ["red", "orange", "yellow", "green", "blue", "violet"], initialValue: 0}
                //]);
                ];
                
                const $popup = help.makeFormModal("Edit Node", "Save", options);

                $popup.on("click", ".btn-success", () => {
                    $popup.modal("hide");
                    self.saveData(data, callback, "editNode", $popup.find("input").first().val() as string, $popup.find("select").first().val() as number);
                }).on("click", ".btn-cancel", () => {
                    $popup.modal("hide");
                    self.cancelEdit(callback);
                }).on("hidden.bs.modal", () => {
                    $popup.remove();
                    self.cancelEdit(callback);
                }).modal("show");
            },
            addEdge: (data, callback) => {
                const apply = () => {
                    if (typeof callback === "function") {
                        callback(null);
                    }
                    GraphState.addEdge(data.from, data.to);
                };
                if (data.from === data.to) {
                    alert("Connect a node to itself is not allowed");
                    return;
                }
                else if (GraphState.checkAdjacency(data.from, data.to)) {
                    alert("These two edges are already connected.");
                    return;
                }

                apply();
            },
            /*addEdge: (data, callback) => {
                const apply = () => {
                    if (typeof callback === "function") {
                        callback(null);
                    }
                    GraphState.addEdge(data.from, data.to);
                };
                if (data.from === data.to) {
                    if (confirm("Do you want to connect the node to itself?")) {
                        apply();
                    }
                    return;
                }

                apply();
            },*/
            editEdge: (data, callback) => {
                callback(null);
                self.visOptions.manipulation.deleteEdge({ edges: [data.id] });
                self.visOptions.manipulation.addEdge(data);
            },
            deleteEdge: (data, callback) => {
                if (typeof callback === "function") {
                    callback(null);
                }
                data.edges.forEach((v: any) => {
                    let weight = null;
                    const edge = (window.network as any).body.data.edges.get(v);
                    const weightFromLabel = edge.label;
                    if (typeof weightFromLabel !== "undefined") {
                        weight = parseFloat(weightFromLabel);
                    }

                    GraphState.deleteEdge(edge.from, edge.to, weight);
                });
            },
            deleteNode: (data, callback) => {
                callback(null);
                data.nodes.forEach((v: string) => {
                    GraphState.deleteNode(v);
                });
            },
        },
    },

    cancelEdit: (callback) => {
        if (typeof callback === "function") {
            callback(null);
        }
    },

    saveData: async (data, callback, operation, label, color) => {
        callback(null);

        data.label = label;
        data.color = color;
        if (operation === "add") {
            GraphState.addNode(data);
        }
        else if (operation === "editNode") {
            GraphState.editNode(data.id, data.label, data.color);
        }
    },

    nodeLabelIDValidator: (v) => {
        if (GraphState.nodeLabelToID(v) > -1) {
            return true;
        }
        return "Invalid Label or ID";
    },

    applyColors: async () => {
        if (window.settings.getOption("direction")) {
            return;
        }

        const coloring = GraphState.graphProperties.colormode;

        let graphColors : any;
        let chromaticNumber : any;

        alert(coloring);

        if (coloring === 2) {
            graphColors = await GraphState.getProperty("graphColoringWelsh", true);
            chromaticNumber = await GraphState.getProperty("Approx. Chromatic Welsh", true);
        }
        else {
            alert("No correct colormode");
            return;
        }
        
        const addColors = randomColor({ count: chromaticNumber > basicColorsNum+1 ? chromaticNumber - basicColorsNum : 1, luminosity: "light" });

        const colors = [...basicColors, ...addColors];

        // const colors = randomColor({ count: chromaticNumber, luminosity: "light" });
        let G = GraphState.graph;
        (G.getAllNodes() as NodeImmutPlain[]).forEach((v) => {
            G = G.editNode(v.id, { color: colors[graphColors[v.id]] });
        });
        self.setData(GraphState.getGraphData(G), false, false);
    },

    setData: (data, recalcProps = false, graphChanged = true, rearrangeGraph = false) => {
        // Store existing positions in the data if we're supposed to keep the layout
        if (rearrangeGraph) {
            data.nodes.forEach((v) => {
                delete v.x;
                delete v.y;
            });
        }

        if (graphChanged) {
            self.saveState();
        }

        if ("directed" in data && typeof data.directed !== "undefined") {
            window.settings.changeOption("direction", data.directed);
        }
        if ("weighted" in data && typeof data.weighted !== "undefined") {
            window.settings.changeOption("weights", data.weighted);
        }
        const directional = window.settings.getOption("direction") as boolean;
        const weighted = window.settings.getOption("weights") as boolean;

        const g = new GraphImmut(data.nodes, data.edges, directional, weighted);
        GraphState.graph = g;

        // Set a new random seed so that the layout will be different
        self.randomizeNetworkLayoutSeed(window.network as unknown as VisNetworkInternals);
        window.network.setData(GraphState.getGraphAsDataSet(g));
        GraphState.graph = GraphState.setLocations(window.network.getPositions());

        window.network.disableEditMode();
        window.network.enableEditMode();

        if (graphChanged) {
            window.ui.stopLoadingAnimation();
            window.ui.isRunning = {};
            window.ui.terminateAllWebWorkers();
            window.ui.printGraphAlgorithms();
            help.printout("");
            GraphState.setUpToDate();
            GraphState.makeAndPrintProperties(recalcProps);
        }

        self.saveStateLocalStorage();
    },

    saveState: () => {
        if (GraphState.graph === null) {
            return;
        }

        if (GraphState.backHistory.length >= GraphState.maxHistory) {
            GraphState.backHistory.shift();
        }

        GraphState.backHistory.push(self.getStateForSaving());
        GraphState.forwardHistory = [];
        document.getElementsByClassName("icon-undo")!.item(0)!.parentElement!.parentElement!.classList.add("active");
    },

    getStateForSaving: () => {
        const state: any = {};
        Object.keys(GraphState).forEach((k: string) => {
            const v: any = (GraphState as any)[k];
            if (typeof v !== "function") {
                if (typeof v !== "object") {
                    state[k] = v;
                }
                else {
                    if (k === "graph" && v !== null) {
                        state[k] = v;
                    }
                    if (!k.toLowerCase().includes("history")) {
                        state[k] = help.deepCopy(true, Array.isArray(v) ? [] : {}, v);
                    }
                }
            }
        });

        return state as GraphStateHistory;
    },

    undo: () => {
        if (GraphState.backHistory.length > 0) {
            self.applyState(true);
        }
    },

    redo: () => {
        if (GraphState.forwardHistory.length > 0) {
            self.applyState(false);
        }
    },

    applyState: (undo = true, newState: null | GraphStateHistory = null) => {
        const firstLoad = newState !== null;
        const currentState = self.getStateForSaving();

        if (!firstLoad) {
            if (undo) {
                newState = GraphState.backHistory.pop()!;
            }
            else {
                newState = GraphState.forwardHistory.pop()!;
            }
        }

        //@ts-ignore Ignore accessing private props. I do this because saving the state lost the type of the data
        newState.graph = new GraphImmut(newState.graph.nodes, newState.graph.edges, newState.graph.directed, newState.graph.weighted);

        window.settings.changeOption("direction", newState!.graph.isDirected());
        window.settings.changeOption("weights", newState!.graph.isWeighted());

        GraphState.graph = newState!.graph;

        window.network.setData(GraphState.getGraphAsDataSet(GraphState.graph));
        window.network.disableEditMode();
        window.network.enableEditMode();

        window.ui.printGraphAlgorithms();
        help.printout("");

        Object.keys(newState!).forEach((k: string) => {
            const v = newState![k];
            if (typeof v !== "object") {
                (GraphState as any)[k] = v;
            }
            else if (!k.toLowerCase().includes("history") && k.toLowerCase() !== "graph") {
                if (k.toLowerCase() === "uptodate") {
                    Object.keys((GraphState as any)[k]).forEach((oldKey) => {
                        (GraphState as any)[k][oldKey].upToDate = (v as any)[oldKey].upToDate;
                    });
                }
                else {
                    (GraphState as any)[k] = help.deepCopy(true, (GraphState as any)[k], v);
                }
            }
        });

        GraphState.makeAndPrintProperties().then(() => {
            if (undo && !firstLoad) {
                document.getElementsByClassName("icon-redo")!.item(0)!.parentElement!.parentElement!.classList.add("active");
                if (GraphState.backHistory.length === 0) {
                    document.getElementsByClassName("icon-undo")!.item(0)!.parentElement!.parentElement!.classList.remove("active");
                }
                GraphState.forwardHistory.push(currentState);
            }
            else if (!undo && !firstLoad) {
                document.getElementsByClassName("icon-undo")!.item(0)!.parentElement!.parentElement!.classList.add("active");
                if (GraphState.forwardHistory.length === 0) {
                    document.getElementsByClassName("icon-redo")!.item(0)!.parentElement!.parentElement!.classList.remove("active");
                }
                GraphState.backHistory.push(currentState);
            }

            self.saveStateLocalStorage();
        });
    },

    saveStateLocalStorage: () => {
        if (window.settings.checkForLocalStorage()) {
            localStorage.setItem("graphPlayground.lastState", JSON.stringify(self.getStateForSaving()));
        }
    },

    shuffleNetworkLayout: () => {
        self.setData({
            nodes: GraphState.graph.getAllNodes() as NodeImmutPlain[],
            edges: GraphState.graph.getAllEdges() as EdgeImmutPlain[]
        }, false, false, true);
    },

    randomizeNetworkLayoutSeed: (network) => {
        const r = Math.round(Math.random() * 1000000);
        network.layoutEngine.randomSeed = r;
        network.layoutEngine.initialRandomSeed = r;
    },

    addNetworkListeners: (network) => {
        // Enable edit node/edge when double clicking
        network.on("doubleClick", (p: VisNetworkEvent) => {
            if (window.settings.getOption("weights") && "edges" in p && p.edges.length === 1) {
                network.editEdgeMode();
            }
            if ("nodes" in p && p.nodes.length === 1) {
                network.editNode();
            }
        });

        // Save locations of nodes after dragging
        network.on("dragEnd", () => {
            GraphState.graph = GraphState.setLocations(network.getPositions());
            self.saveStateLocalStorage(); // Save the new locations as part of the state
        });

        // Delete nodes/edges when hit "Delete"
        let lastNetworkClickEvent: Event | null = null;
        network.on('click', (event) => {
            lastNetworkClickEvent = event;
        });

        // Delete key to delete node or edge
        document.addEventListener('keyup', (key) => {
            if (key.key === "Delete" && lastNetworkClickEvent !== null) {
                if (self.container.contains((lastNetworkClickEvent as any).event.target)) {
                    if (("edges" in lastNetworkClickEvent && (lastNetworkClickEvent as any).edges.length === 1)
                        || ("nodes" in lastNetworkClickEvent && (lastNetworkClickEvent as any).nodes.length === 1)) {
                        network.deleteSelected();
                    }
                }
            }
        });

        // Undo/Redo keyboard commands
        document.addEventListener("keydown", (e) => {
            if ((e.key.toLowerCase() === 'y' && e.ctrlKey) || (e.key.toLowerCase() === 'z' && e.ctrlKey && e.shiftKey)) {
                self.redo();
            }
            else if (e.key.toLowerCase() === 'z' && e.ctrlKey) {
                self.undo();
            }
        });

        // When clicking off of the network, remove the Delete functionality
        document.addEventListener("click", (e) => {
            if (self.container !== e.target && !self.container.contains(e.target as Node)) {
                lastNetworkClickEvent = null;
            }
        });
    },

};

export default self;
