import gHelp from "./util/graphHelpers";
import help, { ModalFormRow } from './util/genericHelpers';
import GraphState from "./graphState";
import { FlowResult, kColorResult, MSTResult, ShortestPathResult } from "./GraphAlgorithms";
//@ts-ignore
import Worker from "worker-loader!./workers/GraphAlgorithmWorker";
import NodeImmut from "./classes/GraphImmut/NodeImmut";
import EdgeImmut from "./classes/GraphImmut/EdgeImmut";
import GraphImmut from "./classes/GraphImmut/GraphImmut";
import * as languages from "./languages";

interface AlgorithmI {
    name: string;
    directional?: boolean;
    weighted?: boolean;
    applyFunc: () => any;
    display: boolean;
}

const possibleColorModes = {
    "Ordered by Node Label (increasing)": 1,
    "Ordered by Node Label (decreasing)": 2,
    "Ordered by Degree (increasing)": 3,
    "Ordered by Degree (decreasing)": 4
}

const makeAndPrintShortestPath = (title: string, fn: string, weighted: boolean): void => {
    const myName = languages.current.ShortestPath;
    if (UIInteractions.isRunning[myName]) {
        UIInteractions.printAlreadyRunning(myName);
        return;
    }
    UIInteractions.isRunning[myName] = true;

    help.showFormModal(
        ($modal, values) => {
            $modal.modal("hide");

            const source = GraphState.nodeLabelToID(values[0]);
            const sink = GraphState.nodeLabelToID(values[1]);

            const iStartedProgress = UIInteractions.startLoadingAnimation();
            const w = UIInteractions.getWorkerIfPossible(e => {
                let a = e.data;
                w.cleanup();
                if (iStartedProgress) {
                    UIInteractions.stopLoadingAnimation();
                }
                UIInteractions.isRunning[myName] = false;

                if (a === false) {
                    if (fn.includes("dijkstra")) {
                        help.showSimpleModal(
                            languages.current.DijkstraError,
                            languages.current.DijkstraErrorHTML
                        );
                    } else if (fn.includes("bellman")) {
                        help.showSimpleModal(
                            languages.current.BellmanFordError,
                            languages.current.BellmanFordErrorHTML
                        );
                    }
                    return;
                }

                a = a as ShortestPathResult;

                let p = `<h3>${title}</h3><hr>${help.stringReplacement(languages.current.NoPathFromAToB,
                    help.htmlEncode(source.toString()), help.htmlEncode(sink.toString()))}`;

                if (a.pathExists) {
                    p = help.stringReplacement(languages.current.ShortestPathFromAToB, title,
                        GraphState.nodeIDToLabel(source), GraphState.nodeIDToLabel(sink), a.distance);
                    if (weighted) {
                        p += `\n${help.stringReplacement(languages.current.WithWeightedCost, a.cost)}`;
                    }
                    p += "\n\n" + languages.current.UsingPath;

                    p = help.htmlEncode(p);
                    let graph = GraphState.getGraphData(GraphState.graph, false, true);
                    let G = new GraphImmut(graph.nodes, graph.edges, graph.directed, graph.weighted);
                    a.path.forEach((v: number, i: number) => {
                        p += `${help.htmlEncode(GraphState.nodeIDToLabel(v))} &rarr; `;
                        if (i > 0) {
                            G = G.editEdge(a.path[i - 1], v, null, null, "#FF0000") as GraphImmut;
                        }
                    });
                    GraphState.graph = G;
                    window.main.setData(GraphState.getGraphData(G), false, false, false);
                    p = p.slice(0, -8);
                    p = `<h3>${title}</h3><hr>${p}`;
                }

                help.printout(p);
            });
            w.send({
                type: fn,
                args: [source, sink],
                convertToGraphImmut: true,
                graph: window.main.graphState.getGraphData()
            });
        },
        title,
        languages.current.Go,
        [
            {
                label: languages.current.StartNode,
                type: "text",
                validationFunc: window.main.nodeLabelIDValidator
            },
            {
                label: languages.current.EndNode,
                type: "text",
                validationFunc: window.main.nodeLabelIDValidator
            }
        ],
        ($modal) => {
            UIInteractions.isRunning[myName] = false;
            $modal.modal("hide");
        }
    );
};


