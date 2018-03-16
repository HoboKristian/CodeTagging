import Color from './Color';
import TagInfo from './TagInfo';
import Tag from './Tag';

export default class Singleton
{
    private static _instance: Singleton;
    private tagInfos: TagInfo[];
    private tags: Tag[];
    private constructor() {
        this.tagInfos = [new TagInfo(new Color(0), "DB"), new TagInfo(new Color(1), "API"), new TagInfo(new Color(2), "BUG")];
        this.tags = [];
    }

    public static getTags() {
        return singleton.tags;
    }

    public static getTagInfos() {
        return singleton.tagInfos;
    }

    public static getTagInfosAsStrings() {
        let strings:string[] = [];
        for (let taginfo of singleton.tagInfos) {
            strings.push(taginfo.name);
        }
        return strings;
    }

    public static get Instance() {
        return this._instance || (this._instance = new this());
    }
}

const singleton = Singleton.Instance;