"use strict";

import help from './util/genericHelpers';
import GraphImmut from './classes/GraphImmut/GraphImmut';
import { EdgeImmutPlain } from "./classes/GraphImmut/EdgeImmut";
import { NodeImmutPlain } from "./classes/GraphImmut/NodeImmut";
import GraphState from "./graphState";
import { GraphPlain } from "./util/predefinedGraphs";
import * as languages from "./languages";

const exportedTextSelector = "exportedText";

const self = {
    importByString: (string: string, format: string): void => {
        if (format.toLowerCase() === "json") {
            try {
                const n = JSON.parse(string);
                if ("nodes" in n && "edges" in n) {
                    window.network.setData({}); // Clear out the existing network in order to import the proper
                    // locations
                    window.main.setData(n, false, true, false);
                }
                else {
                    help.showSimpleModal(languages.current.DataImportError,
                        `<p>${languages.current.DataImportErrorText}</p>`);
                }
            }
            catch (err) {
                help.showSimpleModal(languages.current.JsonParseError, `<p>${languages.current.JsonParseErrorText}</p><pre>${err}</pre>`);
            }
        }
        else if (format.toLowerCase() === "dimacs") {
            const lines = string.split(/\r?\n/);
            let graph: GraphImmut | null = null;
            let error = false;
            lines.forEach((l) => {
                const vals = l.split(/\s+/);
                if (vals[0].toLowerCase() === "p") {
                    if (vals[1].toLowerCase() !== "edge") {
                        help.showSimpleModal(languages.current.DimacsParseError,
                            `<p>${help.htmlEncode(languages.current.DimacsParseErrorText)}</p>`);
                        error = true;
                        return;
                    }
                    graph = new GraphImmut(parseInt(vals[2]));
                }
                else if (vals[0].toLowerCase() === "e" && graph !== null) {
                    graph = graph.addEdge(parseInt(vals[1]) - 1, parseInt(vals[2]) - 1);
                }
            });

            if (graph === null && !error) {
                help.showSimpleModal(languages.current.DimacsParseError, `<p>${languages.current.DimacsParseErrorNoProgram}</p>`);
                error = true;
            }

            if (!error) {
                const d: GraphPlain = GraphState.getGraphData(graph!);
                d.nodes.forEach((v) => {
                    v.label = v.id.toString();
                });
                window.main.setData(d, false, true, true);
            }
        }
        else {
            help.showSimpleModal(languages.current.UnrecognizedInputError, `<p>${languages.current.UnrecognizedInputError}.</p>`);
        }
    },

    makeImportTextModal: (): void => {
        help.showFormModal(($modal, values) => {
            $modal.modal("hide");
            self.importByString(values[0], values[1]);
        }, languages.current.ImportGraphFromText, languages.current.Import, languages.current.Cancel,
            [{ type: "textarea", label: languages.current.ImportText, extraAttrs: { style: "height: 20vh; min-height:400px;" } },
            { type: "select", label: languages.current.Format, optionValues: ["json", "dimacs"], optionText: ["JSON", "DIMACS"] }
            ]);
    },

    makeImportFileModal: (): void => {
        help.showFormModal(($modal, values) => {
            $modal.modal("hide");

            const files = values[0];
            if (files.length === 1) {
                const file = files[0];
                const reader = new FileReader();
                reader.onload = function (event: any) {
                    self.importByString(event.target.result, help.getFileExtension(file.name));
                };

                reader.readAsText(file);
            }
        }, languages.current.ImportGraphFromFile, languages.current.Import, languages.current.Cancel,
            [{
                type: "file", label: languages.current.UploadFile, validationFunc: (val, $files) => {
                    const files = ($files.get(0) as any).files;
                    if (files.length >= 1) {
                        return true;
                    }
                    return languages.current.MustChooseFileError;
                }
            }]);
    },

    makeImportGraphExercise: (exercisegraph: number): void => {
        
        const gstrings = ['{"nodes":[{"id":0,"label":"A","x":0,"y":0},{"id":1,"label":"B","x":-70,"y":-70},{"id":2,"label":"C","x":-70,"y":70},{"id":3,"label":"D","x":50,"y":0},{"id":4,"label":"E","x":120,"y":-70},{"id":5,"label":"F","x":120,"y":70}],"edges":[{"from":0,"to":1,"weight":1},{"from":0,"to":2,"weight":1},{"from":0,"to":3,"weight":1},{"from":1,"to":2,"weight":1},{"from":1,"to":4,"weight":1},{"from":2,"to":5,"weight":1},{"from":3,"to":4,"weight":1},{"from":3,"to":5,"weight":1},{"from":4,"to":5,"weight":1}],"directed":false,"weighted":false}',
                          '{"nodes":[{"id":0,"label":"A","x":0,"y":-70},{"id":1,"label":"B","x":200,"y":-70},{"id":2,"label":"C","x":200,"y":70},{"id":3,"label":"D","x":0,"y":70},{"id":4,"label":"E","x":-70,"y":0},{"id":5,"label":"F","x":70,"y":0},{"id":6,"label":"G","x":130,"y":0},{"id":7,"label":"H","x":270,"y":0}],"edges":[{"from":0,"to":1,"weight":1},{"from":0,"to":4,"weight":1},{"from":4,"to":3,"weight":1},{"from":3,"to":5,"weight":1},{"from":5,"to":0,"weight":1},{"from":4,"to":5,"weight":1},{"from":3,"to":2,"weight":1},{"from":6,"to":2,"weight":1},{"from":6,"to":1,"weight":1},{"from":1,"to":7,"weight":1},{"from":7,"to":2,"weight":1},{"from":1,"to":2,"weight":1}],"directed":false,"weighted":false}',
                          '{"nodes":[{"id":0,"label":"A","x":0,"y":0},{"id":1,"label":"B","x":-70,"y":-70},{"id":2,"label":"C","x":0,"y":-110},{"id":3,"label":"D","x":70,"y":-70},{"id":4,"label":"E","x":70,"y":70},{"id":5,"label":"F","x":-70,"y":70},{"id":6,"label":"G","x":0,"y":-170}],"edges":[{"from":5,"to":4,"weight":1},{"from":5,"to":0,"weight":1},{"from":0,"to":3,"weight":1},{"from":3,"to":1,"weight":1},{"from":1,"to":5,"weight":1},{"from":1,"to":0,"weight":1},{"from":0,"to":4,"weight":1},{"from":4,"to":3,"weight":1},{"from":1,"to":2,"weight":1},{"from":2,"to":3,"weight":1},{"from":1,"to":6,"weight":1},{"from":6,"to":3,"weight":1}],"directed":false,"weighted":false}',
                          '{"nodes":[{"id":0,"label":"A","x":-50,"y":0},{"id":1,"label":"B","x":50,"y":0},{"id":2,"label":"C","x":-100,"y":70},{"id":3,"label":"D","x":100,"y":70},{"id":4,"label":"E","x":-100,"y":-70},{"id":5,"label":"F","x":0,"y":-70},{"id":6,"label":"G","x":100,"y":-70}],"edges":[{"from":2,"to":3,"weight":1},{"from":4,"to":2,"weight":1},{"from":4,"to":5,"weight":1},{"from":5,"to":6,"weight":1},{"from":6,"to":3,"weight":1},{"from":1,"to":3,"weight":1},{"from":1,"to":6,"weight":1},{"from":2,"to":0,"weight":1},{"from":4,"to":0,"weight":1},{"from":0,"to":5,"weight":1},{"from":5,"to":1,"weight":1},{"from":0,"to":6,"weight":1},{"from":4,"to":1,"weight":1},{"from":0,"to":3,"weight":1},{"from":1,"to":2,"weight":1}],"directed":false,"weighted":false}'];

        self.importByString(gstrings[exercisegraph], "json");

    },

    setGraphBackground: (whichone: number): void => {
        if (whichone === 0) {
            window.network.off("beforeDrawing");
            GraphState.repaint();
        }
        else if (whichone === 1) {
            window.network.off("beforeDrawing");
            GraphState.repaint();
            window.network.on("beforeDrawing", function(ctx) {
                ctx.drawImage(document.getElementById("verkehr"), -350, -190);
            });
            GraphState.repaint();
        }
        else if (whichone === 2) {
            window.network.off("beforeDrawing");
            GraphState.repaint();
            window.network.on("beforeDrawing", function(ctx) {
                ctx.drawImage(document.getElementById("schweiz"), -400, -300);
            });
            GraphState.repaint();
        }
        else if (whichone === 3) {
            window.network.off("beforeDrawing");
            GraphState.repaint();
            window.network.on("beforeDrawing", function(ctx) {
                ctx.drawImage(document.getElementById("sudoku4x4"), -350, -250);
            });
            GraphState.repaint();
        }
        
    },

    makeExportFileModal: (): void => {
        help.showFormModal(null, languages.current.ExportGraphToFile, null, languages.current.Cancel,
            [{
                type: "button",
                initialValue: languages.current.ExportToJson,
                onclick: () => {
                    self.exportToFile("json");
                },
                extraAttrs: {
                    class: "btn btn-sm btn-primary m-1"

                },
                clickDismiss: true
            },
            {
                type: "button",
                initialValue: languages.current.ExportToDimacs,
                onclick: () => {
                    self.exportToFile("dimacs");
                },
                extraAttrs: {
                    class: "btn btn-sm btn-primary"
                },
                clickDismiss: true
            }
            ], null, false);
    },

    makeExportFileModalJSON: (): void => {
        help.showFormModal(null, languages.current.ExportGraphToFile, null, languages.current.Cancel,
            [{
                type: "button",
                initialValue: languages.current.ExportToJson,
                onclick: () => {
                    self.exportToFile("json");
                },
                extraAttrs: {
                    class: "btn btn-sm btn-primary m-1"

                },
                clickDismiss: true
            }
            ], null, false);
    },

    makeExportTextModal: (): void => {
        help.showFormModal(null, languages.current.ExportGraphToText, null, languages.current.Cancel,
            [{
                type: "button",
                initialValue: languages.current.ExportToJson,
                onclick: () => {
                    self.exportToText("json");
                },
                extraAttrs: {
                    class: "btn btn-sm btn-primary m-1",
                },
                clickDismiss: false
            },
            {
                type: "button",
                initialValue: languages.current.ExportToDimacs,
                onclick: () => {
                    self.exportToText("dimacs");
                },
                extraAttrs: {
                    class: "btn btn-sm btn-primary",
                },
                clickDismiss: false
            },
            {
                type: "textarea", label: "", initialValue: "", extraAttrs: {
                    style: "height: 20vh;" +
                        " min-height:400px; white-space:pre; margin-top: 1rem;"
                },
                onclick: () => {
                    (document.getElementById(exportedTextSelector) as HTMLTextAreaElement).select();
                    document.execCommand("copy");
                }, id: "exportedText"
            }
            ], ($modal) => {
                $modal.modal("hide");
            }, false);
    },

    exportToFile: (format: string): void => {
        if (format.toLowerCase() === "json") {
            self.downloadFile("graph.json", self.getDataAsJSON());
        }
        else if (format.toLowerCase() === "dimacs") {
            self.downloadFile("graph.dimacs", self.getDataAsDIMACS());
        }
    },

    exportToText: (format: string): void => {
        if (format.toLowerCase() === "json") {
            document.getElementById(exportedTextSelector)!.innerHTML = JSON.stringify(JSON.parse(self.getDataAsJSON()), null, 2);
        }
        else if (format.toLowerCase() === "dimacs") {
            document.getElementById(exportedTextSelector)!.innerHTML = self.getDataAsDIMACS();
        }
    },

    getDataAsJSON: (): string => {
        const d = GraphState.getGraphData(GraphState.graph);
        const nodeKeys = ["id", "label", "color", "x", "y"];
        const edgeKeys = ["from", "to", "weight", "color"];
        d.nodes = help.keepOnlyKeys(d.nodes, nodeKeys) as NodeImmutPlain[];
        d.edges = help.keepOnlyKeys(d.edges, edgeKeys) as EdgeImmutPlain[];

        return JSON.stringify(d);
    },

    getDataAsDIMACS: (): string => {
        // If I add direction, DIMACS cannot be used, it only works for undirected graphs
        const g = GraphState.getGraphData();
        let text = "c This Graph was generated and exported from Michael Dombrowski's Graph Playground " +
            "-- https://mikedombo.github.io/graphPlayground -- https://mikedombrowski.com\n";

        let adj = GraphState.graph.getFullAdjacency();
        adj = adj.filter((v: number[]) => {
            return v.length !== 0;
        });

        const nodes: number[] = [];
        adj.forEach((v: number[], i: number) => {
            if (nodes.indexOf(i + 1) === -1) {
                nodes.push(i + 1);
            }
            v.forEach((n: number) => {
                if (nodes.indexOf(n + 1) === -1) {
                    nodes.push(n + 1);
                }
            });
        });

        let edgeCount = 0;
        let edgeText = "";
        g.edges.forEach((v: EdgeImmutPlain) => {
            edgeText += `e ${v.from + 1} ${v.to + 1}\n`;
            edgeCount++;
        });
        edgeText = edgeText.trim();

        text += `p edge ${nodes.length} ${edgeCount}\n`;
        return text + edgeText;
    },

    downloadFile: (filename: string, text: string): void => {
        const blob = new Blob([text], { type: 'text/plain' });
        // @ts-ignore
        if (window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveBlob(blob, filename);
        }
        else {
            const a = window.document.createElement('a');
            a.href = window.URL.createObjectURL(blob);
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blob as any);
        }
    },
};

export default self;