const makeAndPrintGreedyColoring = (): void => {
    const myName = languages.current.GraphColoringGreedy;
    if (UIInteractions.isRunning[myName]) {
        UIInteractions.printAlreadyRunning(myName);
        return;
    }
    UIInteractions.isRunning[myName] = true;

    help.showFormModal(
        ($modal, values) => {
            $modal.modal("hide");

            const orderingMode = values[0];

            const iStartedProgress = UIInteractions.startLoadingAnimation();
            const w = UIInteractions.getWorkerIfPossible(e => {
                let a = e.data;
                w.cleanup();
                if (iStartedProgress) {
                    UIInteractions.stopLoadingAnimation();
                }
                UIInteractions.isRunning[myName] = false;

                GraphState.graphProperties.colormode = 2;
                GraphState.graphProperties["Approx. Chromatic Greedy"] = a.chromaticNumber;
                GraphState.setUpToDate(true, ["Approx. Chromatic Greedy", "graphColoringGreedy"]);
                (GraphState.state.graphColoringGreedy as {}) = a.colors;

                

                // p += `\nApprox. Chromatic Number from Welsh algorithm: ${a.chromaticNumber}`;


                let p = "Greedy algorithm work with the following ordering of vertices: \n";

                const order : number[] = a.vertexOrder;

                console.log(order);

                order.forEach((v, i) => {
                    p += GraphState.nodeIDToLabel(v) + ", ";
                })

                p += "\n\n";

                // let p = help.stringReplacement(languages.current.NumberOfVertices, colors.length + "");
                p += help.stringReplacement(languages.current.ApproxChromaticNumberIs, a.chromaticNumber + "");

                p += "\n\n";

                const colors = help.flatten(a.colors);
                // colors.forEach((v, i) => {
                //     p += help.stringReplacement(languages.current.VertexGetsColor, GraphState.nodeIDToLabel(i), v + "") + "\n";
                // });

                // p     += `\n${JSON.stringify(help.rotate(a.colors), null, 4)}\n\n`;

                const historyToPrint: {nodeToColor: number, colorsOfNeighbors: {[key: number]: number} }[] = a.history;

                // console.log(historyToPrint);

                // p += "\n\n";

                // history.push({nodeToColor: vertexOrder[curPos], colorsOfNeighbors: coloredAdjacencyList});

                if (historyToPrint != null && window.settings.getOption("stepByStepInfo")) {
                    p += "<h3>Step-by-Step output:</h3><hr>" + "\n";

                    for (let step = 0; step < historyToPrint.length; step++) {

                        const curNode: number = historyToPrint[step].nodeToColor;
                        const colAdjList: { [key: number]: number } = historyToPrint[step].colorsOfNeighbors as {};

                        // console.log(historyToPrint[step]);
                        // console.log("Current node: " + curNode);
                        // console.log(GraphState.nodeIDToLabel(curNode));
                        // console.log(colAdjList);
                        // console.log(typeof colAdjList[0]);
                        // console.log(typeof Object.keys(colAdjList))
                        

                        p += "Step " + (step+1) + " : " + "AL(" + GraphState.nodeIDToLabel(curNode) + ") : ";

                        for (let neighbor in colAdjList) {
                            const nb: number = (neighbor as unknown) as number;
                            if ( colAdjList[neighbor] === -1) {
                                // p += neighbor + " not yet colored; "
                                p += GraphState.nodeIDToLabel(nb) + " not yet colored; "
                            }
                            else {
                                p += GraphState.nodeIDToLabel(nb) + " with color " + colAdjList[neighbor] + "; ";
                            }
                            // p += GraphState.nodeIDToLabel(neighbor) + " with color " + colAdjList[neighbor].toString() + "; ";
                        }

                        p += "--> " + help.stringReplacement(languages.current.VertexGetsColor, GraphState.nodeIDToLabel(curNode), colors[curNode] + "");
                        //p += "--> " + help.stringReplacement(languages.current.VertexGetsColor, GraphState.nodeIDToLabel(curNode), 0colors[curNode].toString()) + "\n";
                        p += "\n";

                    }

                    // console.log(historyToPrint);
                }
                else {
                    p += "No step-by-step output. If desired, please ensure that the checkbox 'Step-by-Step Info' in the 'Graph Options' menu is chosen and rerun the coloring algorithm.";
                }

                p = `<h3>${languages.current.GraphColoringGreedyTitle}</h3><hr>${help.htmlEncode(p)}`;
                


                if (a.chromaticNumber > 6) {
                    p += "As the coloring needs more than the six standard colors additional randomly chosen colors are used. To change their appearence press the button."
                    p += `<br/><button class='btn btn-primary' onclick='main.applyColors()'>${languages.current.ReColor}</button>`;
                }

                help.printout(p);
                window.main.applyColors();

            });
            w.send({
                type: "colorNetworkGreedy",
                args: [orderingMode],
                convertToGraphImmut: true,
                graph: window.main.graphState.getGraphData()
            });
        },
        languages.current.GraphColoringGreedy,
        languages.current.Go,
        [
            {
                type: "select",
                label: languages.current.ColoringMode, 
                optionText: Object.keys(possibleColorModes), 
                optionValues: Object.values(possibleColorModes), 
                initialValue: 0
            }
        ],
        ($modal) => {
            UIInteractions.isRunning[myName] = false;
            $modal.modal("hide");
        }
    );
};


const makeAndPrintkColoringExact = (mode: number): void => {
    
    const myName = (mode === 0) ? languages.current.kColoringBruteForce : languages.current.kColoringBacktracking;

    if (UIInteractions.isRunning[myName]) {
        UIInteractions.printAlreadyRunning(myName);
        return;
    }
    UIInteractions.isRunning[myName] = true;

    const options: ModalFormRow[] = [
        {
        type: "numeric", initialValue: 1, label: languages.current.NumberOfColors, validationFunc: (v) => {
            return v > 0 || languages.current.NumberOfColorsPositiveError;}
        }
    ]
    if (window.settings.getOption("stepByStepInfo")) {
        options.push(
            { 
                type: "numeric", initialValue: 10, label: languages.current.NumberOfSteps, validationFunc: (v) => {
                    return v > 0 || languages.current.NumberOfColorsPositiveError;}
            }
        );
    }
    if (mode === 1) {
        // options.push(
        //     { 
        //         type: "text", label: languages.current.CompleteColoringExplanation 
        //     }
        // );
        options.push(
            { 
                type: "checkbox", initialValue: false, label: languages.current.CompleteColoringExplanation + languages.current.CompleteColoring
            }
        );
    }

    help.showFormModal(
        ($modal, values) => {
            $modal.modal("hide");

            const kColor = values[0];
            let numberOfSteps = -1;
            let completeColoring = -1;

            if (window.settings.getOption("stepByStepInfo")) {
                numberOfSteps = values[1];
            }

            if (mode === 1 && window.settings.getOption("stepByStepInfo")) {
                completeColoring = values[2];
            }
            else if (mode === 1 && !window.settings.getOption("stepByStepInfo")) {
                completeColoring = values[1];
            }
            

            const iStartedProgress = UIInteractions.startLoadingAnimation();
            const w = UIInteractions.getWorkerIfPossible(e => {
                let a = e.data;
                w.cleanup();
                if (iStartedProgress) {
                    UIInteractions.stopLoadingAnimation();
                }
                UIInteractions.isRunning[myName] = false;

                
                a = a as kColorResult;

                // console.log(a.totalSteps);
                // console.log(a.history);

                // return { kColor, kColorable: false, color: [], totalSteps: recAnswer.totalSteps, history };

                GraphState.graphProperties.colormode = 1;

                

                if (GraphState.state.kColorable === null || GraphState.getProperty("Most recent k-color check") == null) {
                    GraphState.graphProperties["Most recent k-color check"] = -1;
                    GraphState.state.kColorable = {};
                    console.log("Newly set up; kColorable and MostRecentKColorCheck");
                }

                // console.log("Check a. kColorable: " + a.kColorable);

                let p = "";

                if (a.kColorable) {
                    

                    GraphState.graphProperties["Most recent k-color check"] = a.kColor;

                    const bestChrNumber = GraphState.graphProperties["Current best guess of chromatic number"];
                    if (bestChrNumber === null) {
                        GraphState.graphProperties["Current best guess of chromatic number"] = a.kColor;
                    }
                    else {
                        GraphState.graphProperties["Current best guess of chromatic number"] = Math.min(a.kColor, bestChrNumber);
                    }


                    GraphState.setUpToDate(true, ["Most recent k-color check", "kColorable", "Current best guess of chromatic number"]); // TODO: What about kColor dictionary if changing the graph?
                    (GraphState.state.kColorable[kColor] as {}) = a.color;

                    // console.log("Saving output from kColor-Algorithm");
                    // console.log(a.color);
                    // console.log(GraphState.state.kColorable[3]);
                    // console.log(GraphState.getProperty("kColorable", true));
                    
                    // console.log("Building output string");

                    p += help.stringReplacement(languages.current.kColoringSuccess, a.kColor + "") + "\n";

                    p += help.stringReplacement(languages.current.kColoringTerminated, a.totalSteps + "");
                    
                    p = (mode === 0) ? `<h3>${languages.current.kColoringBruteForceTitle}</h3><hr>${help.htmlEncode(p)}` : `<h3>${languages.current.kColoringBacktrackingTitle}</h3><hr>${help.htmlEncode(p)}`;
                    
                    if (a.kColor > 6) {
                        p += languages.current.ReColorInfo;
                        p += `<br/><button class='btn btn-primary' onclick='main.applyColors()'>${languages.current.ReColor}</button>`;
                    }

                }
                else {
                    p += help.stringReplacement(languages.current.kColoringFail, a.kColor + "") + "\n";
                    p += help.stringReplacement(languages.current.kColoringCheckedAll, a.totalSteps + "");

                    GraphState.state.kColorable[kColor] = [];

                }

                if (numberOfSteps > 0) {
                    p += "\n\n";
                    p += help.stringReplacement(languages.current.kColoringDocStep1, numberOfSteps + "") + "\n";
                    p += languages.current.kColoringDocStep2;
                    
                    for (let i = 0; i < a.color.length; i++) {
                        p += GraphState.nodeIDToLabel(i) + ", ";
                    };
                    p += "\n";

                    for (let step = 0; step < a.history.length; step++) {
                        p += languages.current.Step + (step+1) + ": " + a.history[step].toString() + "\n";
                    }
                }

                help.printout(p);

                if (a.kColorable) {
                    window.main.applyColors();
                }

            });
            w.send({
                type: "kColoringExact",
                args: [mode, completeColoring, kColor, numberOfSteps],
                graph: window.main.graphState.getGraphData(),
                convertToGraphImmut: true
            });
        },
        (mode === 0) ? languages.current.kColoringBruteForce : languages.current.kColoringBacktracking,
        languages.current.Go,
        options,
        ($modal) => {
            UIInteractions.isRunning[myName] = false;
            $modal.modal("hide");
        }
    );
};

