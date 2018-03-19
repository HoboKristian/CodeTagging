'use strict';
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
    fs.writeFileSync(target, fs.readFileSync(source, 'utf8'));
}

function checkSettingsFile() {
    // This function checks that the .vscode/settings.json file exists, and if not creates it

    // get current working directory and the path to the settings.json file
    let projDir = getProjectPath();
    let vscodeFolder = '';
    let settingsFile = '';
    if (projDir) {
        vscodeFolder = path.join(projDir, '.vscode'); // set .vscode folder path
        settingsFile = path.join(projDir, '.vscode', 'settings.json'); // set settings.json file path
    } else {
        return; // no workspace folder is open, nothing to initialize
    }

    if (!fs.existsSync(vscodeFolder)){
        fs.mkdirSync(vscodeFolder); // make .vscode directory if it doesn't already exist
    }
    
    if (!fs.existsSync(settingsFile)) {
        let data = '{\n    "files.exclude": {\n        "out": true\n    },\n    "search.exclude": {\n        "out": true\n    }\n}\n';
        fs.writeFileSync(settingsFile, data); // create settings.json file if it doesn't already exist
    }

    return;
}

export function hideFiles(files: string[]) {
    // ------------------------------------------------------------------------------
    // This function takes an array of file paths and hides them in the explorer pane.
    // File paths should be relative to the working project directory.
    // ------------------------------------------------------------------------------

    checkSettingsFile(); // make sure settings.json file exists
    
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
    let settingsString = fs.readFileSync(settingsFile, 'utf8'); // read contents of settings.json file
    let settingsJSON = JSON.parse(settingsString); // convert string to JSON object

    // add files files.exclude section of to the settings JSON object
    let filesLength = files.length;
    for (let i = 0; i < filesLength; i++) {
        settingsJSON['files.exclude']['**' + files[i]] = true;
    }

    let newSettingsJSON = JSON.stringify(settingsJSON, null, 2); // convert JSON object to string
    fs.writeFileSync(settingsFile, newSettingsJSON); // save to settings.json file

    return;
}

export function unhideFiles() {
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

    if (fs.existsSync(settingsBackupFile)) {
        copyFile(settingsBackupFile, settingsFile); // move contents of settings-backup.json to settings.json
    } else {
        let data = '{\n    "files.exclude": {\n        "out": true\n    },\n    "search.exclude": {\n        "out": true\n    }\n}\n';
        fs.writeFileSync(settingsFile, data); // write directly to settings.json if backup doesn't exist
    }

    return;
}