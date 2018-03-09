let colors: string[] = ['rgba(255,0,0,0.3)', 'rgba(0,255,0,0.3)', 'rgba(0,0,255,0.3)'];

export default class Color {
    color: string;
    constructor(tagIndex: number) {
        this.color = colors[tagIndex];
    }
    toString() {
        return this.color;
    }
}