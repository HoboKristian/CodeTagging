'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import CodeChangeListener from './CodeChangeListener';
import Singleton from './Singleton';
import Tag from './Tag';
import TagInfo from './TagInfo';
import TextDocumentChanged from './FileChangeListener';
import TagMenu from './TagMenu';

let codeChangeListener:CodeChangeListener;
let textDocumentChanged:TextDocumentChanged;
let tagMenu:TagMenu;

function relativeFilePathForDocument(document:vscode.TextDocument):string {
    let ws = vscode.workspace.getWorkspaceFolder(document.uri);
    let fileName = document.fileName;
    return (ws) ? fileName.replace(ws.uri.fsPath, '') : fileName;
}

function tagIndex(tagIndex: number) {
    tagSelection(Singleton.getTagInfos()[tagIndex]);
}

function tagSelection(tagInfo: TagInfo) {
    let textEditor = vscode.window.activeTextEditor;
    if (textEditor === undefined) {
        return;
    }
    for (let selection of textEditor.selections) {
        let from = selection.start.line + 1;
        let to = selection.end.line;
        if (selection.start.line === selection.end.line || selection.end.character > 0) {
            to = selection.end.line + 1;
        }
        tagLines(tagInfo, from ,to);
    }
}
function tagLines(tagInfo:TagInfo, from: number, to: number) {
    let textEditor = vscode.window.activeTextEditor;
    if (textEditor === undefined) {
        return;
    }
    let tags: Tag[] = Singleton.getTags();
    let fileName = relativeFilePathForDocument(textEditor.document);
    let tag = new Tag(tagInfo, fileName, from, to);

    let overlappingTag;
    for (let oldTag of tags) {
        if (oldTag.overlaps(tag)) {
            overlappingTag = oldTag;
        }
    }
    if (overlappingTag !== undefined) {
        overlappingTag.start = Math.min(tag.start, overlappingTag.start);
        overlappingTag.end = Math.max(tag.end, overlappingTag.end);
    } else {
        Singleton.addTag(tag);
    }
    redraw();
}

let activeDecorations: vscode.TextEditorDecorationType[] = [];

function redraw() {
    activeDecorations.forEach(dec => dec.dispose());
    activeDecorations = [];

    let textEditor = vscode.window.activeTextEditor;
    if (textEditor) {
        let editor = textEditor; // For some reason not doing this gives might be undefined error
        let fileName = relativeFilePathForDocument(textEditor.document);
        Singleton.getTags()
        .filter(tag => tag.file === fileName)
        .forEach(tag => {
            let co = vscode.window.createTextEditorDecorationType(tag.tagInfo.getDecorationConfig(tagMenu.hightlightedTagInfo));
            editor.setDecorations(co, [new vscode.Range(new vscode.Position(tag.start - 1, 0), new vscode.Position(tag.end - 1, 0))]);
            activeDecorations.push(co);
        });
    }
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "codetagging" is now active!');

    createTagMenu(context);

    let disposable = vscode.commands.registerCommand('extension.tag1', () => {
        tagIndex(0);
    });
    let disposable2 = vscode.commands.registerCommand('extension.tag2', () => {
        tagIndex(1);
    });
    let disposable3 = vscode.commands.registerCommand('extension.tag3', () => {
        tagIndex(2);
    });

    codeChangeListener = new CodeChangeListener(context, redraw);
    textDocumentChanged = new TextDocumentChanged(context, redraw);
    tagMenu = new TagMenu(redraw, tagSelection);

    for (let i = 1; i <= 2; i += 3) {
        let ti = Singleton.createNewTagInfo("" + i);
        tagLines(ti, i, i+2);
    }

    // subscribe to selection change and editor activation events
    context.subscriptions.push(disposable);
    context.subscriptions.push(disposable2);
    context.subscriptions.push(disposable3);

    context.subscriptions.push(vscode.commands.registerCommand('extension.tagMenu', () => tagMenu.showTagMenu()));
    context.subscriptions.push(vscode.commands.registerCommand('extension.tagIsolate', () => tagMenu.showIsolateMenu()));

    Singleton.load();
}

// The command has been defined in the package.json file
// Now provide the implementation of the command with  registerCommand
// The commandId parameter must match the command field in package.json
function createTagMenu(context:vscode.ExtensionContext) {
    
}

// this method is called when your extension is deactivated
export function deactivate() {
    codeChangeListener.dispose();
    textDocumentChanged.dispose();
}
