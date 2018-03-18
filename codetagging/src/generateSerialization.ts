//imports to hanlde writing to the filesystem
import * as lodash from 'lodash';
import * as fs from 'fs';
import * as path from 'path';
import {
	workspace,
	window,
	Uri
} from 'vscode';

//import the Singleton class that already has the the class instantiated and we can just use it to get the array of tags
import Singleton from './Singleton';

//used for serializaing tag object array to json file (file created will be .serializedfile in project root)
import {serialize} from "serializer.ts/Serializer";

// Generate a serialized file of our tag objects
export class GenerateSerialization{

    //class properties
    serializedTags: any;
    serializedTagInfos: any;
    lookupPath: any;

    //Constructor
    constructor(uri: Uri){
        this.lookupPath = lodash.get(
		uri,
		'fsPath',
		lodash.get(workspace, 'workspaceFolders[0].uri.fsPath', '.'),
        );

        //create our file to write tags to
        this.serializedTags = path.join(this.lookupPath, '.serializedTags');
        //create our file to write tagInfos to
        this.serializedTagInfos = path.join(this.lookupPath, '.serializedTagInfos');

    }

	
    //attempt to write to the file object
    serialize() {
        //serialize tagInfos
        fs.stat(this.serializedTagInfos, (err, stats) => {

            if (err) {
                if (err.code === 'ENOENT') {
                    //serialize the current array of TagInfo objects into a json string
                    let jsonStr = JSON.stringify(serialize(Singleton.getTagInfos()));

                    //debug: write the json string representing out taginfo objects to console
                    //console.log(jsonStr);

                    //write json to disk
                    this.writeFile(this.serializedTagInfos, jsonStr);
                } else {
                    window.showErrorMessage(err.message);
                }
                return;
            }

            if (stats.isFile()) {
                window.showErrorMessage(
                    'An .serializedfile file already exists in this workspace.'
                );
            }
        });
        //serialize tags
        fs.stat(this.serializedTags, (err, stats) => {

            if (err) {
                if (err.code === 'ENOENT') {
                    //serialize the current array of Tag objects into a json string
                    let jsonStr = JSON.stringify(serialize(Singleton.getTags()));

                     //debug: write the json string representing out taginfo objects to console
                     //console.log(jsonStr);

                    //write the json to disk
                    this.writeFile(this.serializedTags, jsonStr);
                } else {
                    window.showErrorMessage(err.message);
                }
                return;
            }

            if (stats.isFile()) {
                window.showErrorMessage(
                    'An .serializedfile file already exists in this workspace.'
                );
            }
        });
    }
    
	writeFile(file: any, jsonStr: string) {

		fs.writeFile(file, jsonStr, err => {
			if (err) {
				window.showErrorMessage(err.message);
				return;
			}
		});
	}
}