const makeAndPrintComponents = async (stronglyConnected: boolean): Promise<void> => {
    let a = null;
    let cc = languages.current.ConnectedComponents;
    let componentKey = "connectedComponents";

    if (stronglyConnected) {
        if (!window.settings.getOption("direction")) {
            return;
        }
        cc = languages.current.StronglyConnectedComponents;
        componentKey = "stronglyConnectedComponents";
    } else {
        if (window.settings.getOption("direction")) {
            return;
        }
    }

    if (UIInteractions.isRunning[cc]) {
        UIInteractions.printAlreadyRunning(cc);
        return Promise.reject(languages.current.TaskAlreadyRunning);
    }
    UIInteractions.isRunning[cc] = true;

    const iStartedProgress = UIInteractions.startLoadingAnimation();
    const w = UIInteractions.getWorkerIfPossible(e => {
        a = e.data;
        w.cleanup();

        GraphState.graphProperties[cc] = a.count;
        GraphState.setUpToDate(true, [cc, componentKey]);
        GraphState.state[componentKey] = a.components;

        const components = help.flatten(a.components);
        let p = help.stringReplacement(languages.current.NumberOfConnectedComponents, cc, a.count);
        p += "\n\n";

        components.forEach((v, i) => {
            p += help.stringReplacement(languages.current.VertexIsInConnectedComponentNumber, GraphState.nodeIDToLabel(i), v + "") + "\n";
        });

        p += `\n${JSON.stringify(help.rotate(a.components), null, 4)}\n\n`;
        p = `<h3>${cc}</h3><hr>${help.htmlEncode(p)}`;

        if (iStartedProgress) {
            UIInteractions.stopLoadingAnimation();
        }
        UIInteractions.isRunning[cc] = false;

        help.printout(p);
    });
    w.send({
        type: componentKey,
        args: [],
        graph: window.main.graphState.getGraphData(),
        convertToGraphImmut: true
    });
};

class WorkerProxy {
    private readonly worker: Worker;
    private readonly id: number;
    private readonly listener: (e: { data: any }) => any;

    constructor(id: number, w: Worker, listener: ((e: { data: any }) => any)) {
        this.id = id;
        this.worker = w;
        this.listener = listener;
        w.postMessage({ type: "id", id });
        w.onmessage = (e: MessageEvent) => {
            this.listener({ data: e.data.data });
        };
    }

    public send(data: any) {
        this.worker.postMessage(data);
    }

    public cleanup() {
        this.worker.terminate();
        GraphState.workerPool[this.id] = null;
    }
}

