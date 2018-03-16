'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import Color from './Color';
import TagInfo from './TagInfo';
import Tag from './Tag';

let tagInfos: TagInfo[] = [new TagInfo(new Color(0), "DB"), new TagInfo(new Color(1), "API"), new TagInfo(new Color(2), "BUG")];
let tags: Tag[] = [];

function tagSelection(tagIndex: number) {
    let textEditor = vscode.window.activeTextEditor;
    if (textEditor !== undefined) {
        let tagsToRemove: Tag[] = [];
        for (let selection of textEditor.selections) {
            let tag = new Tag(tagInfos[tagIndex], textEditor.document.fileName, selection.start, selection.end);
            let overlappingTag;
            for (let oldTag of tags) {
                if (oldTag.overlaps(tag)) {
                    overlappingTag = oldTag;
                }
            }
            if (overlappingTag !== undefined) {
                tag = new Tag(tagInfos[tagIndex],
                    textEditor.document.fileName,
                    new vscode.Position(Math.min(selection.start.line, overlappingTag.start.line), 0),
                    new vscode.Position(Math.max(selection.end.line, overlappingTag.end.line), 0)
                );
                tagsToRemove.push(overlappingTag);
                console.log("OVERLAPPING");
            }
            tags.push(tag);
        }
        for (let tag of tagsToRemove) {
            tags.splice(tags.indexOf(tag), 1);
        }
    }
    redraw();
}

let activeDecorations: vscode.TextEditorDecorationType[] = [];

function redraw() {
    for (let dec of activeDecorations) {
        if (dec) {
            dec.dispose();
        }
    }
    activeDecorations = [];

    let textEditor = vscode.window.activeTextEditor;
    if (textEditor !== undefined) {
        console.log("DRAWING:", tags.length);
        for (let tag of tags) {
            let co = vscode.window.createTextEditorDecorationType(tag.tagInfo.getDecorationConfig());
            textEditor.setDecorations(co, [new vscode.Range(tag.start, tag.end)]);
            activeDecorations.push(co);
        }
    }
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "codetagging" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.tag1', () => {
        tagSelection(0);
    });
    let disposable2 = vscode.commands.registerCommand('extension.tag2', () => {
        tagSelection(1);
    });
    let disposable3 = vscode.commands.registerCommand('extension.tag3', () => {
        tagSelection(2);
    });

    /*vscode.languages.registerHoverProvider('python', {
        provideHover(document, position, token) {
            console.log(document, position, token);
            let textEditor = vscode.window.activeTextEditor;
            if (textEditor !== undefined) {
            }
            return new vscode.Hover('I am a hover!');
        }
    });*/
    let listener = new Listener(context);

    // subscribe to selection change and editor activation events
    context.subscriptions.push(disposable);
    context.subscriptions.push(disposable2);
    context.subscriptions.push(disposable3);
}

class Listener {
    constructor(context: vscode.ExtensionContext) {
        vscode.workspace.onDidChangeTextDocument(this._onEvent, this, context.subscriptions);
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
        for (let tag of tags) {
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
                    newStart += horizontalMovement;
                    newEnd += horizontalMovement;
                } else if (changeStart < tag.start.line && changeEnd >= tag.start.line && changeEnd < tag.end.line) { // around start
                    newStart = changeEnd;
                    newEnd += horizontalMovement;
                } else if (changeStart >= tag.start.line && changeEnd < tag.end.line) { // within
                    newEnd += horizontalMovement;
                } else if (changeStart <= tag.start.line && changeEnd >= tag.end.line) { // around
                    // TODO: Delete the tag
                    newStart = 0;
                    newEnd = 0;
                } else if (changeStart > tag.start.line && changeEnd >= tag.end.line) { // around end
                    newEnd = changeStart;
                }
                tag.start = new vscode.Position(newStart, 0);
                tag.end = new vscode.Position(newEnd, 0);
            }
        }
        redraw();
    }
}

// this method is called when your extension is deactivated
export function deactivate() {
}