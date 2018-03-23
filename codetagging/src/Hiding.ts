'use strict';
import * as fs from 'fs';
import * as path from 'path';

import FileUtility from './FileUtility';

namespace Hiding {
    export function hideFiles(files: string[]) {
        // ------------------------------------------------------------------------------
        // This function takes an array of file paths and hides them in the explorer pane.
        // File paths should be relative to the working project directory.
        // ------------------------------------------------------------------------------

        FileUtility.checkSettingsFile(); // make sure settings.json file exists
        
        // get current working directory and the path to the settings.json and settings-backup.json files
        let projDir = FileUtility.getProjectPath();
        let settingsFile = '';
        let settingsBackupFile = '';
        if (projDir) {
            settingsFile = path.join(projDir, '.vscode', 'settings.json'); // set settings.json file path
            settingsBackupFile = path.join(projDir, '.vscode', 'settings-backup.json'); // set settings-backup.json file path
        } else {
            return; // no workspace folder is open, nothing to hide 
        }
        
        FileUtility.copyFile(settingsFile, settingsBackupFile); // copy user's settings.json file (create backup)
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
        let projDir = FileUtility.getProjectPath();
        let settingsFile = '';
        let settingsBackupFile = '';
        if (projDir) {
            settingsFile = path.join(projDir, '.vscode', 'settings.json'); // set settings.json file path
            settingsBackupFile = path.join(projDir, '.vscode', 'settings-backup.json'); // set settings-backup.json file path
        } else {
            return; // no workspace folder is open, nothing to hide 
        }

        if (fs.existsSync(settingsBackupFile)) {
            FileUtility.copyFile(settingsBackupFile, settingsFile); // move contents of settings-backup.json to settings.json
        } else {
            let data = '{\n    "files.exclude": {\n        "out": true\n    },\n    "search.exclude": {\n        "out": true\n    }\n}\n';
            fs.writeFileSync(settingsFile, data); // write directly to settings.json if backup doesn't exist
        }

        return;
    }
}
export default Hiding;