export default class UIInteractions {
    public static isRunning: { [index: string]: boolean } = {};
    static getAlgorithms(): AlgorithmI[] {
        return [
            {
                name: languages.current.GetAllDegrees,
                directional: false,
                applyFunc: UIInteractions.getAllDegrees,
                display: true
            },
            {
                name: languages.current.CheckColoring,
                directional: false,
                applyFunc: UIInteractions.checkGraphColoring,
                display: true
            },
            {
                //name: "Graph Coloring Welsh",
                name: languages.current.GraphColoringGreedy,
                directional: false,
                applyFunc: () => {
                    makeAndPrintGreedyColoring();
                },
                display: true
            },
            {
                name: languages.current.kColoringBruteForce,
                directional: false,
                applyFunc: () => {
                    makeAndPrintkColoringExact(0);
                },
                display: true
            },
            {
                name: languages.current.kColoringBacktracking,
                directional: false,
                applyFunc: () => {
                    makeAndPrintkColoringExact(1);
                },
                display: true
            },
            {
                name: languages.current.ConnectedComponents,
                directional: false,
                applyFunc: () => {
                    makeAndPrintComponents(false);
                },
                display: true
            },
            {
                name: languages.current.StronglyConnectedComponents,
                directional: true,
                display: true,
                applyFunc: () => {
                    makeAndPrintComponents(true);
                }
            },
            {
                name: languages.current.BFS,
                directional: false,
                applyFunc: () => {
                    makeAndPrintShortestPath(languages.current.BFS, "breadthFirstSearch", false);
                },
                display: true
            },
            {
                name: languages.current.Dijkstra,
                applyFunc: () => {
                    makeAndPrintShortestPath(languages.current.Dijkstra, "dijkstraSearch", true);
                },
                display: true
            },
            {
                name: languages.current.BellmanFord,
                weighted: true,
                directional: true,
                applyFunc: () => {
                    makeAndPrintShortestPath(languages.current.BellmanFord, "bellmanFord", true);
                },
                display: true
            },
            {
                name: languages.current.FordFulkerson,
                weighted: true,
                directional: true,
                applyFunc: UIInteractions.makeAndPrintFFMCMF,
                display: true
            },
            {
                name: languages.current.KruskalMST,
                weighted: true,
                directional: false,
                applyFunc: UIInteractions.makeAndPrintKruskal,
                display: true
            },
            {
                name: languages.current.Cyclic,
                applyFunc: UIInteractions.makeAndPrintIsCyclic,
                directional: true,
                display: true
            },
            {
                name: languages.current.TopoSort,
                applyFunc: UIInteractions.makeAndPrintTopologicalSort,
                directional: true,
                display: true
            },
            {
                name: languages.current.Eulerian,
                directional: false,
                display: false,
                applyFunc: null
            },
            {
                name: languages.current.Eulerian,
                directional: true,
                display: true,
                applyFunc: UIInteractions.makeAndPrintDirectionalEulerian
            }
        ] as AlgorithmI[];
    }

    static registerListeners(): void {
        const makeSimpleClickListener = (selector: string, fn: () => any) => {
            document.querySelector(selector)!.addEventListener("click", e => {
                e.preventDefault();
                fn();
            });
        };

        makeSimpleClickListener("#print-help-link", UIInteractions.printHelp);
        makeSimpleClickListener("#stop-allworker-link", UIInteractions.terminateAllWebWorkers);
        makeSimpleClickListener("#graph-options-link", UIInteractions.printOptions);
        makeSimpleClickListener("#load-petersen-link", async () => {
            const predefined = (await import("./util/predefinedGraphs")).default;
            window.main.setData(predefined.Petersen(), false, true, true);
        });
        makeSimpleClickListener("#load-konigsberg-link", async () => {
            const predefined = (await import("./util/predefinedGraphs")).default;
            window.main.setData(predefined.Konigsberg(), false, true, true);
        });
        makeSimpleClickListener("#load-complete-link", async () => {
            const predefined = (await import("./util/predefinedGraphs")).default;
            predefined.Complete();
        });
        makeSimpleClickListener("#load-cycle-link", async () => {
            const predefined = (await import("./util/predefinedGraphs")).default;
            predefined.Cycle();
        });
        makeSimpleClickListener("#load-wheel-link", async () => {
            const predefined = (await import("./util/predefinedGraphs")).default;
            predefined.Wheel();
        });
        makeSimpleClickListener("#load-hypercube-link", async () => {
            const predefined = (await import("./util/predefinedGraphs")).default;
            predefined.Hypercube();
        });
        makeSimpleClickListener("#load-custom-link", async () => {
            const predefined = (await import("./util/predefinedGraphs")).default;
            predefined.Custom();
        });
        makeSimpleClickListener("#load-default-color", async () => {
            GraphState.resetColor();
        });
        makeSimpleClickListener("#undo-link", window.main.undo);
        makeSimpleClickListener("#redo-link", window.main.redo);
        makeSimpleClickListener("#calculate-all-properties-link", async () => {
            return GraphState.makeAndPrintProperties(true);
        });
        makeSimpleClickListener("#new-graph-layout-link", window.main.shuffleNetworkLayout);
        makeSimpleClickListener("#import-file-link", async () => {
            const imp = (await import("./dataImportExport")).default;
            imp.makeImportFileModal();
        });
        makeSimpleClickListener("#import-text-link", async () => {
            const imp = (await import("./dataImportExport")).default;
            imp.makeImportTextModal();
        });
        makeSimpleClickListener("#export-file-link", async () => {
            const imp = (await import("./dataImportExport")).default;
            imp.makeExportFileModal();
        });
        makeSimpleClickListener("#export-text-link", async () => {
            const imp = (await import("./dataImportExport")).default;
            imp.makeExportTextModal();
        });
        makeSimpleClickListener("#import-graph-g1", async () => {
            const imp = (await import("./dataImportExport")).default;
            imp.makeImportGraphExercise(0);
        });
        makeSimpleClickListener("#import-graph-g2", async () => {
            const imp = (await import("./dataImportExport")).default;
            imp.makeImportGraphExercise(1);
        });
        makeSimpleClickListener("#import-graph-g3", async () => {
            const imp = (await import("./dataImportExport")).default;
            imp.makeImportGraphExercise(2);
        });
        makeSimpleClickListener("#import-graph-g4", async () => {
            const imp = (await import("./dataImportExport")).default;
            imp.makeImportGraphExercise(3);
        });
        makeSimpleClickListener("#blank-background", async () => {
            const imp = (await import("./dataImportExport")).default;
            imp.setGraphBackground(0);
        });
        makeSimpleClickListener("#import-verkehrskreuzung", async () => {
            const imp = (await import("./dataImportExport")).default;
            imp.setGraphBackground(1);
        });
        makeSimpleClickListener("#import-schweiz", async () => {
            const imp = (await import("./dataImportExport")).default;
            imp.setGraphBackground(2);
        });
        makeSimpleClickListener("#import-sudoku-4x4", async () => {
            const imp = (await import("./dataImportExport")).default;
            imp.setGraphBackground(3);
        });

        (document.querySelector("#fileDropdown") as HTMLAnchorElement).innerText = languages.current.File;
        (document.querySelector("#import-file-link") as HTMLAnchorElement).innerText = languages.current.ImportFile;
        (document.querySelector("#import-text-link") as HTMLAnchorElement).innerText = languages.current.ImportText;
        (document.querySelector("#export-file-link") as HTMLAnchorElement).innerText = languages.current.ExportFile;
        (document.querySelector("#export-text-link") as HTMLAnchorElement).innerText = languages.current.ExportText;

        (document.querySelector("#graphloadDropdown") as HTMLAnchorElement).innerText = languages.current.LoadGraphs;
        (document.querySelector("#import-graph-g1") as HTMLAnchorElement).innerText = "Graph G1";
        (document.querySelector("#import-graph-g2") as HTMLAnchorElement).innerText = "Graph G2";
        (document.querySelector("#import-graph-g3") as HTMLAnchorElement).innerText = "Graph G3";
        (document.querySelector("#import-graph-g4") as HTMLAnchorElement).innerText = "Graph G4";

        (document.querySelector("#setBackgroundDropdown") as HTMLAnchorElement).innerText = languages.current.SetBackground;
        (document.querySelector("#blank-background") as HTMLAnchorElement).innerText = "Reset";
        (document.querySelector("#import-verkehrskreuzung") as HTMLAnchorElement).innerText = "Verkehrskreuzung";
        (document.querySelector("#import-schweiz") as HTMLAnchorElement).innerText = "Karte der Schweiz";
        (document.querySelector("#import-sudoku-4x4") as HTMLAnchorElement).innerText = "Sudoku 4x4";

        (document.querySelector("#calculate-all-properties-link") as HTMLAnchorElement).innerText = languages.current.CalculateAllProperties;
        (document.querySelector("#new-graph-layout-link") as HTMLAnchorElement).innerText = languages.current.NewGraphLayout;
        (document.querySelector("#graph-options-link") as HTMLAnchorElement).innerText = languages.current.GraphOptions;
        (document.querySelector("#print-help-link") as HTMLAnchorElement).innerText = languages.current.Help;

        (document.querySelector("#example-graphs-label") as HTMLHeadingElement).innerText = languages.current.ExampleGraphs;
        (document.querySelector("#load-petersen-link") as HTMLAnchorElement).innerText = languages.current.LoadPetersen;
        (document.querySelector("#load-konigsberg-link") as HTMLAnchorElement).innerText = languages.current.LoadKonigsberg;
        (document.querySelector("#load-complete-link") as HTMLAnchorElement).innerText = languages.current.LoadComplete;
        (document.querySelector("#load-cycle-link") as HTMLAnchorElement).innerText = languages.current.LoadCycle;
        (document.querySelector("#load-wheel-link") as HTMLAnchorElement).innerText = languages.current.LoadWheel;
        (document.querySelector("#load-hypercube-link") as HTMLAnchorElement).innerText = languages.current.LoadHypercube;
        (document.querySelector("#load-custom-link") as HTMLAnchorElement).innerText = languages.current.LoadCustom;

        (document.querySelector("#algorithms-label") as HTMLHeadElement).innerText = languages.current.Algorithms;

        (document.querySelector("#graph-properties-label") as HTMLHeadElement).innerText = languages.current.GraphProperties;
        (document.querySelector("#results-label") as HTMLHeadElement).innerText = languages.current.Results;
    }

