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
    tooltip: string;
    directional?: boolean;
    weighted?: boolean;
    applyFunc: () => any;
    display: boolean;
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
        languages.current.Go, languages.current.Cancel,
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

    const possibleColorModes = {
        [languages.current.IncNodeLabel]: 1,
        [languages.current.DecNodeLabel]: 2,
        [languages.current.IncDegree]: 3,
        [languages.current.DecDegree]: 4
    }
    
    const possibleColorModesArray = ["", languages.current.IncNodeLabel, languages.current.DecNodeLabel, languages.current.IncDegree, languages.current.DecDegree];
    

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

                let p = help.stringReplacement(languages.current.GreedyWorkedOrder, possibleColorModesArray[orderingMode] + "") + "\n";

                const order : number[] = a.vertexOrder;

                order.forEach((v, i) => {
                    p += GraphState.nodeIDToLabel(v) + ", ";
                })

                p += "\n\n";

                p += help.stringReplacement(languages.current.ApproxChromaticNumberIs, a.chromaticNumber + "");

                p += "\n";

                const colors = help.flatten(a.colors);
                
                const historyToPrint: {nodeToColor: number, colorsOfNeighbors: {[key: number]: number} }[] = a.history;

                let p2 = "";

                if (historyToPrint != null && window.settings.getOption("stepByStepInfo")) {
                    
                    
                    for (let step = 0; step < historyToPrint.length; step++) {

                        const curNode: number = historyToPrint[step].nodeToColor;
                        const colAdjList: { [key: number]: number } = historyToPrint[step].colorsOfNeighbors as {};

                        p2 += languages.current.Step + (step+1) + " : " + (step < 10 ? "\t\t": "\t") + "AL(" + GraphState.nodeIDToLabel(curNode) + ") : \t";

                        for (let neighbor in colAdjList) {
                            const nb: number = (neighbor as unknown) as number;
                            p2 += GraphState.nodeIDToLabel(nb) + languages.current.Has + colAdjList[neighbor] + "; \t";
                        }

                        p2 += "\u2192 " + help.stringReplacement(languages.current.VertexGetsThereforeColor, GraphState.nodeIDToLabel(curNode), colors[curNode] + "");
                        p2 += "\n";

                    }

                    p2  = `<hr><h6>${languages.current.StepByStepOutput}</h6>${help.htmlEncode(p2)}`;

                    

                }
                else {
                    p2 += `<hr>${languages.current.IfDesiredActiveStepByStep}${help.htmlEncode(p2)}`;
                }

                p = `<h3>${languages.current.GraphColoringGreedyTitle}</h3><hr>${help.htmlEncode(p)}` + p2;
                


                if (a.chromaticNumber > 6) {
                    p += `<hr>${languages.current.RecolorAddColors}` + "\n";
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
        languages.current.Go, languages.current.Cancel,
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


const makeAndPrintkColoringExact = (mode: number, constrainedColoring: boolean): void => {
    
    const myName = (mode === 0) ? languages.current.kColoringBruteForce : (constrainedColoring ? languages.current.kColoringConstrainedBacktracking : languages.current.kColoringBacktracking);

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

    help.showFormModal(
        ($modal, values) => {
            $modal.modal("hide");

            const kColor = values[0];
            let numberOfSteps = -1;

            if (window.settings.getOption("stepByStepInfo")) {
                numberOfSteps = values[1];
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

                GraphState.graphProperties.colormode = 1;

                

                if (GraphState.state.kColorable === null || GraphState.getProperty("Most recent k-color check") == null) {
                    GraphState.graphProperties["Most recent k-color check"] = -1;
                    GraphState.state.kColorable = {};
                }

                GraphState.graphProperties["Most recent k-color check"] = a.kColor;
                (GraphState.state.kColorable[kColor] as {}) = a.color;

                let p = "";
                GraphState.setUpToDate(true, ["Most recent k-color check", "kColorable"]); // TODO: What about kColor dictionary if changing the graph?
                

                if (constrainedColoring) {
                    p += languages.current.FollowingConstraints + "\n";
                    for (let i = 0; i < a.color.length; i++) {
                        if (a.given[i]) {
                            p += GraphState.nodeIDToLabel(i) + languages.current.MustBe + a.color[i].toString() + "\t";
                        }
                    };
                    p += "\n\n";

                }

                if (a.kColorable) {
                    
                    const bestChrNumber = GraphState.graphProperties["Current best guess of chromatic number"];
                    if (bestChrNumber === null) {
                        GraphState.graphProperties["Current best guess of chromatic number"] = a.kColor;
                    }
                    else {
                        GraphState.graphProperties["Current best guess of chromatic number"] = Math.min(a.kColor, bestChrNumber);
                    }
                    GraphState.setUpToDate(true, ["Current best guess of chromatic number"]);


                    

                    p += help.stringReplacement(languages.current.kColoringSuccess, a.kColor + "") + "\n";

                    p += help.stringReplacement(languages.current.kColoringTerminated, a.totalSteps + "");
                    
                    // p = (mode === 0) ? `<h3>${languages.current.kColoringBruteForceTitle}</h3><hr>${help.htmlEncode(p)}` : `<h3>${languages.current.kColoringBacktrackingTitle}</h3><hr>${help.htmlEncode(p)}`;
                    
                    // if (a.kColor > 6) {
                    //     p += languages.current.ReColorInfo;
                    //     p += `<br/><button class='btn btn-primary' onclick='main.applyColors()'>${languages.current.ReColor}</button>`;
                    // }

                }
                else {
                    p += help.stringReplacement(languages.current.kColoringFail, a.kColor + "") + "\n";
                    p += help.stringReplacement(languages.current.kColoringCheckedAll, a.totalSteps + "");

                    GraphState.state.kColorable[kColor] = [];

                }

                let p2 = "";

                if (numberOfSteps > 0) {
                    p2 += help.stringReplacement(languages.current.kColoringDocStep1, numberOfSteps + "") + "\n";
                    p2 += languages.current.kColoringDocStep2 + "\n";
                    
                    p2 += languages.current.Vertex + "\t\t";

                    for (let i = 0; i < a.color.length; i++) {
                        p2 += GraphState.nodeIDToLabel(i) + "\t";
                    };
                    p2 += "\n";
                                     

                    for (let step = 0; step < a.history.length; step++) {
                        p2 += languages.current.Step + (step+1) + ": " + (step > 100 ? "": "\t") + a.history[step].toString().replace(/,/g, '\t') + "\n";
                    }
                    

                    p2  = `<hr><h6>${languages.current.StepByStepOutput}</h6>${help.htmlEncode(p2)}`;

                }
                else {
                    p2 += `<hr>${languages.current.IfDesiredActiveStepByStep}${help.htmlEncode(p2)}`;
                }

                if (mode === 0) {
                    p = `<h3>${languages.current.kColoringBruteForceTitle}</h3><hr>${help.htmlEncode(p)}` + p2;
                }
                else if (mode === 1 && !constrainedColoring) {
                    p = `<h3>${languages.current.kColoringBacktrackingTitle}</h3><hr>${help.htmlEncode(p)}` + p2;
                }
                else if (mode === 1 && constrainedColoring) {
                    p = `<h3>${languages.current.kColoringConstrainedTitle}</h3><hr>${help.htmlEncode(p)}` + p2;
                }

                if (a.kColor > 6) {
                    p += `<hr>${languages.current.RecolorAddColors}` + "\n";
                    p += `<br/><button class='btn btn-primary' onclick='main.applyColors()'>${languages.current.ReColor}</button>`;
                }

                help.printout(p);

                if (! (constrainedColoring && !a.kColorable)) {
                    window.main.applyColors();
                }

            });
            w.send({
                type: "kColoringExact",
                args: [mode, constrainedColoring, kColor, numberOfSteps],
                graph: window.main.graphState.getGraphData(),
                convertToGraphImmut: true
            });
        },
        (mode === 0) ? languages.current.kColoringBruteForce : languages.current.kColoringBacktracking,
        languages.current.Go, languages.current.Cancel,
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
                name: languages.current.GraphColoringGreedy,
                tooltip: "Färbt die Knoten des Graphen mithilfe des Greedy-Färbungsalgorithmus ein. Dabei können vier vorkonfigurierte Knotenreihenfolgen ausgewählt werden: \n a) alphabetisch aufsteigend nach Namen \n b) alphabetisch absteigend nach Namen \n c) von grossem zu kleinem Knotengrad \n d) von kleinem zu grossem Knotengrad.\n\nUnter 'Optionen' kann weiter eingestellt werden, ob eine Schritt-für-Schritt Ausgabe in Textform gewünscht wird.",
                directional: false,
                applyFunc: () => {
                    makeAndPrintGreedyColoring();
                },
                display: true
            },
            {
                name: languages.current.kColoringBruteForce,
                tooltip: "Versucht die Knoten des Graphen mithilfe der vorgegebenen Anzahl Farben k einzufärben, indem alle möglichen Farbkombinationen für die Knoten ausprobiert werden (egal zulässig oder nicht). Das Resultat wird unter 'Resultate' im unteren Teil des Fensters ausgegeben. \n\nUnter 'Optionen' kann weiter eingestellt werden, ob die getesteten Farbkombinationen in Textform ausgegeben werden sollen. Im folgenden Menü kann gewählt werden, wie viele dieser Farbkombinationen aufgelistet werden sollen.",
                directional: false,
                applyFunc: () => {
                    makeAndPrintkColoringExact(0, false);
                },
                display: true
            },
            {
                name: languages.current.kColoringBacktracking,
                tooltip: "Versucht die Knoten des Graphen mithilfe der vorgegebenen Anzahl Farben k einzufärben, indem Farbkombinationen mittels Backtracking-Algorithmus durchgetestet werden. Das Resultat wird unter 'Resultate' im unteren Teil des Fensters ausgegeben. \n\nUnter 'Optionen' kann weiter eingestellt werden, ob die getesteten Farbkombinationen in Textform ausgegeben werden sollen. Im folgenden Menü kann gewählt werden, wie viele dieser Farbkombinationen aufgelistet werden sollen.",
                directional: false,
                applyFunc: () => {
                    makeAndPrintkColoringExact(1, false);
                },
                display: true
            },
            {
                name: languages.current.kColoringConstrainedBacktracking,
                tooltip: "Vor dem Start dieses Algorithmus können von Hand gewisse Knoten schon eingefärbt werden. Dann versucht der Algorithmus die verbleibenden Knoten mit der vorgegebenen Anzahl Farben k zulässig einzufärben. Die Vorgehensweise ist identisch zum Backtracking-Algorithmus. Das Resultat wird unter 'Resultate' im unteren Teil des Fensters ausgegeben. \n\nUnter 'Optionen' kann weiter eingestellt werden, ob die getesteten Farbkombinationen in Textform ausgegeben werden sollen. Im folgenden Menü kann gewählt werden, wie viele dieser Farbkombinationen aufgelistet werden sollen.",
                directional: false,
                applyFunc: () => {
                    makeAndPrintkColoringExact(1, true);
                },
                display: true
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

        makeSimpleClickListener("#print-about-link", UIInteractions.printAbout);
        makeSimpleClickListener("#stop-allworker-link", UIInteractions.terminateAllWebWorkers);
        makeSimpleClickListener("#graph-options-link", UIInteractions.printOptions);
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
        makeSimpleClickListener("#load-random-link", async () => {
            const predefined = (await import("./util/predefinedGraphs")).default;
            predefined.RandomGraph();
        });
        makeSimpleClickListener("#load-custom-link", async () => {
            const predefined = (await import("./util/predefinedGraphs")).default;
            predefined.Custom();
        });
        makeSimpleClickListener("#load-default-color-link", async () => {
            GraphState.resetColor();
        });
        makeSimpleClickListener("#get-vertex-degrees-link", async () => {
            UIInteractions.getAllDegrees();
        });
        makeSimpleClickListener("#check-coloring-link", async () => {
            UIInteractions.checkGraphColoring();
        });
        makeSimpleClickListener("#undo-link", window.main.undo);
        makeSimpleClickListener("#redo-link", window.main.redo);
        makeSimpleClickListener("#new-graph-layout-link", window.main.shuffleNetworkLayout);
        makeSimpleClickListener("#import-file-link", async () => {
            const imp = (await import("./dataImportExport")).default;
            imp.makeImportFileModal();
        });
        makeSimpleClickListener("#export-file-link", async () => {
            const imp = (await import("./dataImportExport")).default;
            imp.makeExportFileModalJSON();
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
        makeSimpleClickListener("#import-graph-g5", async () => {
            const imp = (await import("./dataImportExport")).default;
            imp.makeImportGraphExercise(4);
        });
        makeSimpleClickListener("#import-graph-g6", async () => {
            const imp = (await import("./dataImportExport")).default;
            imp.makeImportGraphExercise(5);
        });
        makeSimpleClickListener("#import-graph-g7", async () => {
            const imp = (await import("./dataImportExport")).default;
            imp.makeImportGraphExercise(6);
        });
        makeSimpleClickListener("#import-graph-g8", async () => {
            const imp = (await import("./dataImportExport")).default;
            imp.makeImportGraphExercise(7);
        });
        makeSimpleClickListener("#import-graph-g9", async () => {
            const imp = (await import("./dataImportExport")).default;
            imp.makeImportGraphExercise(8);
        });
        makeSimpleClickListener("#import-graph-g10", async () => {
            const imp = (await import("./dataImportExport")).default;
            imp.makeImportGraphExercise(9);
        });
        makeSimpleClickListener("#import-graph-gch", async () => {
            const imp = (await import("./dataImportExport")).default;
            imp.makeImportGraphExercise(10);
        });
        makeSimpleClickListener("#import-graph-g4x4", async () => {
            const imp = (await import("./dataImportExport")).default;
            imp.makeImportGraphExercise(11);
        });
        makeSimpleClickListener("#blank-background", async () => {
            const imp = (await import("./dataImportExport")).default;
            imp.setGraphBackground(0);
        });
        makeSimpleClickListener("#import-verkehrskreuzung", async () => {
            const imp = (await import("./dataImportExport")).default;
            imp.setGraphBackground(1);
        });
        makeSimpleClickListener("#import-bundeslaender", async () => {
            const imp = (await import("./dataImportExport")).default;
            imp.setGraphBackground(2);
        });
        makeSimpleClickListener("#import-schweiz", async () => {
            const imp = (await import("./dataImportExport")).default;
            imp.setGraphBackground(3);
        });
        makeSimpleClickListener("#import-sudoku-3x3", async () => {
            const imp = (await import("./dataImportExport")).default;
            imp.setGraphBackground(4);
        });
        makeSimpleClickListener("#import-sudoku-4x4", async () => {
            const imp = (await import("./dataImportExport")).default;
            imp.setGraphBackground(5);
        });
        makeSimpleClickListener("#import-sudoku-5x5", async () => {
            const imp = (await import("./dataImportExport")).default;
            imp.setGraphBackground(6);
        });

        (document.querySelector("#fileDropdown") as HTMLAnchorElement).innerText = languages.current.File;
        (document.querySelector("#graphDropdown") as HTMLAnchorElement).innerText = languages.current.BuildGraphs;
        (document.querySelector("#import-file-link") as HTMLAnchorElement).innerText = languages.current.ImportFile;
        (document.querySelector("#export-file-link") as HTMLAnchorElement).innerText = languages.current.ExportFile;

        (document.querySelector("#graphloadDropdown") as HTMLAnchorElement).innerText = languages.current.LoadGraphs;
        (document.querySelector("#import-graph-g1") as HTMLAnchorElement).innerText = "Graph G1";
        (document.querySelector("#import-graph-g2") as HTMLAnchorElement).innerText = "Graph G2";
        (document.querySelector("#import-graph-g3") as HTMLAnchorElement).innerText = "Graph G3";
        (document.querySelector("#import-graph-g4") as HTMLAnchorElement).innerText = "Graph G4";
        (document.querySelector("#import-graph-g5") as HTMLAnchorElement).innerText = "Graph G5";
        (document.querySelector("#import-graph-g6") as HTMLAnchorElement).innerText = "Graph G6";
        (document.querySelector("#import-graph-g7") as HTMLAnchorElement).innerText = "Graph G7";
        (document.querySelector("#import-graph-g8") as HTMLAnchorElement).innerText = "Graph G8";
        (document.querySelector("#import-graph-g9") as HTMLAnchorElement).innerText = "Graph G9";
        (document.querySelector("#import-graph-g10") as HTMLAnchorElement).innerText = "Graph G10";
        (document.querySelector("#import-graph-gch") as HTMLAnchorElement).innerText = "Graph CH";
        (document.querySelector("#import-graph-g4x4") as HTMLAnchorElement).innerText = "Graph 4x4";

        (document.querySelector("#setBackgroundDropdown") as HTMLAnchorElement).innerText = languages.current.SetBackground;
        (document.querySelector("#blank-background") as HTMLAnchorElement).innerText = "Reset";
        (document.querySelector("#import-verkehrskreuzung") as HTMLAnchorElement).innerText = "Verkehrskreuzung";
        (document.querySelector("#import-bundeslaender") as HTMLAnchorElement).innerText = "Karte der Bundesländer";
        (document.querySelector("#import-schweiz") as HTMLAnchorElement).innerText = "Karte der Schweiz";
        (document.querySelector("#import-sudoku-3x3") as HTMLAnchorElement).innerText = "Sudoku 3x3";
        (document.querySelector("#import-sudoku-4x4") as HTMLAnchorElement).innerText = "Sudoku 4x4";
        (document.querySelector("#import-sudoku-5x5") as HTMLAnchorElement).innerText = "Sudoku 5x5";

        (document.querySelector("#new-graph-layout-link") as HTMLAnchorElement).innerText = languages.current.NewGraphLayout;
        (document.querySelector("#load-default-color-link") as HTMLAnchorElement).innerText = languages.current.LoadDefaultColor;
        (document.querySelector("#get-vertex-degrees-link") as HTMLAnchorElement).innerText = languages.current.GetAllDegrees;
        (document.querySelector("#check-coloring-link") as HTMLAnchorElement).innerText = languages.current.CheckColoring;

        (document.querySelector("#graph-options-link") as HTMLAnchorElement).innerText = languages.current.Options;
        (document.querySelector("#stop-allworker-link") as HTMLAnchorElement).innerText = languages.current.StopTasks;
        (document.querySelector("#print-about-link") as HTMLAnchorElement).innerText = languages.current.AboutShort;

        (document.querySelector("#graph-tool-label") as HTMLHeadingElement).innerText = languages.current.GraphTools;
        (document.querySelector("#load-complete-link") as HTMLAnchorElement).innerText = languages.current.LoadComplete;
        (document.querySelector("#load-cycle-link") as HTMLAnchorElement).innerText = languages.current.LoadCycle;
        (document.querySelector("#load-wheel-link") as HTMLAnchorElement).innerText = languages.current.LoadWheel;
        (document.querySelector("#load-custom-link") as HTMLAnchorElement).innerText = languages.current.LoadCustom;
        (document.querySelector("#load-random-link") as HTMLAnchorElement).innerText = languages.current.LoadRandom;

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

    static printAbout(): void {
        help.showSimpleModal(
            languages.current.About,
            languages.current.AboutHTML
        );
    }

    static printOptions(): void {
        help.showFormModal(
            ($modal, vals) => {
                $modal.modal("hide");
                if (window.settings.getOption("nodePhysics") !== vals[0]) {
                    window.settings.changeOption("nodePhysics", vals[0]); // Physics
                }
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
            languages.current.Save, languages.current.Cancel,
            [
                {
                    label: languages.current.GraphPhysics,
                    initialValue: window.settings.getOption("nodePhysics"),
                    type: "checkbox"
                },
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

            let a = { degrees: [], maxDegree: 0 };

            

            const printGAD = () => {
            
                const degrees = a.degrees;
                const maxDegrees = a.maxDegree;

                let p = "";
                
                degrees.forEach((v,i) => {
                    p += help.stringReplacement(languages.current.VertexHasDegree, GraphState.nodeIDToLabel(i) + "", v + "") + "\n";
                });


                p += "\n" + help.stringReplacement(languages.current.GraphHasVertexDegree, maxDegrees + "");

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
            languages.current.Go, languages.current.Cancel,
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
            navlink.setAttribute("data-toggle", "tooltip");
            navlink.setAttribute("data-placement", "auto");
            navlink.setAttribute("data-html","true");
            navlink.title = alg.tooltip;
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
