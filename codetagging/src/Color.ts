let colors: string[] = [
    'rgba(208, 157, 90, 0.2)',
    'rgba(246, 211, 154, 0.2)',
    'rgba(182, 180, 226, 0.2)',
//    'rgba(112, 110, 168, 0.2)',
    'rgba(140, 191, 80, 0.2)',
    'rgba(189, 233, 138, 0.2)',
//    'rgba(109, 177, 132, 0.2)',
    'rgba(248, 230, 154, 0.2)',
    'rgba(242, 170, 154, 0.2)',
    'rgba(207, 106, 90, 0.2)',
    'rgba(210, 125, 162, 0.2)',
//    'rgba(170, 70, 114, 0.2)',
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