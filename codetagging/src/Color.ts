let colors: string[] = ['rgba(255,0,0,0.1)', 'rgba(0,255,0,0.1)', 'rgba(0,0,255,0.1)'];
let hightlights: string[] = ['rgba(255,0,0,0.3)', 'rgba(0,255,0,0.3)', 'rgba(0,0,255,0.3)'];

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