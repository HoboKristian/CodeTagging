let colors: string[] = [
    'rgba(208, 157, 90, 0.2)',
    'rgba(246, 211, 154, 0.2)',
    'rgba(182, 180, 226, 0.2)',
    'rgba(140, 191, 80, 0.2)',
    'rgba(189, 233, 138, 0.2)',
    'rgba(248, 230, 154, 0.2)',
    'rgba(242, 170, 154, 0.2)',
    'rgba(207, 106, 90, 0.2)',
    'rgba(210, 125, 162, 0.2)',
    'rgba(125, 210, 162, 0.2)',
    'rgba(210, 125, 162, 0.2)',
    'rgba(162, 210, 162, 0.2)',
    'rgba(240, 235, 162, 0.2)',
    'rgba(160, 170, 240, 0.2)',
    'rgba(240, 235, 210, 0.2)',
    'rgba(255, 255, 255, 0.2)',
    'rgba(255, 60, 60, 0.2)',
];

let hightlights: string[] =[
    'rgba(208, 157, 90, 0.4)',
    'rgba(246, 211, 154, 0.4)',
    'rgba(182, 180, 226, 0.4)',
    'rgba(140, 191, 80, 0.4)',
    'rgba(189, 233, 138, 0.4)',
    'rgba(248, 230, 154, 0.4)',
    'rgba(242, 170, 154, 0.4)',
    'rgba(207, 106, 90, 0.4)',
    'rgba(210, 125, 162, 0.4)',
    'rgba(210, 125, 162, 0.4)',
    'rgba(162, 210, 162, 0.4)',
    'rgba(240, 235, 162, 0.4)',
    'rgba(160, 170, 240, 0.4)',
    'rgba(240, 235, 210, 0.4)',
    'rgba(255, 255, 255, 0.4)',
    'rgba(255, 60, 60, 0.4)',
];

export default class Color {
    color: string;
    highlight: string;
    constructor(tagIndex: number) {
        this.color = colors[tagIndex];
        this.highlight = hightlights[tagIndex];
    }
    toString(highlighted:boolean) {
        if (highlighted) {
            return this.highlight;
        }
        return this.color;
    }
}