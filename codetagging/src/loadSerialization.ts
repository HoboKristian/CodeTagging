import * as fs from 'fs';
import {
	workspace,
	window,
	Uri
} from 'vscode';

import {deserialize} from "serializer.ts/Serializer";
import Tag from './Tag';

// Generate a serialized file of our tag objects
export class LoadSerialization{

    //class properties
    filePath: string;


    //Constructor
    //takes the a string of the filepath for the serialized file
    //loads the file 
    //creates an array of objects from that
    constructor(filePath: string){
        this.filePath = filePath;

    }
    
	readFile() {

        fs.readFile(this.filePath, 'utf8', function (err, data) {
            if (err) {
                window.showErrorMessage(err.message);
                return;
            }
        
            let obj = JSON.parse(data);
            console.log('printing the json object read from local file');
            console.log(obj);
            
            let tags = deserialize<Tag[]>(Tag, obj);
            console.log('priniting array of tag objects after reading it from disk');
            console.log(tags);
        });
		// let json = fs.readFile(this.filePath, err => {
		// 	if (err) {
		// 		window.showErrorMessage(err.message);
		// 		return;
        //     }
        //     else{
        //         console.log('loaded fiel');
        //         console.log(json.toString());
        //     }
        // });
        
        
	}
}