    static printHelp(): void {
        help.showSimpleModal(
            languages.current.Help,
            languages.current.IssuesHTML
        );
    }

    static printOptions(): void {
        help.showFormModal(
            ($modal, vals) => {
                $modal.modal("hide");
                if (window.settings.getOption("nodePhysics") !== vals[0]) {
                    window.settings.changeOption("nodePhysics", vals[0]); // Physics
                }

                // if (window.settings.getOption("direction") !== vals[1]) {
                //     window.settings.changeOption("direction", vals[1]);
                //     let G = GraphState.graph;
                //     G = vals[1] ? G.asDirected(true) : G.asUndirected();
                //     // Clear node coloring because graph color doesn't apply to directed graphs
                //     window.main.setData(GraphState.getGraphData(G, true));
                // }
                // if (window.settings.getOption("weights") !== vals[2]) {
                //     window.settings.changeOption("weights", vals[2]);
                //     let G = GraphState.graph;
                //     G = vals[2] ? G.asWeighted() : G.asUnweighted();
                //     window.main.setData(GraphState.getGraphData(G));
                // }
                // if (window.settings.getOption("customColors") !== vals[1]) {
                //     window.settings.changeOption("customColors", vals[1]);
                // }
                if (window.settings.getOption("smoothEdges") !== vals[1]) {
                    window.settings.changeOption("smoothEdges", vals[1]);

                    window.network.setOptions({ edges: { smooth: vals[1] } });
                    let G = GraphState.graph;
                    window.main.setData(GraphState.getGraphData(G));
                    
                }

                if (window.settings.getOption("fastColorChange") !== vals[2]) {
                    window.settings.changeOption("fastColorChange", vals[2]);                  
                }

                if (window.settings.getOption("stepByStepInfo") !== vals[3]) {
                    window.settings.changeOption("stepByStepInfo", vals[3]);                  
                }

            },
            languages.current.Options,
            languages.current.Save,
            [
                {
                    label: languages.current.GraphPhysics,
                    initialValue: window.settings.getOption("nodePhysics"),
                    type: "checkbox"
                },

                // {
                //     label: languages.current.DiGraph,
                //     initialValue: window.settings.getOption("direction"),
                //     type: "checkbox"
                // },
                // {
                //     label: languages.current.WeightedGraph,
                //     initialValue: window.settings.getOption("weights"),
                //     type: "checkbox"
                // },
                // {
                //     label: languages.current.CustomNodeColors,
                //     initialValue: window.settings.getOption("customColors"),
                //     type: "checkbox"
                // }
                {
                    label: languages.current.SmoothEdges,
                    initialValue: window.settings.getOption("smoothEdges"),
                    type: "checkbox"
                },
                
                {
                    label: languages.current.FastColorChange,
                    initialValue: window.settings.getOption("fastColorChange"),
                    type: "checkbox"
                },

                {
                    label: languages.current.StepByStepInfo,
                    initialValue: window.settings.getOption("stepByStepInfo"),
                    type: "checkbox"
                }

            ],
            null
        );
    }

