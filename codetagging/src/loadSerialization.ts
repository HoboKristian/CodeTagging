import * as fs from 'fs';

import {deserialize} from "serializer.ts/Serializer";

import Tag from './Tag';
import TagInfo from './TagInfo';
import Singleton from './Singleton';

// Generate a serialized file of our tag objects
export class LoadSerialization{

    //class properties
    filePathForTagInfos: string;
    filePathForTags: string;
    private tagInfos: TagInfo[] = [];
    private tags: Tag[] = [];

    //Constructor
    //takes the a string of the filepath for the serialized file
    //loads the file 
    //creates an array of objects from that
    constructor(filePath: string){
        this.filePathForTagInfos = filePath +'/.serializedTagInfos';
        console.log(this.filePathForTagInfos);

        this.filePathForTags = filePath + '/.serializedTags';
        console.log(this.filePathForTags);

    }
    
	readFile() {
        //load serializedTaginfo file to objects
        let TagInfoContents = fs.readFileSync(this.filePathForTagInfos,'utf8');
       // console.log(TagInfoContents);
        let tagInfoObj = JSON.parse(TagInfoContents);
        //console.log('printing the taginfo json object parsed from the string');
        //console.log(tagInfoObj);
        this.tagInfos = deserialize<TagInfo[]>(TagInfo, tagInfoObj);
        //console.log('priniting array of taginfo objects after desierializaing');
        //console.log(this.tagInfos[0].color.toString(true));


        ////load serializedTag file to objects
        let Tagcontents = fs.readFileSync(this.filePathForTags,'utf8');
        //console.log(Tagcontents);
        let tagObj = JSON.parse(Tagcontents);
        //console.log('printing the tags json object parsed from the string');
        //console.log(tagObj);
        this.tags = deserialize<Tag[]>(Tag, tagObj);
        //console.log('priniting array of tag objects after desierializaing');
        //console.log(this.tags);
        
        //Merge the two arrays of objects into the singleton class
        //get the instance of the singleton
        //fore each tag object in the array, look at what it's taginfo object is and then match that to one of
        //those in the taginfo array. and bind it.
        //console.log('loop through tag object array');
        this.tags.forEach( (element) => {
            //console.log(element.tagInfo.name);
            for(let i=0; i<this.tagInfos.length; i++) {
                //console.log(this.tagInfos[i]);
                if(element.tagInfo.name === this.tagInfos[i].name){
                    element.tagInfo = this.tagInfos[i];
                }
              }

            //then add this element(current tag object) into our singleton
            Singleton.addTag(element);
        });

	}
}
