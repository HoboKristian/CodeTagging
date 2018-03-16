import * as vscode from 'vscode';
import Singleton from './Singleton';

enum ChangeType {
    Addition,
    Deletion,
    None,
}

export default class CodeChangeListener {
    tagsMovedCallback: Function;
    constructor(context: vscode.ExtensionContext, callback: Function) {
        vscode.workspace.onDidChangeTextDocument(this._onEvent, this, context.subscriptions);
        this.tagsMovedCallback = callback;
    }
    _onEvent(e: vscode.TextDocumentChangeEvent) {
        let changeStart:number = 0;
        let changeEnd:number = 0;
        let changeType:ChangeType = ChangeType.None;
        for (let msg of e.contentChanges) {
            if (msg) {
                let result = this.getChangeType(msg);
                changeStart = result.changeStart;
                changeEnd = result.changeEnd;
                changeType = result.changeType;
            }
        }
        if (changeType === ChangeType.Addition) {
            this.handleAdditionChange(changeStart, changeEnd);
        } else if (changeType === ChangeType.Deletion) {
            this.handleDeletionChange(changeStart, changeEnd);
        }
        this.tagsMovedCallback();
    }
    getChangeType(msg:vscode.TextDocumentContentChangeEvent) {
        let changeStart:number = 0;
        let changeEnd:number = 0;
        let changeType:ChangeType = ChangeType.None;
        if (msg.text === "") {
            changeType = ChangeType.Deletion;
            changeStart = msg.range.start.line;
            changeEnd = msg.range.end.line;
        }
        if (changeType !== ChangeType.Deletion) {
            changeStart = msg.range.start.line;
            changeEnd = msg.range.end.line;
            for (let i = 0; i < msg.text.length; i++) {
                console.log(msg.text.charCodeAt(i), msg.range.start.line);
                if (msg.text.charAt(i) === "\n") {
                    changeType = ChangeType.Addition;
                    changeEnd += 1;
                }
            }
        }
        return {changeStart, changeEnd, changeType};
    }

    handleAdditionChange(changeStart:number, changeEnd:number) {
        let horizontalMovement:number = changeEnd - changeStart;
        for (let tag of Singleton.getTags()) {
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
        }
    }
    handleDeletionChange(changeStart:number, changeEnd:number) {
        let horizontalMovement:number = changeEnd - changeStart;
        for (let tag of Singleton.getTags()) {
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
                Singleton.removeTag(tag);
                console.log(4);
            } else if (changeStart > tag.start.line && changeEnd >= tag.end.line) { // around end
                newEnd = changeStart;
                console.log(5, changeStart, changeEnd);
            } else if (changeStart === tag.start.line && changeEnd >= tag.end.line) { // Special edge case
                newStart = changeStart;
                newEnd = changeStart;
                console.log(6);
            }
            tag.start = new vscode.Position(newStart, 0);
            tag.end = new vscode.Position(newEnd, 0);
        }
    }
}