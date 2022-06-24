"use strict";

import gHelp from './graphHelpers';
import help from './genericHelpers';
import {EdgeImmutPlain} from "../classes/GraphImmut/EdgeImmut";
import {NodeImmutPlain} from "../classes/GraphImmut/NodeImmut";

interface Degree {
    in: number;
    out: number;
}

const capitalLetters = help.deepFreeze([
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"
]) as string[];

export default {
    findVertexDegreesDirectional: (adjacencyMatrix: Array<Array<number>>): Degree[] => {
        // Adjacency stores IDs of edges TO
        const degrees: Degree[] = [];
        adjacencyMatrix.forEach((v, i) => {
            if (i in degrees) {
                degrees[i].out += v.length;
            }
            else {
                degrees[i] = {out: v.length, in: 0};
            }
            v.forEach((outV) => {
                if (outV in degrees) {
                    degrees[outV].in += 1;
                }
                else {
                    degrees[outV] = {in: 1, out: 0};
                }
            });
        });

        return degrees;
    },

    interpolateNodesFromEdges: (edges: EdgeImmutPlain[]): NodeImmutPlain[] => {
        const nodes: NodeImmutPlain[] = [];
        edges.forEach((v) => {
            nodes[v.from] = {id: v.from, label: gHelp.generateLabelFromNumber(v.from), color: 0};
            nodes[v.to] = {id: v.to, label: gHelp.generateLabelFromNumber(v.to), color: 0};
        });

        return nodes;
    },

    generateLabelFromNumber : (prelabel: number) : string => {
        if (typeof prelabel === "number" && (prelabel >= 0 && prelabel <=25)) {
            return capitalLetters[prelabel];
        } else {
            return prelabel.toString();
        }
    }
};
