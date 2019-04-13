import { RaceDataJson, EventDataJson, ApiConnectionStatus, ApiEventParamss } from "./data-model";
import { TTestData } from "./test-data";
import { TStringList } from "./fb-strings";

export class Dummy {
    private backup: TStringList;
    private backlog: TStringList;
    private raceDataMap: Map<number, RaceDataJson>;
    private connectedApps: Set<WebSocket>;

    isDirectProxy: boolean = true;
    //get connected(): boolean { return this.inputConnected && this.outputConnected};
    inputConnected: boolean = true;
    outputConnected: boolean = true;

    name: string = 'dummy';
    verbose: boolean = false;
    netto: string;

    raceCount: number = 2;
    tpCount: number = 1;
    startlistCount: number = 8;

    //eventData: string = "empty"; // redirected to BackupAndLog
    private eventDataJson: EventDataJson;
    raceDataJson: RaceDataJson;

    slot2: EventDataJson = new EventDataJson();
    slot3: RaceDataJson = new RaceDataJson();

    constructor() {
        this.backup = new TStringList();
        this.backup.Text = TTestData.DefaultEmptyEvent;

        this.backlog = new TStringList();

        //this.eventData = TTestData.DefaultExample;
        this.eventDataJson = new EventDataJson();
        this.raceDataJson = new RaceDataJson();

        this.raceDataMap = new Map<number, RaceDataJson>();
        this.connectedApps = new Set<WebSocket>();
    }

    getEventParams(): ApiEventParamss {
        return { "raceCount": this.raceCount, "itCount": this.tpCount, "startlistCount": this.startlistCount };
    }

    getInputConnectionStatus(): ApiConnectionStatus {
        return { "connected": this.inputConnected, "websockets": true };
    }

    getOutputConnectionStatus(): ApiConnectionStatus {
        return { "connected": this.outputConnected, "websockets": true };
    }

    /**
     * @param client is of type WebSocket
     */
    registerApp(client: any): void {
        this.connectedApps.add(client);
    }

    writeToSocket(t: string) {
        this.backlog.Add(t);
        if (this.isDirectProxy)
            this.broadcastToConnectedApps(t);
    }

    broadcastToConnectedApps(msg: string) {
        this.connectedApps.forEach((ws: WebSocket) => {
            if (ws.readyState === 1) {
                let requestParams = {
                    race: 1,
                    it: 0,
                    netto: msg
                };
                if (this.verbose)
                    this.log('broadcasting netto...');
                ws.send(JSON.stringify(requestParams));
            } else {
                this.connectedApps.delete(ws);
            }
        });
    }

    log(s: string) {
        console.log(this.name + ' ' + s);
    }

    getBackup(): string[] {
        return this.backup.SL;
    }

    getBacklog(): string[] {
        return this.backlog.SL;
    }

    getBackupAndLog(): string[] {
        return this.backup.SL.concat(this.backlog.SL);
    }

    getBackupString(): string {
        return this.backup.Text;
    }

    getBacklogString(): string {
        return this.backlog.Text;
    }

    getBackupAndLogString(): string {
        const SL = new TStringList();
        SL.SL = this.backup.SL.concat(this.backlog.SL);
        return SL.Text;
    }

    getBackupAndLogJsonString(): string {
        const SL = new TStringList();
        SL.SL = this.backup.SL.concat(this.backlog.SL);
        return JSON.stringify(SL.SL, null, 2);
    }

    get EventData(): string {
        // return this.eventData;
        return this.getBackupAndLogString();
    }

    set EventData(value: string) {
        this.backup.Text = value;
        this.backlog.Clear();
    }

    get EventDataJson(): EventDataJson {
        return this.eventDataJson;
    }

    set EventDataJson(value: EventDataJson) {
        this.eventDataJson = value;
        this.backup.SL = this.convertEventDataJson(value);
        this.backlog.Clear();
    }

    getRaceDataJson(race: number): RaceDataJson {
        let rd = this.raceDataMap.get(race);
        if (!rd)
            rd = new RaceDataJson();
        return rd;
    }

    putRaceDataJson(race: number, value: RaceDataJson) {
        this.raceDataMap.set(race, value);
    }

    clear() {
        this.backup.Text = TTestData.DefaultEmptyEvent;
        this.backlog.Clear();
    }

    convertEventDataJson(o: EventDataJson, includeEmptyList: boolean = false): string[] {

        let a: string[] = [];

        for (let s of o.EventParams)
            a.push(s);

        for (let s of o.EventProps)
            a.push(s);

        if (o.NameTable.length > 2 || includeEmptyList)
            for (let s of o.NameTable)
                a.push(s);

        for (let s of o.StartList)
            a.push(s);

        if (o.FleetList.length > 2 || includeEmptyList)
            for (let s of o.FleetList)
                a.push(s);

        for (let s of o.FinishInfo)
            a.push(s);

        if (o.TimingInfo.length > 0)
            for (let ti of o.TimingInfo)
                for (let s of ti)
                    a.push(s);

        if (o.PenaltyInfo.length > 0)
            for (let pi of o.PenaltyInfo) {
                if (pi.length > 0)
                    for (let s of pi)
                        a.push(s);
            }

        return a;
    }

}