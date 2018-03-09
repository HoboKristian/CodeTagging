import * as vscode from 'vscode';
import Color from './Color';

export default class TagInfo {
    color: Color;
    name: string;
    constructor(color: Color, name: string) {
        this.color = color;
        this.name = name;
    }
    getDecorationConfig() {
        return {
            backgroundColor: this.color.toString(),
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
            isWholeLine: true
        };
    }
}