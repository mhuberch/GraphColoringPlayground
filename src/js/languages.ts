import DE from "src/DE";

export enum Languages {
    DE = "DE",

}

export let current = {} as typeof DE;


export const setLanguage = async () => {
    current = (await import(`../${window.settings.getOption("language") || Languages.DE}.ts`)).default;
};
