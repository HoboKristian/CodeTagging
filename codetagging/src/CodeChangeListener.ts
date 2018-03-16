import * as vscode from 'vscode';
import Singleton from './Singleton';

export default class CodeChangeListener {
    tagsMovedCallback: Function;
    constructor(context: vscode.ExtensionContext, callback: Function) {
        vscode.workspace.onDidChangeTextDocument(this._onEvent, this, context.subscriptions);
        this.tagsMovedCallback = callback;
    }
    _onEvent(e: vscode.TextDocumentChangeEvent) {
        let changeStart:number = 0;
        let changeEnd:number = 0;
        let changeAddition:boolean = true;
        for (let msg of e.contentChanges) {
            if (msg) {
                if (msg.text === "") {
                    changeAddition = false;
                    changeStart = msg.range.start.line;
                    changeEnd = msg.range.end.line;
                }
                if (changeAddition) {
                    changeStart = msg.range.start.line;
                    changeEnd = msg.range.end.line;
                    for (let i = 0; i < msg.text.length; i++) {
                        console.log(msg.text.charCodeAt(i), msg.range.start.line);
                        if (msg.text.charAt(i) === "\n") {
                            changeAddition = true;
                            changeEnd += 1;
                        }
                    }
                }
            }
        }
        let horizontalMovement:number = changeEnd - changeStart;
        for (let tag of Singleton.getTags()) {
            if (changeAddition && horizontalMovement !== 0) { // Addition of text
                let newStart:number = tag.start.line;
                let newEnd:number = tag.end.line;
                if (tag.start.line < changeStart && tag.end.line >= changeStart) { // Addition is in between
                    newEnd += horizontalMovement;
                } else if (tag.start.line >= changeStart) { // Addition is before
                    newStart += horizontalMovement;
                    newEnd += horizontalMovement;
                }
                tag.start = new vscode.Position(newStart, 0);
                tag.end = new vscode.Position(newEnd, 0);
            } else if (!changeAddition) { // Deletion of text
                let horizontalMovement:number = changeEnd - changeStart;
                let newStart:number = tag.start.line;
                let newEnd:number = tag.end.line;
                if (changeEnd < tag.start.line) { // Deletion is above
                    newStart -= horizontalMovement;
                    newEnd -= horizontalMovement;
                    console.log(1);
                } else if (changeStart < tag.start.line && changeEnd >= tag.start.line && changeEnd < tag.end.line) { // around start
                    newStart = changeEnd;
                    newEnd -= horizontalMovement;
                    console.log(2);
                } else if (changeStart >= tag.start.line && changeEnd < tag.end.line) { // within
                    newEnd -= horizontalMovement;
                    console.log(3);
                } else if (changeStart < tag.start.line && changeEnd >= tag.end.line) { // around
                    // TODO: Delete the tag
                    newStart = 0;
                    newEnd = 0;
                    console.log(4);
                } else if (changeStart > tag.start.line && changeEnd >= tag.end.line) { // around end
                    newEnd = changeStart;
                    console.log(5, changeStart, changeEnd);
                }
                tag.start = new vscode.Position(newStart, 0);
                tag.end = new vscode.Position(newEnd, 0);
            }
        }
        this.tagsMovedCallback();
    }
}