'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import Color from './Color';
import TagInfo from './TagInfo';
import Tag from './Tag';

let tagInfos: TagInfo[] = [new TagInfo(new Color(0), "DB"), new TagInfo(new Color(1), "API"), new TagInfo(new Color(2), "BUG")]
let tags: Tags[] = [];

function tagSelection(tagIndex: number) {
    let tag = new Tag(tagInfos[0]);
    let co = tag.getDecoration();

    tags.push(tag);

    let textEditor = vscode.window.activeTextEditor;
    if (textEditor !== undefined) {
        const ranges: vscode.DecorationOptions[] = [];
        for (let selection of textEditor.selections) {
            const decoration = {
                range: new vscode.Range(selection.start.line, 0, selection.end.line, 0),
                hovesMessage: "hey there",
                renderOptions: {after: {width: "0"}, before: {width: "0"}}
            };
            ranges.push(decoration);
        }
        textEditor.setDecorations(co, ranges);
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

    context.subscriptions.push(disposable);
    context.subscriptions.push(disposable2);
    context.subscriptions.push(disposable3);
}

// this method is called when your extension is deactivated
export function deactivate() {
}