import TagInfo from "./TagInfo";
import * as vscode from 'vscode';

export default class Tag {
    tagInfo: TagInfo;
    constructor(tagInfo: TagInfo) {
        this.tagInfo = tagInfo;
    }
    getDecoration() {
        var co = vscode.window.createTextEditorDecorationType({
            backgroundColor: this.tagInfo.color.toString(),
            rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed,
            isWholeLine: true
        });
        return co;
    }
}