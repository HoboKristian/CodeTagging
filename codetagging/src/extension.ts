'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import CodeChangeListener from './CodeChangeListener';
import Singleton from './Singleton';
import Tag from './Tag';
import TagInfo from './TagInfo';

function tagSelection(tagIndex: number) {
    let textEditor = vscode.window.activeTextEditor;
    if (textEditor !== undefined) {
        let tagsToRemove: Tag[] = [];
        let tags: Tag[] = Singleton.getTags();
        let tagInfos: TagInfo[] = Singleton.getTagInfos();
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
        for (let tag of Singleton.getTags()) {
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
    let codeChangeListener = new CodeChangeListener(context, redraw);

    // subscribe to selection change and editor activation events
    context.subscriptions.push(disposable);
    context.subscriptions.push(disposable2);
    context.subscriptions.push(disposable3);
}


// this method is called when your extension is deactivated
export function deactivate() {
}