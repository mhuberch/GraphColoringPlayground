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
        
        const gstrings = [  '{"nodes":[{"id":0,"label":"A","x":0,"y":0},{"id":1,"label":"B","x":-70,"y":-70},{"id":2,"label":"C","x":-70,"y":70},{"id":3,"label":"D","x":50,"y":0},{"id":4,"label":"E","x":120,"y":-70},{"id":5,"label":"F","x":120,"y":70}],"edges":[{"from":0,"to":1,"weight":1},{"from":0,"to":2,"weight":1},{"from":0,"to":3,"weight":1},{"from":1,"to":2,"weight":1},{"from":1,"to":4,"weight":1},{"from":2,"to":5,"weight":1},{"from":3,"to":4,"weight":1},{"from":3,"to":5,"weight":1},{"from":4,"to":5,"weight":1}],"directed":false,"weighted":false}',
                            '{"nodes":[{"id":0,"label":"A","x":0,"y":-70},{"id":1,"label":"B","x":200,"y":-70},{"id":2,"label":"C","x":200,"y":70},{"id":3,"label":"D","x":0,"y":70},{"id":4,"label":"E","x":-70,"y":0},{"id":5,"label":"F","x":70,"y":0},{"id":6,"label":"G","x":130,"y":0},{"id":7,"label":"H","x":270,"y":0}],"edges":[{"from":0,"to":1,"weight":1},{"from":0,"to":4,"weight":1},{"from":4,"to":3,"weight":1},{"from":3,"to":5,"weight":1},{"from":5,"to":0,"weight":1},{"from":4,"to":5,"weight":1},{"from":3,"to":2,"weight":1},{"from":6,"to":2,"weight":1},{"from":6,"to":1,"weight":1},{"from":1,"to":7,"weight":1},{"from":7,"to":2,"weight":1},{"from":1,"to":2,"weight":1}],"directed":false,"weighted":false}',
                            '{"nodes":[{"id":0,"label":"A","x":0,"y":0},{"id":1,"label":"B","x":-70,"y":-70},{"id":2,"label":"C","x":0,"y":-110},{"id":3,"label":"D","x":70,"y":-70},{"id":4,"label":"E","x":70,"y":70},{"id":5,"label":"F","x":-70,"y":70},{"id":6,"label":"G","x":0,"y":-170}],"edges":[{"from":5,"to":4,"weight":1},{"from":5,"to":0,"weight":1},{"from":0,"to":3,"weight":1},{"from":3,"to":1,"weight":1},{"from":1,"to":5,"weight":1},{"from":1,"to":0,"weight":1},{"from":0,"to":4,"weight":1},{"from":4,"to":3,"weight":1},{"from":1,"to":2,"weight":1},{"from":2,"to":3,"weight":1},{"from":1,"to":6,"weight":1},{"from":6,"to":3,"weight":1}],"directed":false,"weighted":false}',
                            '{"nodes":[{"id":0,"label":"A","x":-50,"y":0},{"id":1,"label":"B","x":50,"y":0},{"id":2,"label":"C","x":-100,"y":70},{"id":3,"label":"D","x":100,"y":70},{"id":4,"label":"E","x":-100,"y":-70},{"id":5,"label":"F","x":0,"y":-70},{"id":6,"label":"G","x":100,"y":-70}],"edges":[{"from":2,"to":3,"weight":1},{"from":4,"to":2,"weight":1},{"from":4,"to":5,"weight":1},{"from":5,"to":6,"weight":1},{"from":6,"to":3,"weight":1},{"from":1,"to":3,"weight":1},{"from":1,"to":6,"weight":1},{"from":2,"to":0,"weight":1},{"from":4,"to":0,"weight":1},{"from":0,"to":5,"weight":1},{"from":5,"to":1,"weight":1},{"from":0,"to":6,"weight":1},{"from":4,"to":1,"weight":1},{"from":0,"to":3,"weight":1},{"from":1,"to":2,"weight":1}],"directed":false,"weighted":false}',
                            '{"nodes":[{"id":0,"label":"A","x":-100,"y":-200},{"id":1,"label":"B","x":-100,"y":-100},{"id":2,"label":"C","x":0,"y":-200},{"id":3,"label":"D","x":0,"y":-100}],"edges":[{"from":0,"to":1,"weight":1},{"from":1,"to":3,"weight":1},{"from":3,"to":0,"weight":1},{"from":1,"to":2,"weight":1},{"from":2,"to":0,"weight":1}],"directed":false,"weighted":false}',
                            '{"nodes":[{"id":0,"label":"C","x":100,"y":0},{"id":1,"label":"B","x":0,"y":-100},{"id":2,"label":"A","x":-100,"y":0},{"id":3,"label":"D","x":0,"y":100},{"id":4,"label":"E","x":0,"y":0}],"edges":[{"from":0,"to":1,"weight":1},{"from":2,"to":3,"weight":1},{"from":4,"to":3,"weight":1},{"from":4,"to":1,"weight":1},{"from":2,"to":1,"weight":1},{"from":0,"to":3,"weight":1}],"directed":false,"weighted":false}',
                            '{"nodes":[{"id":0,"label":"A","x":165,"y":-43},{"id":1,"label":"B","x":62,"y":14},{"id":2,"label":"C","x":-186,"y":8},{"id":3,"label":"D","x":87,"y":6},{"id":4,"label":"E","x":134,"y":80},{"id":5,"label":"F","x":-86,"y":84},{"id":6,"label":"G","x":-113,"y":-35},{"id":7,"label":"H","x":-79,"y":-87},{"id":8,"label":"I","x":70,"y":-106},{"id":9,"label":"J","x":-169,"y":158},{"id":10,"label":"K","x":-65,"y":130},{"id":11,"label":"L","x":-12,"y":-55},{"id":12,"label":"M","x":-21,"y":162},{"id":13,"label":"N","x":48,"y":-143},{"id":14,"label":"O","x":-162,"y":103},{"id":15,"label":"P","x":-48,"y":-187},{"id":16,"label":"Q","x":-224,"y":-165},{"id":17,"label":"R","x":126,"y":184},{"id":18,"label":"S","x":-9,"y":49},{"id":19,"label":"T","x":116,"y":-147}],"edges":[{"from":3,"to":0,"weight":0},{"from":3,"to":2,"weight":0},{"from":4,"to":0,"weight":0},{"from":5,"to":2,"weight":0},{"from":6,"to":1,"weight":0},{"from":6,"to":2,"weight":0},{"from":6,"to":5,"weight":0},{"from":7,"to":1,"weight":0},{"from":7,"to":2,"weight":0},{"from":7,"to":6,"weight":0},{"from":8,"to":1,"weight":0},{"from":8,"to":3,"weight":0},{"from":8,"to":4,"weight":0},{"from":8,"to":5,"weight":0},{"from":8,"to":6,"weight":0},{"from":8,"to":7,"weight":0},{"from":9,"to":7,"weight":0},{"from":10,"to":1,"weight":0},{"from":10,"to":2,"weight":0},{"from":10,"to":3,"weight":0},{"from":10,"to":4,"weight":0},{"from":10,"to":9,"weight":0},{"from":11,"to":1,"weight":0},{"from":11,"to":5,"weight":0},{"from":11,"to":7,"weight":0},{"from":11,"to":10,"weight":0},{"from":12,"to":4,"weight":0},{"from":12,"to":5,"weight":0},{"from":12,"to":6,"weight":0},{"from":12,"to":9,"weight":0},{"from":12,"to":10,"weight":0},{"from":12,"to":11,"weight":0},{"from":13,"to":0,"weight":0},{"from":13,"to":1,"weight":0},{"from":13,"to":3,"weight":0},{"from":13,"to":8,"weight":0},{"from":14,"to":1,"weight":0},{"from":14,"to":2,"weight":0},{"from":14,"to":3,"weight":0},{"from":14,"to":6,"weight":0},{"from":14,"to":7,"weight":0},{"from":14,"to":10,"weight":0},{"from":15,"to":2,"weight":0},{"from":15,"to":6,"weight":0},{"from":15,"to":8,"weight":0},{"from":15,"to":11,"weight":0},{"from":15,"to":13,"weight":0},{"from":16,"to":2,"weight":0},{"from":16,"to":5,"weight":0},{"from":16,"to":6,"weight":0},{"from":16,"to":7,"weight":0},{"from":16,"to":13,"weight":0},{"from":17,"to":0,"weight":0},{"from":17,"to":3,"weight":0},{"from":17,"to":5,"weight":0},{"from":17,"to":10,"weight":0},{"from":17,"to":12,"weight":0},{"from":18,"to":4,"weight":0},{"from":18,"to":5,"weight":0},{"from":18,"to":6,"weight":0},{"from":18,"to":7,"weight":0},{"from":18,"to":8,"weight":0},{"from":18,"to":9,"weight":0},{"from":18,"to":12,"weight":0},{"from":18,"to":13,"weight":0},{"from":18,"to":17,"weight":0},{"from":19,"to":0,"weight":0},{"from":19,"to":1,"weight":0},{"from":19,"to":7,"weight":0},{"from":19,"to":8,"weight":0},{"from":19,"to":11,"weight":0},{"from":19,"to":15,"weight":0}],"directed":false,"weighted":false}',
                            '{"nodes":[{"id":0,"label":"A","x":122,"y":-37},{"id":1,"label":"B","x":90,"y":146},{"id":2,"label":"C","x":-179,"y":25},{"id":3,"label":"D","x":-69,"y":-118},{"id":4,"label":"E","x":85,"y":21},{"id":5,"label":"F","x":-6,"y":39},{"id":6,"label":"G","x":26,"y":-5},{"id":7,"label":"H","x":15,"y":-68},{"id":8,"label":"I","x":-159,"y":-113},{"id":9,"label":"J","x":-123,"y":-43},{"id":10,"label":"K","x":-75,"y":171},{"id":11,"label":"L","x":-59,"y":-36},{"id":12,"label":"M","x":66,"y":-65},{"id":13,"label":"N","x":-42,"y":41},{"id":14,"label":"O","x":-149,"y":101}],"edges":[{"from":1,"to":0,"weight":0},{"from":2,"to":1,"weight":0},{"from":3,"to":2,"weight":0},{"from":4,"to":1,"weight":0},{"from":5,"to":0,"weight":0},{"from":5,"to":1,"weight":0},{"from":5,"to":3,"weight":0},{"from":5,"to":4,"weight":0},{"from":6,"to":0,"weight":0},{"from":6,"to":1,"weight":0},{"from":6,"to":2,"weight":0},{"from":6,"to":3,"weight":0},{"from":6,"to":4,"weight":0},{"from":6,"to":5,"weight":0},{"from":7,"to":0,"weight":0},{"from":7,"to":2,"weight":0},{"from":7,"to":4,"weight":0},{"from":7,"to":5,"weight":0},{"from":7,"to":6,"weight":0},{"from":8,"to":3,"weight":0},{"from":8,"to":6,"weight":0},{"from":8,"to":7,"weight":0},{"from":9,"to":2,"weight":0},{"from":9,"to":3,"weight":0},{"from":9,"to":4,"weight":0},{"from":9,"to":5,"weight":0},{"from":9,"to":7,"weight":0},{"from":9,"to":8,"weight":0},{"from":10,"to":1,"weight":0},{"from":10,"to":2,"weight":0},{"from":10,"to":4,"weight":0},{"from":10,"to":5,"weight":0},{"from":10,"to":6,"weight":0},{"from":10,"to":7,"weight":0},{"from":10,"to":9,"weight":0},{"from":11,"to":0,"weight":0},{"from":11,"to":3,"weight":0},{"from":11,"to":4,"weight":0},{"from":11,"to":5,"weight":0},{"from":11,"to":6,"weight":0},{"from":11,"to":7,"weight":0},{"from":11,"to":8,"weight":0},{"from":11,"to":9,"weight":0},{"from":11,"to":10,"weight":0},{"from":12,"to":0,"weight":0},{"from":12,"to":1,"weight":0},{"from":12,"to":2,"weight":0},{"from":12,"to":3,"weight":0},{"from":12,"to":4,"weight":0},{"from":12,"to":6,"weight":0},{"from":12,"to":7,"weight":0},{"from":12,"to":8,"weight":0},{"from":12,"to":9,"weight":0},{"from":12,"to":11,"weight":0},{"from":13,"to":0,"weight":0},{"from":13,"to":1,"weight":0},{"from":13,"to":2,"weight":0},{"from":13,"to":3,"weight":0},{"from":13,"to":4,"weight":0},{"from":13,"to":5,"weight":0},{"from":13,"to":6,"weight":0},{"from":13,"to":7,"weight":0},{"from":13,"to":8,"weight":0},{"from":13,"to":9,"weight":0},{"from":13,"to":10,"weight":0},{"from":13,"to":11,"weight":0},{"from":14,"to":1,"weight":0},{"from":14,"to":2,"weight":0},{"from":14,"to":4,"weight":0},{"from":14,"to":5,"weight":0},{"from":14,"to":6,"weight":0},{"from":14,"to":8,"weight":0},{"from":14,"to":9,"weight":0},{"from":14,"to":10,"weight":0},{"from":14,"to":11,"weight":0},{"from":14,"to":13,"weight":0}],"directed":false,"weighted":false}',
                            '{"nodes":[{"id":0,"label":"A","x":122,"y":-37},{"id":1,"label":"B","x":90,"y":146},{"id":2,"label":"C","x":-179,"y":25},{"id":3,"label":"D","x":-69,"y":-118},{"id":4,"label":"E","x":85,"y":21},{"id":5,"label":"F","x":-6,"y":39},{"id":6,"label":"G","x":26,"y":-5},{"id":7,"label":"H","x":15,"y":-68},{"id":8,"label":"I","x":-159,"y":-113},{"id":9,"label":"J","x":-123,"y":-43},{"id":10,"label":"K","x":-75,"y":171},{"id":11,"label":"L","x":-59,"y":-36},{"id":12,"label":"M","x":66,"y":-65},{"id":13,"label":"N","x":-42,"y":41},{"id":14,"label":"O","x":-149,"y":101}],"edges":[{"from":1,"to":0,"weight":0},{"from":2,"to":1,"weight":0},{"from":3,"to":2,"weight":0},{"from":4,"to":1,"weight":0},{"from":5,"to":0,"weight":0},{"from":5,"to":1,"weight":0},{"from":5,"to":3,"weight":0},{"from":5,"to":4,"weight":0},{"from":6,"to":0,"weight":0},{"from":6,"to":1,"weight":0},{"from":6,"to":2,"weight":0},{"from":6,"to":3,"weight":0},{"from":6,"to":4,"weight":0},{"from":6,"to":5,"weight":0},{"from":7,"to":0,"weight":0},{"from":7,"to":2,"weight":0},{"from":7,"to":4,"weight":0},{"from":7,"to":5,"weight":0},{"from":7,"to":6,"weight":0},{"from":8,"to":3,"weight":0},{"from":8,"to":6,"weight":0},{"from":8,"to":7,"weight":0},{"from":9,"to":2,"weight":0},{"from":9,"to":3,"weight":0},{"from":9,"to":4,"weight":0},{"from":9,"to":5,"weight":0},{"from":9,"to":7,"weight":0},{"from":9,"to":8,"weight":0},{"from":10,"to":1,"weight":0},{"from":10,"to":2,"weight":0},{"from":10,"to":4,"weight":0},{"from":10,"to":5,"weight":0},{"from":10,"to":6,"weight":0},{"from":10,"to":7,"weight":0},{"from":10,"to":9,"weight":0},{"from":11,"to":0,"weight":0},{"from":11,"to":3,"weight":0},{"from":11,"to":4,"weight":0},{"from":11,"to":5,"weight":0},{"from":11,"to":6,"weight":0},{"from":11,"to":7,"weight":0},{"from":11,"to":8,"weight":0},{"from":11,"to":9,"weight":0},{"from":11,"to":10,"weight":0},{"from":12,"to":0,"weight":0},{"from":12,"to":1,"weight":0},{"from":12,"to":2,"weight":0},{"from":12,"to":3,"weight":0},{"from":12,"to":4,"weight":0},{"from":12,"to":6,"weight":0},{"from":12,"to":7,"weight":0},{"from":12,"to":8,"weight":0},{"from":12,"to":9,"weight":0},{"from":12,"to":11,"weight":0},{"from":13,"to":0,"weight":0},{"from":13,"to":1,"weight":0},{"from":13,"to":2,"weight":0},{"from":13,"to":3,"weight":0},{"from":13,"to":4,"weight":0},{"from":13,"to":5,"weight":0},{"from":13,"to":6,"weight":0},{"from":13,"to":7,"weight":0},{"from":13,"to":8,"weight":0},{"from":13,"to":9,"weight":0},{"from":13,"to":10,"weight":0},{"from":13,"to":11,"weight":0},{"from":14,"to":1,"weight":0},{"from":14,"to":2,"weight":0},{"from":14,"to":4,"weight":0},{"from":14,"to":5,"weight":0},{"from":14,"to":6,"weight":0},{"from":14,"to":8,"weight":0},{"from":14,"to":9,"weight":0},{"from":14,"to":10,"weight":0},{"from":14,"to":11,"weight":0},{"from":14,"to":13,"weight":0}],"directed":false,"weighted":false}',
                            '{"nodes":[{"id":0,"label":"A","x":156,"y":-73},{"id":1,"label":"B","x":177,"y":-30},{"id":2,"label":"C","x":36,"y":82},{"id":3,"label":"D","x":-15,"y":-150},{"id":4,"label":"E","x":103,"y":19},{"id":5,"label":"F","x":197,"y":96},{"id":6,"label":"G","x":106,"y":-204},{"id":7,"label":"H","x":-140,"y":98},{"id":8,"label":"I","x":83,"y":176},{"id":9,"label":"J","x":218,"y":-23},{"id":10,"label":"K","x":167,"y":-188},{"id":11,"label":"L","x":-265,"y":189},{"id":12,"label":"M","x":207,"y":-111},{"id":13,"label":"N","x":-70,"y":152},{"id":14,"label":"O","x":-11,"y":130},{"id":15,"label":"P","x":-126,"y":112},{"id":16,"label":"Q","x":142,"y":135},{"id":17,"label":"R","x":110,"y":-94},{"id":18,"label":"S","x":259,"y":-58},{"id":19,"label":"T","x":-299,"y":-90},{"id":20,"label":"U","x":-168,"y":-25},{"id":21,"label":"V","x":274,"y":136},{"id":22,"label":"W","x":-47,"y":-161},{"id":23,"label":"X","x":-81,"y":53},{"id":24,"label":"Y","x":23,"y":-65},{"id":25,"label":"Z","x":47,"y":134},{"id":26,"label":"26","x":46,"y":-55},{"id":27,"label":"27","x":-55,"y":-211},{"id":28,"label":"28","x":-130,"y":-246},{"id":29,"label":"29","x":125,"y":232},{"id":30,"label":"30","x":26,"y":96},{"id":31,"label":"31","x":-110,"y":-60},{"id":32,"label":"32","x":-110,"y":-16},{"id":33,"label":"33","x":103,"y":-146},{"id":34,"label":"34","x":37,"y":9}],"edges":[{"from":2,"to":1,"weight":0},{"from":3,"to":1,"weight":0},{"from":4,"to":0,"weight":0},{"from":4,"to":3,"weight":0},{"from":5,"to":0,"weight":0},{"from":5,"to":2,"weight":0},{"from":6,"to":4,"weight":0},{"from":7,"to":3,"weight":0},{"from":8,"to":2,"weight":0},{"from":8,"to":4,"weight":0},{"from":8,"to":5,"weight":0},{"from":9,"to":0,"weight":0},{"from":10,"to":3,"weight":0},{"from":10,"to":4,"weight":0},{"from":10,"to":5,"weight":0},{"from":11,"to":7,"weight":0},{"from":12,"to":6,"weight":0},{"from":14,"to":2,"weight":0},{"from":14,"to":7,"weight":0},{"from":14,"to":8,"weight":0},{"from":14,"to":13,"weight":0},{"from":15,"to":2,"weight":0},{"from":15,"to":7,"weight":0},{"from":15,"to":13,"weight":0},{"from":16,"to":4,"weight":0},{"from":16,"to":14,"weight":0},{"from":17,"to":0,"weight":0},{"from":17,"to":1,"weight":0},{"from":17,"to":4,"weight":0},{"from":17,"to":6,"weight":0},{"from":17,"to":10,"weight":0},{"from":17,"to":12,"weight":0},{"from":17,"to":14,"weight":0},{"from":18,"to":0,"weight":0},{"from":18,"to":1,"weight":0},{"from":18,"to":4,"weight":0},{"from":18,"to":5,"weight":0},{"from":18,"to":9,"weight":0},{"from":18,"to":16,"weight":0},{"from":20,"to":2,"weight":0},{"from":20,"to":14,"weight":0},{"from":20,"to":19,"weight":0},{"from":21,"to":1,"weight":0},{"from":21,"to":5,"weight":0},{"from":21,"to":12,"weight":0},{"from":22,"to":0,"weight":0},{"from":22,"to":6,"weight":0},{"from":22,"to":20,"weight":0},{"from":23,"to":2,"weight":0},{"from":23,"to":3,"weight":0},{"from":23,"to":5,"weight":0},{"from":23,"to":7,"weight":0},{"from":23,"to":8,"weight":0},{"from":23,"to":20,"weight":0},{"from":24,"to":1,"weight":0},{"from":24,"to":3,"weight":0},{"from":24,"to":6,"weight":0},{"from":24,"to":12,"weight":0},{"from":24,"to":15,"weight":0},{"from":24,"to":17,"weight":0},{"from":24,"to":20,"weight":0},{"from":24,"to":23,"weight":0},{"from":25,"to":0,"weight":0},{"from":25,"to":2,"weight":0},{"from":25,"to":7,"weight":0},{"from":25,"to":17,"weight":0},{"from":26,"to":0,"weight":0},{"from":26,"to":3,"weight":0},{"from":26,"to":7,"weight":0},{"from":26,"to":9,"weight":0},{"from":26,"to":10,"weight":0},{"from":26,"to":12,"weight":0},{"from":26,"to":14,"weight":0},{"from":26,"to":15,"weight":0},{"from":26,"to":16,"weight":0},{"from":26,"to":17,"weight":0},{"from":26,"to":24,"weight":0},{"from":27,"to":24,"weight":0},{"from":27,"to":26,"weight":0},{"from":28,"to":3,"weight":0},{"from":28,"to":19,"weight":0},{"from":28,"to":22,"weight":0},{"from":28,"to":27,"weight":0},{"from":29,"to":4,"weight":0},{"from":29,"to":13,"weight":0},{"from":29,"to":14,"weight":0},{"from":29,"to":16,"weight":0},{"from":29,"to":21,"weight":0},{"from":29,"to":24,"weight":0},{"from":30,"to":0,"weight":0},{"from":30,"to":5,"weight":0},{"from":30,"to":7,"weight":0},{"from":30,"to":8,"weight":0},{"from":30,"to":14,"weight":0},{"from":30,"to":15,"weight":0},{"from":30,"to":22,"weight":0},{"from":30,"to":23,"weight":0},{"from":30,"to":24,"weight":0},{"from":30,"to":26,"weight":0},{"from":31,"to":4,"weight":0},{"from":31,"to":7,"weight":0},{"from":31,"to":13,"weight":0},{"from":31,"to":16,"weight":0},{"from":31,"to":19,"weight":0},{"from":31,"to":23,"weight":0},{"from":31,"to":27,"weight":0},{"from":32,"to":1,"weight":0},{"from":32,"to":2,"weight":0},{"from":32,"to":7,"weight":0},{"from":32,"to":13,"weight":0},{"from":32,"to":23,"weight":0},{"from":32,"to":26,"weight":0},{"from":32,"to":28,"weight":0},{"from":33,"to":2,"weight":0},{"from":33,"to":3,"weight":0},{"from":33,"to":9,"weight":0},{"from":33,"to":17,"weight":0},{"from":33,"to":18,"weight":0},{"from":33,"to":27,"weight":0},{"from":34,"to":3,"weight":0},{"from":34,"to":4,"weight":0},{"from":34,"to":5,"weight":0},{"from":34,"to":6,"weight":0},{"from":34,"to":8,"weight":0},{"from":34,"to":9,"weight":0},{"from":34,"to":13,"weight":0},{"from":34,"to":20,"weight":0},{"from":34,"to":23,"weight":0},{"from":34,"to":30,"weight":0},{"from":34,"to":32,"weight":0},{"from":34,"to":33,"weight":0}],"directed":false,"weighted":false}',
                            '{"nodes":[{"id":0,"label":"GR","x":230,"y":3},{"id":1,"label":"LU","x":-29,"y":-81},{"id":2,"label":"NE","x":-247,"y":-73},{"id":3,"label":"GE","x":-362,"y":117},{"id":4,"label":"SZ","x":84,"y":-90},{"id":5,"label":"VS","x":-118,"y":123},{"id":6,"label":"TI","x":86,"y":92},{"id":7,"label":"AI","x":195,"y":-158},{"id":8,"label":"ZG","x":42,"y":-115},{"id":9,"label":"UR","x":56,"y":-10},{"id":10,"label":"TG","x":134,"y":-224},{"id":11,"label":"NW","x":30,"y":-58},{"id":12,"label":"OW","x":-5,"y":-36},{"id":13,"label":"SH","x":44,"y":-253},{"id":14,"label":"BL","x":-79,"y":-184},{"id":15,"label":"GL","x":135,"y":-77},{"id":16,"label":"SG","x":181,"y":-102},{"id":17,"label":"BS","x":-107,"y":-225},{"id":18,"label":"BE","x":-78,"y":-16},{"id":19,"label":"ZH","x":74,"y":-184},{"id":20,"label":"SO","x":-105,"y":-159},{"id":21,"label":"AG","x":-3,"y":-170},{"id":22,"label":"AR","x":170,"y":-167},{"id":23,"label":"VD","x":-317,"y":23},{"id":24,"label":"FR","x":-183,"y":-15},{"id":25,"label":"JU","x":-188,"y":-165}],"edges":[{"from":3,"to":23,"weight":1},{"from":23,"to":5,"weight":1},{"from":23,"to":24,"weight":1},{"from":23,"to":2,"weight":1},{"from":2,"to":18,"weight":1},{"from":2,"to":25,"weight":1},{"from":18,"to":24,"weight":1},{"from":23,"to":18,"weight":1},{"from":5,"to":18,"weight":1},{"from":5,"to":9,"weight":1},{"from":5,"to":6,"weight":1},{"from":6,"to":9,"weight":1},{"from":6,"to":0,"weight":1},{"from":12,"to":18,"weight":1},{"from":12,"to":1,"weight":1},{"from":12,"to":11,"weight":1},{"from":11,"to":18,"weight":1},{"from":11,"to":9,"weight":1},{"from":11,"to":4,"weight":1},{"from":11,"to":1,"weight":1},{"from":9,"to":18,"weight":1},{"from":9,"to":0,"weight":1},{"from":9,"to":15,"weight":1},{"from":9,"to":4,"weight":1},{"from":0,"to":15,"weight":1},{"from":0,"to":16,"weight":1},{"from":15,"to":16,"weight":1},{"from":15,"to":4,"weight":1},{"from":16,"to":7,"weight":1},{"from":16,"to":22,"weight":1},{"from":22,"to":7,"weight":1},{"from":16,"to":10,"weight":1},{"from":16,"to":19,"weight":1},{"from":16,"to":4,"weight":1},{"from":10,"to":19,"weight":1},{"from":19,"to":13,"weight":1},{"from":13,"to":10,"weight":1},{"from":19,"to":8,"weight":1},{"from":4,"to":8,"weight":1},{"from":8,"to":21,"weight":1},{"from":8,"to":1,"weight":1},{"from":1,"to":4,"weight":1},{"from":1,"to":18,"weight":1},{"from":21,"to":1,"weight":1},{"from":21,"to":19,"weight":1},{"from":21,"to":20,"weight":1},{"from":21,"to":14,"weight":1},{"from":14,"to":17,"weight":1},{"from":14,"to":20,"weight":1},{"from":20,"to":18,"weight":1},{"from":21,"to":18,"weight":1},{"from":25,"to":18,"weight":1},{"from":25,"to":14,"weight":1},{"from":20,"to":25,"weight":1},{"from":2,"to":24,"weight":1}],"directed":false,"weighted":false}',
                            '{"nodes":[{"id":0,"label":"A","x":-275,"y":-175},{"id":1,"label":"B","x":-160,"y":-175},{"id":2,"label":"C","x":-275,"y":-60},{"id":3,"label":"D","x":-160,"y":-60},{"id":4,"label":"E","x":-40,"y":-175},{"id":5,"label":"F","x":75,"y":-175},{"id":6,"label":"G","x":-40,"y":-60},{"id":7,"label":"H","x":75,"y":-60},{"id":8,"label":"I","x":-275,"y":65},{"id":9,"label":"J","x":-160,"y":65},{"id":10,"label":"K","x":-275,"y":180},{"id":11,"label":"L","x":-160,"y":180},{"id":12,"label":"M","x":-40,"y":65},{"id":13,"label":"N","x":75,"y":65},{"id":14,"label":"O","x":-40,"y":180},{"id":15,"label":"P","x":75,"y":180}],"edges":[{"from":0,"to":1,"weight":1},{"from":0,"to":3,"weight":1},{"from":0,"to":2,"weight":1},{"from":1,"to":2,"weight":1},{"from":1,"to":3,"weight":1},{"from":3,"to":2,"weight":1},{"from":4,"to":6,"weight":1},{"from":6,"to":7,"weight":1},{"from":7,"to":5,"weight":1},{"from":5,"to":4,"weight":1},{"from":4,"to":7,"weight":1},{"from":5,"to":6,"weight":1},{"from":8,"to":10,"weight":1},{"from":10,"to":11,"weight":1},{"from":11,"to":9,"weight":1},{"from":9,"to":8,"weight":1},{"from":8,"to":11,"weight":1},{"from":10,"to":9,"weight":1},{"from":12,"to":14,"weight":1},{"from":14,"to":15,"weight":1},{"from":15,"to":13,"weight":1},{"from":13,"to":12,"weight":1},{"from":12,"to":15,"weight":1},{"from":14,"to":13,"weight":1},{"from":0,"to":8,"weight":1},{"from":0,"to":10,"weight":1},{"from":2,"to":8,"weight":1},{"from":2,"to":10,"weight":1},{"from":1,"to":9,"weight":1},{"from":1,"to":11,"weight":1},{"from":3,"to":9,"weight":1},{"from":3,"to":11,"weight":1},{"from":4,"to":12,"weight":1},{"from":4,"to":14,"weight":1},{"from":6,"to":12,"weight":1},{"from":6,"to":14,"weight":1},{"from":5,"to":13,"weight":1},{"from":5,"to":15,"weight":1},{"from":7,"to":13,"weight":1},{"from":7,"to":15,"weight":1},{"from":0,"to":4,"weight":1},{"from":0,"to":5,"weight":1},{"from":1,"to":4,"weight":1},{"from":1,"to":5,"weight":1},{"from":2,"to":6,"weight":1},{"from":2,"to":7,"weight":1},{"from":3,"to":6,"weight":1},{"from":3,"to":7,"weight":1},{"from":8,"to":12,"weight":1},{"from":8,"to":13,"weight":1},{"from":9,"to":12,"weight":1},{"from":9,"to":13,"weight":1},{"from":10,"to":14,"weight":1},{"from":10,"to":15,"weight":1},{"from":11,"to":14,"weight":1},{"from":11,"to":15,"weight":1}],"directed":false,"weighted":false}'
                        ];

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
                ctx.drawImage(document.getElementById("sudoku3x3"), -350, -250);
            });
            GraphState.repaint();
        }
        else if (whichone === 4) {
            window.network.off("beforeDrawing");
            GraphState.repaint();
            window.network.on("beforeDrawing", function(ctx) {
                ctx.drawImage(document.getElementById("sudoku4x4"), -350, -250);
            });
            GraphState.repaint();
        }
        else if (whichone === 5) {
            window.network.off("beforeDrawing");
            GraphState.repaint();
            window.network.on("beforeDrawing", function(ctx) {
                ctx.drawImage(document.getElementById("sudoku5x5"), -350, -250);
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
