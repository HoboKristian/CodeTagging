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

    // "Add to existing Tag"
    // key: ctrl/cmd + shift + T
    // command for adding current code selection to an existing tag
    let addToExistingTag = vscode.commands.registerCommand('extension.addToExistingTag', () => {
        let availableTags = ["tag1", "tag2", "tag3", "tag4", "testTag1", "testTag2", "testTag3"]; // TODO this should be changed to read the array from the current list of tag objects

        // open Quick Pick input box, displays suggestions based on typed text from the availableTags array
        vscode.window.showQuickPick(availableTags).then(input => {
            // executes when user presses Enter or selects a suggested tag name
            // if no tag name is entered or the tag name is not an existing tag, no tag is created
            // if an existing tag is entered or selected, add the current code selection to the entered tag
            if (typeof input != 'undefined' && availableTags.includes(input)) {
                // TODO add current code selection to chosen tag
                vscode.window.showInformationMessage('Code was tagged with \"' + input + '\"');
            } else {
                vscode.window.showInformationMessage('Code was not tagged');
            }
        });

        // vscode.window.showInputBox({prompt: 'Enter tag name.', validateInput: autoComplete}).then(value => {
        //     let tagNameIsTaken = false; // replace with function to check if tag name is taken
        //     if (!value) {
        //         vscode.window.showInformationMessage('No tag created');
        //         return; // do nothing if entered tag name is empty
        //     } else if (tagNameIsTaken) {
        //         // if tag name is taken, add selected code to that tag
        //         vscode.window.showInformationMessage('Added to tag \"' + value + '\"');
        //     } else {
        //         // otherwise create new tag and add selected code
        //         vscode.window.showInformationMessage('Tag \"' + value + '\" created');
        //     }
        // });
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
    context.subscriptions.push(addToExistingTag);
}

class Listener {
    constructor(context: vscode.ExtensionContext) {
        vscode.workspace.onDidChangeTextDocument(this._onEvent, this, context.subscriptions);
    }
    _onEvent(e: vscode.TextDocumentChangeEvent) {
        console.log("CYKA");
        for (let msg of e.contentChanges) {
            if (msg) {
                console.log(msg.text, msg.range);
            }
        }
    }
}

// this method is called when your extension is deactivated
export function deactivate() {
}