    static terminateAllWebWorkers(): void {
        for (const v of GraphState.workerPool) {
            if (v !== null && v instanceof window.Worker) {
                v.terminate();
            }
        }
        // Cleanup state
        GraphState.workerPool = [];
        UIInteractions.stopLoadingAnimation();
        UIInteractions.isRunning = {};
    }

    static getWorkerIfPossible(onmessage: (d: { data: any }) => any): WorkerProxy {
        let nextIndex = GraphState.workerPool.findIndex(v => {
            return v === null || typeof v === "undefined";
        });
        if (nextIndex === -1) {
            nextIndex = GraphState.workerPool.length;
        }

        const w = new Worker();
        GraphState.workerPool[nextIndex] = w;
        return new WorkerProxy(nextIndex, w, onmessage);
    }

    static startLoadingAnimation() {
        const prog = document.getElementById("task-spinner")!;
        if (prog.style.display !== "flex") {
            prog.style.display = "flex";
            return true;
        }
        return false;
    }

    static stopLoadingAnimation() {
        const prog = document.getElementById("task-spinner")!;
        if (prog.style.display !== "none") {
            prog.style.display = "none";
        }
    }

    static printAlreadyRunning(name?: string) {
        let n = languages.current.ThisTask;
        if (name) {
            n = name;
        }
        help.showSimpleModal(
            languages.current.TaskAlreadyRunning,
            "<p>" + help.stringReplacement(languages.current.TaskAlreadyRunningBody, n) + "</p>"
        );
    }

    static getAllDegrees(): Promise<void> {
        const myName = languages.current.GetAllDegrees;

        if (UIInteractions.isRunning[myName]) {
            UIInteractions.printAlreadyRunning(myName);
            return Promise.reject(languages.current.TaskAlreadyRunning);
        }
        UIInteractions.isRunning[myName] = true;

        return new Promise<void>(async resolve => {
            if (window.settings.getOption("direction")) {
                UIInteractions.isRunning[myName] = false;
                return resolve();
            }

            let a = { degrees: [] };

            

            const printGAD = () => {
            
                const degrees = a.degrees;

                let p = "";
                
                degrees.forEach((v,i) => {
                    p += help.stringReplacement(languages.current.VertexHasDegree, GraphState.nodeIDToLabel(i) + "", v + "") + "\n";
                });

                p = `<h3>${languages.current.GetAllDegreesTitle}</h3><hr>${help.htmlEncode(p)}`;

                help.printout(p);
                
            };

            const iStartedProgress = UIInteractions.startLoadingAnimation();

            
            const w = UIInteractions.getWorkerIfPossible(e => {
                a = e.data;
                printGAD();
                w.cleanup();
                if (iStartedProgress) {
                    UIInteractions.stopLoadingAnimation();
                }
                UIInteractions.isRunning[myName] = false;
                resolve(e.data);
            });
            w.send({
                type: "getAllDegreesWrapper",
                args: [],
                graph: window.main.graphState.getGraphData(),
                convertToGraphImmut: true
            });
            
        });
    }

    static checkGraphColoring(): Promise<void> {
        const myName = languages.current.CheckColoring;

        if (UIInteractions.isRunning[myName]) {
            UIInteractions.printAlreadyRunning(myName);
            return Promise.reject(languages.current.TaskAlreadyRunning);
        }
        UIInteractions.isRunning[myName] = true;

        return new Promise<void>(async resolve => {
            if (window.settings.getOption("direction")) {
                UIInteractions.isRunning[myName] = false;
                return resolve();
            }

            let a = { from: [], to: [],  num: -1, confList: []};

            const printCC = () => {
                let p = help.stringReplacement(languages.current.NumberOfConflicts, a.num + "");

                const conflist = a.confList;
                
                p += "\n\n";

                conflist.forEach((v,i) => {
                    p += help.stringReplacement(languages.current.NodeIsInConflictWith, (i+1).toString(), GraphState.nodeIDToLabel(v[0]), GraphState.nodeIDToLabel(v[1]) + "") + "\n";
                });

                p = `<h3>${languages.current.CheckColoringTitle}</h3><hr>${help.htmlEncode(p)}`;

                help.printout(p);
                
            };

            const iStartedProgress = UIInteractions.startLoadingAnimation();

            
            const w = UIInteractions.getWorkerIfPossible(e => {
                a = e.data;
                printCC();
                w.cleanup();
                if (iStartedProgress) {
                    UIInteractions.stopLoadingAnimation();
                }
                UIInteractions.isRunning[myName] = false;
                resolve(e.data);
            });
            w.send({
                type: "checkColoringByString",
                args: [],
                graph: window.main.graphState.getGraphData(),
                convertToGraphImmut: true
            });
            
        });
    }

    static resetgraphColoringGreedy(): Promise<void> {

        // console.log("Hi, I'm resetgraphColoringGreedy");

        return new Promise<void>(async resolve => {
            GraphState.graphProperties["Approx. Chromatic Greedy"] = null;
            GraphState.setUpToDate(true, ["Approx. Chromatic Greedy", "graphColoringGreedy"]);
            GraphState.state.graphColoringGreedy = null;
        });

    }

