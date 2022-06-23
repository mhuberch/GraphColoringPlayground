"use strict";

import gHelp from './graphHelpers';
import help from './genericHelpers';
import {EdgeImmutPlain} from "../classes/GraphImmut/EdgeImmut";
import {NodeImmutPlain} from "../classes/GraphImmut/NodeImmut";

export interface GraphPlain {
    edges: EdgeImmutPlain[];
    nodes: NodeImmutPlain[];
    directed?: boolean;
    weighted?: boolean
}

const petersenEdges = help.deepFreeze([
    {from: 1, to: 2, weight: 1},
    {from: 2, to: 3, weight: 1},
    {from: 3, to: 4, weight: 1},
    {from: 4, to: 5, weight: 1},
    {from: 5, to: 1, weight: 1},

    {from: 6, to: 8, weight: 1},
    {from: 7, to: 9, weight: 1},
    {from: 7, to: 10, weight: 1},
    {from: 8, to: 10, weight: 1},
    {from: 9, to: 6, weight: 1},

    {from: 1, to: 6, weight: 1},
    {from: 2, to: 7, weight: 1},
    {from: 3, to: 8, weight: 1},
    {from: 4, to: 9, weight: 1},
    {from: 5, to: 10, weight: 1}
]) as EdgeImmutPlain[];

const konigsbergEdges = help.deepFreeze([
    {from: 1, to: 2, weight: 1},
    {from: 2, to: 3, weight: 1},
    {from: 2, to: 4, weight: 1},
    {from: 3, to: 4, weight: 1},
    {from: 3, to: 4, weight: 1},
    {from: 4, to: 1, weight: 1},
    {from: 4, to: 1, weight: 1},
]) as EdgeImmutPlain[];

const graphG1Edges = help.deepFreeze([
    {from: 0, to: 1, weight: 1},
    {from: 0, to: 2, weight: 1},
    {from: 0, to: 3, weight: 1},
    {from: 1, to: 2, weight: 1},
    {from: 1, to: 4, weight: 1},
    {from: 2, to: 5, weight: 1},
    {from: 3, to: 4, weight: 1},
    {from: 3, to: 5, weight: 1},
    {from: 4, to: 5, weight: 1}
]) as EdgeImmutPlain[];

const completeGraph = (V: number): Readonly<GraphPlain> => {
    const edges = [];
    const nodes = [];

    for (let i = 0; i < V; i++) {
        nodes.push({id: i, label: gHelp.generateLabelFromNumber(i)});
        for (let j = i + 1; j < V; j++) {
            edges.push({from: i, to: j});
        }
    }

    return help.deepFreeze({nodes, edges, directed: false, weighted: false} as GraphPlain);
};

const hypercubeGraph = (D: number): Readonly<GraphPlain> => {
    const edges: EdgeImmutPlain[] = [];
    const nodes: NodeImmutPlain[] = [];

    const numNodes = Math.pow(2, D);

    const pad = (str: string, max: number): string => {
        return str.length < max ? pad("0" + str, max) : str;
    };

    const generateDifferByOne = (input: number, numBits: number) => {
        const inputBits = pad((input).toString(2), numBits).split("").reverse();
        const allDiffer = [];

        // 1 bit difference from input, increasing order, none less than input
        for (let b = 0; b < numBits; b++) {
            if (inputBits[b] === "0") {
                const newNum = inputBits.slice();
                newNum[b] = "1";
                newNum.reverse();
                allDiffer.push(parseInt(newNum.join(""), 2));
            }
        }

        return allDiffer;
    };

    for (let i = 0; i < numNodes; i++) {
        nodes.push({id: i, label: pad(i.toString(2), D)});
        generateDifferByOne(i, D).forEach((j) => {
            edges.push({from: i, to: j, weight: 1});
        });
    }

    return help.deepFreeze({nodes, edges, directed: false, weighted: false} as GraphPlain);
};

const newCustomGraph = (V: number, directed = false, weighted = false): Readonly<GraphPlain> => {
    const nodes = [];
    for (let i = 0; i < V; i++) {
        nodes.push({id: i, label: gHelp.generateLabelFromNumber(i)});
    }

    return help.deepFreeze({nodes, edges: [], directed, weighted} as GraphPlain);
};

export default class PredefinedGraphs {
    public static _complete = completeGraph;
    public static _custom = newCustomGraph;
    public static _hypercube = hypercubeGraph;

    public static Petersen(): Readonly<GraphPlain> {
        return help.deepFreeze({
            edges: petersenEdges,
            nodes: gHelp.interpolateNodesFromEdges(petersenEdges),
            directed: false,
            weighted: false,
        });
    }

    public static Konigsberg(): Readonly<GraphPlain> {
        return help.deepFreeze({
            edges: konigsbergEdges,
            nodes: gHelp.interpolateNodesFromEdges(konigsbergEdges),
            directed: false,
            weighted: false,
        });
    }

    public static GraphG1(): Readonly<GraphPlain> {
        return help.deepFreeze({
            edges: graphG1Edges,
            nodes: gHelp.interpolateNodesFromEdges(graphG1Edges),
            directed: false,
            weighted: false,
        });
    }

    public static Complete(): void {
        help.showFormModal(($modal, vals) => {
                $modal.modal("hide");
                window.main.setData(completeGraph(vals[0]), false, true, true);
            },
            "Configurable Complete Graph", "Go",
            [{
                type: "numeric", initialValue: 5, label: "Number of Vertices", validationFunc: (v) => {
                    return v >= 0 || "Number of vertices must be non-negative";
                }
            }]);
    }

    public static Hypercube(): void {
        help.showFormModal(($modal, vals) => {
                $modal.modal("hide");
                window.main.setData(hypercubeGraph(vals[0]), false, true, true);
            },
            "Configurable Hypercube Graph", "Go",
            [{
                type: "numeric", initialValue: 3, label: "Number of Dimensions", validationFunc: (v) => {
                    return v >= 0 || "Number of dimensions must be non-negative";
                }
            }]);
    }

    public static Custom(): void {
        help.showFormModal(($modal, vals) => {
                $modal.modal("hide");
                window.main.setData(newCustomGraph(vals[0], false, false), false, true, true);
            },
            "Configurable Graph", "Go",
            [
                {
                    type: "numeric", initialValue: 0, label: "Number of Vertices", validationFunc: (v) => {
                        return v >= 0 || "Number of vertices must be non-negative";
                    }
                },
                //{type: "checkbox", initialValue: false, label: "Directed"},
                //{type: "checkbox", initialValue: false, label: "Weighted"},
            ]);
    }
}
