'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';


function getProjectPath() {
    // this function returns a string of the current project's path on the user's computer
    if (typeof vscode.workspace.workspaceFolders !== 'undefined') { // check if the current workspace folder is defined
        return vscode.workspace.workspaceFolders[0].uri.fsPath; // return active project folder path
    } else {
        vscode.window.showErrorMessage('No workspace folder could be found!');
        return '';
    }
}

function copyFile(source: string, target: string) {
    // this function overwrites the contents of the target file with the contents of the source file
    writeFile(target, readFile(source));
}

function readFile(path: string) {
    // this function returns the contents of the specified file as a string
    let data = fs.readFileSync(path, 'utf8');
    return data;
}

function writeFile(path: string, data: string) {
    // this function overwrites the contents of the specified file with the 'data' string
    fs.writeFile(path, data, err => {
        if (err) {
            vscode.window.showErrorMessage(err.message);
            return;
        }
    });
}

function hideFiles(files: string[]) {
    // ------------------------------------------------------------------------------
    // This function takes an array of file paths and hides them in the explorer pane.
    // File paths should be relative to the working project directory.
    // ------------------------------------------------------------------------------

    // get current working directory and the path to the settings.json and settings-backup.json files
    let projDir = getProjectPath();
    let settingsFile = '';
    let settingsBackupFile = '';
    if (projDir) {
        settingsFile = path.join(projDir, '.vscode', 'settings.json'); // set settings.json file path
        settingsBackupFile = path.join(projDir, '.vscode', 'settings-backup.json'); // set settings-backup.json file path
    } else {
        return; // no workspace folder is open, nothing to hide 
    }
    
    copyFile(settingsFile, settingsBackupFile); // copy user's settings.json file (create backup)
    let settingsString = readFile(settingsFile); // read contents of settings.json file
    let settingsJSON = JSON.parse(settingsString); // convert string to JSON object

    // add files files.exclude section of to the settings JSON object
    let filesLength = files.length;
    for (let i = 0; i < filesLength; i++) {
        settingsJSON['files.exclude']['**' + files[i]] = true;
    }

    let newSettingsJSON = JSON.stringify(settingsJSON, null, 2); // convert JSON object to string
    writeFile(settingsFile, newSettingsJSON); // save to settings.json file

    return;
}

function unhideFiles() {
    // ------------------------------------------------------------------------------
    // This function unhides any files that were hidden by the hideFiles() function
    // Loads back the settings-backup.json file
    // ------------------------------------------------------------------------------

    // get current working directory and the path to the settings.json and settings-backup.json files
    let projDir = getProjectPath();
    let settingsFile = '';
    let settingsBackupFile = '';
    if (projDir) {
        settingsFile = path.join(projDir, '.vscode', 'settings.json'); // set settings.json file path
        settingsBackupFile = path.join(projDir, '.vscode', 'settings-backup.json'); // set settings-backup.json file path
    } else {
        return; // no workspace folder is open, nothing to hide 
    }

    copyFile(settingsBackupFile, settingsFile); // move contents of settings-backup.json to settings.json

    return;
}

export function activate(context: vscode.ExtensionContext) {

    let toggle = true;
    let toggleHide = vscode.commands.registerCommand('extension.toggleHide', () => {
        // "Hide selection"
        // key: ctrl/cmd + shift + 0
        // placeholder command for testing the hide files functionality
        if (toggle) {
            hideFiles(["/src/Color.ts", "/src/Tag.ts", "/README.md"]);
        } else {
            unhideFiles();
            vscode.window.showInformationMessage('Test2');
        }
        toggle = !toggle;
    });

    let tagSelectedCode = vscode.commands.registerCommand('extension.tagSelectedCode', () => {
        // "Tag selection"
        // key: ctrl/cmd + shift + T
        // Command for tagging the currently selected code
        let existingTags = ["tag1", "tag2", "tag3", "tag4", "testTag1", "testTag2", "testTag3"]; // TODO this should be changed to generate the array from the current list of tag objects
        existingTags.unshift("Create New Tag"); // add option to create a new tag to array

        // open Quick Pick input box, displays suggestions based on typed text from the existingTags array
        vscode.window.showQuickPick(existingTags).then(input => {
            // executes when user presses Enter or selects a suggested tag name
            // if 'Create New Tag' is selected or entered, open InputBox to enter new tag name
            // if no tag name is entered or the tag name is not an existing tag, code is not tagged
            // if an existing tag is entered or selected, add the current code selection to that tag
            if (typeof input !== 'undefined') {
                if (input === 'Create New Tag') {
                    // open InputBox to create a new tag
                    vscode.window.showInputBox({prompt: 'Enter new tag name'}).then(value => {
                        // executes when user presses Enter
                        // if no tag name is entered, no tag is created
                        // if the entered tag name already exists, no tag is created
                        // otherwise, create new tag and add the selected code to the new tag
                        if (!value) {
                            vscode.window.showErrorMessage('No tag name was entered, code was not tagged');
                        } else if (existingTags.includes(value)) {
                            vscode.window.showErrorMessage('Tag already exists, code was not tagged');
                        } else {
                            // TODO actually create tag and add code selection to the new tag
                            vscode.window.showInformationMessage('Tag created, code was tagged with \"' + value + '\"');
                        }
                    });
                } else if (existingTags.includes(input)) {
                    // TODO actually add current code selection to the chosen tag
                    vscode.window.showInformationMessage('Code was tagged with \"' + input + '\"');
                } else {
                    // shouldn't reach this point
                    vscode.window.showErrorMessage('Code was not tagged');
                }
            } else {
                vscode.window.showErrorMessage('No tag was selected, code was not tagged');
            }
        });
    });

    // subscribe to selection change and editor activation events
    context.subscriptions.push(toggleHide);
    context.subscriptions.push(tagSelectedCode);
}

// this method is called when your extension is deactivated
export function deactivate() {
}
