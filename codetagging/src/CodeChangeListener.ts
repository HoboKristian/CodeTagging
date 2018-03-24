import * as vscode from 'vscode';
import Singleton from './Singleton';

enum ChangeType {
    Addition,
    Deletion,
    None,
}

export default class CodeChangeListener {
    disposable: vscode.Disposable;
    tagsMovedCallback: Function;
    oldLineCount: number = 0;
    constructor(context: vscode.ExtensionContext, callback: Function) {
        this.disposable = vscode.workspace.onDidChangeTextDocument(this._onEvent, this, context.subscriptions);
        this.tagsMovedCallback = callback;
        let textEditor = vscode.window.activeTextEditor;
        if (textEditor) {
            this.oldLineCount = textEditor.document.lineCount;
        }
    }
    _onEvent(e: vscode.TextDocumentChangeEvent) {
        return;
        let msg = e.contentChanges[0];

        let result = this.getChangeType(msg);
        let changeStart:number = result.changeStart;
        let changeEnd:number = result.changeEnd;
        let diff:number = result.diff;
        let changeType:ChangeType = result.changeType;

        if (msg.text.length !== 0) {
            changeStart += 1;
            changeEnd += 1;
        }

        if (changeType === ChangeType.Addition) {
            this.handleAdditionChange(diff, changeStart, changeEnd);
        } else if (changeType === ChangeType.Deletion) {
            this.handleDeletionChange(diff, changeStart, changeEnd);
        }
        this.tagsMovedCallback();
    }
    getChangeType(msg:vscode.TextDocumentContentChangeEvent) {
        let diff = 0;
        let textEditor = vscode.window.activeTextEditor;
        if (textEditor) {
            diff = textEditor.document.lineCount - this.oldLineCount;
            this.oldLineCount = textEditor.document.lineCount;
        }

        let changeStart:number = msg.range.start.line;
        let changeEnd:number = msg.range.end.line;
        let changeType:ChangeType = ChangeType.None;
        if (diff < 0) {
            changeType = ChangeType.Deletion;
        } else if (diff > 0) {
            changeType = ChangeType.Addition;
        }

        return {diff, changeStart, changeEnd, changeType};
    }

    handleAdditionChange(diff:number, changeStart:number, changeEnd:number) {
        for (let tag of Singleton.getTags()) {
            let tagStart:number = tag.start;
            let tagEnd:number = tag.end;
            console.log(tagStart, tagEnd);
            if (changeStart < tagStart) { // before
                console.log("add before");
                tagStart += diff;
                tagEnd += diff;
            } else if (changeStart >= tagStart && changeStart <= tagEnd) { // within
                console.log("add within");
                tagEnd += diff;
            }
            tag.start = tagStart;
            tag.end = tagEnd;
        }
    }
    handleDeletionChange(diff:number, changeStart:number, changeEnd:number) {
        changeStart += 1;
        if (diff === -1) { // Single line case
            changeStart += 1;
            changeEnd += 1;
        }

        for (let tag of Singleton.getTags()) {
            let tagStart:number = tag.start;
            let tagEnd:number = tag.end;
            if (changeEnd < tagStart) { // before
                tagStart += diff;
                tagEnd += diff;
                console.log("del before");
            } else if (changeStart > tagStart && changeEnd < tagEnd) { // within
                tagEnd += diff;
                console.log("del within");
            } else if (changeStart <= tagStart && changeEnd >= tagEnd) { // around
                // TODO: Delete the tag
                Singleton.removeTag(tag);
                console.log("del around");
            } else if (changeStart <= tagStart && changeEnd >= tagStart && changeEnd < tagEnd) { // around start
                tagStart = changeEnd;
                tagEnd += diff;
                console.log("del start");
            } else if (changeStart > tagStart && changeEnd >= tagEnd) { // around end
                tagEnd = changeStart - 1;
                console.log("del end", changeStart, changeEnd);
            } else if (changeStart === tagStart && changeEnd >= tagEnd) { // Special edge case
                tagStart = changeStart;
                tagEnd = changeStart;
                console.log("del special");
            }
            tag.start = tagStart;
            tag.end = tagEnd;
        }
    }
    dispose() {
        this.disposable.dispose();
    }
}