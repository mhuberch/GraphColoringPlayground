export default {
    // Algorithms
    CheckColoring: "Färbung überprüfen",
    GetAllDegrees: "Knotengrade berechnen",
    GraphColoringGreedy: "Greedy Färbung",
    ColoringMode: "Reihenfolge der Knoten für die Färbung:",
    GraphColoringWelsh: "Knotenfärbung Welsh-Powell",
    kColoringBruteForce: "k-Färbung Bruteforce",
    kColoringBacktracking: "k-Färbung Backtracking",
    kColoringConstrainedBacktracking: "k-Färbung mit Vorgaben",
    ConnectedComponents: "Zusammenhangskomponenten",
    StronglyConnectedComponents: "Starke Zusammenhangskomponenten",
    BFS: "Kürzester Weg Breitensuche",
    Dijkstra: "Kürzester Weg Dijkstra",
    BellmanFord: "Kürzester Weg Bellman-Ford",
    FordFulkerson: "Ford-Fulkerson",
    FordFulkersonMaxFlowMinCut: "Ford-Fulkerson MaxFluss-MinSchnitt",
    KruskalMST: "Minimaler Spannbaum Kruskal",
    Cyclic: "Zyklisch",
    TopoSort: "Topologische Sortierung",
    Eulerian: "Euler Graph",
    Vertex: "Knoten",

    ShortestPath: "Kürzester Weg",
    DijkstraError: "Fehler in Dijkstra",
    DijkstraErrorHTML: "<p>Der Dijkstra Algorithmus funktioniert nur für Graphen" +
        " mit total nicht-negativer Kantengewichte. Bitte den Graphen so verändern, dass es" +
        " keine negativen Kantengewichte mehr gibt.</p><p>Nutze andernfalls den Bellman-Ford Algorithmus, der genau" +
        " dieses Problem löst.</p>",
    BellmanFordError: "Fehler in Bellman-Ford",
    BellmanFordErrorHTML: "<p>Der Bellman-Ford Algorithmus funktioniert nur für Graphen" +
        " ohne Zyklen mit negativen Kantengewichten. Bitte den Zyklus mit negativen Kantengewichten entfernen und neu starten.</p>",
    TopoSortErrorHTML: "<h3>Topologisches Sortieren gescheitert.</h3><hr>Topologisches Sortieren gescheitert, weil der Graph nicht zyklenfrei ist.",

    NoPathFromAToB: "Kein Pfad von $1 zu $2 existent",
    MaxFlowFromAToB: "Maximaler Fluss von $1 zu $2: $3",
    ShortestPathFromAToB: "$1 von $2 zu $3: $4",
    WithWeightedCost: "Mit gewichteten Kosten: $1",
    UsingPath: "Entlang des Pfades: ",
    UsingEdges: "Mittels der Kanten:",
    UsingCapacities: "Mithilfe der Kapazitäten:",
    FlowWithCapacity: "$1 &rarr; $2 mittels $3 von $4",
    NumberOfConnectedComponents: "Anzahl von $1: $2",
    NumberOfConflicts: "Anzahl Konflikte: $1",
    NodeIsInConflictWith: "$1.) Knoten $2 und $3 haben die gleiche Farbe.",
    VertexIsInConnectedComponentNumber: "Knoten $1 ist in der Zusammenhangskomponente #$2",
    VertexHasDegree: "Knoten $1 hat Knotengrad $2",
    GraphHasVertexDegree: "Der Graph hat den maximalen Knotengrad $1",
    BuildGraphs: "Neuen Graph erstellen",
    LoadGraphs: "Graph aus Aufgaben laden",
    SetBackground: "Hintergrund laden",
    GraphTools: "Graphwerkzeuge",
    StopTasks: "Prozesse anhalten",

    IncNodeLabel: "Aufsteigend sortiert nach Namen",
    DecNodeLabel: "Absteigend sortiert nach Namen",
    IncDegree: "Aufsteigend sortiert nach Knotengrad",
    DecDegree: "Absteigend sortiert nach Knotengrad",

    Color0: "ohne Farbe",
    Color1: "1: rot",
    Color2: "2: orange",
    Color3: "3: gelb",
    Color4: "4: grün",
    Color5: "5: blau",
    Color6: "6: violett",

    Vertices: "Knoten",
    Edges: "Kanten",
    
    NumberOfVertices: "Anzahl Knoten: $1",
    ChromaticNumberIs: "Chromatische Zahl: $1",
    ApproxChromaticNumberIs: "Ungefähre chromatische Zahl (obere Schranke): $1",
    GreedyWorkedOrder: "Greedy Algorithmus arbeitete im Modus '$1', was zur folgenden Knotenreihenfolge führte:",
    IfDesiredActiveStepByStep: "Falls erwünscht, die Option 'Schritt-für-Schritt Info' im Menü 'Optionen' wählen und Algorithmus neu starten.",
    StepByStepOutput: "Schritt-für-Schritt Infos: ('Farbe 0' bedeutet 'noch ohne Farbe')",
    VertexGetsColor: "Knoten $1 hat Farbe $2",
    VertexGetsThereforeColor: "Knoten $1 bekommt demnach Farbe $2",
    RecolorAddColors: "Die Knotenfärbung benötigt mehr als die sechs Standardfarben. Falls die restlichen zufällig gewählten Farben zu ähnlich sind, werden durch Klick auf den Button neue generiert.",
    GraphColoringTitle: "Knotenfärbung mittels Welsh-Powell Algorithmus",
    GraphColoringGreedyTitle: "Knotenfärbung mittels Greedy Algorithmus",
    kColoringBruteForceTitle: "Test, ob der Graph k-färbbar ist mittels Bruteforce",
    kColoringBacktrackingTitle: "Test, ob der Graph k-färbbar ist mittels Backtracking",
    kColoringConstrainedTitle: "Test, ob der Graph k-färbbar ist mittels Backtracking, wobei gewisse Farben vorgegeben sind",
    kColoringParameter: "Überprüfe, ob k-färbbar für k = ",
    kColoringSuccess: "JA: Der Graph ist $1-färbbar.",
    kColoringTerminated: "Der Färbungsalgorithmus terminierte nach $1 ausprobierten Farbkonfigurationen.",
    FollowingConstraints: "Die folgenden Knotenfarben wurden durch den Benutzer vorgegeben:",
    Has: " hat Farbe ",
    MustBe: " ist demnach ",
    kColoringCheckedAll: "Der Färbungsalgorithmus probierte erfolglos $1 Farbkonfigurationen aus.",
    kColoringDocStep1: "Wie gewünscht, die Auflistung der (maximal) ersten $1 Farbkonfigurationen Schritt-für-Schritt:",
    kColoringDocStep2: "Liste mit der Farbe aller Knoten: 0 = ohne Farbe; 1 = Farbe 1; 2 = Farbe 2; ...), wobei die Knoten nach ID's sortiert sind, d.h. ",
    kColoringFail: "NEIN: Der Graph ist NICHT $1-färbbar.",
    Step: "Schritt ",
    NumberOfColors: "Anzahl Farben",
    NumberOfSteps: "Anzahl dokumentierter Durchläufe als Schritt-für-Schritt Info",
    CompleteColoring: "Färbung ausgehend von vorgegebenen Farben vervollständigen",
    CompleteColoringExplanation: "Falls manuell schon Farben einzelner Knoten gewählt wurden (rot, orange, gelb, grün, blau, violett, ABER NICHT WEIS), so versucht der Backtracking Algorithmus eine Färbung zu finden, ohne die vorgegebenen Farben zu ändern",
    CheckColoringTitle: "Zulässigkeit der aktuellen Knotenfärbung überprüfen",
    GetAllDegreesTitle: "Die Knoten haben die Knotengrade:",
    KruskalMSTTotalWeight: "Minimaler Spannbaum Kruskal hat das Gesamgewicht: $1",

    // UI
    StartNode: "Startknoten",
    EndNode: "Endknoten",
    SourceNode: "Quelle",
    SinkNode: "Senke",
    Go: "Los",
    Help: "Hilfe",
    AboutShort: "Über",
    About: "Über Graph Coloring Playground",
    TaskAlreadyRunning: "Algorithmus läuft noch/schon",
    TaskAlreadyRunningBody: "$1 läuft noch/schon. Bitte zuerst warten, bis er fertig ist.",
    Options: "Optionen",
    Save: "Speichern",
    Cancel: "Abbrechen",
    IssuesHTML: "<h4>Für Support: " +
        "<a href='https://github.com/MikeDombo/graphPlayground' target='_blank'>GitHub repository</a>" +
        " für Anleitungen </h4> <h4>See <a href='https://github.com/MikeDombo/graphPlayground/issues' target='_blank'>" +
        "GitHub issues</a> um Fehler oder Vorschläge zu melden..</h4>",
    AboutHTML: "<i>Elektronische Lernumgebung für Knotenfärbung basierend auf <a href='https://github.com/MikeDombo/graphPlayground' target='_blank'>GraphPlayground</a>" + 
        " von Michael Dombrowski. Das dazugehörige Unterrichtsmaterial findet sich unter " +
        "<a href='https://www.abz.inf.ethz.ch/maturitatsschulen/unterrichtsmaterialien/' target='_blank'>ABZ Webpage</a>. Kompletter Quellcode und Kontakt auf <a href='https://github.com/mhuberch/GraphColoringPlayground' target='_blank'>GitHub</a> </i>" +
        " Martin Huber, 2022",
    GraphPhysics: "Darstellung mit minimaler potentieller Energie",
    DiGraph: "Gerichteter Graph",
    WeightedGraph: "Gewichteter Graph",
    CustomNodeColors: "Wählbare Knotenfarbe",
    SmoothEdges: "Gerundete Kanten",
    FastColorChange: "Knotenfarbe durch Doppelklick ändern",
    StepByStepInfo: "Schritt-für-Schritt Info für Färbungsalgorithmen anzeigen",
    ThisTask: "Aktueller Vorgang",
    ReColor: "Neue Zusatzfarben generieren",
    ReColorInfo: "Weil die Knotenfärbung mehr als die sechs Standardfarben benötigt, wurden zufällig gewählte Farben ergänzt. Den Button drücken um andere zufällige Farben zu generieren.",
    File: "Import/Export",
    ImportFile: "Importiere Datei",
    ImportText: "Importiere Text",
    ExportFile: "Exportiere Datei",
    ExportText: "Exportiere Text",
    CalculateAllProperties: "Alle Eigenschaften berechnen",
    NewGraphLayout: "Knoten neu anordnen",
    LoadDefaultColor: "Knotenfarbe entfernen",
    ExampleGraphs: "Graphen erstellen",
    LoadPetersen: "Petersen Graph laden",
    LoadKonigsberg: "Königsberger-Brückengraph laden",
    LoadComplete: "Vollständigen Graphen erstellen",
    LoadCycle: "Kreisgraphen erstellen",
    LoadWheel: "Radgraphen erstellen",
    LoadHypercube: "Hyperwürfel-Graphen erstellen",
    LoadCustom: "Eigenen Graphen erstellen",
    LoadRandom: "Zufälligen Graphen erstellen",
    Algorithms: "Algorithmen",
    GraphProperties: "Grapheigenschaften",
    Results: "Resultate",
    AddNode: "Neuer Knoten",
    EditEdge: "Kante ändern",
    EditNode: "Knoten ändern",
    WeightCapacity: "Gewicht",
    LabelLabel: "Name",
    NodeId: "Knoten ID: $1",
    Color: "Farbe",
    ConnectNodeToItselfConfirmation: "Soll wirklich der Knoten mit sich selbst verbunden werden?",
    ConnectNodeToItselfAlert: "Knoten darf nicht mit sich selbst verbunden werden!",
    AlreadyConnectedNodes: "Diese zwei Knoten sind schon verbunden.",
    InvalidLabelOrId: "Ungültiger Name oder ID",


    // Import/Export
    DataImportError: "Fehler bei Datenimport",
    DataImportErrorText: "Die Eingabe erfüllt nicht die Importspezifikationen.",
    JsonParseError: "JSON Parser Fehler",
    JsonParseErrorText: "Parsing-Fehler beim Import als JSON.",
    DimacsParseError: "DIMACS Parseer Error",
    DimacsParseErrorText: "Sorry, nur \"edge\" formatierte DIMACS Dateien erlaubt.",
    DimacsParseErrorNoProgram: "Keine Programmzeile gefunden!",
    UnrecognizedInputError: "Inputformat nicht erkannt",
    ImportGraphFromText: "Importiere Graph aus Text",
    ImportGraphFromFile: "Importiere Graph aus Datei",
    Import: "Import",
    ExportToJson: "Export als JSON",
    ExportToDimacs: "Export als DIMACS",
    ExportGraphToFile: "Exportiere Graph in Datei",
    ExportGraphToText: "Exportiere Graph als Text",
    Format: "Format",
    InputText: "Eingabetext",
    UploadFile: "Hochzuladende Datei",
    MustChooseFileError: "Zuerst eine Datei auswählen",

    // Predefined Graphs
    ConfigurableCompleteGraph: "Konfigurierbarer vollständiger Graph",
    ConfigurableCycleGraph: "Konfigurierbarer Kreisgraph",
    ConfigurableWheelGraph: "Konfigurierbarer Radgraph",
    NumberOfVerticesLabel: "Anzahl Knoten",
    NumberOfVerticesNonNegativeError: "Anzahl Knoten muss nicht-negativ sein",
    NumberOfColorsPositiveError: "Anzahl Farben muss grösser als null sein",
    NumberOfStepsPositiveError: "Anzal dokumentierter Schritte muss strikt positiv sein",
    ConfigurableRandomGraph: "Konfigurierbarer zufälliger Graph",
    PercentageOfVerticesLabel: "Wahrscheinlichkeit in Prozent für eine Kante zwischen zwei Knoten",
    ConfigurableGraph: "Konfigurierbarer Graph",
    ConfigurableHypercubeGraph: "Konfigurierbarer Hyperwürfel-Graph",
    NumberOfDimensionsLabel: "Dimension",
    NumberOfDimensionsNonNegativeError: "Dimension muss nicht-negativ sein",
    NumberOfPercentageError: "Prozentsatz muss zwischen 0 und 100 sein",

    // VisJS locale
    VisLocale: {
        "en": {}, // Required, even though we will not use it.
        // Customize the text below...
        "": {
            edit: 'Bearbeite',
            del: 'Lösche Auswahl',
            back: 'Zurück',
            addNode: 'Neuer Knoten',
            addEdge: 'Neue Kante',
            editNode: 'Bearbeite Knoten',
            editEdge: 'Bearbeite Kante',
            addDescription: 'An freien Platz klicken, um neuen Knoten zu platzieren..',
            edgeDescription: 'Auf einen Knoten klicken und zum Verbinden die Kante auf einen anderen Knoten ziehen.',
            editEdgeDescription: 'Kontrollpunkte anklicken und auf zu verbindenden Knoten ziehn.',
            createEdgeError: 'Kanten und Cluster können nicht verbunden werden.',
            deleteClusterError: 'Clusters können nicht gelöscht werden.',
            editClusterError: 'Clusters können nicht bearbeitet werden.'
        }
    }
};
