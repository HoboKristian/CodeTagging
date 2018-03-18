import * as vscode from 'vscode';
import Color from './Color';
import {Type} from "serializer.ts/Decorators";

export default class TagInfo {
    @Type(() => Color)
    color: Color;
    name: string;
    constructor(color: Color, name: string) {
        this.color = color;
        this.name = name;
    }
    getDecorationConfig(highlightedTagInfo:TagInfo) {
        return {
            backgroundColor: this.color.toString(this === highlightedTagInfo),
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
            isWholeLine: true
        };
    }
}