    static makeAndPrintgraphColoringWelsh(): Promise<void> {
        const myName = languages.current.GraphColoringWelsh;

        if (UIInteractions.isRunning[myName]) {
            UIInteractions.printAlreadyRunning(myName);
            return Promise.reject(languages.current.TaskAlreadyRunning);
        }
        UIInteractions.isRunning[myName] = true;

        return new Promise<void>(async resolve => {
            if (window.settings.getOption("direction")) {
                UIInteractions.isRunning[myName] = false;
                return resolve();
            }

            // Use cached responses when able
            let a = {
                chromaticNumber: (await GraphState.getProperty("Approx. Chromatic Greedy")) as number,
                colors: GraphState.state.graphColoringGreedy as {}
            };

            const printGC = () => {
                GraphState.graphProperties.colormode = 2;
                GraphState.graphProperties["Approx. Chromatic Greedy"] = a.chromaticNumber;
                GraphState.setUpToDate(true, ["Approx. Chromatic Greedy", "graphColoringGreedy"]);
                (GraphState.state.graphColoringGreedy as {}) = a.colors;

                const colors = help.flatten(a.colors);

                // p += `\nApprox. Chromatic Number from Welsh algorithm: ${a.chromaticNumber}`;

                let p = help.stringReplacement(languages.current.NumberOfVertices, colors.length + "");
                p += "\n" + help.stringReplacement(languages.current.ChromaticNumberIs, a.chromaticNumber + "");

                p += "\n\n";

                colors.forEach((v, i) => {
                    p += help.stringReplacement(languages.current.VertexGetsColor, GraphState.nodeIDToLabel(i), v + "") + "\n";
                });

                /*help.printout(p)
                if (!confirm("Do you want to continue")) {
                    window.main.applyColors();
                    return;    
                }*/
                

                p += `\n${JSON.stringify(help.rotate(a.colors), null, 4)}\n\n`;

                p = `<h3>${languages.current.GraphColoringTitle}</h3><hr>${help.htmlEncode(p)}`;
                p += `<br/><button class='btn btn-primary' onclick='main.applyColors()'>${languages.current.ReColor}</button>`;

                help.printout(p);
                window.main.applyColors();
            };

            const iStartedProgress = UIInteractions.startLoadingAnimation();

            if (!(a.chromaticNumber !== null && (await GraphState.getProperty("graphColoringGreedy")) !== null)) {
                const w = UIInteractions.getWorkerIfPossible(e => {
                    a = e.data;
                    printGC();
                    w.cleanup();
                    if (iStartedProgress) {
                        UIInteractions.stopLoadingAnimation();
                    }
                    UIInteractions.isRunning[myName] = false;
                    resolve(e.data);
                });
                w.send({
                    type: "colorNetworkWelsh",
                    args: [],
                    graph: window.main.graphState.getGraphData(),
                    convertToGraphImmut: true
                });
            } else {
                printGC();
                if (iStartedProgress) {
                    UIInteractions.stopLoadingAnimation();
                }
                UIInteractions.isRunning[myName] = false;
            }
        });
    }

    

    static makeAndPrintDirectionalEulerian(): Promise<void> {
        const myName = languages.current.Eulerian;
        if (UIInteractions.isRunning[myName]) {
            UIInteractions.printAlreadyRunning(myName);
            return Promise.reject(languages.current.TaskAlreadyRunning);
        }
        UIInteractions.isRunning[myName] = true;

        return new Promise<void>(async resolve => {
            if (!window.settings.getOption("direction")) {
                UIInteractions.isRunning[myName] = false;
                return resolve();
            }

            const iStartedProgress = UIInteractions.startLoadingAnimation();
            const w = UIInteractions.getWorkerIfPossible(e => {
                GraphState.graphProperties.eulerian = e.data;
                GraphState.setUpToDate(true, ["eulerian"]);
                w.cleanup();
                if (iStartedProgress) {
                    UIInteractions.stopLoadingAnimation();
                }
                UIInteractions.isRunning[myName] = false;
                resolve(e.data);
            });

            const scc = await GraphState.getProperty("stronglyConnectedComponents", true);

            w.send({
                type: "directionalEulerian",
                args: [gHelp.findVertexDegreesDirectional(GraphState.graph.getFullAdjacency()), scc]
            });
        });
    }

    static makeAndPrintEulerian(ignoreDuplicate = false): Promise<void> {
        const myName = languages.current.Eulerian;
        if (UIInteractions.isRunning[myName]) {
            if (ignoreDuplicate) {
                return Promise.resolve();
            }
            UIInteractions.printAlreadyRunning(myName);
            return Promise.reject(languages.current.TaskAlreadyRunning);
        }
        UIInteractions.isRunning[myName] = true;

        return new Promise<void>(async resolve => {
            if (window.settings.getOption("direction")) {
                UIInteractions.isRunning[myName] = false;
                return resolve(UIInteractions.makeAndPrintDirectionalEulerian());
            }

            const iStartedProgress = UIInteractions.startLoadingAnimation();
            const cc = await GraphState.getProperty("connectedComponents", true);

            const w = UIInteractions.getWorkerIfPossible(e => {
                GraphState.graphProperties.eulerian = e.data;
                GraphState.setUpToDate(true, ["eulerian"]);
                if (iStartedProgress) {
                    UIInteractions.stopLoadingAnimation();
                }
                UIInteractions.isRunning[myName] = false;
                w.cleanup();
                resolve(e.data);
            });
            w.send({
                type: "hasEulerianCircuit",
                args: [GraphState.graph.getAllOutDegrees(), cc]
            });
        });
    }

    static makeAndPrintFFMCMF(): void {
        if (!window.settings.getOption("direction") || !window.settings.getOption("weights")) {
            return;
        }
        const myName = languages.current.FordFulkerson;
        if (UIInteractions.isRunning[myName]) {
            UIInteractions.printAlreadyRunning(myName);
            return;
        }
        UIInteractions.isRunning[myName] = true;

        help.showFormModal(
            async ($modal, values) => {
                $modal.modal("hide");

                const source = GraphState.nodeLabelToID(values[0]);
                const sink = GraphState.nodeLabelToID(values[1]);

                let a: boolean | FlowResult | null = null;

                const cb = () => {
                    let p = `<h3>${languages.current.FordFulkerson}</h3><hr>${help.stringReplacement(languages.current.NoPathFromAToB,
                        help.htmlEncode(GraphState.nodeIDToLabel(source)), help.htmlEncode(GraphState.nodeIDToLabel(sink)))}`;

                    if (a === false) {
                        help.printout(p);
                        return;
                    }
                    a = a as { maxFlow: number; flowPath: any[] };

                    p = `${languages.current.FordFulkersonMaxFlowMinCut} ${help.stringReplacement(languages.current.MaxFlowFromAToB,
                        GraphState.nodeIDToLabel(source), GraphState.nodeIDToLabel(sink), a.maxFlow + "")}`;
                    p += `\n\n${languages.current.UsingCapacities}\n\n`;
                    p = help.htmlEncode(p);
                    a.flowPath.forEach(v => {
                        p += help.stringReplacement(languages.current.FlowWithCapacity, GraphState.nodeIDToLabel(v.from),
                            GraphState.nodeIDToLabel(v.to), v.flow + "", v.capacity + "");
                        p += "\n";
                    });
                    p = p.trim();
                    p = `<h3>${languages.current.FordFulkersonMaxFlowMinCut}</h3><hr>` + p;

                    help.printout(p);
                };

                const iStartedProgress = UIInteractions.startLoadingAnimation();
                const w = UIInteractions.getWorkerIfPossible(e => {
                    a = e.data;
                    UIInteractions.isRunning[myName] = false;
                    cb();
                    if (iStartedProgress) {
                        UIInteractions.stopLoadingAnimation();
                    }
                    w.cleanup();
                });
                w.send({
                    type: "fordFulkerson",
                    args: [source, sink],
                    convertToGraphImmut: true,
                    graph: window.main.graphState.getGraphData()
                });
            },
            languages.current.FordFulkersonMaxFlowMinCut,
            languages.current.Go,
            [
                {
                    label: languages.current.SourceNode,
                    type: "text",
                    validationFunc: window.main.nodeLabelIDValidator
                },
                {
                    label: languages.current.SinkNode,
                    type: "text",
                    validationFunc: window.main.nodeLabelIDValidator
                }
            ],
            ($modal) => {
                UIInteractions.isRunning[myName] = false;
                $modal.modal("hide");
            }
        );
    }

