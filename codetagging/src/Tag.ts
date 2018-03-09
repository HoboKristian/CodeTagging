import TagInfo from "./TagInfo";
import * as vscode from 'vscode';

export default class Tag {
    tagInfo: TagInfo;
    //id: string;
    //author: string;
    file: string;
    timestamp: number;
    start: vscode.Position;
    end: vscode.Position;
    constructor(tagInfo: TagInfo, file: string, start: vscode.Position, end: vscode.Position) {
        this.tagInfo = tagInfo;
        this.timestamp = Date.now();
        this.file = file;
        this.start = start;
        this.end = end;
    }
    overlaps(tag: Tag) {
        return ((tag.file === this.file) && (tag.tagInfo === this.tagInfo) &&
            (tag.start.line <= this.end.line && tag.start.line >= this.start.line
            || tag.end.line <= this.end.line && tag.end.line >= this.start.line));
    }
}