    static makeAndPrintKruskal(): void {
        if (window.settings.getOption("direction") || !window.settings.getOption("weights")) {
            return;
        }

        const myName = languages.current.KruskalMST;
        if (UIInteractions.isRunning[myName]) {
            UIInteractions.printAlreadyRunning(myName);
            return;
        }
        UIInteractions.isRunning[myName] = true;

        const iStartedProgress = UIInteractions.startLoadingAnimation();
        const w = UIInteractions.getWorkerIfPossible(e => {
            const a: MSTResult = e.data;
            w.cleanup();

            let p = help.stringReplacement(languages.current.KruskalMSTTotalWeight, a.totalWeight + "");
            p += `\n\n${languages.current.UsingEdges}\n\n`;
            p = help.htmlEncode(p);
            a.mst.forEach(v => {
                p += `${GraphState.nodeIDToLabel(new EdgeImmut(v).getFrom())}&rarr;`;
                p += `${GraphState.nodeIDToLabel(new EdgeImmut(v).getTo())}\n`;
            });
            p = p.trim();
            p = `<h3>${languages.current.KruskalMST}</h3><hr>${p}`;

            if (iStartedProgress) {
                UIInteractions.stopLoadingAnimation();
            }
            UIInteractions.isRunning[myName] = false;

            help.printout(p);
        });
        w.send({
            type: "kruskal",
            args: [],
            convertToGraphImmut: true,
            graph: window.main.graphState.getGraphData()
        });
    }

    static makeAndPrintIsCyclic(): Promise<void> {
        if (!window.settings.getOption("direction")) {
            return Promise.resolve();
        }

        const myName = languages.current.Cyclic;
        if (UIInteractions.isRunning[myName]) {
            UIInteractions.printAlreadyRunning(myName);
            return Promise.reject(languages.current.TaskAlreadyRunning);
        }
        UIInteractions.isRunning[myName] = true;

        return new Promise<void>(resolve => {
            const iStartedProgress = UIInteractions.startLoadingAnimation();
            const w = UIInteractions.getWorkerIfPossible(e => {
                GraphState.graphProperties.cyclic = e.data;
                GraphState.setUpToDate(true, ["cyclic"]);
                w.cleanup();
                if (iStartedProgress) {
                    UIInteractions.stopLoadingAnimation();
                }
                UIInteractions.isRunning[myName] = false;
                resolve();
            });
            w.send({
                type: "isGraphCyclic",
                args: [],
                convertToGraphImmut: true,
                graph: window.main.graphState.getGraphData()
            });
        });
    }

    static makeAndPrintTopologicalSort(): void {
        if (!window.settings.getOption("direction")) {
            return;
        }

        const myName = languages.current.TopoSort;
        if (UIInteractions.isRunning[myName]) {
            UIInteractions.printAlreadyRunning(myName);
            return;
        }
        UIInteractions.isRunning[myName] = true;

        const iStartedProgress = UIInteractions.startLoadingAnimation();
        const w = UIInteractions.getWorkerIfPossible(e => {
            const a: boolean | NodeImmut[] = e.data;
            w.cleanup();

            if (iStartedProgress) {
                UIInteractions.stopLoadingAnimation();
            }
            UIInteractions.isRunning[myName] = false;

            if (a === true) {
                GraphState.graphProperties.cyclic = true;
                GraphState.setUpToDate(true, ["cyclic"]);
                help.printout(languages.current.TopoSortErrorHTML);
                return;
            }

            let p = languages.current.TopoSort + ":\n\n";
            p = help.htmlEncode(p);
            (a as any[]).forEach(v => {
                p += `${GraphState.nodeIDToLabel(v.id)}, `;
            });
            p = p.slice(0, -2);
            p = `<h3>${languages.current.TopoSort}</h3><hr>${p}`;

            help.printout(p);
        });
        w.send({
            type: "topologicalSort",
            args: [],
            convertToGraphImmut: true,
            graph: window.main.graphState.getGraphData()
        });
    }

    // display only the graph algorithms that are suited for directional, weighted graphs
    static printGraphAlgorithms(): void {
        const $div = document.getElementById("algorithms-pane")!;
        $div.innerHTML = "";
        const directional = window.settings.getOption("direction");
        const weighted = window.settings.getOption("weights");

        const addAlgoToPane = (alg: AlgorithmI) => {
            const navlink = document.createElement("a");
            navlink.classList.add("nav-link");
            navlink.setAttribute("href", "#");
            navlink.innerText = alg.name;
            navlink.addEventListener("click", e => {
                e.preventDefault();
                alg.applyFunc();
            });

            $div.appendChild(navlink);
        };

        const a = UIInteractions.getAlgorithms();
        a.forEach(alg => {
            if (!alg.display) {
                return;
            }
            if (("directional" in alg && alg.directional === directional) || !("directional" in alg)) {
                if (("weighted" in alg && alg.weighted === weighted) || !("weighted" in alg)) {
                    addAlgoToPane(alg);
                }
            } else if (("weighted" in alg && alg.weighted === weighted) || !("weighted" in alg)) {
                if (("directional" in alg && alg.directional === directional) || !("directional" in alg)) {
                    addAlgoToPane(alg);
                }
            }
        });
    }
}
